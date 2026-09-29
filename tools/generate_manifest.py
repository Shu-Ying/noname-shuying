from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


EXCLUDE_DIRS = {
    ".git",
    ".gitea",
    ".github",
    ".update_tmp",
    "dist",
    "tools",
    "__pycache__",
}
EXCLUDE_FILES = {".gitignore", "log.txt"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def should_include(path: Path, root: Path) -> bool:
    relative = path.relative_to(root)
    return (
        path.is_file()
        and relative.name not in EXCLUDE_FILES
        and not any(part in EXCLUDE_DIRS for part in relative.parts)
    )


def scan_files(root: Path) -> list[Path]:
    return sorted(
        (path for path in root.rglob("*") if should_include(path, root)),
        key=lambda path: str(path.relative_to(root)).replace("\\", "/"),
    )


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip("/")


def validate_relative_paths(paths: list[str], label: str) -> None:
    unsafe = [
        path for path in paths
        if not path
        or any(part in {"", ".", ".."} for part in path.split("/"))
        or any(":" in part for part in path.split("/"))
    ]
    if unsafe:
        raise ValueError(f"{label} contains unsafe paths: {', '.join(unsafe)}")


def load_config(root: Path, config_path: str) -> dict:
    path = Path(config_path)
    if not path.is_absolute():
        path = root / path

    if not path.exists():
        return {
            "core": [],
            "remove": [],
            "removeDirectories": [],
        }

    with path.open("r", encoding="utf-8") as file:
        config = json.load(file)

    return {
        "core": [normalize_path(item) for item in config.get("core", [])],
        "remove": [normalize_path(item) for item in config.get("remove", [])],
        "removeDirectories": [normalize_path(item) for item in config.get("removeDirectories", [])],
    }


def preserve_removals(config: dict, output: Path) -> dict:
    """合并现有清单中的删除项，避免重新生成时覆盖人工维护的内容。"""
    if not output.is_file():
        return config

    with output.open("r", encoding="utf-8") as file:
        previous = json.load(file)

    for key in ("remove", "removeDirectories"):
        existing = [normalize_path(item) for item in previous.get(key, [])]
        config[key] = list(dict.fromkeys([*existing, *config[key]]))

    return config


def validate_config_files(root: Path, files: list[str], label: str) -> None:
    missing = [file for file in files if not (root / file).is_file()]
    if missing:
        raise FileNotFoundError(f"{label} contains missing files: {', '.join(missing)}")


def set_nested_file(tree: dict, relative_path: str, info: dict) -> None:
    parts = relative_path.split("/")
    node = tree

    for folder in parts[:-1]:
        node = node.setdefault(folder, {
            "type": "directory",
            "children": {},
        })["children"]

    node[parts[-1]] = {
        "type": "file",
        **info,
    }


def build_manifest(root: Path, version: str, config: dict) -> dict:
    flat_files = {}
    tree = {
        "type": "directory",
        "name": root.name,
        "children": {},
    }
    core_files = config["core"]
    core_file_set = set(core_files)
    remove_files = config["remove"]
    remove_directories = config["removeDirectories"]
    validate_config_files(root, core_files, "core")
    validate_relative_paths(remove_files, "remove")
    validate_relative_paths(remove_directories, "removeDirectories")

    for path in scan_files(root):
        relative_path = str(path.relative_to(root)).replace("\\", "/")
        info = {
            "size": path.stat().st_size,
            "sha256": sha256_file(path),
        }

        flat_files[relative_path] = info
        set_nested_file(tree["children"], relative_path, info)

    remove_file_conflicts = [file for file in remove_files if file in flat_files]
    if remove_file_conflicts:
        raise ValueError(f"remove still contains current files: {', '.join(remove_file_conflicts)}")

    remove_directory_conflicts = [
        directory for directory in remove_directories
        if any(file == directory or file.startswith(f"{directory}/") for file in flat_files)
    ]
    if remove_directory_conflicts:
        raise ValueError(
            "removeDirectories still contain current files: "
            + ", ".join(remove_directory_conflicts)
        )

    folder_digest = hashlib.sha256()
    for relative_path in sorted(flat_files):
        info = flat_files[relative_path]
        folder_digest.update(relative_path.encode("utf-8"))
        folder_digest.update(str(info["size"]).encode("ascii"))
        folder_digest.update(info["sha256"].encode("ascii"))

    return {
        "version": version,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "algorithm": "sha256",
        "update_channels": True,
        "file_count": len(flat_files),
        "folder_sha256": folder_digest.hexdigest(),
        "core": core_files,
        "assets": [file for file in sorted(flat_files) if file not in core_file_set],
        "remove": remove_files,
        "removeDirectories": remove_directories,
        "files": flat_files,
        "tree": tree,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate shuying manifest.json")
    parser.add_argument("--root", default=".", help="extension root")
    parser.add_argument("--version", help="version, for example 2.0.0.4")
    parser.add_argument("--out", default="dist/manifest.json", help="output json path")
    parser.add_argument("--config", default="tools/manifest_config.json", help="manifest config path")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    version = args.version or input("Input version, for example 2.0.0.4: ").strip()

    if not version:
        raise ValueError("Version cannot be empty")

    output = (root / args.out).resolve()
    config = preserve_removals(load_config(root, args.config), output)
    manifest = build_manifest(root, version, config)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"version: {version}")
    print(f"file_count: {manifest['file_count']}")
    print(f"core_count: {len(manifest['core'])}")
    print(f"asset_count: {len(manifest['assets'])}")
    print(f"remove_count: {len(manifest['remove'])}")
    print(f"remove_directory_count: {len(manifest['removeDirectories'])}")
    print(f"folder_sha256: {manifest['folder_sha256']}")
    print(f"generated: {output}")


if __name__ == "__main__":
    main()
