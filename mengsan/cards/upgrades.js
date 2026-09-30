const upgrades = Object.freeze({
    sha: Object.freeze({ maxLevel: 1, damage: 9 }),
    mengsan_zhongsha: Object.freeze({ maxLevel: 1, damage: 10,
        vulnerable: 3 }),
});

export const cardUpgradeRule = name =>
    Object.hasOwn(upgrades, name) ? upgrades[name] : null;

export function cardUpgradeLevel(card) {
    const data = card?.storage?.mengsanCard_shuying || card;
    if (!data || data.name !== card?.name) return 0;
    const limit = cardUpgradeRule(card.name)?.maxLevel || 0;
    return Number.isInteger(data.upgrade) && data.upgrade > 0
        ? Math.min(data.upgrade, limit) : 0;
}

export function canUpgradeCard(card) {
    const rule = cardUpgradeRule(card?.name);
    const level = card?.upgrade ?? 0;
    return Boolean(rule && Number.isInteger(level) && level >= 0 &&
        level < rule.maxLevel && !card.affixes?.includes("eternal"));
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
    card.upgrade = (card.upgrade || 0) + 1;
    return card;
}
