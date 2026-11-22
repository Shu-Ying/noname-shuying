import { heldRelics, relicDefinitions, canAcquireRelic, grantRelic } from "./definitions.js";
import { relicState, healRun, changeMaxHp, grantGold, upgradeCards } from "./progression.js";
import { relicRandomGet } from "./random.js";

export const restRecovery = run => 8+heldRelics(run).reduce((n,r)=>n+(r.rule.restHeal || 0),0);
export const relicShopPrice = (run,base) => Math.max(1,Math.floor(heldRelics(run).reduce((n,r)=>n*(r.rule.shopDiscount || 1),base)));
export function recordRelicShopPurchase(run) {
    if (heldRelics(run).some(relic => relic.rule.breaksOnPurchase)) relicState(run).mawBankBroken = true;
}
export function relicRestChoices(run) {
    const state = relicState(run), choices = [];
    for (const relic of heldRelics(run)) {
        const id = relic.rule.restAction;
        const image = relic.image;
        if (id === "dig") choices.push({ id, image, name: "挖掘", description: "随机获得一件普通、罕见或稀有遗物" });
        if (id === "lift") {
            const levels = state.giryaLevels || 0;
            choices.push({ id, image, name: "举重", description: `以后每场战斗获得额外力量（${levels}/3）`,
                disabled: levels >= 3, disabledReason: "已达举重上限" });
        }
        if (id === "rekindle") choices.push({ id, image, name: "添火", description: "让南瓜蜡烛再燃烧 5 场战斗",
            disabled: (state.candleRemaining || 0) >= 5, disabledReason: "南瓜蜡烛的燃烧场次已满" });
        if (id === "cook") choices.push({ id, image, name: "烹饪", description: "最大生命 +5" });
    }
    return choices;
}
export function applyRoomRelics(run,node,action) {
    const receipt=`${run.actIndex}:${node.type}:${node.id}:${action}`,state=relicState(run);
    const receipts=run.player.relicRoomReceipts ||= [];
    if(receipts.includes(receipt))return null;
    const relics=heldRelics(run),before=run.player.hp;
    if(action==="enter"){
        if(node.type==="shop")for(const relic of relics)healRun(run,relic.rule.shopHeal || 0);
        if(node.type==="rest"){
            state.afterRest=true;
            for(const relic of relics)healRun(run,Math.floor(run.player.deck.length/5)*(relic.rule.restEntryHealPerFive || 0));
        }
        if(node.type==="event")for(const relic of relics)healRun(run,relic.rule.eventHeal || 0);
    } else if(node.type==="rest"){
        if(action==="heal"){
            healRun(run,restRecovery(run));
            for(const relic of relics){const r=relic.rule;if(r.restMaxHp)changeMaxHp(run,r.restMaxHp);if(r.restCardChoice)(state.choices ||= []).push({relic:relic.name,kind:"cardReward",count:1,offerCount:3});}
        } else if(action==="upgrade")upgradeCards(run,1);
        else if(action==="lift" && relics.some(r=>r.rule.restAction==="lift") && (state.giryaLevels || 0)<3)state.giryaLevels=(state.giryaLevels || 0)+1;
        else if(action==="rekindle" && relics.some(r=>r.rule.restAction==="rekindle"))state.candleRemaining=5;
        else if(action==="cook" && relics.some(r=>r.rule.restAction==="cook"))changeMaxHp(run,5);
        else if(action==="dig" && relics.some(r=>r.rule.restAction==="dig")){
            const candidates=Object.values(relicDefinitions).filter(r=>["普通","罕见","稀有"].includes(r.tier) && canAcquireRelic(run,r.id));
            const relic=relicRandomGet(run,candidates);if(relic)grantRelic(run,relic.id);
        } else return null;
    } else return null;
    run.player.relicRoomReceipts.push(receipt); return {recovered:run.player.hp-before,relics};
}
// Arrival precedes purchases and combat; retries on the same in-memory node
// cannot pay again. Battle rollback retains the existing checkpoint semantics.
export function applyRelicNodeEnter(run,node) {
    if(!node || node.completed)return;
    const state=relicState(run);
    const key=`${run.actIndex}:${node.id}`;
    const receipts=state.nodeReceipts ||= [];
    if(receipts.includes(key))return;
    receipts.push(key);
    for(const relic of heldRelics(run))if(relic.rule.nodeGold && !state.mawBankBroken)grantGold(run,relic.rule.nodeGold);
}
