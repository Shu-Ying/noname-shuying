import { setArtifact } from "./artifact-status.js";
// SVG明确：蓄能只在开场一次，排出回到重复轰击，不回到蓄能。
export const CUBEX_CHARACTER = "mengsan_cubex_construct_shuying";
export const CUBEX_MOVES = Object.freeze({
    charge: Object.freeze({ id: "charge", name: "蓄能", strength: 2 }),
    repeater: Object.freeze({ id: "repeater", name: "重复轰击", damage: 7, strength: 2 }),
    expel: Object.freeze({ id: "expel", name: "排出", damage: 5, hits: 2 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("立柱构造体行动记录无效");
    return turns;
};
const CYCLE = Object.freeze([CUBEX_MOVES.repeater, CUBEX_MOVES.repeater, CUBEX_MOVES.expel]);
export const selectCubexMove = (state = {}) => {
    const turns = turnsOf(state);
    return turns === 0 ? CUBEX_MOVES.charge : CYCLE[(turns - 1) % CYCLE.length];
};
export function recordCubexAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("立柱构造体行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const isCubex = player => player?.name === CUBEX_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
const bindings = new WeakMap();
export function initializeCubex(player, current = null) {
    if (!isCubex(player)) return false;
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player);
            delete player.storage.mengsanCubexState_shuying;
            delete player.storage.mengsanCubexIntent_shuying;
        });
        bindings.set(player, entry);
    }
    player.hujia = 13;
    player.storage.mengsanCubexState_shuying = { turnsTaken: 0 };
    player.storage.mengsanCubexIntent_shuying = null;
    setArtifact(player, 1, current);
    return true;
}
