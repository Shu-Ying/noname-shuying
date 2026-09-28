import { cardDefinitions, canAcquireCard } from "../content/card-definitions.js";

const suits = ["spade", "heart", "club", "diamond"];

// 仅创建可序列化的牌组数据；战斗中的实体牌仍由 game.createCard 创建。
export function createCardData(spec, { character, enemy = false, registry = cardDefinitions } = {}) {
    if (!spec || typeof spec !== "object" || !Object.hasOwn(registry, spec.name)) {
        throw new Error(`梦三牌未注册：${spec?.name}`);
    }
    if (!enemy && !canAcquireCard(character, spec.name, registry)) {
        throw new Error(`武将 ${character || "未知"} 无法获得牌：${spec.name}`);
    }
    if (typeof spec.id !== "string" || !spec.id || !suits.includes(spec.suit) ||
        !Number.isInteger(spec.number) || spec.number < 1 || spec.number > 13 ||
        (spec.nature != null && typeof spec.nature !== "string") ||
        !Number.isInteger(spec.upgrade ?? 0) || (spec.upgrade ?? 0) < 0 ||
        !Array.isArray(spec.affixes ?? []) || !(spec.affixes ?? []).every(value => typeof value === "string")) {
        throw new Error(`梦三牌数据无效：${spec.name}`);
    }
    return {
        id: spec.id, suit: spec.suit, number: spec.number, name: spec.name,
        nature: spec.nature ?? null, affixes: (spec.affixes ?? []).slice(), upgrade: spec.upgrade ?? 0,
    };
}

export function createRandomCardData(run, name, { random, now = Date.now, upgrade = 0, affixes = [] } = {}) {
    if (!run?.player || !Array.isArray(run.player.deck) || typeof random !== "function") throw new Error("梦三随机牌参数无效");
    // 先检查资格，再消耗随机数；失败的获得操作不改变后续奖励序列。
    if (!canAcquireCard(run.player.character, name)) throw new Error(`武将 ${run.player.character} 无法获得牌：${name}`);
    const stamp = now();
    let id;
    do { id = `mengsan_card_${stamp}_${Math.floor(random() * 1e6)}`; }
    while (run.player.deck.some(card => card.id === id));
    return createCardData({
        id, suit: suits[Math.floor(random() * suits.length)], number: 1 + Math.floor(random() * 13),
        name, nature: null, upgrade, affixes,
    }, { character: run.player.character });
}

export function addCardToDeck(run, spec) {
    const card = createCardData(spec, { character: run?.player?.character });
    if (!Array.isArray(run?.player?.deck)) throw new Error("梦三牌组无效");
    if (run.player.deck.some(existing => existing.id === card.id)) throw new Error(`梦三牌 ID 重复：${card.id}`);
    run.player.deck.push(card);
    return card;
}
