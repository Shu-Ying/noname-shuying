"""Generate release manifests from committed Git bytes, without creating a tag."""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path


def git(root: Path, *args: str) -> bytes:
    return subprocess.run(["git", "-c", "core.autocrlf=false", *args], cwd=root,
                          check=True, stdout=subprocess.PIPE).stdout


def prepare(root: Path, version: str) -> None:
    if not re.fullmatch(r"\d+\.\d+\.\d+\.\d+(?:-rc\.\d+)?", version):
        raise ValueError("Invalid release version")
    repository = Path(git(root, "rev-parse", "--show-toplevel").decode("utf-8").strip()).resolve()
    if repository != root:
        raise ValueError("Run this tool from the extension repository")
    rows = git(root, "status", "--porcelain=v1", "-z", "--untracked-files=all").decode("utf-8").split("\0")
    dirty = []
    i = 0
    while i < len(rows):
        row = rows[i]
        if row:
            path = row[3:]
            if not path.startswith("dist/"):
                dirty.append(path)
            if "R" in row[:2] or "C" in row[:2]:
                i += 1
                if i < len(rows) and not rows[i].startswith("dist/"):
                    dirty.append(rows[i])
        i += 1
    if dirty:
        raise ValueError("Commit source and new runtime files first; pending files: " + ", ".join(dirty[:8]))

    with tempfile.TemporaryDirectory(prefix="shuying-release-") as temporary:
        workspace = Path(temporary)
        archive = workspace / "source.zip"
        stage = workspace / "source"
        git(root, "archive", "--format=zip", f"--output={archive}", "HEAD")
        with zipfile.ZipFile(archive) as source:
            # Git trees cannot contain traversal paths; still check before extracting.
            for item in source.infolist():
                path = stage / item.filename
                if not path.resolve().is_relative_to(stage.resolve()):
                    raise ValueError("Unsafe archive path")
            source.extractall(stage)
        subprocess.run([sys.executable, str(stage / "tools/generate_manifest.py"),
                        "--root", str(stage), "--version", version], check=True)
        subprocess.run([sys.executable, str(stage / "tools/verify_manifest.py"),
                        "--root", str(stage), "--version", version], check=True)
        output = root / "dist"
        output.mkdir(exist_ok=True)
        shutil.copyfile(stage / "dist/manifest.json", output / "manifest.json")
        components = output / "modules"
        components.mkdir(exist_ok=True)
        generated = list((stage / "dist/modules").glob("*.json"))
        expected = {path.name for path in generated}
        for path in generated:
            shutil.copyfile(path, components / path.name)
        for stale in components.glob("*.json"):
            if stale.name not in expected:
                stale.unlink()
    print("Manifests are ready. Commit dist/manifest.json and dist/modules/*.json before creating the release tag.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".")
    parser.add_argument("--version", default=os.environ.get("SHUYING_RELEASE_VERSION"))
    args = parser.parse_args()
    if not args.version:
        parser.error("--version is required")
    prepare(Path(args.root).resolve(), args.version)


if __name__ == "__main__":
    main()
