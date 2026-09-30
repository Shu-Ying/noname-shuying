const entries = [
    { id: "mengsan_burning_blood_shuying", name: "燃烧之血",
        description: "战斗结束后回复6点生命，不能超过生命上限。",
        effect: "battleHeal", amount: 6 },
    { id: "mengsan_snake_ring_shuying", name: "蛇之戒指",
        description: "每场战斗开始时，额外摸2张牌。",
        effect: "openingDraw", amount: 2 },
    { id: "mengsan_long_snake_ring_shuying", name: "长蛇戒指",
        description: "每场战斗的前3个自身回合开始时，额外摸2张牌。",
        effect: "earlyTurnDraw", amount: 2, turns: 3 },
    { id: "mengsan_millennium_puzzle_shuying", name: "千年积木",
        description: "每场战斗首次实际损失生命且仍存活时，摸3张牌。",
        effect: "firstHpLossDraw", amount: 3 },
    { id: "mengsan_pendulum_shuying", name: "摆动球",
        description: "每场战斗每到第3个自身回合开始时，额外摸1张牌。",
        effect: "periodicTurnDraw", amount: 1, turns: 3 },
    { id: "mengsan_hand_charm_shuying", name: "束带",
        description: "基础手牌上限额外+1；重复获得不叠加。",
        effect: "handLimit", amount: 1 },
];

export const relicDefinitions = Object.freeze(Object.fromEntries(
    entries.map(entry => [entry.id, Object.freeze({ ...entry,
        owner: null, image: null })])));

export const getRelic = id => Object.hasOwn(relicDefinitions, id)
    ? relicDefinitions[id] : null;

export const heldRelics = run => [...new Set(run?.player?.items || [])]
    .map(getRelic).filter(Boolean);

export function canAcquireRelic(run, id) {
    const relic = getRelic(id);
    return Boolean(run?.player && relic &&
        (relic.owner === null || relic.owner === run.player.character) &&
        !run.player.items?.includes(id));
}

export function grantRelic(run, id) {
    if (!getRelic(id)) throw new Error(`梦三遗物未注册：${id}`);
    if (!canAcquireRelic(run, id)) return false;
    run.player.items ||= [];
    run.player.items.push(id);
    const relic = getRelic(id);
    if (relic.effect === "handLimit") {
        run.player.handLimitBonus = (run.player.handLimitBonus || 0) +
            relic.amount;
    }
    return true;
}

export const relicRewardIds = entries.filter(entry =>
    entry.effect !== "handLimit").map(entry => `shared.reward.relic.${entry.id}`);

export const relicRewards = Object.fromEntries(relicRewardIds.map(id => {
    const relicId = id.slice("shared.reward.relic.".length);
    const relic = getRelic(relicId);
    return [id, { relic: relicId, name: `遗物·${relic.name}`,
        description: relic.description }];
}));
