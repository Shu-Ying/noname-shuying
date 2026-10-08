// Isolated behavior checks. This is NOT a live-game acceptance test.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { relicCatalog } from "../relics/catalog.js";
import { relicDefinitions, getRelic, heldRelics, canAcquireRelic, grantRelic, relicRewardIds, relicRewardPools } from "../relics/definitions.js";
import { relicState, grantGold, newRelicCard, resolveRelicChoices, relicCardPool } from "../relics/progression.js";
import { createRelicBattle, applyBattleEndRelics } from "../relics/battle.js";
import { applyRoomRelics, applyRelicNodeEnter, relicShopPrice } from "../relics/rooms.js";
import { addCardToDeck } from "../cards/card-data.js";
import { createBattleSettlement } from "../battle/battle-settlement.js";
import { getRandomRewardChoices } from "../progression/reward.js";
import config from "../config.js";
import { createRun } from "../progression/state.js";
import { createRelicCombatSkills } from "../relics/combat.js";

let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const eq=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const copy=value=>JSON.parse(JSON.stringify(value));
const makeRun=()=>({runId:"relic-test",actIndex:0,revision:0,status:"running",randomState:20261006,
    player:{character:"mengsan_liubei_shuying",items:[],deck:[],hp:30,maxHp:80,gold:0,permanentSkills:[],handLimitBonus:0},
    statistics:{goldEarned:0,completedNodes:0,defeatedEnemies:0},
    map:{nodes:[{id:"battle-1",type:"battle",completed:false}],completedNodeIds:[]}});
function starter(run){for(let i=0;i<6;i++)run.player.deck.push(newRelicCard(run,i<3 ? "sha" : "mengsan_fangyu"));}
function add(run,id){assert.ok(grantRelic(run,id),`grant ${id}`);checks++;}
function fixture(run,{encounter={}}={}){
    let hand=[],drawn=0,alive=true;const drawPile=run.player.deck.map(data=>({name:data.name,storage:{mengsanCard_shuying:copy(data)}}));
    const owner={hp:run.player.hp,maxHp:run.player.maxHp,hujia:0,storage:{mengsanEnergy_shuying:3},getCards:()=>hand,isAlive:()=>alive};
    const piles={drawCards:()=>drawPile,addToDraw(data,index){const card={name:data.name,storage:{mengsanCard_shuying:copy(data)}};drawPile.splice(index,0,card);return card;},async addToHand(data){const card={name:data.name,storage:{mengsanCard_shuying:copy(data)}};hand.push(card);return card;}};
    const effects=[];
    const controller=createRelicBattle(run,{active:()=>alive,owner,piles,encounter,draw:async n=>{drawn+=n;return [];},log:()=>{},
        effect:async relic=>{effects.push([relic.effect,relic.amount]);if(["openingBlock","nextBlock","plating"].includes(relic.effect))owner.hujia+=relic.amount;if(["energy","nextEnergy"].includes(relic.effect))owner.storage.mengsanEnergy_shuying=Math.max(0,owner.storage.mengsanEnergy_shuying+relic.amount);if(["openingHeal","healAbsolute"].includes(relic.effect))owner.hp=Math.min(owner.maxHp,owner.hp+relic.amount);},});
    return {owner,piles,controller,effects,get drawn(){return drawn;},setHand(cards){hand=cards;},stop(){alive=false;},
        async turn(){controller.globalTurnStart(owner);await controller.turnStart({name:"phase",player:owner});},
        async use(name="sha"){const use={name:"useCard",player:owner,card:{name},parent:null};await controller.onUse(use);return use;}};
}

eq(relicCatalog.length,298,"complete catalog");eq(new Set(relicCatalog.map(r=>r.wikiId)).size,298);
eq(relicCatalog.map(r=>r.order),Array.from({length:298},(_,i)=>i+1));
const manifest=JSON.parse(await readFile(new URL("../assets/relics/manifest.json",import.meta.url),"utf8"));
for(const asset of manifest.assets){
    const bytes=await readFile(new URL(`../${asset.runtime}`,import.meta.url));
    const source=await readFile(new URL(`../assets/sts2/Godot_Atlas_Sprites_v0.111.0/images/atlases/relic_atlas.sprites/${asset.source}`,import.meta.url));
    eq(createHash("sha256").update(bytes).digest("hex"),asset.sha256,asset.wikiId);
    eq(bytes,source,`original image ${asset.wikiId}`);
    eq([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[asset.width,asset.height]);
    check(asset.width<=480 && asset.height<=672 && asset.bytes<=300*1024,`icon budget ${asset.wikiId}`);
}
eq(manifest.assets.length,298);
check(heldRelics(createRun('mengsan_liubei_shuying')).some(r=>r.wikiId==='burning_blood'),'mapped new journey starts with Burning Blood');
for(const relic of Object.values(relicDefinitions)){
    const run=makeRun();starter(run);run.player.relicPool=relic.pool;
    if(relic.implementation==="pending"){
        const before=copy(run);check(!canAcquireRelic(run,relic.id));check(!grantRelic(run,relic.id));eq(run,before,"pending does not mutate");continue;
    }
    add(run,relic.id);check(!canAcquireRelic(run,relic.id),`unique ${relic.id}`);
    await resolveRelicChoices(run,async (title,choices)=>choices.find(c=>c.id!=="skip").id);
    eq(new Set(run.player.deck.map(c=>c.id)).size,run.player.deck.length,`unique cards ${relic.id}`);
    check(run.player.hp>0 && run.player.hp<=run.player.maxHp,`safe pickup ${relic.id}`);
    const f=fixture(run);await f.controller.start();await f.turn();await f.use();await f.controller.turnEnd();
    eq(f.controller.beforeHpLoss(0),0);
}
for(const id of relicRewardIds)check(getRelic(id.slice("shared.reward.relic.".length)).implementation!=="pending");
for(const [key,ids] of Object.entries(relicRewardPools)){
    check(ids.every(id=>config.rewards[id]),key);
    if(key.includes("ancient"))check(ids.length>0,`${key} populated`);
}
{
    const run=makeRun();add(run,"strawberry");eq(run.player.maxHp,87);eq(run.player.hp,30);check(!grantRelic(run,"strawberry"));
    add(run,"burning_blood");add(run,"black_blood");check(!heldRelics(run).some(r=>r.wikiId==="burning_blood"));check(!grantRelic(run,"burning_blood"));
    eq(applyBattleEndRelics(run,"defeat"),0);eq(applyBattleEndRelics(run,"victory"),12);
}
{
    const run=makeRun();add(run,"bowler_hat");add(run,"dragon_fruit");eq(grantGold(run,20),25);eq(run.player.gold,25);eq(run.player.maxHp,81);eq(run.player.hp,30);
    add(run,"ectoplasm");eq(grantGold(run,200),0);eq(run.player.gold,25);eq(run.player.maxHp,81);
}
{
    const run=makeRun();add(run,"molten_egg");add(run,"bing_bong");add(run,"lucky_fysh");
    addCardToDeck(run,newRelicCard(run,"sha"));eq(run.player.deck.length,2);eq(run.player.deck.map(c=>c.upgrade),[1,1]);eq(run.player.gold,30);
    add(run,"darkstone_periapt");addCardToDeck(run,newRelicCard(run,"mengsan_curse_greed"));eq(run.player.maxHp,92);
}
{
    const run=makeRun();starter(run);add(run,"neows_talisman");eq(run.player.deck.filter(c=>c.upgrade).length,2);
    const oldIds=run.player.deck.map(c=>c.id);add(run,"pandoras_box");eq(run.player.deck.map(c=>c.id),oldIds);check(run.player.deck.every(c=>!['sha','mengsan_fangyu'].includes(c.name)));
}
{
    const run=makeRun();starter(run);run.player.deck[0].affixes=['eternal'];add(run,"empty_cage");
    await resolveRelicChoices(run,async(title,choices)=>choices[0].id);eq(run.player.deck.length,4);check(run.player.deck.some(c=>c.affixes.includes('eternal')));
    add(run,"claws");await resolveRelicChoices(run,async(title,choices)=>choices.find(c=>c.id!=='skip').id);eq(run.player.deck.filter(c=>c.name==='mengsan_event_maul').length,3);
}
{
    const run=makeRun();starter(run);add(run,"paels_tooth");await resolveRelicChoices(run,async(title,choices)=>choices[0].id);
    eq(run.player.deck.length,1);eq(relicState(run).storedCards.length,5);applyBattleEndRelics(run,"victory");eq(run.player.deck.length,2);eq(relicState(run).storedCards.length,4);check(run.player.deck.some(c=>c.upgrade===1));
}
{
    const run=makeRun();add(run,"meal_ticket");const shop={id:'shop',type:'shop'};
    eq(applyRoomRelics(run,shop,'enter').recovered,15);eq(applyRoomRelics(run,shop,'enter'),null);
    add(run,"membership_card");add(run,"the_courier");eq(relicShopPrice(run,120),48);
    add(run,"regal_pillow");const rest={id:'rest',type:'rest'};applyRoomRelics(run,rest,'enter');eq(applyRoomRelics(run,rest,'heal').recovered,23);eq(applyRoomRelics(run,rest,'heal'),null);
    add(run,"maw_bank");applyRelicNodeEnter(run,{id:'1'});eq(run.player.gold,12);applyRelicNodeEnter(run,{id:'1'});eq(run.player.gold,12);relicState(run).mawBankBroken=true;applyRelicNodeEnter(run,{id:'2'});eq(run.player.gold,12);
}
{
    const run=makeRun();add(run,"anchor");add(run,"bag_of_preparation");add(run,"lantern");add(run,"centennial_puzzle");add(run,"venerable_tea_set");relicState(run).afterRest=true;
    const f=fixture(run);await f.controller.start();eq(f.owner.hujia,10);eq(f.controller.retainedBlock(10),10);eq(f.drawn,2);eq(f.controller.openingHandBonus,2);
    await f.turn();eq(f.owner.storage.mengsanEnergy_shuying,6);eq(f.controller.retainedBlock(10),0);
    const event={num:-1};await f.controller.loseHp(event);await f.controller.loseHp(event);eq(f.drawn,5);await f.controller.loseHp({num:-1});eq(f.drawn,5);
    const second=fixture(run);await second.controller.start();await second.turn();eq(second.owner.storage.mengsanEnergy_shuying,4,"tea receipt spent");
}
{
    const run=makeRun();add(run,"tungsten_rod");add(run,"beating_remnant");const f=fixture(run);await f.controller.start();await f.turn();
    eq(f.controller.beforeHpLoss(-10,10),-10,"full block must be consumed normally");eq(f.controller.beforeHpLoss(-10,5),-9,"reduce HP loss after armor");
    await f.controller.loseHp({num:-19});eq(f.controller.beforeHpLoss(-8,5),-6,"turn cap after armor");
    f.controller.globalTurnStart({});eq(f.controller.beforeHpLoss(-50),-20,"all turns reset cap");
}
{
    const run=makeRun();add(run,'big_mushroom');add(run,'bag_of_preparation');const f=fixture(run);
    eq(f.controller.drawAdjustment,-2,"opening penalties apply before positive bonus draws");await f.controller.start();eq(f.controller.openingHandBonus,0);eq(f.drawn,2);
}
{
    const run=makeRun();add(run,"lizard_tail");const f=fixture(run);await f.controller.start();f.owner.hp=-4;await f.controller.dying();eq(f.owner.hp,40);f.owner.hp=-1;await f.controller.dying();eq(f.owner.hp,-1);
    const second=fixture(run);await second.controller.start();second.owner.hp=0;await second.controller.dying();eq(second.owner.hp,0,"tail once per journey");
}
{
    const run=makeRun();add(run,"pen_nib");add(run,"akabeko");add(run,"strike_dummy");add(run,"nunchaku");const f=fixture(run);await f.controller.start();await f.turn();
    let use=await f.use();eq(f.controller.outgoingDamage({source:f.owner,card:{name:'sha'},num:6,parent:use}),17);
    for(let i=1;i<9;i++)await f.use();const next=fixture(run);await next.controller.start();await next.turn();use=await next.use();
    eq(next.controller.outgoingDamage({source:next.owner,card:{name:'sha'},num:6,parent:use}),34,"pen nib persists + fresh battle vigor");eq(next.owner.storage.mengsanEnergy_shuying,4);
}
{
    const run=makeRun();add(run,"permafrost");const f=fixture(run);await f.controller.start();await f.turn();const power='mengsan_ic_demon_form';
    check(relicCardPool(run,{type:'power'}).includes(power));await f.use(power);eq(f.owner.hujia,7);await f.turn();await f.use(power);eq(f.owner.hujia,7,"permafrost once per combat");
}
{
    const run=makeRun();add(run,"vambrace");add(run,"oddly_smooth_stone");const f=fixture(run);await f.controller.start();await f.turn();const use=await f.use('mengsan_fangyu');
    eq(f.controller.blockAmount(5,{parent:use}),12);eq(f.controller.blockAmount(5,{parent:use}),6);eq(f.controller.blockAmount(5,{}),5,"noncard block gets no dexterity");
}
{
    const run=makeRun();add(run,'velvet_choker');add(run,'brilliant_scarf');const f=fixture(run);await f.controller.start();await f.turn();
    for(let i=0;i<4;i++)await f.use();check(f.controller.isFree({name:'sha'}));await f.use();check(!f.controller.isFree({name:'sha'}));await f.use();check(f.controller.limited());f.controller.globalTurnStart({});check(!f.controller.limited(),'responses outside own turn remain enabled');
}
{
    const run=makeRun();run.player.relicPool='静默猎手';add(run,'paper_krane');const f=fixture(run);await f.controller.start();
    const skills=createRelicCombatSkills(()=>({session:{active:true},relics:f.controller}),()=>f.owner);
    const enemy={storage:{mengsanWeak_shuying:1}},event={source:enemy,card:null,mengsanAttack_shuying:true,num:10};
    check(skills.mengsan_relic_attack_shuying.filter(event),'explicit scripted attack marker supports Weak');
    await skills.mengsan_relic_attack_shuying.content({},event);eq(event.num,6);
    check(!skills.mengsan_relic_attack_shuying.filter({...event,mengsanScriptedSkill_shuying:true}),'relic damage is not an attack');
    check(!skills.mengsan_relic_attack_shuying.filter({source:f.owner,card:{name:'tao'},num:1}),'non-attack cards do not receive Strength');
}
{
    const run=makeRun();add(run,'joss_paper');add(run,'the_abacus');add(run,'charons_ashes');const f=fixture(run);await f.controller.start();
    for(let i=0;i<5;i++)f.controller.queueExhaust({});f.controller.queueShuffle();await f.controller.flushExhaust();eq(f.drawn,1);eq(f.owner.hujia,6);eq(f.effects.filter(([key])=>key==='openingDamage').length,5);await f.controller.flushExhaust();eq(f.drawn,1);
}
{
    const run=makeRun();starter(run);add(run,'blessed_antler');add(run,'tea_of_discourtesy');add(run,'bellows');add(run,'stone_cracker');add(run,'vexing_puzzlebox');
    const f=fixture(run);f.setHand([{name:'sha',storage:{mengsanCard_shuying:copy(run.player.deck[0])}}]);await f.controller.start();eq(f.piles.drawCards().length,11);eq(run.player.deck.filter(c=>c.upgrade).length,0,"battle upgrades do not leak into permanent deck");
    const second=fixture(run);await second.controller.start();eq(second.piles.drawCards().length,9,"one battle dazed consumed once");
}
{
    const run=makeRun();add(run,'black_star');let data={[config.saveKey]:copy(run)},writes=0;
    const store={read:()=>copy(data),async update(fn){writes++;return fn(data);}};
    const settlement=createBattleSettlement({store,config,getRandomRewardChoices,applyReward:(r,id)=>{const relic=config.rewards[id]?.relic;if(relic)grantRelic(r,relic);},completeNode:(r,id)=>{r.map.nodes[0].completed=true;return true;},enterNextAct:()=>false,resolveRelicChoices:async r=>resolveRelicChoices(r,async(t,c)=>c[0].id)});
    const pending=await settlement.prepare({run:copy(data[config.saveKey]),node:run.map.nodes[0],encounter:{tier:'elite',gold:20,skipRandomReward:true},hp:25});eq(pending.fixedRewards.length,2);
    await settlement.choose(run.runId,pending.id,null);const one=await settlement.commit(run.runId,pending.id);const two=await settlement.commit(run.runId,pending.id);eq(writes,1);eq(one.run.player.gold,20);check(two.duplicate);eq(one.run.player.items.length,3);
}
{
    const run=makeRun();let data={[config.saveKey]:copy(run)},attempts=0,resolutions=0,release;
    const barrier=new Promise(resolve=>{release=resolve;});
    const store={read:()=>copy(data),async update(fn){if(++attempts===1)throw new Error('injected write failure');return fn(data);}};
    const settlement=createBattleSettlement({store,config,getRandomRewardChoices,applyReward:()=>{},completeNode:r=>{r.map.nodes[0].completed=true;return true;},enterNextAct:()=>false,
        resolveRelicChoices:async()=>{resolutions++;await barrier;}});
    const pending=await settlement.prepare({run:copy(run),node:run.map.nodes[0],encounter:{tier:'normal',gold:20,skipRandomReward:true},hp:20});
    const first=settlement.choose(run.runId,pending.id,null),second=settlement.choose(run.runId,pending.id,null);
    eq(first,second,'concurrent same reward shares one operation');await assert.rejects(settlement.choose(run.runId,pending.id,'other'));checks++;
    release();await first;eq(resolutions,1);await assert.rejects(settlement.commit(run.runId,pending.id));checks++;
    eq(data[config.saveKey].player.gold,0,'failed write keeps prior checkpoint');const saved=await settlement.commit(run.runId,pending.id);eq(saved.run.player.gold,20);eq(attempts,2);eq(resolutions,1);
}
console.log(JSON.stringify({checks,images:manifest.assets.length,wikiRelics:relicCatalog.length,
    states:relicCatalog.reduce((counts,r)=>{const status=getRelic(r.id).implementation;counts[status]=(counts[status] || 0)+1;return counts;},{}),acceptance:"isolated behavior / resource checks only; live game pending"},null,2));
