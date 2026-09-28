// 冷却按飞蝇菌子自己的行动次数计算，不受玩家回合或增援数量影响。
export const FLYCONID_MOVES = Object.freeze({
    smash: Object.freeze({ id: "smash", name: "猛砸", damage: 11 }),
    frail: Object.freeze({ id: "frail", name: "脆弱孢子", damage: 8, debuff: "脆弱", stacks: 2 }),
    vulnerable: Object.freeze({ id: "vulnerable", name: "易伤孢子", debuff: "易伤", stacks: 2 }),
});

export function eligibleFlyconidMoves(state = {}) {
    const upcoming = (state.turnsTaken || 0) + 1;
    const lastUsed = state.lastUsed || {};
    const moves = [];
    if (state.lastMove !== "smash") moves.push(FLYCONID_MOVES.smash);
    if (lastUsed.frail == null || upcoming - lastUsed.frail > 2) moves.push(FLYCONID_MOVES.frail);
    if (upcoming >= 2 && (lastUsed.vulnerable == null || upcoming - lastUsed.vulnerable > 3)) moves.push(FLYCONID_MOVES.vulnerable);
    return moves;
}

export function selectFlyconidMove(state, random) {
    const moves = eligibleFlyconidMoves(state);
    if (!moves.length) return null;
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("怪物随机数必须在 [0,1) 内");
    return moves[Math.floor(roll * moves.length)];
}

export function recordFlyconidAction(state, move, paid) {
    const next = {
        turnsTaken: (state.turnsTaken || 0) + 1,
        lastMove: state.lastMove || null,
        lastUsed: { ...(state.lastUsed || {}) },
    };
    if (paid && move) {
        next.lastMove = move.id;
        next.lastUsed[move.id] = next.turnsTaken;
    }
    return next;
}
