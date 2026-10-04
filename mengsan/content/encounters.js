import { validateBattlePlan } from "../battle/battle-director.js";

export function chooseEncounterEntry(list, random) {
    if (!Array.isArray(list) || !list.length || typeof random !== "function") {
        throw new Error("梦三遭遇池为空或缺少随机数接口");
    }
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("遭遇随机数必须在[0,1)内");
    return list[Math.floor(value * list.length)];
}

export function createEncounterPlan(definition, random) {
    if (!definition) throw new Error("梦三遭遇定义不存在");
    const plan = typeof definition.createBattlePlan === "function"
        ? definition.createBattlePlan(random)
        : { units: JSON.parse(JSON.stringify(chooseEncounterEntry(definition.variants, random))), rules: [] };
    return validateBattlePlan(plan);
}
