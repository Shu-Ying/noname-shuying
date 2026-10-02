const upgrades = Object.freeze({
    mengsan_songjianwushi: Object.freeze({ maxLevel: 1, baseBlock: 8, block: 11, draw: 1 }),
    mengsan_pomie: Object.freeze({ maxLevel: 1, baseCost: 1, cost: 0 }),
    mengsan_jianyi: Object.freeze({ maxLevel: 1, baseBlock: 7, block: 9, chooseExhaust: true }),
    mengsan_fangxue: Object.freeze({ maxLevel: 1, loseHp: 3, baseEnergy: 2, energy: 3 }),
    mengsan_yujin: Object.freeze({ maxLevel: 1, baseDamage: 18, damage: 24, exhaust: 1 }),
    mengsan_wanmeidaji: Object.freeze({ maxLevel: 1, baseDamage: 6, damage: 6, basePerStrike: 2, perStrike: 3 }),
    mengsan_yubeidaji: Object.freeze({ maxLevel: 1, baseDamage: 7, damage: 9, baseStrength: 2, strength: 3 }),
    mengsan_tupo: Object.freeze({ maxLevel: 1, baseDamage: 9, damage: 13, loseHp: 1 }),
    mengsan_touchui: Object.freeze({ maxLevel: 1, baseDamage: 9, damage: 12 }),
    mengsan_tiezhanbo: Object.freeze({ maxLevel: 1, baseBlock: 5, block: 7, baseDamage: 5, damage: 7 }),
    mengsan_shuangchongdaji: Object.freeze({ maxLevel: 1, baseDamage: 5, damage: 7, hits: 2 }),
    mengsan_shandianpili: Object.freeze({ maxLevel: 1, baseDamage: 4, damage: 7, vulnerable: 1 }),
    mengsan_rongrongzhiquan: Object.freeze({ maxLevel: 1, baseDamage: 10, damage: 14, exhaust: true }),
    mengsan_quanshenzhuangji: Object.freeze({ maxLevel: 1, baseCost: 1, cost: 0, damageFromBlock: true }),
    mengsan_jianbingdaji: Object.freeze({ maxLevel: 1, baseDamage: 9, damage: 10, baseDraw: 1, draw: 2 }),
    mengsan_feijianhuixuanbiao: Object.freeze({ maxLevel: 1, damage: 3, baseHits: 3, hits: 4 }),
    mengsan_fennu: Object.freeze({ maxLevel: 1, baseDamage: 6, damage: 8 }),
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
