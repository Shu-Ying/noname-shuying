// Temporary combat-only strength. Never alter permanent strength or the run/deck.
const records = new WeakMap();
const SKILL = "mengsan_setup_strength_shuying";

export function forgetTemporaryStrength(player) {
    const existed = records.delete(player);
    delete player.storage.mengsanSetupStrength_shuying;
    return existed;
}

export function clearTemporaryStrength(player) {
    if (!records.has(player)) return false;
    forgetTemporaryStrength(player);
    player.removeSkill(SKILL);
    return true;
}

export function temporaryStrengthAmount(player, battle) {
    const entry = records.get(player);
    return entry?.battle === battle && battle?.session.active ? entry.amount : 0;
}

export function temporaryStrengthExpires(player, phase) {
    const entry = records.get(player);
    return Boolean(entry && phase.name === "phase" && (!entry.turn || entry.turn === phase));
}

export function createTemporaryStrength(game, getActiveBattle) {
    return {
        amount(player) { return temporaryStrengthAmount(player, getActiveBattle()); },
        capture() {
            const battle = getActiveBattle();
            return battle?.session.active ? battle : null;
        },
        grant(player, amount, event, battle) {
            if (!battle?.session.active || getActiveBattle() !== battle || !player.isAlive()) return false;
            if (!Number.isSafeInteger(amount) || amount <= 0) throw new RangeError("临时力量必须是正安全整数");
            const ancestor = event.getParent?.("phase");
            const turn = ancestor?.name === "phase" ? ancestor : null;
            let entry = records.get(player);
            if (entry && (entry.battle !== battle || entry.turn !== turn)) {
                clearTemporaryStrength(player);
                entry = null;
            }
            if (amount > Number.MAX_SAFE_INTEGER - (entry?.amount || 0)) throw new RangeError("临时力量层数越界");
            if (!entry) {
                entry = { battle, turn, amount: 0 };
                // Register cleanup before publishing state. A stale release cannot clear a later battle.
                battle.session.ownResource(entry, () => {
                    if (records.get(player) === entry) forgetTemporaryStrength(player);
                });
                records.set(player, entry);
            }
            entry.amount += amount;
            player.storage.mengsanSetupStrength_shuying = entry.amount;
            player.addSkill(SKILL);
            player.markSkill(SKILL);
            game.log(player, `在本回合内获得${amount}点力量`);
            return true;
        },
    };
}
