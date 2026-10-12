import { relicCatalog } from "./catalog.js";
import { relicRules, missingMechanisms, unhandledRelicRule } from "./rules.js";
import { applyRelicPickup, relicCardRequirements } from "./progression.js";

export const relicAdaptations = Object.freeze({
    the_courier:"梦三商店出售【杀】、回复生命及三件随机遗物；购买后补货，折扣适用现有商品。药水尚无接口。遗物基价120金币，为梦三配置值。",
    miniature_tent:"每个休息选项可各选择一次，直至选择离开；不允许无限重复同一选项。",
    meat_cleaver:"网页没有烹饪细则；暂定每次烹饪最大生命+5，待用户确认。",
    big_mushroom:"沿用梦三初始手牌4张，扣减2张；未改成STS2的基础手牌数量。",
    ring_of_the_drake:"刘备仅映射铁甲战士池；其他角色池需配置player.relicPool才可获取。效果按前三个自身回合各摸2张接入。",
    runic_pyramid:"梦三原本按手牌上限弃牌；这里让全部手牌不计入弃牌上限。虚无牌照常消耗。",
    precarious_shears:"选牌后扣除16点生命；当前地图流程保留至少1点生命，待补充非战斗死亡结算。",
    fragrant_mushroom:"随机强化2张并扣除15点生命；当前地图流程保留至少1点生命，待补充非战斗死亡结算。",
    dusty_tome:"从已登记的先古事件牌池随机获得一张；网页未列出完整候选排除规则。",
    sword_of_stone:"按5次精英战胜利计数，变化为玉之剑；尚无精英单位的独立击杀标签。",
    paper_phrog:"依梦三易伤口径向上取整；作用于玩家发起的攻击，保留既有卡牌的额外易伤增幅。",
    paper_krane:"依梦三虚弱口径向下取整，敌人攻击倍率0.6。",
    maw_bank:"将进入一个新的梦三节点视为攀爬一层，先发12金币，再进行商店购买或战斗；原作楼层与额外剧情节点未单独区分。",
});
const entries = relicCatalog.map(item => {
    const rule = relicRules[item.wikiId];
    const missingCards = rule ? relicCardRequirements(rule) : [];
    const unhandled = rule ? unhandledRelicRule(rule) : [];
    const reason = missingMechanisms[item.wikiId] || (missingCards.length ? `尚缺网页对应卡牌：${missingCards.join("、")}` : !rule ? "尚未接入此效果" : unhandled.length ? `尚缺效果接口：${unhandled.join("、")}` : null);
    return Object.freeze({ ...item, owner: null, rule: rule || Object.freeze({}),
        implementation: reason ? "pending" : relicAdaptations[item.wikiId] ? "adapted" : "implemented",
        implementationNote: reason || relicAdaptations[item.wikiId] || "效果已接入，实机验收待完成。", effect: "sts2" });
});
entries.push(Object.freeze({ id: "mengsan_hand_charm_shuying", wikiId: "legacy_hand_charm",
    name: "束带", description: "基础手牌上限额外+1；重复获得不叠加。", pool: "通用", tier: "梦三道具",
    ancient: null, owner: null, image: null, effect: "handLimit", amount: 1,
    rule: Object.freeze({ handLimit: 1 }), implementation: "implemented", implementationNote: "保留原梦三道具。" }));
export const relicDefinitions = Object.freeze(Object.fromEntries(entries.map(entry => [entry.id, entry])));
const aliases = Object.freeze(Object.fromEntries(entries.flatMap(entry => [[entry.id, entry.id], [entry.wikiId, entry.id], [`mengsan_${entry.wikiId}_shuying`, entry.id]])));
export const getRelic = id => Object.hasOwn(aliases, id) ? relicDefinitions[aliases[id]] : null;
export const heldRelics = run => [...new Set((run?.player?.items || []).map(id => getRelic(id)?.id).filter(Boolean))].map(getRelic);
export const relicPoolFor = run => run?.player?.relicPool || (run?.player?.character === "mengsan_liubei_shuying" ? "铁甲战士" : null);
export function canAcquireRelic(run, id, { allowPending = false } = {}) {
    const relic = getRelic(id);
    if (!run?.player || !relic || !allowPending && relic.implementation === "pending") return false;
    if (relic.pool !== "通用" && relic.pool !== relicPoolFor(run)) return false;
    return !heldRelics(run).some(item => item.id === relic.id || item.rule.replaces === relic.wikiId);
}
export function grantRelic(run, id) {
    const relic = getRelic(id);
    if (!relic) throw new Error(`梦三遗物未注册：${id}`);
    if (!canAcquireRelic(run, id)) return false;
    const draft = JSON.parse(JSON.stringify(run));
    draft.player.items ||= [];
    if (relic.rule.replaces) draft.player.items = draft.player.items.filter(value => getRelic(value)?.wikiId !== relic.rule.replaces);
    draft.player.items.push(relic.id);
    applyRelicPickup(draft, relic, { entries, canAcquire: canAcquireRelic, grant: grantRelic });
    Object.assign(run, draft);
    return true;
}
export function initializeRelicMaxHp(run) {
    const amount = run.player.pendingRelicMaxHp || 0;
    if (!Number.isFinite(run.player.maxHp)) return;
    run.player.maxHp = Math.max(1, run.player.maxHp + amount);
    delete run.player.pendingRelicMaxHp;
    run.player.hp = Math.min(run.player.hp, run.player.maxHp);
    if (run.player.pendingRelicFullHeal) { run.player.hp = run.player.maxHp; delete run.player.pendingRelicFullHeal; }
}
export const relicRewardIds = entries.filter(entry => entry.implementation !== "pending" && ["普通", "罕见", "稀有"].includes(entry.tier)).map(entry => `shared.reward.relic.${entry.id}`);
export const relicShopRewardIds = entries.filter(entry => entry.implementation !== "pending" && ["普通", "罕见", "稀有", "商店"].includes(entry.tier)).map(entry => `shared.reward.relic.${entry.id}`);
export const relicRewards = Object.fromEntries(entries.map(relic => [`shared.reward.relic.${relic.id}`, { relic: relic.id, name: `遗物·${relic.name}`, description: relic.description, image: relic.image }]));
const ancientKeys={"涅奥":"neow","欧洛巴斯":"orobas","佩尔":"pael","特兹卡塔拉":"tezcatara","诺奴佩普":"nonupep","坦克斯":"tanx","瓦库":"vakuu","达弗":"darv"};
export const relicRewardPools={
    "shared.pool.relic.shop":[...relicShopRewardIds],
    "shared.pool.relic.event":entries.filter(r=>r.implementation!=="pending" && r.tier==="事件").map(r=>`shared.reward.relic.${r.id}`),
    "shared.pool.relic.initial":entries.filter(r=>r.implementation!=="pending" && r.tier==="初始").map(r=>`shared.reward.relic.${r.id}`),
    ...Object.fromEntries(Object.entries(ancientKeys).map(([ancient,key])=>[`shared.pool.relic.ancient.${key}`,entries.filter(r=>r.implementation!=="pending" && r.ancient===ancient).map(r=>`shared.reward.relic.${r.id}`)])),
};
