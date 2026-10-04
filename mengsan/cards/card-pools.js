// 牌组归属只管理正常获得和随机生成，不限制怪物/剧情显式使用实体牌。
import { liubeiBaseCardNames } from "./packs/liubei/names.js";
export { LIUBEI_CARD_OWNER, legacyIroncladNames } from "./packs/liubei/names.js";
export function generationPool(registry, decks, {attacksOnly=false}={}) {
    const chosen = new Set(decks);
    return Object.values(registry).filter(c => (chosen.has(c.deck) ||
        chosen.has("liubei") && liubeiBaseCardNames.includes(c.name)) && !c.generatedOnly &&
        (!attacksOnly || (c.cardType ? c.cardType === "attack" : c.category === "damage"))).map(c=>c.name);
}
