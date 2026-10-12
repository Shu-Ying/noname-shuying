"""Import the reviewed Wiki snapshot and supplied split atlas without fetching the web."""
import argparse
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALIASES = {
    "ring_of_the_snake": "mengsan_snake_ring_shuying",
    "ring_of_the_drake": "mengsan_long_snake_ring_shuying",
    "centennial_puzzle": "mengsan_millennium_puzzle_shuying",
    "festive_popper": "mengsan_festive_poppers_shuying",
}
IMAGE_ALIASES = {
    "yummy_cookie": "yummy_cookie_ironclad.png",
    "forgotten_soul": "lost_soul.png",
    "looming_fruit": "looming_fruit_2.png",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    args = parser.parse_args()
    source = json.loads(args.snapshot.read_text(encoding="utf-8"))
    rows = source["relics"]
    if len(rows) != 298 or len({row["id"] for row in rows}) != 298:
        raise ValueError("Expected reviewed 298 unique relics")
    atlas = ROOT / "assets/sts2/Godot_Atlas_Sprites_v0.111.0/images/atlases/relic_atlas.sprites"
    target = ROOT / "assets/relics"
    target.mkdir(exist_ok=True)
    entries, assets = [], []
    for row in rows:
        wiki_id = row["id"]
        filename = IMAGE_ALIASES.get(wiki_id, row["image"])
        data = (atlas / filename).read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"Invalid PNG: {filename}")
        width, height, depth, color = struct.unpack(">IIBB", data[16:26])
        # Icons are copied byte-for-byte; no enlargement, redraw or loss of alpha.
        (target / f"{wiki_id}.png").write_bytes(data)
        entries.append({
            "id": ALIASES.get(wiki_id, f"mengsan_{wiki_id}_shuying"),
            "wikiId": wiki_id, "name": row["name"],
            "description": row["rendered_description"], "pool": row["pool"],
            "tier": row["tier"], "ancient": row["ancient"] or None,
            "order": int(row["compendium_order"]),
            "image": f"extension/术樱包/mengsan/assets/relics/{wiki_id}.png",
            "source": row["source_page_url"],
            "descriptionRaw": row["description_raw"], "descriptionSource": row["description"],
            "flavor": row["flavor"], "predecessor": row["predecessor"], "category": row["category"],
        })
        assets.append({"wikiId": wiki_id, "source": filename,
                       "runtime": f"assets/relics/{wiki_id}.png", "width": width,
                       "height": height, "bytes": len(data), "depth": depth,
                       "alpha": color in (4, 6), "sha256": hashlib.sha256(data).hexdigest()})
    (ROOT / "relics/catalog.js").write_text(
        "// Generated from the reviewed 2026-10-04 Wiki snapshot; use tools/import-sts2-relics.py.\n"
        "export const relicCatalog = Object.freeze(" + json.dumps(entries, ensure_ascii=False, indent=2) + ");\n",
        encoding="utf-8")
    (target / "manifest.json").write_text(json.dumps({
        "snapshot_date": "2026-10-04", "atlas_version": "v0.111.0",
        "data_source": source["data_source_url"], "data_revision": source["source_revision"],
        "assets": assets,
        "notes": ["美味饼干使用铁甲战士版本；四个其他角色版本仍保留在来源图集中。",
                  "遗忘之魂映射 lost_soul.png；布质果实映射 looming_fruit_2.png。",
                  "图标是用户提供的原游戏拆包图片，逐字节复制，未重绘。"]
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(entries)} relics, {sum(a['bytes'] for a in assets)} PNG bytes")


if __name__ == "__main__":
    main()
