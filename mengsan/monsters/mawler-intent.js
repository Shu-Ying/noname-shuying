// 灰机 Wiki 蛮兽页普通数值；冷却1表示攻击不能连续使用。
export const MAWLER_CHARACTER = "mengsan_mawler_shuying";
export const MAWLER_MOVES = Object.freeze({
    claw: Object.freeze({ id: "claw", name: "爪击", damage: 4, hits: 2 }),
    rip: Object.freeze({ id: "rip", name: "狂乱撕扯", damage: 14 }),
    roar: Object.freeze({ id: "roar", name: "怒吼", debuff: "易伤", stacks: 3 }),
});
export function eligibleMawlerMoves(state = {}) {
    const turn = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turn) || turn < 0) throw new RangeError("蛮兽行动次数无效");
    if (turn === 0) return [MAWLER_MOVES.claw];
    const moves = [];
    if (state.lastMove !== "claw") moves.push(MAWLER_MOVES.claw);
    if (state.lastMove !== "rip") moves.push(MAWLER_MOVES.rip);
    if (!state.roarUsed) moves.push(MAWLER_MOVES.roar);
    return moves;
}
export function selectMawlerMove(state = {}, random) {
    const moves = eligibleMawlerMoves(state);
    if (moves.length === 1) return moves[0];
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("怪物随机数必须在 [0,1) 内");
    return moves[Math.floor(roll * moves.length)];
}
export function recordMawlerAction(state = {}, move, paid) {
    const turn = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turn) || turn < 0 || turn === Number.MAX_SAFE_INTEGER) {
        throw new RangeError("蛮兽行动次数无效");
    }
    if (paid && (!move || !Object.hasOwn(MAWLER_MOVES, move.id))) throw new TypeError("蛮兽行动无效");
    return {
        turnsTaken: turn + 1,
        lastMove: paid ? move.id : state.lastMove || null,
        roarUsed: Boolean(state.roarUsed || paid && move.id === "roar"),
    };
}
export const isMawler = player => player?.name === MAWLER_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
