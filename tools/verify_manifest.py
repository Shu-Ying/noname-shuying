"""Read-only validation of the manifests committed in a release tag."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from generate_manifest import build_manifest, load_config, preserve_removals, scan_files


def read_json(path: Path) -> dict:
    if not path.is_file():
        raise ValueError(f"Missing committed manifest: {path}. Generate and commit manifests before tagging.")
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Manifest must be an object: {path}")
    return value


def compare_manifest(actual: dict, expected: dict, label: str) -> None:
    # generated_at and the export directory's name do not affect installed bytes.
    fields = ("version", "algorithm", "update_channels", "file_count", "size_bytes",
              "folder_sha256", "core", "assets", "remove", "removeDirectories", "files")
    if "module_id" in expected:
        fields += ("module_id",)
    for field in fields:
        if actual.get(field) != expected.get(field):
            raise ValueError(f"Stale or invalid {label}: {field}. Regenerate manifests before tagging.")
    if actual.get("tree", {}).get("children") != expected["tree"]["children"]:
        raise ValueError(f"Invalid {label}: tree")


def verify_imports(root: Path, names: set[str]) -> None:
    patterns = (
        re.compile(r'''\b(?:import|export)\s+(?:[^;]*?\bfrom\s*)?["'](\.[^"']+)["']'''),
        re.compile(r'''\bimport\s*\(\s*["'](\.[^"']+)["']'''),
    )
    for name in sorted(names):
        if not name.endswith(".js"):
            continue
        path = root / name
        source = path.read_text(encoding="utf-8")
        for pattern in patterns:
            for match in pattern.finditer(source):
                target = (path.parent / match[1]).resolve()
                if target.is_relative_to(root):
                    dependency = target.relative_to(root).as_posix()
                    if dependency not in names or not target.is_file():
                        raise ValueError(f"Missing packaged import: {name} -> {match[1]}. Commit all runtime files before releasing.")


def verify(root: Path, version: str) -> None:
    if not re.fullmatch(r"\d+\.\d+\.\d+\.\d+(?:-rc\.\d+)?", version):
        raise ValueError("Invalid release version")
    source = (root / "extension.js").read_text(encoding="utf-8")
    match = re.search(r'shuYingLocalVersion\s*=\s*"([^"]+)"', source)
    if not match or match[1] != version:
        raise ValueError(f"extension.js version must be {version}")
    for path in scan_files(root):
        if not path.resolve().is_relative_to(root):
            raise ValueError(f"Release file escapes source root: {path}")

    output = root / "dist/manifest.json"
    actual = read_json(output)
    config = preserve_removals(load_config(root, "tools/manifest_config.json"), output)
    expected, modules, legacy = build_manifest(root, version, config, actual)
    compare_manifest(actual, expected, "base manifest")
    if actual.get("modules") != expected.get("modules"):
        raise ValueError("Invalid module descriptors")
    for name, expected_module in modules.items():
        component = read_json(root / actual["modules"][name]["manifest"])
        compare_manifest(component, expected_module, f"{name} manifest")
    packaged_files = set(actual["files"])
    for component in modules.values():
        packaged_files.update(component["files"])
    verify_imports(root, packaged_files)
    for name, baseline in legacy.items():
        snapshot = read_json(root / actual["modules"][name]["legacy_manifest"])
        files = snapshot.get("files")
        prefix = config["modules"][name]["root"] + "/"
        if (snapshot.get("version") != version or snapshot.get("module_id") != name
                or snapshot.get("snapshot") != "legacy" or not isinstance(files, list)
                or any(not isinstance(path, str) or not path.startswith(prefix)
                       or "\\" in path or ":" in path
                       or any(part in {"", ".", ".."} for part in path.split("/"))
                       for path in files)
                or len(files) != len(set(files))
                or not set(baseline["files"]).issubset(files)):
            raise ValueError(f"Invalid or incomplete {name} legacy ownership snapshot")
    print(f"Verified {version}: {actual['file_count']} base files; "
          + ", ".join(f"{name}: {item['file_count']} files" for name, item in modules.items()))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".")
    parser.add_argument("--version", required=True)
    args = parser.parse_args()
    verify(Path(args.root).resolve(), args.version)


if __name__ == "__main__":
    main()
