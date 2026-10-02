// 普通难度：顶撞→犹豫斩击→哈气。双只分别从斩击、哈气进入同一循环。
export const NIBBIT_CHARACTER = "mengsan_nibbit_shuying";
export const NIBBIT_MOVES = Object.freeze({
    butt: Object.freeze({ id: "butt", name: "顶撞", damage: 12 }),
    slice: Object.freeze({ id: "slice", name: "犹豫斩击", damage: 6, block: 5 }),
    hiss: Object.freeze({ id: "hiss", name: "哈气", strength: 2 }),
});
const CYCLE = Object.freeze([NIBBIT_MOVES.butt, NIBBIT_MOVES.slice, NIBBIT_MOVES.hiss]);
const openingOf = state => {
    const opening = state.opening ?? "butt";
    if (!Object.hasOwn(NIBBIT_MOVES, opening)) throw new RangeError("小啃兽起手无效");
    return opening;
};
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("小啃兽行动记录无效");
    return turns;
};
export const selectNibbitMove = (state = {}) => {
    const offset = openingOf(state) === "slice" ? 1 : openingOf(state) === "hiss" ? 2 : 0;
    return CYCLE[(turnsOf(state) % CYCLE.length + offset) % CYCLE.length];
};
export function recordNibbitAction(state = {}, advance = true) {
    const opening = openingOf(state), turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("小啃兽行动推进无效");
    return { opening, turnsTaken: turns + (advance ? 1 : 0) };
}
export function rollNibbitHp(random) {
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("怪物随机数必须在[0,1)内");
    return 42 + Math.floor(roll * 5);
}
export const isNibbit = player => player?.name === NIBBIT_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
export function bindNibbitOpenings(players) {
    // 开战时按关卡前后顺序固定起手；死亡、席位变更或重复规划不重置循环。
    const group = players.filter(isNibbit);
    group.forEach((player, index) => {
        if (player.storage.mengsanNibbitState_shuying != null) return;
        player.storage.mengsanNibbitState_shuying = {
            opening: group.length === 2 ? (index === 0 ? "slice" : "hiss") : "butt",
            turnsTaken: 0,
        };
    });
}
