import { slowAttackDamage } from "../monsters/effigy-slow.js";
import { shrinkAttackDamage } from "../monsters/shrinker-status.js";
import { ironcladStrengthPenalty } from "../cards/ironclad-hooks.js";

export function attackHitCount(intent) {
    const hits = intent.hits ?? 1;
    if (!Number.isInteger(hits) || hits < 1) {
        throw new RangeError("攻击段数必须是正整数");
    }
    return hits;
}

export function outgoingAttackDamage(intent, source) {
    if (!Number.isInteger(intent.damage) || intent.damage < 0) {
        throw new RangeError("预测伤害必须是非负整数");
    }
    const storedStrength = source?.storage?.mengsanStrength_shuying;
    const strength = Number.isInteger(storedStrength) ? storedStrength : 0;
    let damage = Math.max(0, intent.damage + strength - ironcladStrengthPenalty(source));
    if (source?.storage?.mengsanWeak_shuying > 0) {
        damage = Math.floor(damage * 0.75);
    }
    return shrinkAttackDamage(damage, source);
}

export function previewAttackDamage(intent, source, target) {
    let damage = outgoingAttackDamage(intent, source);
    if (target?.storage?.mengsanVulnerable_shuying > 0) {
        damage = Math.ceil(damage * 1.5);
    }
    return slowAttackDamage(damage, target);
}
