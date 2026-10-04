import { cardRarities } from "./rarity-data.js";
import { cardRarityLabels } from "./classification-types.js";

// 使用固定可信色值；不把牌组数据或外部输入直接拼成 CSS。
const palettes = Object.fromEntries([
    ["common", "普通", "#b2b5b6", "#383e42", "#14181b", "#dededd"],
    ["uncommon", "罕见", "#66d6df", "#113d42", "#102a2e", "#b5eff1"],
    ["rare", "稀有", "#ecc063", "#604116", "#332710", "#fff0b6"],
    ["event", "事件", "#77ce8a", "#123c21", "#152718", "#c4f3c8"],
    ["ancient", "先古之民", "#b45cc0", "#291a35", "#17131b", "#bfc7c5"],
].map(([key, label, accent, dark, ink, metal]) => [key, Object.freeze({key, label, accent, dark, ink, metal})]));
// 初始、衍生沿用现有中性配色；尚无专门视觉的状态/诅咒/任务保留原卡面。
export const rarityTypes = Object.freeze({ ...palettes,
    basic: Object.freeze({...palettes.common, key:"basic", label:cardRarityLabels.basic}),
    token: Object.freeze({...palettes.common, key:"token", label:cardRarityLabels.token}),
    ...Object.fromEntries(["status","curse","quest"].map(key =>
        [key, Object.freeze({key, label:cardRarityLabels[key], visualKey:"pending"})])),
});
const variables = ["accent", "dark", "ink", "metal"];
export function createRarityResolver(assignments) {
    if (!assignments || typeof assignments !== "object" || Array.isArray(assignments))
        throw new TypeError("梦三稀有度配置须为对象");
    const values = Object.create(null);
    for (const [name, value] of Object.entries(assignments)) {
        if (!/^[a-z][a-z0-9_]*$/.test(name) ||
            !(value == null || typeof value === "string" && Object.hasOwn(rarityTypes, value)))
            throw new TypeError(`梦三稀有度配置无效：${name}`);
        values[name] = value;
    }
    return card => {
        const name = typeof card === "string" ? card : card?.name;
        const key = typeof name === "string" && Object.hasOwn(values, name) ? values[name] : null;
        // 未登记的原生牌、未填写或 null 均按普通显示，显式等级仍优先。
        return key ? rarityTypes[key] : rarityTypes.common;
    };
}
export const getCardRarity = createRarityResolver(cardRarities);
// Reused by real hand nodes and read-only previews; never write card.storage or game data.
export function applyCardRarity(node, card) {
    const info = getCardRarity(card);
    const visualKey = info.visualKey || info.key;
    if (node.dataset.mengsanRarity !== visualKey) node.dataset.mengsanRarity = visualKey;
    if (node.dataset.mengsanRarityLabel !== info.label) node.dataset.mengsanRarityLabel = info.label;
    for (const key of variables) {
        const property = `--ms-rarity-${key}`;
        if (visualKey === "pending") {
            if (node.style.getPropertyValue(property)) node.style.removeProperty(property);
        } else if (node.style.getPropertyValue(property) !== info[key]) node.style.setProperty(property, info[key]);
    }
    return info;
}
