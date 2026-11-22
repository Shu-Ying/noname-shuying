import { slowAttackDamage } from "../monsters/effigy-slow.js";
import { shrinkAttackDamage } from "../monsters/shrinker-status.js";
import { applyBodyguardDamage, ironcladStrengthPenalty } from "../cards/ironclad-hooks.js";
import { applyInterceptDamage, applyIntangibleDamage } from "../cards/shared-hooks.js";
import { campEnemy } from "./camps.js";

export function attackHitCount(intent) {
    const hits = intent.hits ?? 1;
    if (!Number.isInteger(hits) || hits < 1) {
        throw new RangeError("攻击段数必须是正整数");
    }
    return hits;
}

export function applyAttackWeakness(damage, source, owner, relics) {
    if (!(source?.storage?.mengsanWeak_shuying > 0)) return damage;
    const multiplier = campEnemy(owner, source) && relics?.has("paper_krane") ? 0.6 : 0.75;
    return Math.floor(damage * multiplier);
}

export function outgoingAttackDamage(intent, source, battle) {
    if (!Number.isInteger(intent.damage) || intent.damage < 0) {
        throw new RangeError("预测伤害必须是非负整数");
    }
    const storedStrength = source?.storage?.mengsanStrength_shuying;
    const strength = Number.isInteger(storedStrength) ? storedStrength : 0;
    const damage = Math.max(0, intent.damage + strength - ironcladStrengthPenalty(source));
    return shrinkAttackDamage(applyAttackWeakness(damage, source, battle?.owner, battle?.relics), source);
}

export function previewAttackDamage(intent, source, target, battle) {
    let damage = outgoingAttackDamage(intent, source, battle);
    if (target?.storage?.mengsanVulnerable_shuying > 0) {
        damage = Math.ceil(damage * 1.5);
    }
    damage = applyInterceptDamage(damage, source, target, battle?.players);
    damage = applyBodyguardDamage(damage, source, target, battle?.players);
    return applyIntangibleDamage(slowAttackDamage(damage, target), target);
}
