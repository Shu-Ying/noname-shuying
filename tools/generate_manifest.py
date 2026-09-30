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
    ".planning",
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
            "modules": {},
        }

    with path.open("r", encoding="utf-8") as file:
        config = json.load(file)

    modules = {}
    for name, item in config.get("modules", {}).items():
        legacy_files = item.get("legacy_files", [])
        legacy_source = item.get("legacy_files_from")
        if legacy_source:
            legacy_path = Path(legacy_source)
            if not legacy_path.is_absolute():
                legacy_path = root / legacy_path
            with legacy_path.open("r", encoding="utf-8") as file:
                legacy_files = json.load(file)
        if not isinstance(legacy_files, list):
            raise ValueError(f"legacy file list must be an array: {name}")
        modules[name] = {
            "root": normalize_path(item["root"]),
            "entry": normalize_path(item["entry"]),
            "title": item.get("title", name),
            "legacy_files": [normalize_path(path) for path in legacy_files],
        }

    return {
        "core": [normalize_path(item) for item in config.get("core", [])],
        "remove": [normalize_path(item) for item in config.get("remove", [])],
        "removeDirectories": [normalize_path(item) for item in config.get("removeDirectories", [])],
        "modules": modules,
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


def build_manifest(root: Path, version: str, config: dict,
                   previous_manifest=None) -> tuple[dict, dict, dict]:
    module_configs = config.get("modules", {})
    module_roots = {name: item["root"] for name, item in module_configs.items()}
    validate_relative_paths(list(module_roots.values()), "module roots")
    if len(set(module_roots.values())) != len(module_roots):
        raise ValueError("module roots must be unique")
    for name, item in module_configs.items():
        for other_name, other_root in module_roots.items():
            if name != other_name and (
                item["root"] == other_root
                or item["root"].startswith(other_root + "/")
                or other_root.startswith(item["root"] + "/")
            ):
                raise ValueError("module roots cannot overlap")

    def owned_by_module(path: str) -> bool:
        return any(path == module_root or path.startswith(module_root + "/")
                   for module_root in module_roots.values())

    config["remove"] = [file for file in config["remove"]
                         if not owned_by_module(file)]
    config["removeDirectories"] = [
        directory for directory in config["removeDirectories"]
        if not any(directory == module_root
                   or directory.startswith(module_root + "/")
                   or module_root.startswith(directory + "/")
                   for module_root in module_roots.values())
    ]

    all_files = {}
    for path in scan_files(root):
        relative_path = str(path.relative_to(root)).replace("\\", "/")
        all_files[relative_path] = {
            "size": path.stat().st_size,
            "sha256": sha256_file(path),
        }

    def make_manifest(file_map: dict, core_files: list[str], removals: list[str],
                      remove_directories: list[str], module_id: str = "") -> dict:
        tree = {
            "type": "directory",
            "name": root.name,
            "children": {},
        }
        for relative_path, info in file_map.items():
            set_nested_file(tree["children"], relative_path, info)

        core_file_set = set(core_files)
        validate_config_files(root, core_files, "core")
        missing_core = [file for file in core_files if file not in file_map]
        if missing_core:
            raise ValueError(
                "core contains files outside this manifest: "
                + ", ".join(missing_core)
            )
        validate_relative_paths(removals, "remove")
        validate_relative_paths(remove_directories, "removeDirectories")
        conflicts = [file for file in removals if file in file_map]
        if conflicts:
            raise ValueError(f"remove still contains current files: {', '.join(conflicts)}")
        directory_conflicts = [
            directory for directory in remove_directories
            if any(file == directory or file.startswith(directory + "/")
                   for file in file_map)
        ]
        if directory_conflicts:
            raise ValueError(
                "removeDirectories still contain current files: "
                + ", ".join(directory_conflicts)
            )

        folder_digest = hashlib.sha256()
        for relative_path in sorted(file_map):
            info = file_map[relative_path]
            folder_digest.update(relative_path.encode("utf-8"))
            folder_digest.update(str(info["size"]).encode("ascii"))
            folder_digest.update(info["sha256"].encode("ascii"))

        result = {
            "version": version,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "algorithm": "sha256",
            "update_channels": True,
            "file_count": len(file_map),
            "size_bytes": sum(info["size"] for info in file_map.values()),
            "folder_sha256": folder_digest.hexdigest(),
            "core": core_files,
            "assets": [file for file in sorted(file_map) if file not in core_file_set],
            "remove": removals,
            "removeDirectories": remove_directories,
            "files": file_map,
            "tree": tree,
        }
        if module_id:
            result["module_id"] = module_id
        return result

    module_files = {name: {} for name in module_configs}
    base_files = {}
    for path, info in all_files.items():
        owner = next((name for name, module_root in module_roots.items()
                      if path == module_root or path.startswith(module_root + "/")), None)
        if owner:
            module_files[owner][path] = info
        else:
            base_files[path] = info

    base_manifest = make_manifest(
        base_files, config["core"], config["remove"], config["removeDirectories"]
    )
    base_manifest["modules"] = {
        name: {
            "title": item["title"],
            "entry": item["entry"],
            "manifest": f"dist/modules/{name}.json",
            "file_count": len(module_files[name]),
            "size_bytes": sum(info["size"] for info in module_files[name].values()),
        }
        for name, item in module_configs.items()
    }

    manifests = {}
    legacy_manifests = {}
    for name, item in module_configs.items():
        files = module_files[name]
        if item["entry"] not in files:
            raise FileNotFoundError(f"module entry is missing: {item['entry']}")
        manifests[name] = make_manifest(
            files, [item["entry"]], [], [], module_id=name
        )
        manifests[name]["assets"] = [
            file for file in sorted(files) if file != item["entry"]
        ]
        if not item["entry"].startswith(item["root"] + "/"):
            raise ValueError(f"module entry is outside its root: {item['entry']}")
        previous_files = previous_manifest.get("files", {}) \
            if isinstance(previous_manifest, dict) else {}
        legacy_files = set(item["legacy_files"])
        legacy_files.update(module_files[name])
        legacy_files.update(
            file for file in previous_files
            if isinstance(file, str) and file.startswith(item["root"] + "/")
        )
        legacy_files = sorted(legacy_files)
        if legacy_files:
            validate_relative_paths(list(legacy_files), "legacy module files")
            if any(not file.startswith(item["root"] + "/")
                   for file in legacy_files):
                raise ValueError(f"legacy files escape module root: {name}")
            legacy_manifests[name] = {
                "version": version,
                "module_id": name,
                "snapshot": "legacy",
                "files": legacy_files,
            }
            base_manifest["modules"][name]["legacy_manifest"] = (
                f"dist/modules/{name}.legacy.json"
            )

    return base_manifest, manifests, legacy_manifests


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
    previous_manifest = None
    if output.is_file():
        with output.open("r", encoding="utf-8") as file:
            previous_manifest = json.load(file)
    config = preserve_removals(load_config(root, args.config), output)
    manifest, modules, legacy_modules = build_manifest(
        root, version, config, previous_manifest
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    module_output = output.parent / "modules"
    for name, module_manifest in modules.items():
        module_path = module_output / f"{name}.json"
        module_path.parent.mkdir(parents=True, exist_ok=True)
        module_path.write_text(
            json.dumps(module_manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    for name, module_manifest in legacy_modules.items():
        module_path = module_output / f"{name}.legacy.json"
        module_path.parent.mkdir(parents=True, exist_ok=True)
        module_path.write_text(
            json.dumps(module_manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    if module_output.is_dir():
        expected = {f"{name}.json" for name in modules}
        expected.update(f"{name}.legacy.json" for name in legacy_modules)
        for stale in module_output.glob("*.json"):
            if stale.name not in expected:
                stale.unlink()

    print(f"version: {version}")
    print(f"file_count: {manifest['file_count']}")
    print(f"core_count: {len(manifest['core'])}")
    print(f"asset_count: {len(manifest['assets'])}")
    print(f"remove_count: {len(manifest['remove'])}")
    print(f"remove_directory_count: {len(manifest['removeDirectories'])}")
    print(f"folder_sha256: {manifest['folder_sha256']}")
    print(f"generated: {output}")
    for name, module_manifest in modules.items():
        print(f"module_{name}_file_count: {module_manifest['file_count']}")


if __name__ == "__main__":
    main()
