import { heldRelics, relicDefinitions, canAcquireRelic, grantRelic } from "./definitions.js";
import { relicState, healRun, changeMaxHp, grantGold, upgradeCards } from "./progression.js";
import { relicRandomGet } from "./random.js";

export const restRecovery = run => 8+heldRelics(run).reduce((n,r)=>n+(r.rule.restHeal || 0),0);
export const relicShopPrice = (run,base) => Math.max(1,Math.floor(heldRelics(run).reduce((n,r)=>n*(r.rule.shopDiscount || 1),base)));
export function recordRelicShopPurchase(run){relicState(run).mawBankBroken=true;}
export function relicRestChoices(run) {
    const state=relicState(run),choices=[];
    for(const relic of heldRelics(run)){
        const action=relic.rule.restAction;
        if(action==="dig")choices.push({id:"dig",name:"挖掘",description:"获得一件可实现的随机普通、罕见或稀有遗物"});
        if(action==="lift")choices.push({id:"lift",name:"举重",description:`以后每场战斗获得额外力量（${state.giryaLevels || 0}/3）`,disabled:(state.giryaLevels || 0)>=3});
        if(action==="rekindle")choices.push({id:"rekindle",name:"添火",description:"让南瓜蜡烛再次燃烧5场战斗",disabled:(state.candleRemaining || 0)>=5});
        if(action==="cook")choices.push({id:"cook",name:"烹饪",description:"最大生命+5；梦三适配值"});
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
