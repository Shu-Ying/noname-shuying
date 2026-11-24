import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from build_mengsan_archives import build_archives


class MengsanArchivesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "snapshot"
        self.output = Path(self.temp.name) / "archives"
        self.manifest = self.root / "dist/modules/mengsan.json"
        self.manifest.parent.mkdir(parents=True)

    def write_snapshot(self, files):
        entries = {}
        for name, data in files.items():
            file = self.root / name
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_bytes(data)
            entries[name] = {"size": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        self.manifest.write_text(json.dumps({
            "version": "2.0.2.3-rc.8", "module_id": "mengsan", "files": entries,
        }), encoding="utf-8")

    def test_parts_cover_packable_files_once(self):
        first = b"a" * (10 * 1024**2)
        second = b"b"
        self.write_snapshot({
            "mengsan/b": second,
            "mengsan/oversized": b"c" * (10 * 1024**2 + 1),
            "mengsan/a": first,
        })
        parts = build_archives(self.root, self.output, "v2.0.2.3-rc.8")
        self.assertEqual([part.name for part in parts], [
            "mengsan-v2.0.2.3-rc.8-part-001.zip", "mengsan-v2.0.2.3-rc.8-part-002.zip",
        ])
        for part, name, data in zip(parts, ["mengsan/a", "mengsan/b"], [first, second], strict=True):
            with zipfile.ZipFile(part) as archive:
                self.assertEqual(archive.namelist(), [name])
                self.assertEqual(archive.read(name), data)

    def test_reject_inconsistent_release(self):
        self.write_snapshot({"mengsan/a": b"a"})
        with self.assertRaisesRegex(ValueError, "version"):
            build_archives(self.root, self.output, "v2.0.2.3-rc.9")
        (self.root / "mengsan/a").write_bytes(b"b")
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            build_archives(self.root, self.output, "v2.0.2.3-rc.8")

    def test_reject_archive_over_download_limit(self):
        self.write_snapshot({"mengsan/a": b"a"})
        with patch("build_mengsan_archives.MAX_ARCHIVE_BYTES", 50):
            with self.assertRaisesRegex(ValueError, "ZIP size"):
                build_archives(self.root, self.output, "v2.0.2.3-rc.8")
