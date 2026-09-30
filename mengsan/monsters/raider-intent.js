// 普通难度数值；团伙每名成员仅预测并执行自己的一项技能，随后照常出牌。
export const RAIDER_MOVES = Object.freeze({
    beat: Object.freeze({ id: "beat", name: "殴打", damage: 7 }),
    roar: Object.freeze({ id: "roar", name: "怒吼", strength: 3 }),
    killshot: Object.freeze({ id: "killshot", name: "致命射击", damage: 10 }),
    swing: Object.freeze({ id: "swing", name: "挥击", damage: 5, block: 5 }),
    bigSwing: Object.freeze({ id: "bigSwing", name: "大力挥舞", damage: 12 }),
    reload: Object.freeze({ id: "reload", name: "装填", block: 3 }),
    fire: Object.freeze({ id: "fire", name: "射击！", damage: 14 }),
    track: Object.freeze({ id: "track", name: "追踪", debuff: "脆弱", stacks: 2 }),
    hounds: Object.freeze({ id: "hounds", name: "放狗", damage: 1, hits: 8 }),
});

export const RAIDER_CYCLES = Object.freeze({
    mengsan_raider_brute_shuying: Object.freeze([RAIDER_MOVES.beat, RAIDER_MOVES.roar]),
    mengsan_raider_assassin_shuying: Object.freeze([RAIDER_MOVES.killshot]),
    mengsan_raider_axe_shuying: Object.freeze([RAIDER_MOVES.swing, RAIDER_MOVES.swing, RAIDER_MOVES.bigSwing]),
    mengsan_raider_crossbow_shuying: Object.freeze([RAIDER_MOVES.reload, RAIDER_MOVES.fire]),
    mengsan_raider_tracker_shuying: Object.freeze([RAIDER_MOVES.track, RAIDER_MOVES.hounds]),
});

export function isRaiderCharacter(character) {
    return Object.hasOwn(RAIDER_CYCLES, character);
}

export function selectRaiderMove(character, state = {}) {
    const cycle = RAIDER_CYCLES[character];
    if (!cycle) return null;
    const turn = state.turnsTaken || 0;
    if (!Number.isInteger(turn) || turn < 0) throw new RangeError("劫掠者行动次数无效");
    if (character === "mengsan_raider_tracker_shuying") {
        return turn === 0 ? RAIDER_MOVES.track : RAIDER_MOVES.hounds;
    }
    return cycle[turn % cycle.length];
}

export function recordRaiderAction(state = {}) {
    return { turnsTaken: (state.turnsTaken || 0) + 1 };
}
