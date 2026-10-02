// 灰机Wiki普通数值；不混入A8生命和A9攻击。
export const PHROG_CHARACTER = "mengsan_phrog_parasite_shuying";
export const WRIGGLER_CHARACTER = "mengsan_wriggler_shuying";
export const INFESTED_COUNT = 4;
export const PHROG_MOVES = Object.freeze({
    infect: Object.freeze({ id: "infect", name: "感染", infection: 3 }),
    lash: Object.freeze({ id: "lash", name: "甩动", damage: 4, hits: 4 }),
});
export const WRIGGLER_MOVES = Object.freeze({
    spawned: Object.freeze({ id: "spawned", name: "生成", intentType: "stun" }),
    bite: Object.freeze({ id: "bite", name: "污秽啃咬", damage: 6 }),
    wriggle: Object.freeze({ id: "wriggle", name: "扭动", infection: 1, strength: 2 }),
});
const turnsOf = state => {
    const value = state.turnsTaken ?? 0;
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("异蛙行动次数无效");
    return value;
};
const positionOf = state => {
    const position = state.position ?? 1;
    if (!Number.isInteger(position) || position < 1 || position > 4) throw new RangeError("扭动虫站位必须为1~4");
    return position;
};
export const selectPhrogMove = (state = {}) => turnsOf(state) % 2 ? PHROG_MOVES.lash : PHROG_MOVES.infect;
export function selectWrigglerMove(state = {}) {
    const position = positionOf(state), turn = turnsOf(state);
    if (state.spawned) return WRIGGLER_MOVES.spawned;
    return (turn + (position % 2 ? 0 : 1)) % 2 ? WRIGGLER_MOVES.wriggle : WRIGGLER_MOVES.bite;
}
export function recordPhrogAction(state = {}, advance = true) {
    const turn = turnsOf(state);
    if (typeof advance !== "boolean" || advance && turn === Number.MAX_SAFE_INTEGER) throw new RangeError("异蛙行动推进无效");
    return { ...state, turnsTaken: turn + (advance ? 1 : 0) };
}
const rollHp = (random, base, range) => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("异蛙随机数必须在[0,1)内");
    return base + Math.floor(value * range);
};
export const rollPhrogHp = random => rollHp(random, 61, 4);
export const rollWrigglerHp = random => rollHp(random, 17, 5);
export const isPhrog = player => player?.name === PHROG_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
export const isWriggler = player => player?.name === WRIGGLER_CHARACTER && player.storage?.mengsanCamp_shuying === "enemy";
export const isPhrogActor = player => isPhrog(player) || isWriggler(player);
const bindings = new WeakMap();
export function initializePhrog(player, spec, current = null) {
    if (!isPhrogActor(player)) return false;
    const position = isWriggler(player) ? positionOf({ position: spec.wrigglerPosition }) : 1;
    if (current?.session.active && bindings.get(player)?.battle !== current) {
        const entry = { battle: current };
        current.session.ownResource(entry, () => {
            if (bindings.get(player) !== entry) return;
            bindings.delete(player);
            delete player.storage.mengsanPhrogState_shuying;
            delete player.storage.mengsanPhrogIntent_shuying;
            player.removeSkill("mengsan_infested_shuying");
            player.removeSkill("mengsan_raider_strength_shuying");
        });
        bindings.set(player, entry);
    }
    player.storage.mengsanPhrogState_shuying = { turnsTaken: 0, position, spawned: isWriggler(player) && spec.wrigglerSpawned === true };
    player.storage.mengsanPhrogIntent_shuying = null;
    if (isPhrog(player)) {
        player.storage.mengsanInfested_shuying = INFESTED_COUNT;
        player.addSkill("mengsan_infested_shuying"); player.markSkill("mengsan_infested_shuying");
    }
    return true;
}
export function skipSpawnedWriggler(player, phase) {
    if (!isWriggler(player) || !player.isAlive() || !player.storage.mengsanPhrogState_shuying?.spawned) return false;
    phase.cancel();
    player.storage.mengsanPhrogState_shuying = { ...player.storage.mengsanPhrogState_shuying, spawned: false };
    player.storage.mengsanPhrogIntent_shuying = null;
    return true;
}
