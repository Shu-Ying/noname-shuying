import { consumeArtifact } from "./artifact-status.js";
import { isActiveCardUse } from "../battle/combat-rules.js";
import { skipStunnedAction } from "../battle/stun-intent.js";
export const BEAST_CHARACTER = "mengsan_ceremonial_beast_shuying";
export const BEAST_MOVES = Object.freeze({
    stamp: Object.freeze({ id: "stamp", name: "跺地", plow: 150 }),
    plow: Object.freeze({ id: "plow", name: "横冲直撞", damage: 18, strength: 2 }),
    cry: Object.freeze({ id: "cry", name: "野兽咆哮", ringing: true }),
    stomp: Object.freeze({ id: "stomp", name: "踩踏", damage: 15 }),
    crush: Object.freeze({ id: "crush", name: "碾碎", damage: 17, strength: 3 }),
});
export const isBeast = player => player?.name === BEAST_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
function checked(state) {
    const s = { phase: 1, step: 0, turnsTaken: 0, revision: 0, ...state };
    if (![1, 2].includes(s.phase) || !Number.isSafeInteger(s.step) || s.step < 0 || s.step > (s.phase === 1 ? 1 : 2) ||
        !Number.isSafeInteger(s.turnsTaken) || s.turnsTaken < 0 || !Number.isSafeInteger(s.revision) || s.revision < 0) throw new RangeError("仪式兽行动状态无效");
    return s;
}
export function selectBeastMove(state = {}) {
    const s = checked(state);
    return s.phase === 1 ? (s.step === 0 ? BEAST_MOVES.stamp : BEAST_MOVES.plow) : [BEAST_MOVES.cry, BEAST_MOVES.stomp, BEAST_MOVES.crush][s.step];
}
export function recordBeastAction(state = {}, advance = true) {
    const s = checked(state);
    if (typeof advance !== "boolean" || advance && s.turnsTaken === Number.MAX_SAFE_INTEGER) throw new RangeError("仪式兽行动推进无效");
    return { ...s, step: advance ? (s.phase === 1 ? 1 : (s.step + 1) % 3) : s.step, turnsTaken: s.turnsTaken + (advance ? 1 : 0) };
}
export function recoverBeastStun(player, choice, original) {
    const s = checked(player.storage.mengsanBeastState_shuying);
    if (s.justBroken) { player.storage.mengsanBeastState_shuying = { ...s, justBroken: false }; player.storage.mengsanBeastIntent_shuying = null; return null; }
    player.storage.mengsanBeastState_shuying = recordBeastAction(s, choice !== "retry");
    const next = choice === "retry" ? original : null;
    player.storage.mengsanBeastIntent_shuying = next; return next;
}
const bindings = new WeakMap();
export function initializeBeast(player, current) {
    if (!isBeast(player)) return false;
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player); delete player.storage.mengsanBeastState_shuying; delete player.storage.mengsanBeastIntent_shuying;
            player.removeSkill("mengsan_plow_shuying"); player.removeSkill("mengsan_raider_strength_shuying");
        }); bindings.set(player, entry);
    }
    player.storage.mengsanBeastState_shuying = checked({}); player.storage.mengsanBeastIntent_shuying = null;
    player.removeSkill("mengsan_plow_shuying"); player.removeSkill("mengsan_raider_strength_shuying"); return true;
}
export function gainPlow(player) {
    if (!isBeast(player) || !player.isAlive()) return false;
    const max = player.maxHp;
    if (!Number.isSafeInteger(max) || max <= 0 || !Number.isSafeInteger(max * 150)) throw new RangeError("仪式兽血量缩放无效");
    player.storage.mengsanPlow_shuying = Math.max(1, Math.round(150 * max / 252));
    player.addSkill("mengsan_plow_shuying"); player.markSkill("mengsan_plow_shuying"); return true;
}
export const canBreakPlow = (player, current, damage) => Boolean(current?.session.active && isBeast(player) && player.isAlive() &&
    damage?.name === "damage" && damage.player === player && damage.num > 0 && player.storage.mengsanPlow_shuying > 0 &&
    player.hp <= player.storage.mengsanPlow_shuying && player.storage.mengsanBeastState_shuying?.phase === 1);
export function breakPlow(game, current, player, damage) {
    if (!canBreakPlow(player, current, damage)) return false;
    const s = checked(player.storage.mengsanBeastState_shuying);
    if (s.revision === Number.MAX_SAFE_INTEGER) throw new RangeError("仪式兽阶段版本溢出");
    player.removeSkill("mengsan_plow_shuying"); player.removeSkill("mengsan_raider_strength_shuying");
    player.storage.mengsanStrength_shuying = 0;
    player.storage.mengsanBeastState_shuying = { ...s, phase: 2, step: 0, revision: s.revision + 1, justBroken: true };
    player.storage.mengsanBeastIntent_shuying = null;
    game.mengsanStunEnemy_shuying(player, { resume: "retry" });
    const phaseUse = damage.getParent?.("phaseUse");
    if (phaseUse?.player === player) skipStunnedAction(player, phaseUse);
    return true;
}
const ringing = new WeakMap();
export function clearRinging(player) {
    ringing.delete(player); delete player.storage.mengsanRinging_shuying; delete player.storage.mengsanRingingUsed_shuying;
}
export function applyRinging(current, player, phasePlayer = null) {
    if (!current?.session.active || !player?.isAlive() || !current.players?.has(player)) return false;
    if (consumeArtifact(player)) return false;
    if (ringing.get(player)?.battle === current && player.storage.mengsanRinging_shuying) return true;
    const entry = { battle: current, seen: new WeakSet() };
    current.session.ownResource(entry, () => { if (ringing.get(player) !== entry) return; player.removeSkill("mengsan_ringing_shuying"); clearRinging(player); });
    ringing.set(player, entry); player.storage.mengsanRinging_shuying = 1;
    // Mid-turn applications use already played cards; ordinary Beast Cry arrives before the target's next turn.
    player.storage.mengsanRingingUsed_shuying = phasePlayer === player ? (player.getHistory?.("useCard", e => !e.cancelled && !e._cancelled && isActiveCardUse(e, player)).length || 0) : 0;
    player.addSkill("mengsan_ringing_shuying"); player.markSkill("mengsan_ringing_shuying"); current.handUI?.refresh(); return true;
}
export const ringingLimited = (player, event) => Boolean(player.storage?.mengsanRinging_shuying &&
    player.storage.mengsanRingingUsed_shuying >= 1 && isActiveCardUse(event, player));
export function countRingingCard(player, current, event) {
    const entry = ringing.get(player);
    if (!current?.session.active || entry?.battle !== current || !player.isAlive() || !player.storage.mengsanRinging_shuying ||
        event?.name !== "useCard" || !event.card || event.cancelled || event._cancelled || !isActiveCardUse(event, player) || entry.seen.has(event)) return false;
    entry.seen.add(event); player.storage.mengsanRingingUsed_shuying = 1; player.markSkill("mengsan_ringing_shuying"); current.handUI?.refresh(); return true;
}
