// 灰机Wiki普通数值：首回合黏糊射击；随机分支等权，黏液不连用，扑击最多连用两次。
export const TWIGMEDIUM_CHARACTER = "mengsan_twig_slime_m_shuying";
export const TWIGMEDIUM_MOVES = Object.freeze({
    sticky: Object.freeze({ id: "sticky", name: "黏糊射击", slimed: 1 }),
    pounce: Object.freeze({ id: "pounce", name: "戳刺扑击", damage: 11 }),
});
const stateOf = state => {
    const turnsTaken = state.turnsTaken ?? 0;
    const lastMove = state.lastMove ?? null;
    const consecutive = state.consecutive ?? 0;
    if (!Number.isSafeInteger(turnsTaken) || turnsTaken < 0 ||
        !Number.isSafeInteger(consecutive) || consecutive < 0 ||
        (turnsTaken === 0 ? lastMove !== null || consecutive !== 0 :
            !Object.hasOwn(TWIGMEDIUM_MOVES, lastMove) || consecutive < 1 ||
            consecutive > turnsTaken || consecutive > (lastMove === "sticky" ? 1 : 2))) {
        throw new RangeError("中型树枝史莱姆行动记录无效");
    }
    return { turnsTaken, lastMove, consecutive };
};
const roll = random => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("随机数必须在[0,1)内");
    return value;
};
export function selectTwigmediumMove(state = {}, random) {
    const { turnsTaken, lastMove, consecutive } = stateOf(state);
    if (turnsTaken === 0) return TWIGMEDIUM_MOVES.sticky;
    if (lastMove === "sticky") return TWIGMEDIUM_MOVES.pounce;
    if (consecutive === 2) return TWIGMEDIUM_MOVES.sticky;
    return roll(random) < 0.5 ? TWIGMEDIUM_MOVES.sticky : TWIGMEDIUM_MOVES.pounce;
}
export function recordTwigmediumAction(state = {}, move, advance = true) {
    const previous = stateOf(state);
    if (typeof advance !== "boolean") throw new RangeError("行动推进参数无效");
    if (!advance) return previous;
    const id = move?.id;
    if (previous.turnsTaken === Number.MAX_SAFE_INTEGER || !Object.hasOwn(TWIGMEDIUM_MOVES, id) ||
        (previous.turnsTaken === 0 && id !== "sticky") ||
        (previous.lastMove === id && previous.consecutive >= (id === "sticky" ? 1 : 2))) {
        throw new RangeError("中型树枝史莱姆行动推进无效");
    }
    return { turnsTaken: previous.turnsTaken + 1, lastMove: id,
        consecutive: previous.lastMove === id ? previous.consecutive + 1 : 1 };
}
export const rollTwigmediumHp = random => 26 + Math.floor(roll(random) * 3);
export const isTwigmedium = player => player?.name === TWIGMEDIUM_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
