// 灰机Wiki普通数值：每次行动在冲撞/黏液之间等权重随机。
export const LEAFSLIME_CHARACTER = "mengsan_leaf_slime_s_shuying";
export const LEAFSLIME_MOVES = Object.freeze({
    tackle: Object.freeze({ id: "tackle", name: "冲撞", damage: 3 }),
    goop: Object.freeze({ id: "goop", name: "黏液", slimed: 1 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("树叶史莱姆行动记录无效");
    return turns;
};
const roll = random => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("树叶史莱姆随机数必须在[0,1)内");
    return value;
};
export function selectLeafslimeMove(state = {}, random) {
    turnsOf(state);
    return roll(random) < 0.5 ? LEAFSLIME_MOVES.tackle : LEAFSLIME_MOVES.goop;
}
export function recordLeafslimeAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("树叶史莱姆行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const rollLeafslimeHp = random => 11 + Math.floor(roll(random) * 5);
export const isLeafslime = player => player?.name === LEAFSLIME_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
