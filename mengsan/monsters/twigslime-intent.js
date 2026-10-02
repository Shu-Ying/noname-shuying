// 灰机Wiki普通数值：每回合冲撞，造成4点攻击伤害。
export const TWIGSLIME_CHARACTER = "mengsan_twig_slime_s_shuying";
export const TWIGSLIME_MOVES = Object.freeze({
    tackle: Object.freeze({ id: "tackle", name: "冲撞", damage: 4 }),
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
export function selectTwigslimeMove(state = {}) {
    turnsOf(state);
    return TWIGSLIME_MOVES.tackle;
}
export function recordTwigslimeAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("树叶史莱姆行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const rollTwigslimeHp = random => 7 + Math.floor(roll(random) * 5);
export const isTwigslime = player => player?.name === TWIGSLIME_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
