// 灰机Wiki普通数值，SVG箭头：挥击→紧绕藤蔓→大啃→挥击。
export const VINE_CHARACTER = "mengsan_vine_shambler_shuying";
export const VINE_MOVES = Object.freeze({
    swipe: Object.freeze({ id: "swipe", name: "挥击", damage: 6, hits: 2 }),
    vines: Object.freeze({ id: "vines", name: "紧绕藤蔓", damage: 8, debuff: "缠结", stacks: 1 }),
    chomp: Object.freeze({ id: "chomp", name: "大啃", damage: 16 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("藤蔓蹒跚者行动记录无效");
    return turns;
};
const CYCLE = Object.freeze([VINE_MOVES.swipe, VINE_MOVES.vines, VINE_MOVES.chomp]);
export const selectVineMove = (state = {}) => CYCLE[turnsOf(state) % CYCLE.length];
export function recordVineAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("藤蔓蹒跚者行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const isVine = player => player?.name === VINE_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
