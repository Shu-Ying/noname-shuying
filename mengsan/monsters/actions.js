import {
    attackHitCount,
    outgoingAttackDamage,
} from "../battle/intent-damage.js";
import { beginDeathBlow, isDeathBlowIntent } from "../battle/death-blow.js";
import { isStunned } from "../battle/stun-intent.js";
import { nextRandom } from "../progression/state.js";
import { selectFlyconidMove, recordFlyconidAction } from "./flyconid-intent.js";
import {
    isRaiderCharacter,
    selectRaiderMove,
    recordRaiderAction,
} from "./raider-intent.js";

export const isFlyconid = player =>
    player?.name === "mengsan_flyconid_shuying" &&
    player.storage?.mengsanCamp_shuying === "enemy";

export const isRaider = player =>
    player?.storage?.mengsanCamp_shuying === "enemy" &&
    isRaiderCharacter(player.name);

export function createMonsterIntentActions(game, getActiveBattle) {
    const planEnemyIntent = (player, run) => {
        if (!player?.isAlive() || isStunned(player)) return;
        if (isFlyconid(player)) {
            if (player.storage.mengsanFlyconidIntent_shuying) return;
            const move = selectFlyconidMove(
                player.storage.mengsanFlyconidState_shuying || {},
                () => nextRandom(run));
            player.storage.mengsanFlyconidIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        } else if (isRaider(player)) {
            if (player.storage.mengsanRaiderIntent_shuying) return;
            const move = selectRaiderMove(player.name,
                player.storage.mengsanRaiderState_shuying || {});
            player.storage.mengsanRaiderIntent_shuying = move;
            game.mengsanSetEnemyIntent_shuying(player, move);
        }
    };

    const applyIntentDebuff = (target, move) => {
        if (!move.debuff) return;
        const frail = move.debuff === "脆弱";
        const key = frail ? "mengsanFrail_shuying" :
            "mengsanVulnerable_shuying";
        target.storage[key] = (target.storage[key] || 0) + move.stacks;
        target.addSkill(frail ? "mengsan_frail_shuying" :
            "mengsan_vulnerable_shuying");
        target.markSkill(frail ? "mengsan_frail_shuying" :
            "mengsan_vulnerable_shuying");
    };

    const dealIntentDamage = async (source, target, move) => {
        if (move.damage == null) return;
        for (let index = 0; index < attackHitCount(move); index++) {
            if (!target.isAlive() || !source.isAlive()) break;
            const hit = target.damage(
                outgoingAttackDamage(move, source), source);
            hit.mengsanAttack_shuying = true;
            hit.mengsanScriptedSkill_shuying = true;
            await hit;
        }
    };

    const executeFlyconidIntent = async player => {
        const move = player.storage.mengsanFlyconidIntent_shuying;
        if (!move) return;
        player.storage.mengsanFlyconidIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        const paid = player.storage.mengsanEnergy_shuying >= 1;
        player.storage.mengsanFlyconidState_shuying =
            recordFlyconidAction(
                player.storage.mengsanFlyconidState_shuying || {},
                move, paid);
        if (!paid) {
            game.log(player, "费用不足，未发动", move.name);
            return;
        }
        player.storage.mengsanEnergy_shuying--;
        getActiveBattle()?.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        const target = game.me;
        if (!target?.isAlive() || !player.isAlive()) return;
        if (isDeathBlowIntent(move)) {
            await beginDeathBlow(player, target, move);
            return;
        }
        await dealIntentDamage(player, target, move);
        if (target.isAlive() && player.isAlive()) {
            applyIntentDebuff(target, move);
        }
    };

    const executeRaiderIntent = async player => {
        const move = player.storage.mengsanRaiderIntent_shuying;
        if (!move) return;
        player.storage.mengsanRaiderIntent_shuying = null;
        game.mengsanSetEnemyIntent_shuying(player, null);
        player.storage.mengsanRaiderState_shuying = recordRaiderAction(
            player.storage.mengsanRaiderState_shuying || {});
        if (player.storage.mengsanEnergy_shuying < 1) {
            game.log(player, "费用不足，未发动", move.name);
            return;
        }
        player.storage.mengsanEnergy_shuying--;
        getActiveBattle()?.energyUI.get(player)?.();
        game.log(player, "消耗1费用发动", move.name);
        const target = game.me;
        if (!target?.isAlive() || !player.isAlive()) return;
        await dealIntentDamage(player, target, move);
        if (target.isAlive() && player.isAlive()) {
            applyIntentDebuff(target, move);
        }
        if (!player.isAlive() || !getActiveBattle()?.session.active) return;
        if (move.block) await player.changeHujia(move.block);
        if (move.strength) {
            player.storage.mengsanStrength_shuying =
                (player.storage.mengsanStrength_shuying || 0) +
                move.strength;
            player.addSkill("mengsan_raider_strength_shuying");
            player.markSkill("mengsan_raider_strength_shuying");
        }
    };

    return {
        planEnemyIntent,
        executeFlyconidIntent,
        executeRaiderIntent,
    };
}
