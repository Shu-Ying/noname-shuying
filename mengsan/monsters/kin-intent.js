export const KIN_PRIEST_CHARACTER = "mengsan_kin_priest_shuying";
export const KIN_FOLLOWER_CHARACTER = "mengsan_kin_follower_shuying";
export const KIN_PRIEST_MOVES = Object.freeze({
    frailty: Object.freeze({ id: "frailty", name: "脆弱法球", damage: 8, debuff: "脆弱", stacks: 1 }),
    weakness: Object.freeze({ id: "weakness", name: "虚弱法球", damage: 8, debuff: "虚弱", stacks: 1 }),
    beam: Object.freeze({ id: "beam", name: "灵魂光束", damage: 3, hits: 3 }),
    ritual: Object.freeze({ id: "ritual", name: "黑暗仪式", strength: 2 }),
});
export const KIN_FOLLOWER_MOVES = Object.freeze({
    slash: Object.freeze({ id: "slash", name: "快斩", damage: 5 }),
    boomerang: Object.freeze({ id: "boomerang", name: "回旋镖", damage: 2, hits: 2 }),
    dance: Object.freeze({ id: "dance", name: "力量之舞", strength: 2 }),
});
const priestCycle = Object.freeze(Object.values(KIN_PRIEST_MOVES));
const followerCycle = Object.freeze(Object.values(KIN_FOLLOWER_MOVES));
const turnsOf = state => {
    const turns = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError("同族小队行动记录无效");
    return turns;
};
export const selectKinPriestMove = (state = {}) => priestCycle[turnsOf(state) % priestCycle.length];
export const selectKinFollowerMove = (state = {}) => followerCycle[turnsOf(state) % followerCycle.length];
export function recordKinAction(state = {}, advance = true) {
    const turns = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turns === Number.MAX_SAFE_INTEGER) throw new RangeError("同族小队行动推进无效");
    return { turnsTaken: turns + (advance ? 1 : 0) };
}
export function rollKinFollowerHp(random) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("同族信徒随机数必须在[0,1)内");
    return 58 + Math.floor(value * 2);
}
export const isKinPriest = player => player?.name === KIN_PRIEST_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
export const isKinFollower = player => player?.name === KIN_FOLLOWER_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
export const isKinActor = player => isKinPriest(player) || isKinFollower(player);
export function canActKin(game, current, player) {
    if (!current?.session.active || !player?.isAlive() || !isKinActor(player)) return false;
    if (isKinPriest(player)) return true;
    const owner = player.storage.mengsanKinOwner_shuying;
    return Boolean(owner && game.players.some(p => p.isAlive() && isKinPriest(p) && p.storage.mengsanUnitId_shuying === owner));
}
const bindings = new WeakMap();
export function initializeKin(player, spec = {}, current = null) {
    if (!isKinActor(player)) return false;
    if (isKinFollower(player) && spec.kinOwner != null &&
        (typeof spec.kinOwner !== "string" || !/^[\w.-]+$/.test(spec.kinOwner))) throw new TypeError("同族信徒的神官ID无效");
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player);
            delete player.storage.mengsanKinState_shuying;
            delete player.storage.mengsanKinIntent_shuying;
            delete player.storage.mengsanKinOwner_shuying;
            player.removeSkill("mengsan_kin_minion_shuying");
            player.removeSkill("mengsan_raider_strength_shuying");
        });
        bindings.set(player, entry);
    }
    player.storage.mengsanKinState_shuying = { turnsTaken: 0 };
    player.storage.mengsanKinIntent_shuying = null;
    if (isKinFollower(player)) {
        player.storage.mengsanKinOwner_shuying = spec.kinOwner ?? null;
        player.addSkill("mengsan_kin_minion_shuying");
        player.markSkill("mengsan_kin_minion_shuying");
    }
    return true;
}
export function clearKinOwnerIntents(game, current, priest) {
    if (!current?.session.active || !isKinPriest(priest)) return;
    for (const player of game.players) {
        if (!isKinFollower(player) || player.storage.mengsanKinOwner_shuying !== priest.storage.mengsanUnitId_shuying) continue;
        player.storage.mengsanKinIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
    }
}
