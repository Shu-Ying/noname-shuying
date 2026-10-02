// 灰机Wiki普通数值：第一回合黏糊射击，之后与团块射击严格交替。
export const LEAFMEDIUM_CHARACTER = "mengsan_leaf_slime_m_shuying";
export const LEAFMEDIUM_MOVES = Object.freeze({
    clump: Object.freeze({ id: "clump", name: "团块射击", damage: 8 }),
    sticky: Object.freeze({ id: "sticky", name: "黏糊射击", slimed: 2 }),
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
export function selectLeafslimeMediumMove(state = {}) {
    return turnsOf(state) % 2 === 0 ? LEAFMEDIUM_MOVES.sticky : LEAFMEDIUM_MOVES.clump;
}
export function recordLeafslimeMediumAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("树叶史莱姆行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const rollLeafslimeMediumHp = random => 32 + Math.floor(roll(random) * 4);
export const isLeafslimeMedium = player => player?.name === LEAFMEDIUM_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
