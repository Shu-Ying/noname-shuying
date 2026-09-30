import { createIntentExecutor } from "../battle/intent-effects.js";
import { isStunned } from "../battle/stun-intent.js";

export const DEFAULT_BOND_INTENTS = Object.freeze([
    Object.freeze({ id: "assist_strike", name: "援击", damage: 6 }),
    Object.freeze({ id: "assist_combo", name: "连击", damage: 3, hits: 2 }),
    Object.freeze({ id: "assist_guard", name: "整备", block: 5 }),
]);

export function getBondIntents(definition) {
    const moves = definition.intents;
    if (moves == null || Array.isArray(moves) && !moves.length) {
        return DEFAULT_BOND_INTENTS;
    }
    if (!Array.isArray(moves) || moves.some(move =>
        !move || typeof move.id !== "string" || !move.id ||
        typeof move.name !== "string" || !move.name ||
        !["damage", "block", "strength"].every(key => move[key] == null ||
            Number.isInteger(move[key]) && move[key] >= 0) ||
        move.hits != null && (!Number.isInteger(move.hits) || move.hits < 1) ||
        move.debuff != null && (!["脆弱", "易伤"].includes(move.debuff) ||
            !Number.isInteger(move.stacks) || move.stacks < 1) ||
        move.intentType != null && move.intentType !== "death_blow" ||
        move.intentType === "death_blow" &&
            (move.damage == null || (move.hits ?? 1) !== 1) ||
        move.damage == null && !move.block && !move.strength && !move.debuff)) {
        throw new Error("羁绊 NPC 意图组配置无效");
    }
    return moves;
}

export function selectBondIntent(combat) {
    return combat.intents[combat.turnsTaken % combat.intents.length];
}

export function createBondIntentActions(game, getActiveBattle) {
    const executeEffects = createIntentExecutor(game, getActiveBattle);
    const planBondIntent = player => {
        const combat = player.storage?.mengsanBond_shuying;
        if (!combat || !player.isAlive() || isStunned(player) || combat.intent) {
            return;
        }
        combat.intent = selectBondIntent(combat);
        game.mengsanSetEnemyIntent_shuying(player, combat.intent);
    };
    const executeBondIntent = async player => {
        const combat = player.storage?.mengsanBond_shuying;
        if (!combat?.intent || !player.isAlive() || isStunned(player) ||
            !getActiveBattle()?.session.active) return;
        const move = combat.intent;
        combat.intent = null;
        combat.turnsTaken++;
        game.mengsanSetEnemyIntent_shuying(player, null);
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动羁绊意图", move.name);
            return;
        }
        player.storage.mengsanEnergy_shuying--;
        getActiveBattle()?.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动羁绊意图", move.name);
        await executeEffects(player, move);
    };
    return { planBondIntent, executeBondIntent };
}
