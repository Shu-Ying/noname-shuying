import { heldRelics, grantRelic, getRelic, relicDefinitions, canAcquireRelic } from "./definitions.js";
import { cardType, starterKind, relicState, healRun, grantGold, changeMaxHp, upgradeCards, newRelicCard, relicCardPool } from "./progression.js";
import { cardUpgradeLevel, canUpgradeCard } from "../cards/upgrades.js";
import { isRetiredDeckCard } from "../cards/retired-cards.js";
import { relicRandomGet, relicRandom } from "./random.js";
import { sharedByName } from "../cards/packs/shared/data.js";
import { ironcladByName } from "../cards/packs/liubei/data.js";

export function nearestRelicUse(event) {
    const seen = new Set();
    for (let current=event;current && !seen.has(current);current=current.parent) { seen.add(current); if(current.name==="useCard")return current; }
    return null;
}
const progress = (value, label, goal) => ({
    value,
    label: `${label} ${value}${goal === undefined ? "" : `/${goal}`}`,
});

export function createRelicBattle(run,{active,draw,log,effect,owner,node={},encounter={},piles,isStrike=card=>starterKind(card)==="strike",onCounterChange=()=>{}}) {
    const relics=heldRelics(run).filter(r=>r.implementation!=="pending"), rules=relics.map(r=>r.rule);
    const has=id=>relics.some(r=>r.wikiId===id), sum=key=>rules.reduce((s,r)=>s+(r[key] || 0),0);
    const saved=relicState(run), uses=new WeakMap(), seenTurns=new WeakSet(), seenLosses=new WeakSet();
    const runCount = (relic, kind, total) => total - (saved.counterStarts?.[relic.wikiId]?.[kind] || 0);
    const attackEnergyRelics = relics.filter(relic => relic.rule.attackEnergyEvery);
    const seenResponses = new WeakSet();
    const attackEnergyProgress = (relic, count=energyAttacks) => count % relic.rule.attackEnergyEvery;
    const skillProgress = (relic, count=saved.skillCount || 0) => runCount(relic, "skill", count) % relic.rule.skillBlockEvery;
    const cardProgress = (relic, count=saved.totalCardCount || 0) => runCount(relic, "card", count) % relic.rule.cardDrawEvery;
    const exhaustProgress = relic => runCount(relic, "exhaust", saved.exhaustCount || 0) % relic.rule.exhaustDrawEvery;
    const periodicDrawRelics = relics.filter(relic => relic.rule.turnEvery);
    const turnDrawProgress = relic => saved.turnDrawProgress?.[relic.wikiId] || 0;
    const nextEnergy = new Map();
    let started=false, turns=0, endedTurns=0, firstLoss=false, openingHandBonus=0, inRelicEffect=0, ownTurn=false;
    let attacks=0, cards=0, previousCards=null, turnAttacks=0, turnSkills=0, nextBlock=0, hpLost=0;
    let energyAttacks = 0;
    const turnAttackProgress = () => turnAttacks % 3;
    const turnSkillProgress = () => turnSkills % 3;
    let firstPower=false, usedDeath=false, firstCardBlock=false, freeCards=new WeakSet(), dexterity=0, plating=sum("plating"), exhaustQueue=[], shuffles=0, flushing=false;
    const physical=card=>card?.cards?.length===1 ? card.cards[0] : card;
    const upgradePhysical=card=>{const data=physical(card)?.storage?.mengsanCard_shuying;if(data && canUpgradeCard(data))data.upgrade++;};
    saved.relicEnemyKills=0;
    const usable=()=>started && active() && owner.hp>0;
    const fire=async (relic,key,amount)=>{
        if(!active() || !amount || !(owner.hp>0) && key!=="healAbsolute")return;
        const label={openingHeal:"回复生命",healAbsolute:"回复生命",openingBlock:"获得格挡",nextBlock:"获得格挡",plating:"覆甲提供格挡",energy:"获得费用",nextEnergy:"获得费用",openingStrength:"获得力量",openingEnemyStrength:"敌人获得力量",openingVulnerable:"给予敌人易伤",openingWeak:"给予敌人虚弱",openingDamage:"对全体敌人造成伤害",randomDamage:"对随机敌人造成伤害",targetDamage:"反击伤害",openingLoseHp:"失去生命"}[key] || key;
        log(relic,`${label} ${amount}`); inRelicEffect++;
        try { await effect({...relic,effect:key,amount}); } finally { inRelicEffect--; }
    };
    const give=async (key,amount)=>{ if(!amount)return; const relic=relics.find(r=>r.rule[key]) || relics[0]; if(relic)await fire(relic,key,amount); };
    const drawMore=async (relic,amount)=>{ if(!usable() || !(amount>0))return; if(!turns)openingHandBonus+=amount; log(relic,`摸${amount}张牌`); await draw(amount); };
    const controller={
        has,
        counter(relic) {
            if (relic.implementation === "pending") return null;
            const r = relic.rule, id = relic.wikiId;
            if (r.attackEnergyEvery) return progress(attackEnergyProgress(relic), "本场攻击牌", r.attackEnergyEvery);
            if (r.nthAttackDouble) return progress(runCount(relic, "attack", saved.attackCount || 0) % r.nthAttackDouble, "累计攻击牌", r.nthAttackDouble);
            if (r.skillBlockEvery) return progress(skillProgress(relic), "累计技能牌", r.skillBlockEvery);
            if (r.cardDrawEvery) return progress(cardProgress(relic), "累计出牌", r.cardDrawEvery);
            if (r.exhaustDrawEvery) return progress(exhaustProgress(relic), "累计消耗牌", r.exhaustDrawEvery);
            if (r.turnEvery) return progress(turnDrawProgress(relic), "累计自身回合", r.turnEvery);
            if (r.tripleAttackBlock || r.tripleAttackDamage || r.tripleAttackDexterity || r.tripleAttackStrength) {
                return progress(turnAttackProgress(), "本回合攻击牌", 3);
            }
            if (r.tripleSkillDamage) return progress(turnSkillProgress(), "本回合技能牌", 3);
            if (r.turnCardLimit) return progress(cards, "自身回合已出牌", r.turnCardLimit);
            if (r.fifthCardFree) return progress(Math.max(0, 5 - cards), "距离免费出牌还差");
            if (r.fewCardsDraw) return progress(cards, "自身回合已出牌", r.fewCardsLimit);
            if (r.turnHpLossCap) return progress(Math.max(0, r.turnHpLossCap - hpLost), "本回合还可失去的生命");
            if (r.nthTurn || r.fromTurn) return progress(Math.max(0, (r.nthTurn || r.fromTurn) - turns), "触发前剩余回合");
            if (r.endTurn) return progress(Math.max(0, r.endTurn - endedTurns), "触发前剩余回合结束次数");
            if (r.earlyTurns) return progress(Math.max(0, r.earlyTurns - turns), "剩余额外抽牌回合");
            if (r.turnNumberDamage) return progress(turns, "当前自身回合");
            if (r.plating) return progress(plating, "当前覆甲");
            if (r.vigor) return progress(attacks ? 0 : r.vigor, "剩余活力");
            if (r.hpLossNextBlock) return progress(nextBlock, "下回合格挡");
            if (r.noAttackNextEnergy || r.unspentNextEnergy) return progress(nextEnergy.get(relic) || 0, "下回合额外能量");
            if (r.firstHpLossDraw) return progress(Number(!firstLoss), "本场受伤抽牌剩余次数");
            if (r.firstCardBlockDouble) return progress(Number(!firstCardBlock), "本场格挡翻倍剩余次数");
            if (r.firstPowerBlock) return progress(Number(!firstPower), "本场能力牌格挡剩余次数");
            if (r.afterRestEnergy) return progress(Number(Boolean(saved.afterRest)), "休息后待触发次数");
            if (r.oneBattleDrawCards) return progress(Number(!saved.oneBattleUsed?.[id]), "剩余战斗触发次数");
            if (r.deathHealFraction) return progress(Number(!saved.lizardTailUsed), "剩余复活次数");
            if (r.deckAddHealEvery) return progress((saved.deckAdds || 0) % r.deckAddHealEvery, "累计加入牌组", r.deckAddHealEvery);
            if (r.normalBattleUpgradeEvery) return progress((saved.fishingBattles || 0) % r.normalBattleUpgradeEvery, "累计普通战胜利", r.normalBattleUpgradeEvery);
            if (r.eliteTransformAfter) return progress(saved.eliteTransform?.[id] || 0, "累计精英战胜利", r.eliteTransformAfter);
            if (r.afterBattles) return progress(Math.max(0, r.afterBattles - (saved.battleCounters?.[id] || 0)), "领取遗物前剩余胜利场次");
            if (r.candleBattles) return progress(saved.candleRemaining || 0, "剩余燃烧场次");
            if (r.limitedBattles) return progress(saved.emberRemaining || 0, "剩余生效场次");
            if (r.returnStored) return progress(saved.storedCards?.length || 0, "待返还牌数");
            if (r.restAction === "lift") return progress(saved.giryaLevels || 0, "已举重次数", 3);
            if (r.breaksOnPurchase) return progress(Number(!saved.mawBankBroken), "储蓄罐可用状态");
            return null;
        },
        displayState(){return {dexterity,plating,nextEnergy:[...nextEnergy.values()].reduce((sum,amount)=>sum+amount,0),nextBlock};},
        retainsHand(){return has("runic_pyramid") || has("ringing_triangle") && turns===1;},
        get openingHandBonus(){return openingHandBonus;},
        get turns(){return turns;},
        get drawAdjustment(){return !turns ? rules.reduce((n,r)=>n+Math.min(0,r.openingDraw || 0),0) : 0;},
        async start(){
            if(started || !active())return; started=true;
            openingHandBonus=controller.drawAdjustment;
            for(const relic of relics){
                const r=relic.rule;
                if(r.openingDraw>0)await drawMore(relic,r.openingDraw);
                for(const key of ["openingHeal","openingBlock","openingStrength","openingVulnerable","openingWeak","openingEnemyStrength","openingDamage","openingLoseHp"])if(r[key])await fire(relic,key,r[key]);
                if(r.bossOpeningHeal && encounter.boss)await fire(relic,"openingHeal",r.bossOpeningHeal);
                if(r.eliteOpeningStrength && encounter.tier==="elite")await fire(relic,"openingStrength",r.eliteOpeningStrength);
                if(r.eliteOpeningDraw && encounter.tier==="elite")await drawMore(relic,r.eliteOpeningDraw);
                if(r.limitedOpeningStrength && saved.emberRemaining>0)await fire(relic,"openingStrength",r.limitedOpeningStrength);
                if(r.restAction==="lift" && saved.giryaLevels)await fire(relic,"openingStrength",saved.giryaLevels);
                if(r.openingUpgradeHand)for(const card of owner.getCards("h"))upgradePhysical(card);
                if(r.openingUpgradeDraw){const eligible=piles.drawCards().filter(canUpgradeCard);for(let i=0;i<r.openingUpgradeDraw && eligible.length;i++){const card=eligible.splice(Math.floor(relicRandom(run)*eligible.length),1)[0];upgradePhysical(card);}}
                for(const name of [...(r.openingDrawCards || []),...(!saved.oneBattleUsed?.[relic.wikiId] ? r.oneBattleDrawCards || [] : [])])piles.addToDraw(newRelicCard(run,name),Math.floor(relicRandom(run)*(piles.drawCards().length+1)));
                if(r.oneBattleDrawCards)(saved.oneBattleUsed ||= {})[relic.wikiId]=true;
                for(let i=0;i<(r.openingRandom || 0);i++){
                    let pool=relicCardPool(run,{pack:r.openingRandomPack});
                    if(r.openingRandomEthereal)pool=pool.filter(name=>(sharedByName[name] || ironcladByName[name])?.base.ethereal);
                    const name=relicRandomGet(run,pool);if(name){const card=await piles.addToHand(newRelicCard(run,name));if(card){openingHandBonus++;if(r.openingRandomFree)freeCards.add(card);}}
                }
            }
            if(firstLoss)for(const relic of relics)if(relic.rule.firstHpLossDraw)await drawMore(relic,relic.rule.firstHpLossDraw);
            onCounterChange();
        },
        globalTurnStart(player) {
            hpLost=0;
            turnAttacks=0;
            turnSkills=0;
            ownTurn=player===owner;
            onCounterChange();
        },
        resetEnergy(base,current){return base+(has("ice_cream") && turns ? Math.max(0,current || 0) : 0);},
        retainedBlock(block){return !turns ? block : Math.min(block,sum("keepBlock"));},
        async turnStart(event){
            if(!usable() || seenTurns.has(event))return; seenTurns.add(event);
            endedTurns=turns++;
            previousCards=turns>1 ? cards : null; cards=0;
            if(turns>1)freeCards=new WeakSet();
            for (const relic of periodicDrawRelics) {
                (saved.turnDrawProgress ||= {})[relic.wikiId] = (turnDrawProgress(relic) + 1) % relic.rule.turnEvery;
            }
            for (const [relic, amount] of nextEnergy) await fire(relic, "nextEnergy", amount);
            nextEnergy.clear();
            await give("nextBlock",nextBlock); nextBlock=0;
            onCounterChange();
            for(const relic of relics){
                const r=relic.rule;
                let energy=(r.turnEnergy && (!r.fromTurn || turns>=r.fromTurn) ? r.turnEnergy : 0)+(turns===1 ? r.firstTurnEnergy || 0 : r.laterTurnEnergy || 0);
                if(turns===1 && r.afterRestEnergy && saved.afterRest)energy+=r.afterRestEnergy;
                if(turns===1 && r.eliteFirstTurnEnergy && encounter.tier==="elite")energy+=r.eliteFirstTurnEnergy;
                if(r.nthTurn===turns){energy+=r.nthTurnEnergy || 0;dexterity+=r.nthTurnDexterity || 0;await fire(relic,"openingBlock",r.nthTurnBlock);await fire(relic,"openingStrength",r.nthTurnStrength);}
                if(r.candleEnergy && saved.candleRemaining>0)energy+=r.candleEnergy;
                if(r.paidTurnEnergy && run.player.gold>=r.paidTurnGold){run.player.gold-=r.paidTurnGold;energy+=r.paidTurnEnergy;}
                await fire(relic,"energy",energy);
                await fire(relic,"openingBlock",r.turnBlock);
                let amount=r.turnDraw && (!r.turnEvery || turnDrawProgress(relic)===0) ? r.turnDraw : 0;
                if(r.earlyTurnDraw && turns<=r.earlyTurns)amount+=r.earlyTurnDraw;
                if(r.fewCardsDraw && previousCards!==null && previousCards<=r.fewCardsLimit)amount+=r.fewCardsDraw;
                await drawMore(relic,amount);
                await fire(relic,"openingDamage",r.turnDamage || (r.turnNumberDamage ? turns : 0));
                await fire(relic,"openingStrength",r.turnStrength);
                await fire(relic,"openingEnemyStrength",r.enemyTurnStrength);
            }
            if(turns===1)delete saved.afterRest;
            onCounterChange();
        },
        async beforeDiscard(){
            if(!usable())return;
            for(const relic of relics)if(relic.rule.endHandBlock)await fire(relic,"openingBlock",owner.getCards("h").length*relic.rule.endHandBlock);
        },
        async turnEnd(){
            if(!usable())return;
            for(const relic of relics){const r=relic.rule;
                if(r.noAttackBlock && !turnAttacks)await fire(relic,"openingBlock",r.noAttackBlock);
                const energy=(!turnAttacks ? r.noAttackNextEnergy || 0 : 0) +
                    (r.unspentNextEnergy && owner.storage.mengsanEnergy_shuying>0 ? r.unspentNextEnergy : 0);
                if(energy)nextEnergy.set(relic,(nextEnergy.get(relic) || 0)+energy);
                if(r.emptyBlock && !owner.hujia)await fire(relic,"openingBlock",r.emptyBlock);
                if(r.endBlockThreshold && owner.hujia>=r.endBlockThreshold)await fire(relic,"randomDamage",r.endBlockDamage);
                if(r.endTurn===turns)await fire(relic,"openingDamage",r.endTurnDamage);
            }
            if(plating)await give("plating",plating);
            endedTurns=turns;
            onCounterChange();
        },
        beforeHpLoss(amount,armor=0){
            if(!(amount<0) || !started)return amount;
            const absorbed=Math.min(-amount,Math.max(0,armor));
            let loss=Math.max(0,-amount-absorbed-sum("reduceHpLoss"));
            if(sum("turnHpLossCap"))loss=Math.min(loss,Math.max(0,sum("turnHpLossCap")-hpLost));
            return -(absorbed+loss);
        },
        async loseHp(event){
            if(!active() || seenLosses.has(event) || !(event.num<0))return; seenLosses.add(event); hpLost-=event.num;
            if(event.parent?.name==="damage")event.parent.mengsanHpDamage_shuying=-event.num;
            for(const r of rules)if(r.hpLossNextBlock)nextBlock+=r.hpLossNextBlock;
            const first=!firstLoss;
            firstLoss=true;
            onCounterChange();
            if(first && started)for(const relic of relics)if(relic.rule.firstHpLossDraw)await drawMore(relic,relic.rule.firstHpLossDraw);
        },
        async dying(){
            if(!active() && !(owner.hp<=0))return;
            if(!has("lizard_tail") || usedDeath || saved.lizardTailUsed || owner.hp>0)return;
            usedDeath=true;saved.lizardTailUsed=true;
            onCounterChange();
            await give("healAbsolute",Math.ceil(owner.maxHp*0.5)-owner.hp);
        },
        async onUse(use){
            if(!usable() || uses.has(use) || use.player!==owner || !use.card || use.mengsanIcEcho_shuying || use.mengsanSharedEcho_shuying)return;
            const type=cardType(use.card), record={type,attackIndex:0,vigor:0};
            uses.set(use,record);
            if(ownTurn)cards++;
            saved.totalCardCount=(saved.totalCardCount || 0)+1;
            const firstPowerUse=type==="power" && !firstPower;
            if(type==="attack"){
                attacks++;turnAttacks++;saved.attackCount=(saved.attackCount || 0)+1;
                energyAttacks++;
                record.attackIndex=saved.attackCount;
                if(attacks===1)record.vigor=sum("vigor");
            } else if(type==="skill"){
                turnSkills++;saved.skillCount=(saved.skillCount || 0)+1;
            } else if(type==="power")firstPower=true;
            const energyAttackCount=energyAttacks, skillCount=saved.skillCount, cardCount=saved.totalCardCount;
            const thirdAttack=turnAttackProgress()===0, thirdSkill=turnSkillProgress()===0;
            onCounterChange();

            for(const relic of relics){
                const r=relic.rule;
                if(type==="attack"){
                    if(r.attackEnergyEvery && attackEnergyProgress(relic,energyAttackCount)===0)await fire(relic,"energy",1);
                    if(r.attackBlock)await fire(relic,"openingBlock",r.attackBlock);
                    if(thirdAttack){
                        dexterity+=r.tripleAttackDexterity || 0;
                        await fire(relic,"openingBlock",r.tripleAttackBlock);
                        await fire(relic,"randomDamage",r.tripleAttackDamage);
                        await fire(relic,"openingStrength",r.tripleAttackStrength);
                    }
                } else if(type==="skill"){
                    if(r.skillBlockEvery && skillProgress(relic,skillCount)===0)await fire(relic,"openingBlock",r.skillBlock);
                    if(thirdSkill)await fire(relic,"openingDamage",r.tripleSkillDamage);
                } else if(type==="power"){
                    if(firstPowerUse)await fire(relic,"openingBlock",r.firstPowerBlock);
                    await drawMore(relic,r.powerDraw);
                    await fire(relic,"openingDamage",r.powerDamage);
                    if(r.powerFreeRandom){
                        const card=relicRandomGet(run,owner.getCards("h").filter(card=>card!==physical(use.card)));
                        if(card)freeCards.add(card);
                    }
                }
            }
            for(const relic of relics)if(relic.rule.cardDrawEvery && cardProgress(relic,cardCount)===0)await drawMore(relic,1);
        },
        async onRespond(response) {
            if (!attackEnergyRelics.length || !usable() || response.player !== owner ||
                seenResponses.has(response) || cardType(response.card) !== "attack") return;
            seenResponses.add(response);
            const count = ++energyAttacks;
            onCounterChange();
            for (const relic of attackEnergyRelics) {
                if (attackEnergyProgress(relic, count) === 0) await fire(relic, "energy", 1);
            }
        },
        limited(){return ownTurn && rules.some(r=>r.turnCardLimit && cards>=r.turnCardLimit);},
        isFree(card){return freeCards.has(physical(card)) || ownTurn && has("brilliant_scarf") && cards===4;},
        cost(card,base){return Math.max(0,base+(cardType(card)==="power" ? sum("powerTax") : 0));},
        blocksDraw(){return false;},
        blockAmount(amount,event){
            if(!(amount>0) || inRelicEffect)return amount;
            const use=nearestRelicUse(event);
            if(use?.player!==owner || !use.card)return amount;
            const value=Math.max(0,amount+sum("openingDexterity")+dexterity);
            if(!firstCardBlock && has("vambrace")){
                firstCardBlock=true;
                onCounterChange();
                return value*2;
            }
            return value;
        },
        outgoingDamage(event){
            if(event.source!==owner || !(event.card || event.mengsanAttack_shuying))return event.num;
            const use=nearestRelicUse(event),record=uses.get(use),attack=record?.type==="attack" || cardType(event.card)==="attack" || event.mengsanAttack_shuying;
            if(!attack)return event.num;
            let amount=event.num+(record?.vigor || 0);
            if(isStrike(event.card))amount+=sum("strikeDamage");
            if(cardUpgradeLevel(event.card)>0)amount+=sum("upgradedAttackDamage");
            if(owner.hp<=owner.maxHp/2)amount+=sum("lowHpStrength");
            if(record?.type==="attack" && relics.some(relic=>relic.rule.nthAttackDouble && runCount(relic,"attack",record.attackIndex)%relic.rule.nthAttackDouble===0))amount*=2;
            return amount;
        },
        lateOutgoingDamage(event){const unblocked=event.num-(event.player?.hujia || 0);return has("the_boot") && event.source===owner && cardType(event.card)==="attack" && unblocked>0 && unblocked<5 ? event.num+5-unblocked : event.num;},
        async afterDamage(event){
            if(event.player!==owner || !(event.num>0))return;
            const attack=cardType(event.card)==="attack" || event.mengsanAttack_shuying;
            if(attack && plating && event.mengsanHpDamage_shuying>0){
                plating--;
                onCounterChange();
            }
            if(attack && event.source?.isAlive?.())for(const relic of relics)if(relic.rule.thorns)await fire({...relic,target:event.source},"targetDamage",relic.rule.thorns);
        },
        async enemyDeath(target){if(!usable() || target.storage?.mengsanCamp_shuying!=="enemy")return;saved.relicEnemyKills++;for(const relic of relics){await fire(relic,"energy",relic.rule.killEnergy);await drawMore(relic,relic.rule.killDraw);}},
        queueExhaust(card){exhaustQueue.push(card);},
        queueShuffle(){shuffles++;},
        async flushExhaust(){
            if(flushing || !usable())return;flushing=true;
            try{
                while(shuffles && usable()){shuffles--;for(const relic of relics)await fire(relic,"openingBlock",relic.rule.shuffleBlock);}
                while(exhaustQueue.length && usable()){
                    exhaustQueue.shift();saved.exhaustCount=(saved.exhaustCount || 0)+1;
                    onCounterChange();
                    for(const relic of relics){const r=relic.rule;await fire(relic,"openingDamage",r.exhaustDamage);if(r.exhaustDrawEvery && exhaustProgress(relic)===0)await drawMore(relic,1);}
                }
            }finally{flushing=false;}
        },
        status(relic) {
            if (relic.implementation === "pending") return relic.implementationNote;
            return controller.counter(relic)?.label ?? null;
        },
    };
    return controller;
}

export function applyBattleEndRelics(run,outcome,{node={},encounter={}}={}) {
    if(outcome!=="victory" || !(run.player.hp>0))return 0;
    const before=run.player.hp, relics=heldRelics(run);
    const low=run.player.hp<=run.player.maxHp/2;
    for(const relic of relics){const r=relic.rule,state=relicState(run);
        healRun(run,(r.battleHeal || 0)+(low ? r.lowHpBattleHeal || 0 : 0));
        if(r.battleGold)grantGold(run,r.battleGold*(state.relicEnemyKills || encounter.defeatedEnemies || 1));
        if(r.battleMaxHp)changeMaxHp(run,r.battleMaxHp);
        if(r.eliteUpgrade && encounter.tier==="elite")upgradeCards(run,r.eliteUpgrade);
        if(r.normalBattleUpgradeEvery && node.type==="battle" && !encounter.boss && encounter.tier!=="elite"){
            state.fishingBattles=(state.fishingBattles || 0)+1;if(state.fishingBattles%r.normalBattleUpgradeEvery===0)upgradeCards(run,1);
        }
        if(r.candleBattles)state.candleRemaining=Math.max(0,(state.candleRemaining || 0)-1);
        if(r.limitedBattles)state.emberRemaining=Math.max(0,(state.emberRemaining || 0)-1);
        if (r.returnStored && state.storedCards?.length) {
            state.storedCards = state.storedCards.filter(card => !isRetiredDeckCard(run.player.character, card?.name));
            const card = relicRandomGet(run, state.storedCards);
            if (card) {
                upgradeCards({ ...run, player: { ...run.player, deck: [card] } }, 1);
                state.storedCards.splice(state.storedCards.indexOf(card), 1);
                run.player.deck.push(card);
            }
        }
        if(r.eliteTransformAfter && encounter.tier==="elite"){
            const counters=relicState(run).eliteTransform ||= {};counters[relic.wikiId]=(counters[relic.wikiId] || 0)+1;
            if(counters[relic.wikiId]>=r.eliteTransformAfter){run.player.items=run.player.items.filter(id=>getRelic(id)?.id!==relic.id);grantRelic(run,r.transformRelic);}
        }
        if(r.afterBattles){
            const counters=relicState(run).battleCounters ||= {};counters[relic.wikiId]=(counters[relic.wikiId] || 0)+1;
            if(counters[relic.wikiId]===r.afterBattles)for(let i=0;i<(r.randomRelicsAfter || 0);i++){
                const target=relicRandomGet(run,Object.values(relicDefinitions).filter(r=>["普通","罕见","稀有"].includes(r.tier) && canAcquireRelic(run,r.id)));if(target)grantRelic(run,target.id);
            }
        }
    }
    return run.player.hp-before;
}
export function createRelicSkills(getBattle,getOwner){
    return {mengsan_relics_shuying:{
        group:["mengsan_relics_limit_shuying"],
        trigger:{global:["phaseBefore","phaseBegin","changeHp","useCard1","respond","phaseDiscardBegin","phaseJieshuBegin","damage","dying"]},
        forced:true,silent:true,popup:false,priority:400,
        filter(event, player) {
            const owner = getOwner(), battle = getBattle();
            // 全局技能按座位排队，只有遗物持有者的座位结算。
            return Boolean(owner && player === owner && battle?.session.active && battle.relics &&
                (event.player === owner || event.name === "phase"));
        },
        async content(event,trigger){
            const r=getBattle()?.relics;if(!r)return;
            if(event.triggername==="phaseBefore")r.globalTurnStart(trigger.player);
            if(trigger.player!==getOwner())return;
            if(event.triggername==="phaseBegin")await r.turnStart(trigger);
            else if(event.triggername==="changeHp")await r.loseHp(trigger);
            else if(event.triggername==="useCard1")await r.onUse(trigger);
            else if(event.triggername==="respond")await r.onRespond(trigger);
            else if(event.triggername==="phaseDiscardBegin")await r.beforeDiscard();
            else if(event.triggername==="phaseJieshuBegin")await r.turnEnd();
            else if(event.triggername==="damage")await r.afterDamage(trigger);
            else if(event.triggername==="dying")await r.dying();
        },
    },mengsan_relics_limit_shuying:{trigger:{global:"useCard0"},forced:true,silent:true,popup:false,firstDo:true,priority:13000,
        filter(event){return Boolean(getBattle()?.session.active && event.player===getOwner() && getBattle().relics?.limited());},
        async content(event,trigger){trigger.cancel();},
        mod:{cardEnabled(card,player){if(player===getOwner() && getBattle()?.session.active && getBattle().relics?.limited())return false;},
            ignoredHandcard(card,player){if(player===getOwner() && getBattle()?.session.active && getBattle().relics?.retainsHand())return true;}},
    }};
}
