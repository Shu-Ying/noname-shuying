import { consumeArtifact } from "./artifact-status.js";
import { isStrangler } from "./strangler-intent.js";
const SKILL = "mengsan_constrict_shuying";
const KEY = "mengsanConstrict_shuying";
const clear = target => { delete target.storage[KEY]; target.removeSkill(SKILL); };
// 来源引用仅保存在本场战斗中，不进入永久牌堆/存档；同名多只怪物分别计层。
export function constrictTotal(current, target) {
    const records = current?.stranglerConstrict;
    const sources = records?.get(target);
    if (!sources) return 0;
    if (!current.session.active || !target.isAlive()) {
        records.delete(target); clear(target); return 0;
    }
    let total = 0;
    for (const [source, layers] of sources) {
        if (!source.isAlive() || !isStrangler(source) || !current.players.has(source) ||
            source.storage.mengsanCamp_shuying === target.storage.mengsanCamp_shuying) sources.delete(source);
        else total += layers;
    }
    if (total) { target.storage[KEY] = total; target.markSkill(SKILL); }
    else { records.delete(target); clear(target); }
    return total;
}
export function addConstrict(current, source, target, layers) {
    if (!current?.session.active || !isStrangler(source) || !source.isAlive() ||
        !current.players.has(source) || !target.isAlive() ||
        target.storage.mengsanCamp_shuying === source.storage.mengsanCamp_shuying) return false;
    if (!Number.isSafeInteger(layers) || layers <= 0) throw new RangeError("紧缠层数无效");
    if (!current.stranglerConstrict) {
        const records = current.stranglerConstrict = new Map();
        current.session.ownResource(records, () => {
            for (const target of records.keys()) clear(target);
            records.clear(); delete current.stranglerConstrict;
        });
    }
    constrictTotal(current, target);
    const records = current.stranglerConstrict;
    const sources = records.get(target) || new Map();
    const total = (target.storage[KEY] || 0) + layers;
    if (!Number.isSafeInteger(total)) throw new RangeError("紧缠层数溢出");
    if (consumeArtifact(target)) return false;
    sources.set(source, (sources.get(source) || 0) + layers); records.set(target, sources);
    target.storage[KEY] = total; target.addSkill(SKILL); target.markSkill(SKILL);
    return true;
}
export function clearConstrictSource(current, source) {
    const records = current?.stranglerConstrict;
    if (!records) return;
    if (records.has(source)) { records.delete(source); clear(source); }
    for (const [target, sources] of records) {
        sources.delete(source); constrictTotal(current, target);
    }
}
export async function resolveConstrict(current, target) {
    const amount = constrictTotal(current, target);
    if (!amount) return;
    // 非攻击伤害：可由原生护甲抵扣，不受力量/虚弱/易伤的攻击修正。
    const hit = target.damage(amount, "nosource");
    hit.mengsanConstrictDamage_shuying = true;
    hit.mengsanScriptedSkill_shuying = true;
    await hit;
}
