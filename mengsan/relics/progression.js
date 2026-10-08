import { relicCatalog } from "./catalog.js";
import { relicRules } from "./rules.js";
import { relicRandom, relicRandomGet } from "./random.js";
import { installRelicDeckHook } from "./hooks.js";
import { cardDefinitions, canAcquireCard } from "../cards/card-definitions.js";
import { createCardData } from "../cards/card-data.js";
import { canUpgradeCard, upgradeRandomCard } from "../cards/upgrades.js";

const ids = new Map(relicCatalog.flatMap(r => [[r.id,r.wikiId],[r.wikiId,r.wikiId],[`mengsan_${r.wikiId}_shuying`,r.wikiId]]));
export const hasRelic = (run, id) => (run?.player?.items || []).some(value => ids.get(value) === id);
export const relicState = run => run.player.relicState ||= {};
export const cardType = card => cardDefinitions[card?.name]?.cardType;
export const starterKind = card => card?.name === "sha" ? "strike" : card?.name === "mengsan_fangyu" ? "defend" : null;
export function relicCardRequirements(rule) {
    return [...(rule.addCards || []), ...(rule.openingCards || []), ...(rule.openingDrawCards || []), ...(rule.oneBattleDrawCards || []), ...(rule.shuffleCard ? [rule.shuffleCard] : []), ...(rule.choice === "bite" ? ["mengsan_event_maul"] : [])].filter(name => !Object.hasOwn(cardDefinitions,name));
}
export function healRun(run, amount) {
    const before = run.player.hp;
    if (!Number.isFinite(before) || !(before > 0)) return 0;
    run.player.hp = Math.min(run.player.maxHp ?? before, before + Math.max(0,amount));
    return run.player.hp - before;
}
export function changeMaxHp(run, amount) {
    if (!Number.isFinite(run.player.maxHp)) { run.player.pendingRelicMaxHp = (run.player.pendingRelicMaxHp || 0) + amount; return; }
    run.player.maxHp = Math.max(1,run.player.maxHp + amount);
    run.player.hp = Math.min(run.player.hp,run.player.maxHp);
}
export function grantGold(run, amount) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("梦三金币增量无效");
    if (!amount || hasRelic(run,"ectoplasm")) return 0;
    const actual = Math.floor(amount * (hasRelic(run,"bowler_hat") ? 1.25 : 1));
    if (!Number.isSafeInteger((run.player.gold || 0) + actual)) throw new Error("梦三金币超出范围");
    run.player.gold = (run.player.gold || 0) + actual;
    run.statistics ||= {}; run.statistics.goldEarned = (run.statistics.goldEarned || 0) + actual;
    if (hasRelic(run,"dragon_fruit")) changeMaxHp(run,1);
    return actual;
}
export function newRelicCard(run, name, spec = {}) {
    const state = relicState(run), suits = ["spade","heart","club","diamond"];
    let id;
    do { id = `${run.runId || "run"}_relic_card_${state.cardSerial = (state.cardSerial || 0) + 1}`; }
    while (run.player.deck.some(card => card.id === id));
    return createCardData({name,suit:spec.suit ?? relicRandomGet(run,suits),number:spec.number ?? 1+Math.floor(relicRandom(run)*13),upgrade:0,affixes:[],...spec,id}, {character:run.player.character,enemy:true});
}
export function relicCardPool(run, {rarity,pack,type} = {}) {
    return Object.values(cardDefinitions).filter(card => canAcquireCard(run.player.character,card.name) &&
        (!pack ? card.owner === run.player.character : card.deck === pack) &&
        (!rarity || card.rarity === rarity) && (!type || card.cardType === type)).map(card => card.name);
}
export function upgradeCards(run, count, type) {
    const result = [];
    for (let i=0;i<count;i++) { const card=upgradeRandomCard(run.player.deck.filter(card=>!type || cardType(card)===type),()=>relicRandom(run)); if (!card) break; result.push(card); }
    return result;
}
export function afterDeckAdd(run,card,{duplicate=true}={}) {
    for (const id of new Set((run.player.items || []).map(id=>ids.get(id)))) {
        const rule = relicRules[id] || {};
        if (rule.upgradeAddedType === cardType(card) && canUpgradeCard(card)) card.upgrade++;
        if (rule.deckAddHealEvery) { const state=relicState(run); state.deckAdds=(state.deckAdds || 0)+1; if (state.deckAdds%rule.deckAddHealEvery===0) healRun(run,rule.deckAddHeal); }
        if (rule.deckAddGold) grantGold(run,rule.deckAddGold);
        if (rule.addedCurseMaxHp && cardType(card)==="curse") changeMaxHp(run,rule.addedCurseMaxHp);
        if (rule.duplicateAdded && duplicate) {
            const copy=newRelicCard(run,card.name,{...card,affixes:[...card.affixes]});
            run.player.deck.push(copy); afterDeckAdd(run,copy,{duplicate:false});
        }
    }
}
installRelicDeckHook(afterDeckAdd);
export function addPermanentRelicCard(run,name,spec) {
    const card=newRelicCard(run,name,spec); run.player.deck.push(card); afterDeckAdd(run,card); return card;
}
const queue = (run,relic,spec) => (relicState(run).choices ||= []).push({relic:relic.name,...spec});
const transform = (run,card,upgrade=false) => {
    const name=relicRandomGet(run,relicCardPool(run)); if (!name) return false;
    const next=newRelicCard(run,name); next.id=card.id; if (upgrade && canUpgradeCard(next)) next.upgrade++;
    Object.keys(card).forEach(key=>delete card[key]); Object.assign(card,next); return true;
};
export function applyRelicPickup(run,relic,{entries,canAcquire,grant}) {
    const r=relic.rule;
    const state=relicState(run);
    (state.counterStarts ||= {})[relic.wikiId]={attack:state.attackCount || 0,skill:state.skillCount || 0,card:state.totalCardCount || 0,exhaust:state.exhaustCount || 0};
    if (r.handLimit) run.player.handLimitBonus=(run.player.handLimitBonus || 0)+r.handLimit;
    if (r.maxHp) changeMaxHp(run,r.maxHp);
    if (r.fullHeal) { if (Number.isFinite(run.player.maxHp)) run.player.hp=run.player.maxHp; else run.player.pendingRelicFullHeal=true; }
    if (r.gainHealFraction) healRun(run,Math.floor(run.player.maxHp*r.gainHealFraction));
    if (r.gainGold) grantGold(run,r.gainGold);
    if (r.gainUpgrade) upgradeCards(run,r.gainUpgrade,r.upgradeType);
    for (const name of r.addCards || []) addPermanentRelicCard(run,name);
    for (let i=0;i<(r.randomCurse || 0);i++) { const name=relicRandomGet(run,relicCardPool(run,{pack:"curse"})); if (name) addPermanentRelicCard(run,name); }
    if (r.upgradeStarters) for (const kind of ["strike","defend"]) { const card=run.player.deck.find(card=>starterKind(card)===kind && canUpgradeCard(card)); if (card) card.upgrade++; }
    if (r.transformAllStarters) for (const card of run.player.deck) if (starterKind(card) && !card.affixes.includes("eternal")) transform(run,card);
    if (r.transformStarters) for (const kind of ["strike","defend"]) { const card=run.player.deck.find(card=>starterKind(card)===kind && !card.affixes.includes("eternal")); if (card) transform(run,card); }
    if (r.addStarters) { addPermanentRelicCard(run,"sha"); addPermanentRelicCard(run,"mengsan_fangyu"); }
    if (r.gainRandomRarity) { const name=relicRandomGet(run,relicCardPool(run,{rarity:r.gainRandomRarity})); if (name) addPermanentRelicCard(run,name); }
    if (r.gainAncientCard) { const name=relicRandomGet(run,relicCardPool(run,{rarity:"ancient",pack:"event"})); if (name) addPermanentRelicCard(run,name); }
    if (r.choice) queue(run,relic,{kind:r.choice,count:r.choiceCount || 1,optional:!!r.optionalChoices});
    for (const rarity of r.cardChoiceRarities || Array(r.cardChoices || 0).fill(r.cardChoiceRarity)) queue(run,relic,{kind:"cardReward",count:1,rarity,pack:r.cardChoicePack,offerCount:r.choiceOfferCount || 3});
    if (r.gainLoseHp) queue(run,relic,{kind:"loseHp",amount:r.gainLoseHp});
    for (let i=0;i<(r.randomRelics || 0);i++) {
        const candidates=entries.filter(item=>item.id!==relic.id && canAcquire(run,item.id) && (r.randomRelicAncient ? item.ancient===r.randomRelicAncient : ["普通","罕见","稀有"].includes(item.tier)));
        const target=relicRandomGet(run,candidates); if (target) grant(run,target.id);
    }
    if (r.candleBattles) relicState(run).candleRemaining=r.candleBattles;
    if (r.limitedBattles) relicState(run).emberRemaining=r.limitedBattles;
}
export async function resolveRelicChoices(run,choose,{cardName=name=>name}={}) {
    while (relicState(run).choices?.length) {
        const task=relicState(run).choices[0];
        if (task.kind==="loseHp") { run.player.hp=Math.max(1,(run.player.hp || 1)-task.amount); relicState(run).choices.shift(); continue; }
        for (let i=0;i<task.count;i++) {
            let choices;
            if (task.kind==="cardReward") {
                const pool=relicCardPool(run,task), offers=[];
                while(pool.length && offers.length<task.offerCount) offers.push(pool.splice(Math.floor(relicRandom(run)*pool.length),1)[0]);
                choices=offers.map(name=>({id:name,name:cardName(name),description:"加入永久牌组"}));
            } else choices=run.player.deck.filter(card=>!(task.selected || []).includes(card.id) &&
                (task.kind==="upgrade" ? canUpgradeCard(card) : task.kind==="duplicate" || !card.affixes.includes("eternal")))
                .map(card=>({id:card.id,name:`${cardName(card.name)}${card.upgrade ? "+" : ""}`,description:`${card.suit} ${card.number}`}));
            if (!choices.length) break;
            if (task.optional || task.kind==="cardReward") choices.push({id:"skip",name:"跳过"});
            const selected=await choose(`遗物·${task.relic}（${i+1}/${task.count}）`,choices,task.kind==="cardReward" ? "选择一张卡牌" : ({remove:"选择移除的卡牌",duplicate:"选择复制的卡牌",upgrade:"选择强化的卡牌",transform:"选择变化的卡牌",transformUpgrade:"选择变化并强化的卡牌",store:"选择暂存的卡牌"}[task.kind] || task.kind));
            if (selected==="skip") break;
            if (!choices.some(choice=>choice.id===selected)) throw new Error("遗物卡牌选择无效");
            if (task.kind==="cardReward") { addPermanentRelicCard(run,selected); continue; }
            const index=run.player.deck.findIndex(card=>card.id===selected),card=run.player.deck[index];
            (task.selected ||= []).push(card.id);
            if (task.kind==="upgrade") card.upgrade++;
            else if (task.kind==="duplicate") addPermanentRelicCard(run,card.name,{...card,affixes:[...card.affixes]});
            else if (task.kind==="remove") run.player.deck.splice(index,1);
            else if (task.kind==="transform" || task.kind==="transformUpgrade") transform(run,card,task.kind==="transformUpgrade");
            else if (task.kind==="bite") { const next=newRelicCard(run,"mengsan_event_maul");next.id=card.id;Object.keys(card).forEach(key=>delete card[key]);Object.assign(card,next); }
            else if (task.kind==="store") (relicState(run).storedCards ||= []).push(...run.player.deck.splice(index,1));
        }
        relicState(run).choices.shift();
    }
}
