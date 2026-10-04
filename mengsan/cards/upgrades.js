import { cardPackUpgradeRules } from "./packs/data.js";
const upgrades = Object.freeze({
    ...cardPackUpgradeRules,
    sha: Object.freeze({ maxLevel: 1, damage: 9 }),
    mengsan_zhongsha: Object.freeze({ maxLevel: 1, damage: 10,
        vulnerable: 3 }),
});

export const cardUpgradeRule = name =>
    Object.hasOwn(upgrades, name) ? upgrades[name] : null;

function upgradeData(card) {
    if(card?.cards?.length===1 && card.cards[0]?.name===card.name && card.cards[0].storage?.mengsanCard_shuying)card=card.cards[0];
    const data=card?.storage?.mengsanCard_shuying || card;
    return data && data.name===card?.name ? data : null;
}

export function cardUpgradeLevel(card) {
    const data = upgradeData(card);
    if (!data || data.name !== card?.name) return 0;
    const limit = cardUpgradeRule(card.name)?.maxLevel || 0;
    return Number.isInteger(data.upgrade) && data.upgrade > 0
        ? Math.min(data.upgrade, limit) : 0;
}

export function canUpgradeCard(card) {
    const rule = cardUpgradeRule(card?.name);
    const data = upgradeData(card), level = data?.upgrade ?? 0;
    // 永恒只禁止移除和变化；是否可强化由强化规则及真实等级决定。
    return Boolean(data && rule && Number.isInteger(level) && level >= 0 &&
        level < rule.maxLevel);
}

export const hasUpgradeableCard = deck =>
    Array.isArray(deck) && deck.some(canUpgradeCard);

export function upgradeRandomCard(deck, random) {
    const eligible = Array.isArray(deck) ? deck.filter(canUpgradeCard) : [];
    if (!eligible.length) return null;
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("梦三强化随机数必须位于[0, 1)");
    }
    const card = eligible[Math.floor(value * eligible.length)];
    const data=upgradeData(card);
    data.upgrade = (data.upgrade || 0) + 1;
    return card;
}
