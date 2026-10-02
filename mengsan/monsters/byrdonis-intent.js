// 普通数值；网页SVG：开始→俯冲→啄击→俯冲。领地意识在回合结束结算。
export const BYRDONIS_CHARACTER = "mengsan_byrdonis_shuying";
export const BYRDONIS_MOVES = Object.freeze({
    swoop: Object.freeze({ id: "swoop", name: "俯冲", damage: 17 }),
    peck: Object.freeze({ id: "peck", name: "啄击", damage: 3, hits: 3 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("多尼斯异鸟行动记录无效");
    return turns;
};
export const selectByrdonisMove = (state = {}) => turnsOf(state) % 2 ? BYRDONIS_MOVES.peck : BYRDONIS_MOVES.swoop;
export function recordByrdonisAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("多尼斯异鸟行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export function rollByrdonisHp(random) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("多尼斯异鸟随机数必须在[0,1)内");
    return 81 + Math.floor(value * 4);
}
export const isByrdonis = player => player?.name === BYRDONIS_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
const bindings = new WeakMap();
export function initializeByrdonis(player, current = null) {
    if (!isByrdonis(player)) return false;
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player);
            delete player.storage.mengsanByrdonisState_shuying;
            delete player.storage.mengsanByrdonisIntent_shuying;
            player.removeSkill("mengsan_territorial_shuying");
            player.removeSkill("mengsan_raider_strength_shuying");
        });
        bindings.set(player, entry);
    }
    player.storage.mengsanByrdonisState_shuying = { turnsTaken: 0 };
    player.storage.mengsanByrdonisIntent_shuying = null;
    player.storage.mengsanTerritorial_shuying = 1;
    player.addSkill("mengsan_territorial_shuying");
    player.markSkill("mengsan_territorial_shuying");
    return true;
}
export function resolveTerritorial(player, current) {
    if (!isByrdonis(player) || !player.isAlive() || !current?.session.active) return false;
    const layers = player.storage.mengsanTerritorial_shuying ?? 0;
    const strength = player.storage.mengsanStrength_shuying ?? 0;
    if (!Number.isSafeInteger(layers) || layers < 0 || !Number.isSafeInteger(strength) ||
        !Number.isSafeInteger(strength + layers)) throw new RangeError("领地意识或力量数值无效");
    if (!layers) return false;
    player.storage.mengsanStrength_shuying = strength + layers;
    player.addSkill("mengsan_raider_strength_shuying");
    player.markSkill("mengsan_raider_strength_shuying");
    return true;
}
