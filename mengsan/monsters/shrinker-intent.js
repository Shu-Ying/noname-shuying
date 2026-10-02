// 缩小甲虫，灰机Wiki普通数值；缩小后大啃、践踏严格交替。
export const SHRINKER_CHARACTER = "mengsan_shrinker_beetle_shuying";
export const SHRINKER_MOVES = Object.freeze({
    shrink: Object.freeze({ id: "shrink", name: "缩小", debuff: "缩小", stacks: 1, shrink: true }),
    chomp: Object.freeze({ id: "chomp", name: "大啃", damage: 7 }),
    stomp: Object.freeze({ id: "stomp", name: "践踏", damage: 13 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("缩小甲虫行动记录无效");
    return turns;
};
export function selectShrinkerMove(state = {}) {
    const turns = turnsOf(state);
    return turns === 0 ? SHRINKER_MOVES.shrink : turns % 2 ? SHRINKER_MOVES.chomp : SHRINKER_MOVES.stomp;
}
export function recordShrinkerAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("缩小甲虫行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export function rollShrinkerHp(random) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("缩小甲虫随机数必须在[0,1)内");
    return 38 + Math.floor(value * 3);
}
export const isShrinker = player => player?.name === SHRINKER_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
