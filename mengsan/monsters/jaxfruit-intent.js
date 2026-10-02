// 闪光贾克斯果：每回合能量球，伤害结算完成后获得2力量；不随机选择行动。
export const JAXFRUIT_CHARACTER = "mengsan_snapping_jaxfruit_shuying";
export const JAXFRUIT_MOVE = Object.freeze({ id: "energyOrb", name: "能量球", damage: 3, strength: 2 });
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("贾克斯果行动记录无效");
    return turns;
};
export function selectJaxfruitMove(state = {}) {
    turnsOf(state);
    return JAXFRUIT_MOVE;
}
export function recordJaxfruitAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) {
        throw new RangeError("贾克斯果行动推进无效");
    }
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export function rollJaxfruitHp(random) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("贾克斯果随机数必须在[0,1)内");
    return 31 + Math.floor(value * 3);
}
export const isJaxfruit = player => player?.name === JAXFRUIT_CHARACTER &&
    player.storage?.mengsanCamp_shuying === "enemy";
