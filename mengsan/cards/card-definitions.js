// 梦三永久牌组的可获得牌注册表。这里登记牌名与归属，不复制引擎中的效果定义。
// 新增武将专属牌时填写 owner 为该武将 ID；通用牌填写 owner: null。
const definitions = [
    { name: "sha", category: "damage", owner: null },
    { name: "shan", category: "utility", owner: null },
    { name: "tao", category: "recovery", owner: null },
    { name: "jiu", category: "recovery", owner: null },
    { name: "guohe", category: "utility", owner: null },
    { name: "wuzhong", category: "utility", owner: null },
    { name: "juedou", category: "damage", owner: null },
    { name: "bagua", category: "utility", owner: null },
    // 当前仅刘备专属首关的固定奖励会永久获得【的卢】。
    { name: "dilu", category: "utility", owner: "mengsan_liubei_shuying" },
];

export function createCardRegistry(entries) {
    const registry = Object.create(null);
    for (const entry of entries) {
        if (!entry || typeof entry.name !== "string" || !/^[a-z][a-z0-9_]*$/.test(entry.name) ||
            !["damage", "recovery", "utility"].includes(entry.category) ||
            !(entry.owner === null || typeof entry.owner === "string" && entry.owner.length > 0) ||
            Object.hasOwn(registry, entry.name)) {
            throw new Error(`梦三牌定义无效或重复：${entry?.name}`);
        }
        registry[entry.name] = Object.freeze({ name: entry.name, category: entry.category, owner: entry.owner });
    }
    return Object.freeze(registry);
}

export const cardDefinitions = createCardRegistry(definitions);

export function canAcquireCard(character, name, registry = cardDefinitions) {
    const definition = Object.hasOwn(registry, name) ? registry[name] : null;
    return !!definition && (definition.owner === null || definition.owner === character);
}
