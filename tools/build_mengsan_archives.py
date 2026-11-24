"""Build bounded ZIP attachments from the verified Mengsan release snapshot."""

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path

from generate_manifest import validate_relative_paths

MAX_UNCOMPRESSED_BYTES = 5 * 1024**2
MAX_ARCHIVE_BYTES = 6 * 1024**2


def write_part(root: Path, part: Path, files: list[str], manifest: dict) -> None:
    with zipfile.ZipFile(part, "w", zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=False) as archive:
        for name in files:
            source = (root / name).resolve()
            if not source.is_relative_to(root) or source.stat().st_size != manifest[name]["size"]:
                raise ValueError(f"Source size or path differs from manifest: {name}")
            archive.write(source, name)
    if part.stat().st_size > MAX_ARCHIVE_BYTES:
        raise ValueError(f"ZIP size exceeds download limit: {part.name}")
    with zipfile.ZipFile(part) as archive:
        if archive.namelist() != files:
            raise ValueError(f"Unexpected ZIP entries: {part.name}")
        for entry in archive.infolist():
            info = manifest[entry.filename]
            if entry.file_size != info["size"]:
                raise ValueError(f"ZIP entry size differs from manifest: {entry.filename}")
            if hashlib.sha256(archive.read(entry)).hexdigest() != info["sha256"]:
                raise ValueError(f"ZIP entry SHA-256 differs from manifest: {entry.filename}")


def build_archives(root: Path, output: Path, tag: str) -> list[Path]:
    root = root.resolve()
    manifest = json.loads((root / "dist/modules/mengsan.json").read_text(encoding="utf-8"))
    if (not re.fullmatch(r"v\d+\.\d+\.\d+\.\d+(?:-rc\.\d+)?", tag)
            or manifest.get("version") != tag[1:] or manifest.get("module_id") != "mengsan"):
        raise ValueError("Mengsan manifest and release version do not match")
    files = manifest["files"]
    validate_relative_paths(list(files), "Mengsan manifest")
    groups: list[list[str]] = []
    group: list[str] = []
    group_bytes = 0
    for name, info in sorted(files.items()):
        size = info["size"]
        if not name.startswith("mengsan/") or "\\" in name or type(size) is not int or size < 0:
            raise ValueError(f"Invalid Mengsan manifest entry: {name}")
        if size > MAX_UNCOMPRESSED_BYTES:
            continue
        if group and group_bytes + size > MAX_UNCOMPRESSED_BYTES:
            groups.append(group)
            group = []
            group_bytes = 0
        group.append(name)
        group_bytes += size
    if group:
        groups.append(group)

    output.mkdir(parents=True)
    parts = []
    for index, names in enumerate(groups, 1):
        part = output / f"mengsan-{tag}-part-{index:03}.zip"
        write_part(root, part, names, files)
        parts.append(part)
    return parts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--tag", required=True)
    args = parser.parse_args()
    parts = build_archives(args.root, args.out_dir, args.tag)
    print(f"Verified {len(parts)} Mengsan ZIP parts for {args.tag}")


if __name__ == "__main__":
    main()
