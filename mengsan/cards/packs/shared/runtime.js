import { sharedCards, sharedByName } from "./data.js";
import { cardDefinitions } from "../../card-definitions.js";
import { witherDamage } from "../../wither-card.js";
import { hasCardAffix } from "../../intrinsic-affixes.js";
import { createCardData } from "../../card-data.js";
import { cardUpgradeLevel, cardUpgradeRule, canUpgradeCard } from "../../upgrades.js";
import { generationPool } from "../../card-pools.js";
import { cardPackCosts } from "../data.js";
import { ironcladStrengthPenalty } from "../../ironclad-hooks.js";
import { installSharedHookResolver } from "../../shared-hooks.js";
import { isAttackCard } from "../../../monsters/vine-tangled.js";
import { applyMengsanDebuff, consumeArtifact } from "../../../monsters/artifact-status.js";
import { isStunned } from "../../../battle/stun-intent.js";
import { canPayCard, isActiveCardUse, authorizeFreeCardUse, takeXCardUse, cardCost } from "../../../battle/combat-rules.js";
import { grantGold } from "../../../relics/progression.js";

const BRIDGE="mengsan_shared_bridge_shuying", RULES="mengsan_shared_rules_shuying", END="mengsan_shared_end_shuying", LIMIT="mengsan_shared_limit_shuying", AFTER="mengsan_shared_after_shuying";
const safe=n=>Number.isSafeInteger(n) && n>=0;
function belongs(event,root) {
    const seen=new Set();
    for(let e=event;e&&!seen.has(e);e=e.parent){if(e===root)return true;seen.add(e);}
    return false;
}
function nearestUse(event) {
    const seen=new Set();
    for(let e=event;e&&!seen.has(e);e=e.parent){if(e.name==="useCard")return e;seen.add(e);}
    return null;
}
const physical=card=>card?.cards?.length===1 && card.cards[0]?.name===card.name ? card.cards[0] : card;
const rule=card=>{const c=sharedByName[card?.name];return c ? cardUpgradeLevel(card) && c.upgraded ? c.upgraded : c.base : null;};

export function createSharedCardRuntime({game,get,lib,status,getBattle,battleEnergy,temporaryStrength,random}) {
    const states=new WeakMap(), uses=new WeakMap(), replays=new WeakMap(), costCaps=new WeakMap(), ballBonuses=new WeakMap();
    const seenUses=new WeakSet(), seenDraws=new WeakSet(), seenEnds=new WeakSet(), kills=new WeakMap();
    const tokenOf=player=>{
        const b=getBattle();
        return b?.session?.active && b.root && b.players?.has(player) && player?.isAlive?.()
            ? {battle:b,session:b.session,root:b.root,run:status.mengsanRun_shuying} : null;
    };
    const valid=(player,t)=>Boolean(t && getBattle()===t.battle && t.session.active &&
        t.battle.session===t.session && t.battle.root===t.root && t.battle.players.has(player) && player?.isAlive?.());
    const pileOf=s=>s.player===game.me ? s.token.battle.personalPiles : s.token.battle.monsterPiles?.get(s.player);
    const stateOf=player=>{const s=states.get(player);return s&&valid(player,s.token)?s:null;};
    const add=(o,k,n)=>{const next=(o[k]||0)+n;if(!safe(next))throw new RangeError("通用牌数值越界");o[k]=next;};
    const friends=s=>[...s.token.battle.players].filter(p=>valid(p,s.token) && (p===s.player || s.player.isFriendOf(p)));
    const enemies=s=>[...s.token.battle.players].filter(p=>valid(p,s.token) && p!==s.player && s.player.isEnemyOf(p));
    const refresh=s=>{if(valid(s.player,s.token)){s.token.battle.handUI?.refresh();s.token.battle.pilesUI?.refresh();}};
    function ensure(player) {
        const token=tokenOf(player);if(!token)return null;
        let s=stateOf(player);if(s)return s;
        s={player,token,powers:Object.create(null),turn:Object.create(null),freeTurn:new WeakSet(),freeBattle:new WeakSet(),
            nextTurn:[],bombs:[],negativeStrength:0,autoCount:0,drawCount:0,returns:[],maulBonus:0,vigor:0,queuedAllyEnergy:0};
        states.set(player,s);player.addSkill(RULES);
        token.session.ownResource(s,()=>{if(states.get(player)===s){states.delete(player);player.removeSkill(RULES);s.nextTurn.length=0;s.returns.length=0;}});
        return s;
    }
    const rand=(s,list)=>{
        if(!list.length)return null;
        const v=random(s.token.run);if(!Number.isFinite(v)||v<0||v>=1)throw new RangeError("通用牌随机数无效");
        return list[Math.floor(v*list.length)];
    };
    function sample(s,list,n) {
        const bag=list.slice(),out=[];
        while(bag.length && out.length<n){const item=rand(s,bag);out.push(item);bag.splice(bag.indexOf(item),1);}
        return out;
    }
    function pool(s,type=null,onlyColorless=false) {
        const ownDecks=Object.values(cardDefinitions).filter(c=>c.owner===s.token.run?.player?.character).map(c=>c.deck);
        const names=generationPool(cardDefinitions,onlyColorless?["colorless"]:[...new Set(ownDecks),"colorless"]);
        return names.filter(name=>(!type || cardDefinitions[name].cardType===type) && lib.card[name]);
    }
    function generated(s,name,upgrade=0) {
        const b=s.token.battle,n=(b.generatedCardSerial||0)+1;if(!safe(n))throw new RangeError("生成牌序号越界");b.generatedCardSerial=n;
        return createCardData({id:`mengsan_generated_${s.token.session.id}_${n}`,name,suit:"spade",number:1,nature:null,affixes:[],
            upgrade:Math.min(upgrade,cardUpgradeRule(name)?.maxLevel||0)},{enemy:true});
    }
    async function generateHand(s,name,{upgrade=0,free=false}={}) {
        if(!valid(s.player,s.token)||!name)return null;
        const c=await pileOf(s)?.addToHand(generated(s,name,upgrade));
        if(c && valid(s.player,s.token) && free)s.freeTurn.add(c);
        refresh(s);return c;
    }
    async function choose(s,list,prompt,{max=1,optional=false}={}) {
        if(!valid(s.player,s.token)||!list.length)return [];
        const count=Math.min(max,list.length);
        const answer=await s.player.chooseButton({createDialog:[prompt,list],forced:!optional,selectButton:optional?[0,count]:[1,count],
            ai:button=>typeof button.link==="string" ? 1 : get.value(button.link,s.player)}).forResult();
        if(!valid(s.player,s.token))return [];
        return [...new Set(answer.links||[])].filter(c=>list.includes(c)).slice(0,count);
    }
    async function chooseGenerated(s,{type=null,upgrade=0}={}) {
        const names=sample(s,pool(s,type),3);
        // Native virtual-card buttons preserve Chinese title and the registered card image.
        const buttons=names.map(name=>["", "", name]);
        if(!buttons.length)return;
        const result=await s.player.chooseButton({createDialog:["选择一张牌加入手牌",[buttons,"vcard"]],forced:true,selectButton:1,
            ai:button=>get.value({name:button.link[2]},s.player)}).forResult();
        if(!valid(s.player,s.token))return;
        const name=result.links?.[0]?.[2];if(names.includes(name))await generateHand(s,name,{upgrade,free:true});
    }
    function strength(s,player,n) {
        if(!valid(player,s.token)||!safe(n))return;
        const next=(player.storage.mengsanStrength_shuying||0)+n;if(!safe(next))throw new RangeError("力量数值越界");
        player.storage.mengsanStrength_shuying=next;player.addSkill("mengsan_raider_strength_shuying");player.markSkill("mengsan_raider_strength_shuying");
    }
    async function hit(s,target,n,card=null,attack=false) {
        if(!safe(n))throw new RangeError("通用牌伤害无效");
        if(!n||!valid(s.player,s.token)||!valid(target,s.token)||!s.player.isEnemyOf(target))return 0;
        const e=target.damage(n,s.player);if(card)e.card=card;if(attack)e.mengsanAttack_shuying=true;
        const gold=rule(card)?.killGold;if(gold)kills.set(e,{s,target,gold,claimed:false});
        // Fisticuffs' detail page explicitly includes damage absorbed by the target's block.
        await e;return e._cancelled?0:Math.max(0,e.num||0);
    }
    async function hitAll(s,n) {for(const t of enemies(s)){if(!valid(s.player,s.token))break;await hit(s,t,n);}}
    function origin(event) {const use=nearestUse(event);return use?.mengsanSharedOriginal_shuying || use?.mengsanIcRepeatOriginal_shuying || use?.cards?.find(c=>c.name===use.card?.name) || physical(event.card);}
    function ballBonus(s,card) {
        const c=physical(card),entry=ballBonuses.get(c),data=c?.storage?.mengsanCard_shuying||c;
        return entry?.session===s.token.session ? entry.amount : data?.ballSession===s.token.session.id&&safe(data.ballBonus) ? data.ballBonus : 0;
    }
    function snapshot(use) {
        const original=origin(use),data=original?.storage?.mengsanCard_shuying || {};
        return {original,card:{name:use.card.name,suit:use.card.suit,number:use.card.number,nature:use.card.nature},
            data:{...data,name:use.card.name,upgrade:cardUpgradeLevel(use.card),affixes:[...(data.affixes||[])]},targets:[...(use.targets||[])]};
    }
    async function autoPlay(s,card,{echo=null,targets=null}={}) {
        if(!valid(s.player,s.token))return false;
        if(++s.autoCount>1024)throw new Error("通用牌自动结算超过安全上限");
        const pile=pileOf(s),info=lib.card[card?.name];
        const movable=!echo && (pile?.drawCards().includes(card)||pile?.discardCards().includes(card));
        const skip=()=>{if(movable&&pile.beginAutoPlay(card))pile.finishAutoPlay(card);return false;};
        if(!info || info.enable===false || hasCardAffix(card,"unplayable"))return skip();
        let selected=info.notarget?[]:targets?.filter(t=>valid(t,s.token) &&
            (typeof info.filterTarget!=="function" || info.filterTarget(card,s.player,t)));
        if(!selected){
            const candidates=[...s.token.battle.players].filter(t=>valid(t,s.token) &&
                (typeof info.filterTarget!=="function" || info.filterTarget(card,s.player,t)));
            selected=info.toself?[s.player]:info.selectTarget===-1?candidates:[rand(s,candidates)].filter(Boolean);
        }
        if(!selected.length&&!info.notarget)return skip();
        if(movable&&!pile.beginAutoPlay(card))return false;
        let release=()=>{};
        try {
            const played=echo?{...echo.card,storage:{mengsanCard_shuying:{...echo.data,affixes:echo.data.affixes.slice()}}}:card;
            const use=s.player.useCard({card:played,cards:echo?[]:[card],targets:selected,addCount:false});
            use.mengsanSharedAuto_shuying=true;use.addCount=false;
            if(echo){use.mengsanSharedEcho_shuying=true;use.mengsanSharedOriginal_shuying=echo.original;}
            release=authorizeFreeCardUse(s.player,use.card,use,()=>valid(s.player,s.token));
            use.oncard=()=>{if(!valid(s.player,s.token)||!lib.filter.cardEnabled(use.card,s.player)||selected.some(t=>!s.player.canUse(use.card,t,false)))use.cancel();};
            await use;return !use._cancelled;
        } finally {release();if(movable)pile.finishAutoPlay(card);}
    }
    function debitGold(s,n) {
        if(s.player!==game.me || !safe(s.token.run?.player?.gold))return;
        s.token.run.player.gold=Math.max(0,s.token.run.player.gold-n);
    }
    async function afterDraw(s,cards) {
        if(!valid(s.player,s.token))return;
        for(const c of cards||[])if(sharedByName[c.name]?.id==="void"){
            s.player.storage.mengsanEnergy_shuying=Math.max(0,(s.player.storage.mengsanEnergy_shuying||0)-1);
        }
        if(s.powers.automation){
            const n=s.drawCount+(cards?.length||0),gained=Math.floor(n/10);s.drawCount=n%10;
            if(gained)battleEnergy.grant(s.player,gained*s.powers.automation,s.token.battle);
        }
        refresh(s);
    }
    function cost(s,card,amount) {
        const c=physical(card),cap=costCaps.get(c);
        if(cap?.session===s.token.session && (cap.permanent || cap.turn===s.turn))amount=Math.min(amount,1);
        if(cardDefinitions[card?.name]?.cardType==="power")amount=Math.max(0,amount-(s.powers.powerDiscount||0));
        return amount;
    }
    function cardBlock(s,n,event) {
        if(!(n>0))return n;
        // Stop at an explicit skill boundary so powers/relics cannot borrow an outer card's source.
        const seen=new Set();
        for(let e=event;e&&!seen.has(e);e=e.parent){
            seen.add(e);if(e.skill || lib.skill[e.name])return n;
            if(e.name==="useCard" && e.player===s.player){
                if(s.powers.noCardBlock>0)return 0;
                const title=lib.translate[e.card?.name]||"";
                return n+(s.powers.dexterity||0)+(title.includes("防御")?(s.powers.defendBonus||0):0);
            }
        }
        return n;
    }
    installSharedHookResolver(player=>{
        const s=ensure(player);if(!s)return null;
        return {isFree:card=>s.freeTurn.has(physical(card))||s.freeBattle.has(physical(card)),cost:(card,n)=>cost(s,card,n),
            strengthPenalty:()=>s.negativeStrength,blockAmount:(n,e)=>cardBlock(s,n,e),afterDraw:cards=>afterDraw(s,cards),
            snapshotCard:card=>sharedByName[card.name]?.id==="the_ball"?{ballBonus:ballBonus(s,card),ballSession:s.token.session.id}:{},
            copyCard(source,target){
                if(sharedByName[source.name]?.id==="the_ball"&&target.name===source.name)ballBonuses.set(target,{session:s.token.session,amount:ballBonus(s,source)});
                if(s.freeBattle.has(source))s.freeBattle.add(target);
                const cap=costCaps.get(source);if(cap?.session===s.token.session&&cap.permanent)costCaps.set(target,{...cap});
            }};
    });

    async function play(spec,event,player) {
        const s=ensure(player);if(!s || !belongs(event,s.token.root))return;
        const r=rule(event.card),id=spec.id,target=event.target,pile=pileOf(s),original=origin(event);
        if(!r)return;
        if(r.damage!==undefined || ["mind_blast","gold_axe","volley"].includes(id)){
            let amount=r.damage||0;
            if(id==="mind_blast")amount=pile?.drawCards().length||0;
            if(id==="gold_axe")amount=s.token.battle.sharedCardUses||0;
            if(id==="gang_up")amount+=r.perAllyAttack*(s.token.battle.sharedAttackRecords||[]).filter(x=>x.turn===status.currentPhase&&x.source!==player&&player.isFriendOf(x.source)&&x.targets.includes(target)).length;
            if(id==="rend"){
                const bad=["mengsanVulnerable_shuying","mengsanWeak_shuying","mengsanFrail_shuying","mengsanTangled_shuying","mengsanShrink_shuying","mengsanConstrict_shuying"];
                let kinds=bad.filter(k=>target?.storage?.[k]>0).length+(ironcladStrengthPenalty(target)>0?1:0)+(isStunned(target)?1:0);
                if(s.token.battle.sharedKnockdowns?.some(mark=>mark.target===target&&valid(mark.owner,s.token)))kinds++;
                if([...s.token.battle.players].some(p=>stateOf(p)?.turn.choking?.has(target)))kinds++;
                amount+=r.perDebuff*kinds;
            }
            if(id==="maul")amount+=s.maulBonus;
            if(id==="the_ball")amount+=ballBonus(s,original);
            let count=r.hits||1;if(id==="volley")count=takeXCardUse(player,event,s.token.battle)??0;
            let actual=0;
            for(let i=0;i<count && valid(player,s.token);i++){
                const selected=id==="volley"?[rand(s,enemies(s))].filter(Boolean):r.all?enemies(s):[target];
                for(const t of selected){actual+=await hit(s,t,amount,event.card,true);if(!valid(player,s.token))return;}
            }
            // Detail page: the equal splash directly deals non-attack damage; no strength/weak/vulnerable reapplication.
            if(id==="omnislice")for(const t of enemies(s).filter(t=>t!==target))await hit(s,t,actual);
            if(id==="fisticuffs"&&actual>0&&valid(player,s.token))await player.changeHujia(actual);
            if(id==="maul")add(s,"maulBonus",r.maulGrowth);
            if(id==="the_ball"&&valid(player,s.token)){
                const next=ballBonus(s,original)+r.ballGrowth;if(!safe(next))throw new RangeError("魔球伤害数值越界");
                ballBonuses.set(original,{session:s.token.session,amount:next});
                const use=nearestUse(event),entry=uses.get(use);
                if(entry&&!use.mengsanSharedEcho_shuying&&!use.mengsanIcEcho_shuying)entry.ballHandoff=true;
            }
        }
        if(!valid(player,s.token))return;
        if(r.block)await player.changeHujia(r.block);
        if(!valid(player,s.token))return;
        if(r.energy)battleEnergy.grant(player,r.energy,s.token.battle);
        if(r.draw)await player.draw(r.draw);
        if(!valid(player,s.token))return;
        for(const t of r.all?enemies(s):[target])if(valid(t,s.token)){
            if(r.weak)applyMengsanDebuff(t,"weak",r.weak,player);
            if(r.vulnerable)applyMengsanDebuff(t,"vulnerable",r.vulnerable,player);
        }
        if(r.strength)strength(s,player,r.strength);
        if(r.dexterity)add(s.powers,"dexterity",r.dexterity);
        if(r.temporaryStrength)temporaryStrength.grant(player,r.temporaryStrength,event,s.token.battle);
        if(r.negativeStrength && valid(target,s.token) && !consumeArtifact(target))add(ensure(target),"negativeStrength",r.negativeStrength);
        if(r.allyBlock && valid(target,s.token))await target.changeHujia(r.allyBlock);
        if(r.allyEnergy && valid(target,s.token)){
            // Each actor restores energy on its own turn; keep an off-turn gift until that restoration finishes.
            if(status.currentPhase===target)battleEnergy.grant(target,r.allyEnergy,s.token.battle);
            else add(ensure(target),"queuedAllyEnergy",r.allyEnergy);
        }
        if(r.teamStrength)for(const p of friends(s).filter(p=>p!==player))temporaryStrength.grant(p,r.teamStrength,event,s.token.battle,{ownTurn:true});
        if(r.teamDraw)for(const p of friends(s)){if(!valid(player,s.token))return;await p.draw(r.teamDraw);}
        if(r.teamBlock)for(const p of friends(s)){if(!valid(player,s.token))return;await p.changeHujia(r.teamBlock);}
        if(id==="impatience" && !player.getCards("h").some(isAttackCard))await player.draw(r.conditionalDraw);
        if(id==="restlessness" && !player.getCards("h").length){await player.draw(r.emptyDraw);if(valid(player,s.token))battleEnergy.grant(player,r.emptyEnergy,s.token.battle);}
        if(r.chooseExhaust){
            const selected=await choose(s,player.getCards("h"),"净化：选择要消耗的手牌",{max:r.chooseExhaust,optional:true});
            for(const c of selected){if(!valid(player,s.token))return;await pile?.exhaustFromHand(c);}
        }
        if(id==="thinking_ahead"){
            const [c]=await choose(s,player.getCards("h"),"深谋远虑：将一张手牌放回堆顶");
            if(c)await pile?.moveHandToTop(c);
        }
        if(id==="seeker_strike" || ["secret_technique","secret_weapon","wish"].includes(id)){
            let list=pile?.drawCards()||[];
            if(id==="seeker_strike")list=sample(s,list,3);
            if(id==="secret_technique")list=list.filter(c=>cardDefinitions[c.name]?.cardType==="skill");
            if(id==="secret_weapon")list=list.filter(isAttackCard);
            const [c]=await choose(s,list,"选择抽牌堆中的一张牌加入手牌");if(c)await pile?.gainFromDraw(c);
        }
        if(r.chooseDiscard){
            const selected=await choose(s,pile?.discardCards()||[],"涅奥之怒：取回至多指定数量的牌",{max:r.chooseDiscard,optional:true});
            for(const c of selected){if(!valid(player,s.token))return;await pile?.gainToHand(c);}
        }
        if(id==="anointed")for(const c of pile?.drawCards().filter(c=>cardDefinitions[c.name]?.rarity==="rare")||[]){if(!valid(player,s.token))return;await pile.gainFromDraw(c);}
        if(id==="scrawl"){
            const limit=player.getHandcardLimit(),count=Math.max(0,limit-player.countCards("h"));
            if(safe(count)&&count)await player.draw(count);
        }
        if(id==="mimic"&&valid(target,s.token)&&target.hujia>0)await player.changeHujia(target.hujia);
        if(r.generate)for(let i=0;i<r.generate&&valid(player,s.token);i++)await generateHand(s,rand(s,pool(s,null,true)));
        if(id==="discovery")await chooseGenerated(s);
        if(id==="abundance")await chooseGenerated(s,{type:"power",upgrade:r.generatedUpgrade||0});
        if(id==="mad_science-chaos")await generateHand(s,rand(s,pool(s)),{free:true});
        if(r.generateZero){
            const names=pool(s).filter(name=>{
                // Jackpot+ upgrades the result, but its pool still requires a zero-cost base card.
                return cardPackCosts[name]===0;
            });
            for(let i=0;i<r.generateZero&&valid(player,s.token);i++)await generateHand(s,rand(s,names),{upgrade:r.generatedUpgrade||0});
        }
        if(r.generateDrawAttacks)for(let i=0;i<r.generateDrawAttacks&&valid(player,s.token);i++){
            const name=rand(s,pool(s,"attack"));if(!name)break;
            const c=pile?.addToDraw(generated(s,name),Math.floor(random(s.token.run)*((pile?.drawCards().length||0)+1)));
            if(c)s.freeBattle.add(c);
        }
        if(r.autoDraw)for(let i=0;i<r.autoDraw&&valid(player,s.token);i++){const c=rand(s,pile?.drawCards()||[]);if(!c)break;await autoPlay(s,c);}
        if(r.autoDiscard)for(const c of sample(s,(pile?.discardCards()||[]).filter(isAttackCard),r.autoDiscard)){if(!valid(player,s.token))return;await autoPlay(s,c);}
        if(r.replay){const c=rand(s,(pile?.drawCards()||[]).filter(c=>!replays.has(c)));if(c)replays.set(c,{session:s.token.session,count:r.replay});}
        if(id==="thrumming_hatchet"||id==="bolas")s.returns.push(original);
        if(id==="prolong")s.nextTurn.push({block:Math.max(0,player.hujia||0)});
        if(r.futureBlock)s.nextTurn.push({block:r.futureBlock,remaining:r.futureTurns});
        if(r.nextDraw||r.nextEnergy)s.nextTurn.push({draw:r.nextDraw,energy:r.nextEnergy});
        if(id==="panic_button"&&!consumeArtifact(player))s.powers.noCardBlock=2;
        if(id==="equilibrium"||id==="salvo")s.turn.retain=true;
        if(r.bombDamage)s.bombs.push({turns:3,damage:r.bombDamage});
        if(r.intangible)add(s.powers,"intangible",r.intangible);
        if(id==="the_gambit")s.powers.gambit=true;
        if(id==="enlightenment")for(const c of player.getCards("h"))costCaps.set(c,{session:s.token.session,permanent:cardUpgradeLevel(event.card)>0,turn:s.turn});
        if(id==="brightest_flame"){
            // The detail page applies full-health HP loss before reducing the maximum.
            if(player.hp===player.maxHp)await player.loseHp(1);
            if(!valid(player,s.token))return;
            await player.loseMaxHp(1);
            if(player===game.me && safe(player.maxHp))s.token.run.player.maxHp=player.maxHp;
        }
        if(id==="apotheosis"){
            for(const c of pile?.battleCards(event.cards||[])||[]){
                const d=c.storage?.mengsanCard_shuying;if(d&&canUpgradeCard(d))d.upgrade=(d.upgrade||0)+1;
            }
            // Exhausted cards keep real nodes; refresh their serialized viewer data after upgrading them.
            pile?.syncExhaustSnapshots();
        }
        if(id==="deprecated_card"&&player===game.me){const cid=original?.storage?.mengsanCard_shuying?.id;s.token.run.player.deck=s.token.run.player.deck.filter(c=>c.id!==cid);}
        if(id==="whistle"&&valid(target,s.token))game.mengsanStunEnemy_shuying(target);
        if(id==="tag_team"&&valid(target,s.token)){s.token.battle.sharedTags||=[];s.token.battle.sharedTags.push({owner:player,target});}
        if(r.allyDamageMultiplier&&valid(target,s.token)&&!consumeArtifact(target)){s.token.battle.sharedKnockdowns||=[];s.token.battle.sharedKnockdowns.push({owner:player,target,multiplier:r.allyDamageMultiplier});}
        if(id==="intercept"&&valid(target,s.token))s.turn.intercept=target;
        if(r.choking&&valid(target,s.token)&&!consumeArtifact(target)){s.turn.choking||=new Map();s.turn.choking.set(target,(s.turn.choking.get(target)||0)+r.choking);}
        if(spec.cardType==="power"){
            for(const k of ["panache","defendBonus","turnVigor","automation","powerDiscount","plating"])if(r[k])add(s.powers,k,r[k]);
            if(r.boulder)add(s.powers,"boulder",r.boulder);
            for(const k of ["nostalgia","entropy","beacon_of_hope","mayhem","calamity"])if(id===k)add(s.powers,k,1);
            if(r.battleUpgrade && player===game.me){const run=s.token.run;run.sharedBattleCardEffects||={upgrades:0};add(run.sharedBattleCardEffects,"upgrades",r.battleUpgrade);}
        }
        refresh(s);
    }

    async function onUse(use) {
        const s=ensure(use.player);if(!s || seenUses.has(use))return;seenUses.add(use);
        const b=s.token.battle,entry={s,snapshot:snapshot(use),vigor:0,echoes:[]};uses.set(use,entry);
        b.sharedPendingUses||=new Set();b.sharedPendingUses.add(use);
        // Death can omit useCardAfter/Cancelled while the native use event still
        // drains its after queue. Release only this use's entry after that unwind;
        // onUseAfter is idempotent and ignores effects owned by a dead player.
        use.insertAfter(async () => {
            await onUseAfter(use);
        }, { forceDie: true });
        if(game.me.isFriendOf(s.player))b.sharedCardUses=(b.sharedCardUses||0)+1;
        if(isAttackCard(use.card)){
            b.sharedAttackRecords||=[];entry.attackRecord={turn:status.currentPhase,source:s.player,targets:(use.targets||[]).filter(t=>valid(t,s.token)&&s.player.isEnemyOf(t))};b.sharedAttackRecords.push(entry.attackRecord);
            entry.vigor=s.vigor;s.vigor=0;
            if(s.powers.calamity)for(let i=0;i<s.powers.calamity && valid(s.player,s.token);i++)await generateHand(s,rand(s,pool(s,"attack")));
        }
        if(isActiveCardUse(use,s.player))add(s.turn,"plays",1);
        if(s.powers.panache){
            add(s.turn,"panachePlays",1);
            if(s.turn.panachePlays%5===0)await hitAll(s,s.powers.panache);
        }
        if(s.turn.choking)for(const [target,n] of s.turn.choking){if(valid(s.player,s.token)&&valid(target,s.token))await target.loseHp(n);}
        if(!use.mengsanSharedEcho_shuying){
            const replay=replays.get(entry.snapshot.original);
            if(replay?.session===s.token.session)for(let i=0;i<replay.count;i++)entry.echoes.push(entry.snapshot.targets);
            if(isAttackCard(use.card)){
                const consumed=[];
                for(const tag of b.sharedTags||[])if(tag.owner!==s.player && s.player.isFriendOf(tag.owner) && valid(tag.target,s.token)){
                    entry.echoes.push([tag.target]);consumed.push(tag);
                }
                b.sharedTags=(b.sharedTags||[]).filter(t=>!consumed.includes(t));
            }
        }
        if(s.powers.nostalgia && (s.turn.nostalgia||0)<s.powers.nostalgia && !use.mengsanSharedEcho_shuying &&
            ["attack","skill"].includes(cardDefinitions[use.card?.name]?.cardType)){
            add(s.turn,"nostalgia",1);entry.returnTop=true;
        }
    }
    async function onUseAfter(use) {
        const entry=uses.get(use);if(!entry)return;
        uses.delete(use);const {s}=entry,b=s.token.battle;
        try {
            if(valid(s.player,s.token) && !use._cancelled){
                for(const targets of entry.echoes){if(!valid(s.player,s.token))break;await autoPlay(s,entry.snapshot.original,{echo:entry.snapshot,targets});}
                if(entry.returnTop && valid(s.player,s.token))pileOf(s)?.moveDiscardToTop(entry.snapshot.original);
                if(entry.ballHandoff && valid(s.player,s.token)){
                    const card=entry.snapshot.original,source=pileOf(s),recipients=friends(s).filter(p=>p!==s.player).map(ensure)
                        .filter(other=>pileOf(other)?.canReceiveTransfer(card,s.token.session));
                    const recipient=rand(s,recipients);
                    if(recipient){
                        const turnFree=s.freeTurn.has(card),battleFree=s.freeBattle.has(card);
                        if(await source?.transferTo(card,pileOf(recipient))){
                            if(turnFree)recipient.freeTurn.add(card);if(battleFree)recipient.freeBattle.add(card);
                            refresh(recipient);
                        }
                    }
                }
            }
        } finally {
            b.sharedPendingUses?.delete(use);
            if(getBattle()===b && b.session.active && !b.sharedPendingUses?.size){
                if(b.sharedDeferredVictory && game.me?.isAlive()){b.sharedDeferredVictory=false;game.mengsanFinishBattle_shuying();}
                else game.checkResult();
            }
        }
    }
    async function turnStart(player) {
        const s=ensure(player);if(!s)return;
        s.turn=Object.create(null);s.freeTurn=new WeakSet();s.autoCount=0;
        if(s.queuedAllyEnergy){battleEnergy.grant(player,s.queuedAllyEnergy,s.token.battle);s.queuedAllyEnergy=0;}
        if(s.powers.plating)s.powers.plating=Math.max(0,s.powers.plating-1);
        if(s.powers.intangible)s.powers.intangible=Math.max(0,s.powers.intangible-1);
        add(s,"vigor",s.powers.turnVigor||0);
        s.token.battle.sharedKnockdowns=(s.token.battle.sharedKnockdowns||[]).filter(e=>e.owner!==player);
        const next=s.nextTurn.splice(0);
        for(const e of next){
            if(!valid(player,s.token))return;
            if(e.block)await player.changeHujia(e.block);
            if(!valid(player,s.token))return;
            if(e.draw)await player.draw(e.draw);
            if(!valid(player,s.token))return;
            if(e.energy)battleEnergy.grant(player,e.energy,s.token.battle);
            if(e.remaining>1)s.nextTurn.push({...e,remaining:e.remaining-1});
        }
        for(const c of s.returns.splice(0)){if(!valid(player,s.token))return;await pileOf(s)?.returnToHand(c);}
        if(s.powers.boulder){
            if(!valid(player,s.token))return;
            await hitAll(s,s.powers.boulder);add(s.powers,"boulder",5);
        }
        if(s.powers.entropy && pileOf(s))for(let i=0;i<s.powers.entropy && valid(player,s.token);i++){
            const [c]=await choose(s,player.getCards("h").filter(c=>!hasCardAffix(c,"eternal")),"熵：选择变化一张手牌");
            if(c && player.getCards("h").includes(c)){
                const name=rand(s,pool(s).filter(name=>name!==c.name));
                if(name)pileOf(s).transformHand(c,generated(s,name));
            }
        }
        refresh(s);
    }
    async function afterDrawPhase(player) {
        const s=stateOf(player);if(!s?.powers.mayhem)return;
        for(let i=0;i<s.powers.mayhem&&valid(player,s.token);i++){
            const c=pileOf(s)?.drawTop();if(!c)break;await autoPlay(s,c);
        }
    }
    async function handEnd(phase) {
        if(seenEnds.has(phase))return;seenEnds.add(phase);
        const s=ensure(phase.player);if(!s)return;
        // Snapshot before ethereal removal and ordinary discards; resolve each held copy separately.
        const hand=s.player.getCards("h").slice(),count=hand.length;
        for(const c of hand){
            if(!valid(s.player,s.token))return;
            if(!s.player.getCards("h").includes(c))continue;
            const spec=sharedByName[c.name],r=rule(c);if(!spec||!r||spec.id==="infection")continue;
            const damage=spec.id==="wither"?witherDamage(c):r.endDamage;
            if(damage){const e=s.player.damage(damage,"nosource");e.mengsanSharedHandDamage_shuying=true;await e;}
            if(!valid(s.player,s.token))return;
            if(r.endLoseHp)await s.player.loseHp(r.endLoseHp);
            if(!valid(s.player,s.token))return;
            if(spec.id==="regret"&&count)await s.player.loseHp(count);
            if(!valid(s.player,s.token))return;
            if(spec.id==="debt")debitGold(s,10);
            if(spec.id==="shame"){s.pendingDebuffs||={};add(s.pendingDebuffs,"frail",1);}
            if(spec.id==="doubt"){s.pendingDebuffs||={};add(s.pendingDebuffs,"weak",1);}
        }
        for(const c of hand){if(!valid(s.player,s.token))return;if(rule(c)?.ethereal)await pileOf(s)?.exhaustFromHand(c);}
        refresh(s);
    }
    async function turnEnd(player) {
        const s=stateOf(player);if(!s)return;
        if(s.powers.plating)await player.changeHujia(s.powers.plating);
        for(const bomb of s.bombs.slice()){
            if(!valid(player,s.token))return;
            bomb.turns--;if(bomb.turns<=0){s.bombs.splice(s.bombs.indexOf(bomb),1);await hitAll(s,bomb.damage);}
        }
    }
    function clearTurn(player) {
        const b=getBattle();if(!b?.session.active)return;
        for(const p of b.players){const s=stateOf(p);if(!s)continue;if(p===player)s.negativeStrength=0;s.turn.choking=null;s.freeTurn=new WeakSet();}
        const s=stateOf(player);if(s?.powers.noCardBlock)s.powers.noCardBlock--;
        b.sharedAttackRecords=[];
    }
    function limited(player,card,event) {
        const s=ensure(player);if(!s || !isActiveCardUse(event,player))return false;
        const use=nearestUse(event);if(use?.mengsanSharedEcho_shuying||use?.mengsanIcEcho_shuying)return false;
        const held=player.getCards("h"),id=sharedByName[card?.name]?.id;
        if(id!=="enthralled"&&held.some(c=>sharedByName[c.name]?.id==="enthralled"))return true;
        return held.some(c=>sharedByName[c.name]?.id==="normality") && (s.turn.plays||0)>=3;
    }
    const cards={},translate={};
    for(const spec of sharedCards){
        const ally=["believe_in_you","lift","mimic","intercept"].includes(spec.id);
        const enemy=spec.cardType==="attack"&&!spec.base.all&&spec.id!=="volley" || spec.id==="dark_shackles";
        cards[spec.name]={type:spec.cardType==="status"?"status":"basic",fullimage:true,
            mengsanShared_shuying:true,
            image:`ext:术樱包/mengsan/assets/cards/${spec.name}.png`,usable:Infinity,
            mengsanCost_shuying:spec.cost,mengsanXCost_shuying:spec.cost==="X",
            mengsanInnate_shuying:card=>Boolean(rule(card)?.innate),mengsanExhaust_shuying:card=>Boolean(rule(card)?.exhaust),
            mengsanPower_shuying:spec.cardType==="power",selectTarget:enemy||ally?1:-1,toself:!enemy&&!ally,
            enable:spec.base.unplayable ? false : function(card,player,event){return Boolean(tokenOf(player)&&!hasCardAffix(card,"unplayable")&&!limited(player,card,event||status.event)&&
                (!isActiveCardUse(event||status.event,player)||canPayCard(player,card)));},
            filterTarget(card,player,target){return Boolean(target?.isAlive?.() && (enemy?target!==player&&player.isEnemyOf(target):ally?target!==player&&player.isFriendOf(target):target===player));},
            content:async(event,trigger,player)=>play(spec,event,player),
            cardPrompt(card){const r=rule(card||{name:spec.name});let description=r?.description||spec.description;
                if(spec.id==="the_ball"){const s=stateOf(game.me);if(s)description=description.replace("造成10点伤害",`造成${10+ballBonus(s,card)}点伤害`);}
                if(spec.id==="wither")description=description.replace("受到3点伤害",`受到${witherDamage(card)}点伤害`);
                return `梦三：${spec.cost==null?"不能被打出":`${spec.cost==="X"?"X":cardCost(card||{name:spec.name})}费`}。${description}`;},
            ai:{order:spec.cardType==="power"?7:6,value:spec.cardType==="curse"?0:5,useful:spec.cardType==="curse"?0:5,
                result:{target:enemy?-1:1},tag:spec.cardType==="attack"?{damage:1}:{}},
        };
        translate[spec.name]=spec.title;translate[`${spec.name}_info`]=cards[spec.name].cardPrompt({name:spec.name});
    }
    const skills={
        [RULES]:{charlotte:true,popup:false,
            mod:{
                cardEnabled(card,player){if(limited(player,card,status.event))return false;},
                cardEnabled2(card,player){if(limited(player,card,status.event))return false;},
                ignoredHandcard(card,player){if(stateOf(player)?.turn.retain)return true;},
            },
        },
        [END]:{trigger:{global:"phaseAfter"},forced:true,silent:true,popup:false,priority:-300,
            filter(event){return Boolean(stateOf(event.player)?.pendingDebuffs);},
            async content(event,trigger){const s=stateOf(trigger.player);if(!s)return;const pending=s.pendingDebuffs;delete s.pendingDebuffs;
                for(const kind of ["frail","weak"])if(pending[kind])applyMengsanDebuff(s.player,kind,pending[kind]);refresh(s);},
        },
        [LIMIT]:{trigger:{global:"useCard0"},forced:true,silent:true,popup:false,firstDo:true,priority:12000,
            filter(event){const b=getBattle();return Boolean(b?.session.active && belongs(event,b.root) && limited(event.player,event.card,event));},
            async content(event,trigger){trigger.cancel();},
        },
        [AFTER]:{trigger:{global:["useCardAfter","useCardCancelled"]},forced:true,silent:true,popup:false,priority:-500,
            filter(event){return uses.has(event);},async content(event,trigger){await onUseAfter(trigger);},
        },
        [BRIDGE]:{group:[END,LIMIT,AFTER],trigger:{global:["useCard1","phaseBefore","phaseDrawAfter","phaseDiscardBegin","phaseJieshuBegin","phaseAfter","drawAfter","damageBegin1","damageBegin2","damageBegin4","loseHpBegin","damage","changeHujiaAfter"]},
            forced:true,silent:true,popup:false,priority:300,
            filter(event){const b=getBattle();return Boolean(b?.session.active&&belongs(event,b.root));},
            async content(event,trigger){
                const name=event.triggername,b=getBattle();if(!b?.session.active)return;
                if(name==="useCard0"){if(limited(trigger.player,trigger.card,trigger))trigger.cancel();return;}
                if(name==="useCard1"){await onUse(trigger);return;}
                if(name==="phaseBefore"){await turnStart(trigger.player);return;}
                if(name==="phaseDrawAfter"){await afterDrawPhase(trigger.player);return;}
                if(name==="phaseDiscardBegin"){await handEnd(trigger);return;}
                if(name==="phaseJieshuBegin"){await turnEnd(trigger.player);return;}
                if(name==="phaseAfter"){clearTurn(trigger.player);return;}
                if(name==="drawAfter"){
                    if(!trigger.mengsanIcDrawHandled_shuying&&!seenDraws.has(trigger)){seenDraws.add(trigger);const s=ensure(trigger.player);if(s)await afterDraw(s,trigger.result?.cards||trigger.cards||[]);}return;
                }
                if(name==="damageBegin1"){
                    const use=nearestUse(trigger),entry=uses.get(use);
                    if(entry?.attackRecord && entry.s.player===trigger.source && valid(trigger.player,entry.s.token) && trigger.source.isEnemyOf(trigger.player) &&
                        !entry.attackRecord.targets.includes(trigger.player))entry.attackRecord.targets.push(trigger.player);
                    if(entry && entry.s.player===trigger.source && (trigger.mengsanAttack_shuying||isAttackCard(trigger.card)))trigger.num+=entry.vigor;
                    if(trigger.source)for(const mark of b.sharedKnockdowns||[])if(mark.target===trigger.player&&valid(mark.owner,entry?.s.token||tokenOf(mark.owner))&&mark.owner!==trigger.source&&mark.owner.isFriendOf(trigger.source))trigger.num*=mark.multiplier;
                    return;
                }
                if(name==="damageBegin4"||name==="loseHpBegin"){
                    const s=stateOf(trigger.player);if(s?.powers.intangible&&trigger.num>1)trigger.num=1;return;
                }
                if(name==="damageBegin2" && (trigger.mengsanAttack_shuying||isAttackCard(trigger.card))){
                    // Wiki's interception is attack damage suppression + doubled holder damage, not native retargeting.
                    let multiplier=1;
                    for(const p of b.players){const s=stateOf(p);if(!s?.turn.intercept || !valid(p,s.token) || !p.isEnemyOf(trigger.source))continue;
                        if(trigger.player===s.turn.intercept)multiplier=0;
                        if(trigger.player===p)multiplier*=2;
                    }
                    trigger.num=Math.floor(trigger.num*multiplier);return;
                }
                if(name==="damage"){
                    const s=stateOf(trigger.player);
                    // This native signal is after block/HP change and before ordinary dying rescue.
                    // Clear before forcing death so immunity cannot cause a second kill after rescue.
                    if(s?.powers.gambit && trigger.num>(trigger.hujia||0) && (trigger.mengsanAttack_shuying||isAttackCard(trigger.card))){s.powers.gambit=false;await trigger.player.die(trigger.source);}return;
                }
                if(name==="changeHujiaAfter"){
                    const s=stateOf(trigger.player);
                    if(s?.powers.beacon_of_hope && status.currentPhase===s.player && trigger.num>0 && !trigger.mengsanSharedBeacon_shuying){
                        const n=Math.floor(trigger.num/2)*s.powers.beacon_of_hope;
                        if(n)for(const p of friends(s).filter(p=>p!==s.player)){if(!valid(s.player,s.token))return;const e=p.changeHujia(n);e.mengsanSharedBeacon_shuying=true;await e;}
                    }return;
                }
            },
        },
    };
    return {cards,translate,skills,names:sharedCards.map(c=>c.name),
        async onDeath(event){
            const seen=new Set();for(let e=event;e&&!seen.has(e);e=e.parent){
                seen.add(e);const entry=kills.get(e);if(!entry||entry.claimed||entry.target!==event.player)continue;
                entry.claimed=true;const {s,gold}=entry;
                if(valid(s.player,s.token)&&s.player===game.me&&entry.target.isDead()){
                    const run=s.token.run,before=run.player.maxHp;grantGold(run,gold);
                    if(run.player.maxHp>before)await s.player.gainMaxHp(run.player.maxHp-before);
                }break;
            }
        },
    };
}
