import { ironcladByName } from "./data.js";
import { cardDefinitions } from "../../card-definitions.js";
import { generationPool, legacyIroncladNames } from "../../card-pools.js";
import { cardUpgradeLevel, cardUpgradeRule, canUpgradeCard } from "../../upgrades.js";
import { createCardData } from "../../card-data.js";
import { isStrikeCard } from "../../strike-counter.js";
import { snapshotRampage, copyRampageGrowth } from "../../rampage.js";
import { isAttackCard } from "../../../monsters/vine-tangled.js";
import { authorizeFreeCardUse, takeXCardUse, cardCost } from "../../../battle/combat-rules.js";
import { bindIroncladHooks } from "../../ironclad-hooks.js";
import { sharedHooks } from "../../shared-hooks.js";
import { temporaryStrengthAmount } from "../../temporary-strength.js";
import { shrinkAttackDamage } from "../../../monsters/shrinker-status.js";

const MARK = "mengsan_ic_advanced_shuying";
const BRIDGE = "mengsan_ic_bridge_shuying";
const powerKeys = ["exhaustBlock","exhaustDraw","vulnerableDraw","plating","juggle","endAttack",
    "retrieveAttack","bodyguard","autoStrike","firstBlock","blockDamage","barricade","corruption"];
const safe = n => Number.isSafeInteger(n) && n >= 0;
function belongs(event,root) {
    const seen=new Set();
    for(let current=event;current&&!seen.has(current);current=current.parent){
        if(current===root)return true; seen.add(current);
    }
    return false;
}
function nearestUse(event) {
    const seen=new Set();
    for(let current=event;current&&!seen.has(current);current=current.parent){
        if(current.name==="useCard")return current; seen.add(current);
    }
    return null;
}
const originalOf = event => {
    const use=nearestUse(event);
    return use?.mengsanIcRepeatOriginal_shuying || use?.cards?.find(c=>c.name===use.card?.name) || event.card;
};

export function createAdvancedIronclad({game,get,lib,status,getBattle,battleEnergy,random}) {
    const states=new WeakMap(), uses=new WeakMap(), hits=new WeakMap(), growth=new WeakMap();
    const seenUses=new WeakSet(), seenBlocks=new WeakSet(), seenDraws=new WeakSet();
    const valid=(player,token)=>Boolean(token && getBattle()===token.battle && token.session.active &&
        token.battle.session===token.session && token.battle.root===token.root &&
        token.battle.players.has(player) && player?.isAlive?.());
    const tokenOf=player=>{
        const battle=getBattle();
        if(!battle?.session?.active || !battle.root || !battle.players.has(player) || !player?.isAlive?.())return null;
        return {battle,session:battle.session,root:battle.root,run:status.mengsanRun_shuying};
    };
    const pileOf=(player,token)=>player===game.me ? token.battle.personalPiles : token.battle.monsterPiles?.get(player);
    const stateOf=player=>{
        const s=states.get(player); return s && valid(player,s.token) ? s : null;
    };
    const add=(object,key,value)=>{
        const next=(object[key]||0)+value;
        if(!safe(next))throw new RangeError("刘备牌组状态数值越界");
        object[key]=next;
    };
    const rule=card=>{
        const spec=ironcladByName[card?.name];
        return spec ? cardUpgradeLevel(card) ? spec.upgraded : spec.base : null;
    };
    const skillCard=card=>{
        const r=rule(card);
        const info=lib.card[card?.name],definition=cardDefinitions[card?.name];
        if(definition?.cardType)return definition.cardType==="skill";
        return r ? !r.damage && !r.power : !isAttackCard(card) && !info?.mengsanPower_shuying &&
            (legacyIroncladNames.includes(card?.name) || definition?.deck==="colorless" &&
                info?.type!=="equip" && info?.type!=="status");
    };
    const refresh=s=>{if(s&&valid(s.player,s.token)){s.token.battle.handUI?.refresh();s.token.battle.pilesUI?.refresh();}};
    function ensure(player,{requiresPile=true}={}) {
        const token=tokenOf(player); if(!token)return null;
        // 全局钩子也接收公共牌堆友军的事件；他们没有个人消耗牌堆。
        // 被卡牌施加的临时状态可单独登记，不将目标当成个人牌堆使用者。
        if(requiresPile && !pileOf(player,token))return null;
        let s=stateOf(player); if(s)return s;
        s={player,token,powers:Object.create(null),turn:Object.create(null),queue:[],flushing:false,
            autoQueue:[],autoBusy:false,freeCards:new WeakSet(),negativeStrength:0,autoCount:0};
        states.set(player,s); player.addSkill(MARK);
        token.session.ownResource(s,()=>{if(states.get(player)===s){states.delete(player);player.removeSkill(MARK);s.queue.length=0;s.autoQueue.length=0;}});
        bindIroncladHooks(player,token.session,{
            valid:()=>valid(player,token),
            blocksDraw:()=>Boolean(s.turn.noDraw), blocksEnergy:()=>Boolean(s.turn.noEnergy),
            preservesBlock:()=>Boolean(s.powers.barricade),
            skillExhausts:card=>Boolean(s.powers.corruption && skillCard(card)),
            strengthPenalty:()=>s.negativeStrength,
            isFree:card=>{
                const node=card?.cards?.length===1 ? card.cards[0] : card;
                return Boolean(s.freeCards.has(node) || s.powers.freeAttack && isAttackCard(card) || s.powers.corruption && skillCard(card));
            },
            cost:(card,cost)=>{
                const r=rule(card);
                if(r?.attackDiscount)cost=Math.max(0,cost-(s.turn.attacks||0));
                if(r?.exhaustDiscount)cost=Math.max(0,cost-totalExhaustions(token));
                const node=card?.cards?.length===1 ? card.cards[0] : card;
                if(s.freeCards.has(node) || s.powers.freeAttack && isAttackCard(card) || s.powers.corruption && skillCard(card))return 0;
                return cost;
            },
            queueExhaust:card=>s.queue.push({type:"exhaust",card,energy:rule(card)?.exhaustEnergy||0,
                block:s.powers.exhaustBlock||0,draw:s.powers.exhaustDraw||0}),
            flushExhaust:()=>flush(s), afterDraw:cards=>afterDraw(s,cards),
            snapshotCard:card=>card.name==="mengsan_ic_thrash" ? {
                mengsanThrashBonus_shuying:growthOf(card,s),mengsanThrashSession_shuying:token.session.id} : {},
            queueVulnerable:target=>{if(s.powers.vulnerableDraw && valid(target,token))s.queue.push({type:"vulnerable",draw:s.powers.vulnerableDraw});},
            blockAmount:(num,event)=>{
                if(!(num>0) || !s.powers.firstBlock)return num;
                let current=event;const visited=new Set();
                while(current&&!visited.has(current)){
                    visited.add(current);
                    // 技能/遗物获得的格挡不借用其外层卡牌的来源。
                    if(current.skill || lib.skill[current.name])return num;
                    if(current.name==="useCard" && current.player===player){
                        const uses=s.turn.blockUses ||= new Set();
                        if(uses.has(current))return num*2;
                        if(uses.size<s.powers.firstBlock){uses.add(current);return num*2;}
                        return num;
                    }
                    current=current.parent;
                }
                return num;
            },
        });
        return s;
    }
    function totalExhaustions(token) {
        let total=0;
        for(const player of token.battle.players)total+=pileOf(player,token)?.exhaustTotal?.()||0;
        return total;
    }
    function dataOf(card) {
        const physical=card?.cards?.length===1 ? card.cards[0] : card;
        const data=physical?.storage?.mengsanCard_shuying || card?.storage?.mengsanCard_shuying || {};
        return {...data,name:card.name,suit:card.suit||data.suit||"spade",number:card.number||data.number||1,
            nature:card.nature||data.nature||null,upgrade:cardUpgradeLevel(card),affixes:[...(data.affixes||[])]};
    }
    function generatedData(s,name,source=null,upgrade=0) {
        const battle=s.token.battle,serial=(battle.generatedCardSerial||0)+1;
        if(!safe(serial))throw new RangeError("生成牌序号越界");
        battle.generatedCardSerial=serial;
        const raw=source ? dataOf(source) : {suit:"spade",number:1,nature:null,affixes:[],upgrade};
        return createCardData({...raw,id:`mengsan_generated_${s.token.session.id}_${serial}`,name,
            upgrade:Math.min(raw.upgrade||0,cardUpgradeRule(name)?.maxLevel||0)}, {enemy:true});
    }
    const randomItem=(s,list)=>{
        if(!list.length)return null;
        const value=random(s.token.run);
        if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError("战斗随机数无效");
        return list[Math.floor(value*list.length)];
    };
    function rememberGrowth(s,card,bonus) {
        if(!safe(bonus))throw new RangeError("痛殴累积伤害越界");
        const entry={token:s.token,bonus};growth.set(card,entry);
        s.token.session.ownResource(entry,()=>{if(growth.get(card)===entry)growth.delete(card);});
    }
    function growthOf(card,s=null) {
        if(card?.cards?.length===1 && card.cards[0].name===card.name)card=card.cards[0];
        const entry=growth.get(card);
        return entry?.token.session.active && (!s || entry.token.battle===s.token.battle) ? entry.bonus :
            !card?.storage && card?.mengsanThrashSession_shuying===getBattle()?.session.id ? card.mengsanThrashBonus_shuying||0 : 0;
    }
    async function copyToHand(s,source) {
        if(!valid(s.player,s.token))return null;
        const pile=pileOf(s.player,s.token);if(!pile)return null;
        const copy=await pile.addToHand(generatedData(s,source.name,source));
        if(!copy || !valid(s.player,s.token))return copy;
        copyRampageGrowth(source,copy,s.token.battle);
        sharedHooks(s.player)?.copyCard?.(source,copy);
        if(source.name==="mengsan_ic_thrash")rememberGrowth(s,copy,growthOf(source,s));
        // 实体牌副本继承永久词缀与当前强化，不继承本回合免费、已使用或消耗标记。
        return copy;
    }
    async function flush(s) {
        if(!s || s.flushing)return;
        s.flushing=true;
        try {
            while(s.queue.length && valid(s.player,s.token)){
                const entry=s.queue.shift();
                if(entry.energy)battleEnergy.grant(s.player,entry.energy,s.token.battle);
                if(entry.block){await s.player.changeHujia(entry.block);if(!valid(s.player,s.token))break;}
                if(entry.draw){await s.player.draw(entry.draw);if(!valid(s.player,s.token))break;}
            }
            refresh(s);
        } finally {s.flushing=false;}
    }
    async function flushAll() {
        const battle=getBattle();if(!battle?.session.active)return;
        for(const player of [...battle.players])await flush(stateOf(player));
    }
    function legalTargets(s,card) {
        const info=lib.card[card.name];if(!info)return [];
        return [...s.token.battle.players].filter(target=>valid(target,s.token) &&
            (typeof info.filterTarget!=="function" || info.filterTarget(card,s.player,target)));
    }
    async function autoPlay(s,card,{fromExhaust=false,fromDraw=false,echo=null,targets=null}={}) {
        if(!valid(s.player,s.token))return false;
        const info=lib.card[card.name],pile=pileOf(s.player,s.token);
        if((fromExhaust||fromDraw) && !pile)return false;
        if(++s.autoCount>1024)throw new Error("自动打牌超过安全结算上限，请检查递归组合");
        const skip=()=>{if(fromDraw && pile.beginAutoPlay(card,false))pile.finishAutoPlay(card);return false;};
        if(!info || info.enable===false || card.storage?.mengsanCard_shuying?.affixes?.includes("unplayable"))return skip();
        let selected=info.notarget ? [] : targets?.filter(target=>valid(target,s.token)) || null;
        if(!selected){
            const candidates=legalTargets(s,card);
            if(!candidates.length)return skip();
            selected=info.toself ? [s.player] : info.selectTarget===-1 ? candidates : [randomItem(s,candidates)];
        }
        if(!selected.length && !info.notarget)return skip();
        if((fromExhaust||fromDraw) && !pile.beginAutoPlay(card,fromExhaust))return false;
        let use,release=()=>{};
        try {
            const played=echo ? {...echo.card,storage:{mengsanCard_shuying:{...echo.data,affixes:echo.data.affixes.slice()}}} : card;
            use=s.player.useCard({card:played,cards:echo?[]:[card],targets:selected,addCount:false});
            if(echo){use.mengsanIcEcho_shuying=true;use.mengsanIcRepeatOriginal_shuying=echo.original;}
            use.mengsanIcAuto_shuying=true;use.addCount=false;
            release=authorizeFreeCardUse(s.player,use.card,use,()=>valid(s.player,s.token));
            // 在该原生 useCard 成为当前事件时校验，临时免费授权才能匹配正确父链。
            use.oncard=()=>{
                if(!valid(s.player,s.token) || !lib.filter.cardEnabled(use.card,s.player) ||
                    selected.some(target=>!s.player.canUse(use.card,target,false)))use.cancel();
            };
            await use;
            return !use.cancelled;
        } finally {release();if(fromExhaust||fromDraw)pile.finishAutoPlay(card);}
    }
    async function afterDraw(s,cards) {
        if(!s?.powers.autoStrike || !valid(s.player,s.token))return;
        for(const card of cards||[])if(isAttackCard(card) && isStrikeCard(card,lib))s.autoQueue.push(card);
        if(s.autoBusy)return;
        s.autoBusy=true;
        try {
            while(s.autoQueue.length && valid(s.player,s.token)){
                const card=s.autoQueue.shift();
                if(s.player.getCards("h").includes(card))await autoPlay(s,card);
            }
        } finally {s.autoBusy=false;}
    }
    function baseDamage(card,player,event=null) {
        const s=stateOf(player),r=rule(card),level=cardUpgradeLevel(card),upgrade=level?cardUpgradeRule(card.name):null;
        if(r){
            let value=r.damage||0;
            if(r.perExhaust)value+=r.perExhaust*(s ? pileOf(player,s.token)?.exhaustedCards().length||0 : 0);
            if(card.name==="mengsan_ic_thrash")value+=growthOf(card,s);
            return value;
        }
        const values={sha:level?9:6,mengsan_zhongsha:level?10:8,mengsan_fennu:level?8:6,
            mengsan_feijianhuixuanbiao:3,mengsan_jianbingdaji:level?10:9,mengsan_rongrongzhiquan:level?14:10,
            mengsan_shandianpili:level?7:4,mengsan_shuangchongdaji:level?7:5,mengsan_tiezhanbo:level?7:5,
            mengsan_touchui:level?12:9,mengsan_tupo:level?13:9,mengsan_yubeidaji:level?9:7,
            mengsan_yujin:level?24:18,mengsan_yuanhen:5,mengsan_xuanfengzhan:level?8:5};
        if(card.name==="mengsan_quanshenzhuangji")return player.hujia||0;
        if(card.name==="mengsan_baozou")return 9+(snapshotRampage(card).mengsanRampageBonus_shuying||0);
        if(card.name==="mengsan_qiling")return 4; // 无指定目标时，目标易伤项为0。
        if(card.name==="mengsan_wanmeidaji"){
            const all=s ? pileOf(player,s.token)?.battleCards(event?.cards||[])||[] : [];
            return 6+all.filter(c=>isStrikeCard(c,lib)).length*(level?3:2);
        }
        return values[card.name]??upgrade?.damage??0;
    }
    async function play(spec,event,player) {
        const s=ensure(player);if(!s || !belongs(event,s.token.root))return;
        const r=cardUpgradeLevel(event.card)?spec.upgraded:spec.base,pile=pileOf(player,s.token);
        if(r.damage){
            const source=originalOf(event),amount=r.damage+(r.absorbAttack?growthOf(source,s):0),hitsCount=r.hits||1;
            for(let i=0;i<hitsCount && valid(player,s.token);i++){
                const targets=r.all ? [...s.token.battle.players].filter(t=>valid(t,s.token)&&player.isEnemyOf(t)) : [event.target];
                for(const target of targets){
                    if(!valid(player,s.token))return;
                    if(!valid(target,s.token)||!player.isEnemyOf(target))continue;
                    const hit=target.damage(amount,player);hit.card=event.card;hit.mengsanAttack_shuying=true;
                    if(r.feed)hits.set(hit,{s,amount:r.feed,claimed:false});
                    await hit;
                }
            }
        }
        if(!valid(player,s.token))return;
        if(r.nextFreeAttack)add(s.powers,"freeAttack",1);
        if(r.negativeStrength && valid(event.target,s.token)){
            const targetState=ensure(event.target,{requiresPile:false});
            if(targetState)add(targetState,"negativeStrength",r.negativeStrength);
        }
        if(r.absorbAttack){
            const candidate=randomItem(s,player.getCards("h").filter(c=>isAttackCard(c)));
            if(candidate){
                let amount=Math.max(0,baseDamage(candidate,player,event)+(player.storage.mengsanStrength_shuying||0)+temporaryStrengthAmount(player,s.token.battle)-s.negativeStrength);
                if(player.storage.mengsanWeak_shuying>0)amount=Math.floor(amount*0.75);
                amount=shrinkAttackDamage(amount,player);
                if(await pile.exhaustFromHand(candidate)){
                    if(valid(player,s.token)){const source=originalOf(event);rememberGrowth(s,source,growthOf(source,s)+amount);}
                }
            }
        }
        if(r.draw){await player.draw(r.draw);if(!valid(player,s.token))return;}
        if(r.stopDraw)s.turn.noDraw=true;
        if(r.energyPerAttack){const count=player.getCards("h").filter(isAttackCard).length;if(count)battleEnergy.grant(player,count,s.token.battle);}
        if(r.stopEnergy)s.turn.noEnergy=true;
        if(r.doubleTap)add(s.turn,"doubleTap",r.doubleTap);
        if(r.grapple){s.turn.grapple||=new Map();if(valid(event.target,s.token))addMap(s.turn.grapple,event.target,r.grapple);}
        if(r.generateAttack){
            const name=randomItem(s,generationPool(cardDefinitions,["liubei"],{attacksOnly:true}));
            if(name){const card=await pile.addToHand(generatedData(s,name));if(card&&valid(player,s.token))s.freeCards.add(card);}
        }
        if(r.copies){
            const candidates=player.getCards("h").filter(c=>isAttackCard(c)||
                (cardDefinitions[c.name]?.cardType ? cardDefinitions[c.name].cardType==="power" : lib.card[c.name]?.mengsanPower_shuying));
            let chosen=candidates[0];
            if(candidates.length>1){const result=await player.chooseButton({createDialog:["双持：选择一张攻击或能力牌",candidates],forced:true,selectButton:1,ai:button=>get.value(button.link,player)}).forResult();chosen=result.links?.[0];}
            if(valid(player,s.token)&&candidates.includes(chosen)&&player.getCards("h").includes(chosen))for(let i=0;i<r.copies&&valid(player,s.token);i++)await copyToHand(s,chosen);
        }
        if(r.partyCopies)for(const participant of [...s.token.battle.players]){
            if(!valid(player,s.token))return;
            if(!valid(participant,s.token))continue;
            const targetPile=pileOf(participant,s.token);if(targetPile)targetPile.addToDiscard(generatedData(s,spec.name,event.card));
        }
        if(r.topPlays){
            const count=takeXCardUse(player,event,s.token.battle);
            if(count!==null)for(let i=0;i<count+r.xBonus&&valid(player,s.token);i++){
                const card=pile.drawTop();if(!card)break;await autoPlay(s,card,{fromDraw:true});
            }
        }
        if(r.transformAttacks)for(const card of player.getCards("h").filter(isAttackCard)){
            if(!valid(player,s.token))break;
            const data=dataOf(card);pile.transformHand(card,{...data,name:"mengsan_ic_boulder",upgrade:r.boulderUpgrade||0});
        }
        if(r.stoke){
            const candidates=player.getCards("h").slice();
            const pool=generationPool(cardDefinitions,["liubei","colorless"]);
            let count=0;
            for(const card of candidates){if(!valid(player,s.token))return;if(await pile.exhaustFromHand(card))count++;}
            for(let i=0;i<count&&valid(player,s.token);i++){
                const name=randomItem(s,pool);if(!name)break;
                await pile.addToHand(generatedData(s,name,null,r.generatedUpgrade||0));
            }
        }
        if(r.power)for(const key of powerKeys)if(r[key]){
            if(["bodyguard","autoStrike","barricade","corruption"].includes(key))s.powers[key]=1;
            else add(s.powers,key,r[key]);
        }
        await flush(s);refresh(s);
    }
    function addMap(map,key,value){const next=(map.get(key)||0)+value;if(!safe(next))throw new RangeError("擒拿数值越界");map.set(key,next);}
    async function onUse(use) {
        const s=ensure(use.player);if(!s || seenUses.has(use))return;seenUses.add(use);
        if(!isAttackCard(use.card))return;
        add(s.turn,"attacks",1);
        if(s.powers.freeAttack)s.powers.freeAttack--;
        const source=originalOf(use),snapshot={card:{name:use.card.name,suit:use.card.suit,number:use.card.number,nature:use.card.nature},data:dataOf(use.card),original:source,targets:[...(use.targets||[])]};
        if(s.turn.doubleTap&&!use.mengsanIcEcho_shuying){s.turn.doubleTap--;uses.set(use,snapshot);}
        // 第三张的副本在原牌效果之前加入手牌，复制此刻的累积数据。
        if(s.turn.attacks===3 && s.powers.juggle)for(let i=0;i<s.powers.juggle&&valid(s.player,s.token);i++)await copyToHand(s,source);
        refresh(s);
    }
    async function onUseAfter(use) {
        await flushAll();const s=stateOf(use.player),echo=uses.get(use);uses.delete(use);
        if(s&&echo&&valid(s.player,s.token))await autoPlay(s,echo.original,{echo,targets:echo.targets});
        refresh(s);
    }
    async function turnBegin(player) {
        const s=ensure(player);if(!s)return;
        s.turn=Object.create(null);s.freeCards=new WeakSet();s.autoCount=0;
        if(s.powers.plating)s.powers.plating=Math.max(0,s.powers.plating-1);
        const pile=pileOf(player,s.token);
        if(!pile)return;
        for(let i=0;i<(s.powers.retrieveAttack||0)&&valid(player,s.token);i++){
            const card=randomItem(s,pile.discardCards().filter(isAttackCard));if(!card)break;
            if(await pile.gainToHand(card)){
                if(!valid(player,s.token))break;
                const data=dataOf(card);if(canUpgradeCard(data))card.storage.mengsanCard_shuying={...data,upgrade:data.upgrade+1};
            }
        }
        refresh(s);
    }
    async function turnEnd(player) {
        const s=ensure(player);if(!s)return;
        if(s.powers.plating){await player.changeHujia(s.powers.plating);if(!valid(player,s.token))return;}
        const pile=pileOf(player,s.token);if(!pile)return;
        const howls=pile.exhaustedCards().filter(c=>rule(c)?.exhaustReplay);
        for(const card of howls){if(!valid(player,s.token))return;await autoPlay(s,card,{fromExhaust:true});}
        for(let i=0;i<(s.powers.endAttack||0)&&valid(player,s.token);i++){
            const card=randomItem(s,player.getCards("h").filter(isAttackCard));if(!card)break;await autoPlay(s,card);
        }
    }
    async function afterBlock(event) {
        if(seenBlocks.has(event)||!(event.num>0)||event.type==="damage")return;seenBlocks.add(event);
        const s=stateOf(event.player);if(!s)return;
        if(s.powers.blockDamage){const target=randomItem(s,[...s.token.battle.players].filter(t=>valid(t,s.token)&&s.player.isEnemyOf(t)));
            if(target){const damage=target.damage(s.powers.blockDamage,s.player,"nocard");damage.mengsanScriptedSkill_shuying=true;await damage;}}
        for(const [target,amount] of s.turn.grapple||[]){
            if(!valid(s.player,s.token))return;
            if(valid(target,s.token)){const damage=target.damage(amount,s.player,"nocard");damage.mengsanScriptedSkill_shuying=true;await damage;}
        }
    }
    async function onDeath(event) {
        let current=event;const visited=new Set();
        while(current&&!visited.has(current)){
            visited.add(current);const record=hits.get(current);
            if(record){
                const {s,amount}=record;
                if(record.claimed || !valid(s.player,s.token) || status.mengsanRun_shuying!==s.token.run)return;
                record.claimed=true;
                await s.player.gainMaxHp(amount);
                if(s.player===game.me && status.mengsanRun_shuying===s.token.run){
                    s.token.run.player.maxHp=s.player.maxHp;s.token.run.player.hp=s.player.hp;
                    await game.mengsanPersistRun_shuying(s.token.run);
                }
                return;
            }
            current=current.parent;
        }
    }
    const skills={
        // 本场内部状态技能：保留触发与清理，不在武将状态栏显示。
        [MARK]:{charlotte:true,mark:false,
            trigger:{source:"damageBegin1"},forced:true,silent:true,popup:false,priority:82,
            filter(event,player){return Boolean(player!==game.me && !event.mengsanScriptedSkill_shuying && stateOf(player)?.negativeStrength && (event.mengsanAttack_shuying||isAttackCard(event.card)));},
            async content(event,trigger,player){trigger.num=Math.max(0,trigger.num-stateOf(player).negativeStrength);}},
        [BRIDGE]:{trigger:{global:["useCard1","useCardAfter","cardsDiscardAfter","loseAfter","phaseBefore","phaseJieshuBegin","phaseAfter","drawAfter","changeHujiaAfter","damageBegin2"]},
            forced:true,silent:true,popup:false,priority:60,
            filter(event){const battle=getBattle();return Boolean(battle?.session.active&&belongs(event,battle.root));},
            async content(event,trigger){
                const name=event.triggername;
                if(name==="useCard1")await onUse(trigger);
                else if(name==="useCardAfter")await onUseAfter(trigger);
                else if(name==="phaseBefore")await turnBegin(trigger.player);
                else if(name==="phaseJieshuBegin")await turnEnd(trigger.player);
                else if(name==="phaseAfter"){
                    for(const player of getBattle().players){const s=stateOf(player);if(s){s.negativeStrength=0;s.freeCards=new WeakSet();s.turn=Object.create(null);refresh(s);}}
                } else if(name==="drawAfter"){
                    if(!seenDraws.has(trigger)&&!trigger.mengsanIcDrawHandled_shuying){seenDraws.add(trigger);await afterDraw(ensure(trigger.player),trigger.result?.cards||[]);}
                } else if(name==="changeHujiaAfter")await afterBlock(trigger);
                else if(name==="damageBegin2" && (trigger.mengsanAttack_shuying||isAttackCard(trigger.card))){
                    let multiplier=1;
                    for(const holder of getBattle().players){const s=stateOf(holder);if(s?.powers.bodyguard&&valid(holder,s.token)&&holder.isFriendOf(trigger.player)&&holder.isEnemyOf(trigger.source))
                        multiplier*=holder===trigger.player?2:0.5;}
                    if(multiplier!==1)trigger.num=Math.floor(trigger.num*multiplier);
                } else await flushAll();
            }},
    };
    const describe=(spec,card)=>{
        const r=cardUpgradeLevel(card)?spec.upgraded:spec.base,parts=[];
        if(r.damage)parts.push(`对${r.all?"所有敌人":"一名敌人"}造成${r.damage+(r.absorbAttack?growthOf(card):0)}点伤害${r.hits?`${r.hits}次`:""}。`);
        if(r.nextFreeAttack)parts.push("下一张攻击牌费用变为0。");
        if(r.exhaustReplay)parts.push("回合结束时，此牌在消耗牌堆中则免费打出。");
        if(r.attackDiscount)parts.push("本回合每打出一张攻击牌，费用减少1。");
        if(r.draw)parts.push(`抽${r.draw}张牌。`);
        if(r.stopDraw)parts.push("本回合不能再抽牌。");
        if(r.generateAttack)parts.push("随机生成一张铁甲战士攻击牌至手牌，本回合费用为0。");
        if(r.exhaustEnergy)parts.push(`被消耗时获得${r.exhaustEnergy}费用。`);
        if(r.energyPerAttack)parts.push("每张攻击手牌获得1费用。");
        if(r.stopEnergy)parts.push("本回合不能再获得费用。");
        if(r.exhaustBlock)parts.push(`每张牌被消耗时获得${r.exhaustBlock}点格挡。`);
        if(r.exhaustDraw)parts.push(`每张牌被消耗时抽${r.exhaustDraw}张牌。`);
        if(r.vulnerableDraw)parts.push(`每次成功施加易伤抽${r.vulnerableDraw}张牌。`);
        if(r.plating)parts.push(`获得${r.plating}层覆甲：回合末获得等量格挡，下个自身回合开始减少1层。`);
        if(r.juggle)parts.push("每个自身回合的第三张攻击牌复制一张至手牌。");
        if(r.innate)parts.push("固有。");
        if(r.endAttack)parts.push("回合结束时，随机免费打出一张攻击手牌，目标随机。");
        if(r.feed)parts.push(`斩杀敌人时永久增加${r.feed}点最大生命。`);
        if(r.absorbAttack)parts.push("消耗随机一张攻击手牌，将其当前伤害（计入你的力量及攻击减益）累积给此牌，本场战斗保留。");
        if(r.negativeStrength)parts.push(`目标本回合失去${r.negativeStrength}点力量。`);
        if(r.topPlays)parts.push(`免费打出抽牌堆顶的X${r.xBonus?"+1":""}张牌。`);
        if(r.transformAttacks)parts.push(`所有攻击手牌变为巨石${r.boulderUpgrade?"+":""}，仅本场战斗。`);
        if(r.doubleTap)parts.push(`本回合接下来的${r.doubleTap}张攻击牌额外打出一次。`);
        if(r.stoke)parts.push(`消耗所有手牌，每张随机生成一张${r.generatedUpgrade?"已强化":""}铁甲战士或无色牌至手牌。`);
        if(r.retrieveAttack)parts.push("自身回合开始，从弃牌堆随机获得一张攻击牌并强化。");
        if(r.bodyguard)parts.push("你承受敌人双倍伤害，敌人对其他友方的伤害减半。");
        if(r.autoStrike)parts.push("抽到【杀】或名称含“打击”的攻击牌时，免费向随机敌人打出。");
        if(r.firstBlock)parts.push("每个自身回合首张获得格挡的卡牌，其获得的格挡翻倍；叠加时增加可翻倍的牌数。");
        if(r.blockDamage)parts.push(`每次获得格挡，对随机敌人造成${r.blockDamage}点非攻击伤害。`);
        if(r.barricade)parts.push("自身回合开始时不清空格挡。");
        if(r.copies)parts.push(`选择一张攻击或能力手牌，复制${r.copies}张至手牌。`);
        if(r.corruption)parts.push("技能牌费用变为0，打出后被消耗。");
        if(r.exhaustDiscount)parts.push("本场任意角色每消耗一张牌，费用减少1。");
        if(r.partyCopies)parts.push("在所有存活角色的个人弃牌堆加入此牌副本。");
        if(r.grapple)parts.push(`本回合每次获得格挡，对此目标造成${r.grapple}点非攻击伤害。`);
        if(r.exhaust)parts.push("消耗。");
        if(r.power)parts.push("能力持续本场战斗，打出后退出牌堆。");
        return `梦三：主动使用消耗${spec.cost==="X"?"X":cardCost(card||{name:spec.name})}费用。`+parts.join("");
    };
    return {ensure,play,describe,skills,flushAll,baseDamage,onDeath};
}
