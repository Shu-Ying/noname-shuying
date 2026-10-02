import { initializeSlow } from "./effigy-slow.js";
export const EFFIGY_CHARACTER = "mengsan_bygone_effigy_shuying";
export const EFFIGY_MOVES = Object.freeze({
    sleep: Object.freeze({ id: "sleep", name: "沉睡", sleep: true }),
    wake: Object.freeze({ id: "wake", name: "苏醒", strength: 10 }),
    slashes: Object.freeze({ id: "slashes", name: "斩击", damage: 13 }),
});
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("旧日雕像行动记录无效");
    return turns;
};
export const selectEffigyMove = (state = {}) => {
    const turns = turnsOf(state);
    return turns === 0 ? EFFIGY_MOVES.sleep : turns === 1 ? EFFIGY_MOVES.wake : EFFIGY_MOVES.slashes;
};
export function recordEffigyAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("旧日雕像行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export const isEffigy = player => player?.name === EFFIGY_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
export function initializeEffigy(player, current = null) {
    if (!isEffigy(player)) return false;
    initializeSlow(player, current);
    player.storage.mengsanEffigyState_shuying = { turnsTaken: 0 };
    player.storage.mengsanEffigyIntent_shuying = null;
    return true;
}
