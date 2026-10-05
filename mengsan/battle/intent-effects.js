import { applyMengsanDebuff } from "../monsters/artifact-status.js";
import { applyTangled } from "../monsters/vine-tangled.js";
import { attackHitCount, outgoingAttackDamage } from "./intent-damage.js";
import { beginDeathBlow, isDeathBlowIntent } from "./death-blow.js";
import { campEnemy } from "./camps.js";

export const getIntentHostiles = (game, source) =>
    game.players.filter(target => target.isAlive() && campEnemy(source, target));

export function createIntentExecutor(game, getActiveBattle) {
    const active = source => source.isAlive() &&
        Boolean(getActiveBattle()?.session.active);
    const applyDebuff = (target, move, source) => {
        if (!move.debuff) return;
        if (move.debuff === "缠结") { applyTangled(getActiveBattle(), target, move.stacks); return; }
        applyMengsanDebuff(target, move.debuff === "脆弱" ? "frail" : move.debuff === "虚弱" ? "weak" : "vulnerable", move.stacks, source);
    };
    return async (source, move) => {
        for (const target of getIntentHostiles(game, source)) {
            if (!active(source)) break;
            if (!target.isAlive()) continue;
            if (isDeathBlowIntent(move)) {
                await beginDeathBlow(source, target, move);
                continue;
            }
            if (move.damage != null) {
                for (let hitIndex = 0; hitIndex < attackHitCount(move); hitIndex++) {
                    if (!target.isAlive() || !active(source)) break;
                    const hit = target.damage(
                        outgoingAttackDamage(move, source), source);
                    hit.mengsanAttack_shuying = true;
                    hit.mengsanScriptedSkill_shuying = true;
                    await hit;
                }
            }
            if (target.isAlive() && active(source)) applyDebuff(target, move, source);
        }
        if (!active(source)) return;
        if (move.block) await source.changeHujia(move.block);
        if (!active(source)) return;
        if (move.strength) {
            source.storage.mengsanStrength_shuying =
                (source.storage.mengsanStrength_shuying || 0) + move.strength;
            source.addSkill("mengsan_raider_strength_shuying");
            source.markSkill("mengsan_raider_strength_shuying");
        }
    };
}
