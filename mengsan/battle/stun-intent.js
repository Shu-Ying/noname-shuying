const stunned = new WeakMap();

export const STUN_INTENT = Object.freeze({ intentType: "stun" });

export function isStunIntent(intent) {
    return intent?.intentType === "stun";
}

export function isStunned(player) {
    return stunned.has(player);
}

export function applyStun(player, intent, options = {}) {
    if (stunned.has(player)) return false;
    const { resume = "advance", recover } = options;
    if (resume !== "advance" && resume !== "retry") {
        throw new RangeError("击晕恢复方式无效");
    }
    if (typeof recover !== "function") {
        throw new TypeError("击晕需要恢复回调");
    }
    if (!player?.isAlive()) return false;
    stunned.set(player, { intent, resume, recover, skipped: false });
    return true;
}

export function skipStunnedAction(player, phaseUse) {
    const state = stunned.get(player);
    if (!state || state.skipped) return false;
    phaseUse.cancel();
    state.skipped = true;
    return true;
}

export async function finishStunnedTurn(player) {
    const state = stunned.get(player);
    if (!state?.skipped) return false;
    stunned.delete(player);
    if (player.isAlive()) await state.recover(state.resume, state.intent);
    return true;
}

export function clearStun(player) {
    return stunned.delete(player);
}
