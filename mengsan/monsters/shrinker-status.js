import { consumeArtifact } from "./artifact-status.js";
import { isShrinker } from "./shrinker-intent.js";
const SKILL = "mengsan_shrink_shuying";
const KEY = "mengsanShrink_shuying";
const clear = target => { delete target.storage[KEY]; target.removeSkill(SKILL); };
// 来源只保留在战斗对象中；多只甲虫不累乘减伤，死亡逐个解除来源。
export function isShrunk(current, target) {
    const records = current?.shrinkerSources;
    const sources = records?.get(target);
    if (!sources) return false;
    if (!current.session.active || !target.isAlive()) {
        records.delete(target); clear(target); return false;
    }
    for (const source of sources) {
        if (!source.isAlive() || !isShrinker(source) || !current.players.has(source) ||
            source.storage.mengsanCamp_shuying === target.storage.mengsanCamp_shuying) sources.delete(source);
    }
    if (sources.size) { target.storage[KEY] = true; return true; }
    records.delete(target); clear(target); return false;
}
export function applyShrink(current, source, target) {
    if (!current?.session.active || !isShrinker(source) || !source.isAlive() ||
        !current.players.has(source) || !target.isAlive() ||
        source.storage.mengsanCamp_shuying === target.storage.mengsanCamp_shuying) return false;
    if (consumeArtifact(target)) return false;
    if (!current.shrinkerSources) {
        const records = current.shrinkerSources = new Map();
        current.session.ownResource(records, () => {
            for (const target of records.keys()) clear(target);
            records.clear(); delete current.shrinkerSources;
        });
    }
    isShrunk(current, target);
    const sources = current.shrinkerSources.get(target) || new Set();
    sources.add(source); current.shrinkerSources.set(target, sources);
    target.storage[KEY] = true; target.addSkill(SKILL); target.markSkill(SKILL);
    return true;
}
export function clearShrinkSource(current, source) {
    const records = current?.shrinkerSources;
    if (!records) return;
    if (records.has(source)) { records.delete(source); clear(source); }
    for (const [target, sources] of records) { sources.delete(source); isShrunk(current, target); }
}
export const shrinkAttackDamage = (damage, source) => source?.storage?.mengsanShrink_shuying ? Math.floor(damage * 7 / 10) : damage;
