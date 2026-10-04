// 梦三永久牌组的可获得牌注册表。这里登记牌名与归属，不复制引擎中的效果定义。
// 新增武将专属牌时填写 owner 为该武将 ID；通用牌填写 owner: null。
import { cardPackDefinitions } from "./packs/data.js";
import { cardTypes, cardRarityLabels } from "./classification-types.js";
import { liubeiCardTraits } from "./packs/liubei/traits.js";
const definitions = [
    ...cardPackDefinitions,
    { name: "sha", category: "damage", owner: null, ...liubeiCardTraits.sha },
    { name: "mengsan_zhongsha", category: "damage", owner: null, ...liubeiCardTraits.mengsan_zhongsha },
    { name: "shan", category: "utility", owner: null, cardType: "skill" },
    { name: "tao", category: "recovery", owner: null, cardType: "skill" },
    { name: "jiu", category: "recovery", owner: null, cardType: "skill" },
    { name: "guohe", category: "utility", owner: null, cardType: "skill" },
    { name: "wuzhong", category: "utility", owner: null, cardType: "skill" },
    { name: "juedou", category: "damage", owner: null, cardType: "attack" },
    { name: "bagua", category: "utility", owner: null, cardType: "equipment" },
    // 当前仅刘备专属首关的固定奖励会永久获得【的卢】。
    { name: "dilu", category: "utility", owner: "mengsan_liubei_shuying", cardType: "equipment" },
];

export function createCardRegistry(entries) {
    const registry = Object.create(null);
    for (const entry of entries) {
        if (!entry || typeof entry.name !== "string" || !/^[a-z][a-z0-9_]*$/.test(entry.name) ||
            !["damage", "recovery", "utility"].includes(entry.category) ||
            !(entry.owner === null || typeof entry.owner === "string" && entry.owner.length > 0) ||
            !(entry.deck == null || typeof entry.deck === "string" && /^[a-z][a-z0-9_]*$/.test(entry.deck)) ||
            !(entry.generatedOnly == null || typeof entry.generatedOnly === "boolean") ||
            !(entry.cardType == null || typeof entry.cardType === "string" && Object.hasOwn(cardTypes, entry.cardType)) ||
            !(entry.rarity == null || typeof entry.rarity === "string" && Object.hasOwn(cardRarityLabels, entry.rarity)) ||
            Object.hasOwn(registry, entry.name)) {
            throw new Error(`梦三牌定义无效或重复：${entry?.name}`);
        }
        registry[entry.name] = Object.freeze({ name: entry.name, category: entry.category, owner: entry.owner,
            cardType: entry.cardType ?? null, rarity: entry.rarity ?? "common",
            deck: entry.deck || "legacy", generatedOnly: entry.generatedOnly === true });
    }
    return Object.freeze(registry);
}

export const cardDefinitions = createCardRegistry(definitions);

export function canAcquireCard(character, name, registry = cardDefinitions) {
    const definition = Object.hasOwn(registry, name) ? registry[name] : null;
    return !!definition && !definition.generatedOnly &&
        (definition.owner === null || definition.owner === character);
}
