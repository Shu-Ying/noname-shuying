import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));

export function getSts2Atlas(name) {
    const config = join(toolsDir, ".sts2-source");
    const source = process.env.MENGSAN_STS2_SOURCE?.trim()
        || (existsSync(config) ? readFileSync(config, "utf8").trim() : "")
        || "../assets/sts2";
    const atlas = resolve(toolsDir, source, "Godot_Atlas_Sprites_v0.111.0", "images", "atlases", name);
    if (!statSync(atlas, { throwIfNoEntry: false })?.isDirectory()) {
        throw new Error("找不到 STS2 拆分图集：" + atlas + "。请检查 MENGSAN_STS2_SOURCE 或 tools/.sts2-source。");
    }
    return atlas;
}
