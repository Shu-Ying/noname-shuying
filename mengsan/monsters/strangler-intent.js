// 蛇行扼杀者，普通数值：缠身与等权重随机攻击严格交替。
export const STRANGLER_CHARACTER = "mengsan_slithering_strangler_shuying";
export const STRANGLER_MOVES = Object.freeze({
    constrict: Object.freeze({ id: "constrict", name: "缠身", debuff: "紧缠", stacks: 3, constrict: 3 }),
    thwack: Object.freeze({ id: "thwack", name: "重击", damage: 7, block: 5 }),
    lash: Object.freeze({ id: "lash", name: "甩动", damage: 12 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("扼杀者行动记录无效");
    return turns;
};
const roll = random => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("扼杀者随机数必须在[0,1)内");
    return value;
};
export function selectStranglerMove(state = {}, random) {
    return turnsOf(state) % 2 === 0 ? STRANGLER_MOVES.constrict :
        roll(random) < 0.5 ? STRANGLER_MOVES.thwack : STRANGLER_MOVES.lash;
}
export function recordStranglerAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) {
        throw new RangeError("扼杀者行动推进无效");
    }
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const rollStranglerHp = random => 53 + Math.floor(roll(random) * 3);
export const isStrangler = player => player?.name === STRANGLER_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
