// 网页普通主表：墨迹→墨水长枪→肢解→准备→墨迹；开场滑溜9。
export const VANTOM_CHARACTER = "mengsan_vantom_shuying";
export const VANTOM_MOVES = Object.freeze({
    blot: Object.freeze({ id: "blot", name: "墨迹", damage: 7 }),
    lance: Object.freeze({ id: "lance", name: "墨水长枪", damage: 6, hits: 2 }),
    dismember: Object.freeze({ id: "dismember", name: "肢解", damage: 26, wound: 3 }),
    prepare: Object.freeze({ id: "prepare", name: "准备", strength: 2 }),
});
const cycle = Object.freeze(Object.values(VANTOM_MOVES));
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("墨影幻灵行动记录无效");
    return turns;
};
export const selectVantomMove = (state = {}) => cycle[turnsOf(state) % cycle.length];
export function recordVantomAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("墨影幻灵行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const isVantom = player => player?.name === VANTOM_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
const bindings = new WeakMap();
export function initializeVantom(player, current = null) {
    if (!isVantom(player)) return false;
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player);
            delete player.storage.mengsanVantomState_shuying;
            delete player.storage.mengsanVantomIntent_shuying;
            player.removeSkill("mengsan_slippery_shuying");
            player.removeSkill("mengsan_raider_strength_shuying");
        });
        bindings.set(player, entry);
    }
    player.storage.mengsanVantomState_shuying = { turnsTaken: 0 };
    player.storage.mengsanVantomIntent_shuying = null;
    player.storage.mengsanSlippery_shuying = 9;
    player.addSkill("mengsan_slippery_shuying");
    player.markSkill("mengsan_slippery_shuying");
    return true;
}
