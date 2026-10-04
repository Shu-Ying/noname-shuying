// 仅迁移读取/写入时的存档副本，不重新注册已移除的独立牌。
const cardNames = Object.freeze({mengsan_ic_strike: "sha", mengsan_ic_bash: "mengsan_zhongsha"});
const rewardIds = Object.freeze({
    "shared.reward.card.mengsan_ic_strike": "card_sha",
    "shared.reward.card.mengsan_ic_bash": "shared.reward.card.zhongsha",
});

// 旧奖励候选保留ID，避免与同批已有杀/重杀候选发生ID冲突。
export function resolveRetiredCardReward(id) {
    return Object.hasOwn(rewardIds, id) ? rewardIds[id] : id;
}

export function migrateRetiredCards(run) {
    if (!run || typeof run !== "object") return run;
    // 同时覆盖永久牌组、待结算快照、已选结果与重试快照，保留牌实例ID及其余状态。
    const pending = [run], seen = new Set();
    while (pending.length) {
        const value = pending.pop();
        if (seen.has(value)) continue;
        seen.add(value);
        if (Object.hasOwn(cardNames, value.name)) value.name = cardNames[value.name];
        const cardName = Object.hasOwn(cardNames, value.card?.name) ? cardNames[value.card.name] : value.card?.name;
        if (cardName === "sha" && value.name === "获得一张【打击】") value.name = "获得一张【杀】";
        if (cardName === "mengsan_zhongsha" && value.name === "获得一张【痛击】") value.name = "获得一张【重杀】";
        for (const key of Object.keys(value)) {
            const item = value[key];
            if (item && typeof item === "object") pending.push(item);
        }
    }
    return run;
}
