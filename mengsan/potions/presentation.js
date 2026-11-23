import { getPotion, potionIds } from "./state.js";

const configKey = "mengsan_potion_localization_shuying";
const assetBase = new URL("../assets/sts2/potions/", import.meta.url);
const referenceRoot = "D:/workspace/术樱包-本地资料/参考资料/";
const localText = referenceRoot + "Slay the Spire 2/localization/zhs/potions.json";
const localIcons = referenceRoot +
    "梦三/STS2拆分图集/Godot_Atlas_Sprites_v0.111.0/images/atlases/potion_atlas.sprites/";
let translations = null;
const localImages = new Map();

export function setPotionText(source) {
    const entries = potionIds.flatMap(id => [id + ".title", id + ".description"]);
    if (entries.some(key => typeof source?.[key] !== "string" || !source[key].trim())) {
        throw new Error("请选择包含首批五种药水名称和说明的 potions.json");
    }
    translations = Object.fromEntries(entries.map(key => [key, source[key]]));
    return translations;
}

export const hasPotionText = () => translations !== null;

export async function loadPotionAssets(lib) {
    const fs = lib.node?.fs?.promises;
    if (fs) {
        await Promise.allSettled([
            fs.readFile(localText, "utf8").then(source => setPotionText(JSON.parse(source))),
            ...potionIds.map(async id => {
                const bytes = await fs.readFile(localIcons + id.toLowerCase() + ".png");
                localImages.set(id, "data:image/png;base64," + bytes.toString("base64"));
            }),
        ]);
    }
    if (hasPotionText()) return;
    if (lib.config[configKey]) {
        try { setPotionText(lib.config[configKey]); } catch { /* Try the resource directory. */ }
    }
    if (!hasPotionText()) {
        try {
            const response = await fetch(new URL("potions.json", assetBase));
            if (response.ok) setPotionText(await response.json());
        } catch { /* The player can load their JSON from the map. */ }
    }
}

export async function importPotionText(file, game) {
    const text = setPotionText(JSON.parse(await file.text()));
    game.saveConfig(configKey, text);
}

export function potionView(id) {
    const definition = getPotion(id);
    if (!definition) return null;
    const template = translations?.[id + ".description"];
    const rendered = template?.replace(/\{(\w+)(?::([^}]+))?\}/g, (token, key, formatter) => {
        if (key !== definition.variable) return token;
        return formatter === "energyIcons()" ? "⚡".repeat(definition.amount) : String(definition.amount);
    }) ?? (definition.stat + " " + definition.amount);
    return {
        name: translations?.[id + ".title"] ?? definition.name,
        description: rendered.replace(/\[\/?(?:blue|gold|green|red)\]/g, ""),
        richDescription: rendered,
        image: localImages.get(id) ?? new URL(id.toLowerCase() + ".png", assetBase).href,
    };
}
