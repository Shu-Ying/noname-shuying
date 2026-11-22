// Isolated behavior checks. This is NOT a live-game acceptance test.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { registerHooks } from "node:module";
import { relicCatalog } from "../relics/catalog.js";
import { relicDefinitions, getRelic, heldRelics, canAcquireRelic, grantRelic, relicRewardIds, relicRewardPools } from "../relics/definitions.js";
import { relicState, grantGold, newRelicCard, resolveRelicChoices, relicCardPool, addPermanentRelicCard } from "../relics/progression.js";
import { createRelicBattle, createRelicSkills, applyBattleEndRelics } from "../relics/battle.js";
import { applyRoomRelics, applyRelicNodeEnter, relicShopPrice, recordRelicShopPurchase } from "../relics/rooms.js";
import { addCardToDeck } from "../cards/card-data.js";
import { canAcquireCard } from "../cards/card-definitions.js";
import { createModeStorage } from "../progression/mode-storage.js";
import { createBattleSettlement } from "../battle/battle-settlement.js";
import { getRandomRewardChoices } from "../progression/reward.js";
import config from "../config.js";
import { createRun } from "../progression/state.js";
import { createRelicCombatSkills } from "../relics/combat.js";
import { previewAttackDamage } from "../battle/intent-damage.js";
import { createIntentExecutor } from "../battle/intent-effects.js";
import { applyBodyguardDamage, bindIroncladHooks } from "../cards/ironclad-hooks.js";
// The shared runtime only needs the engine's status export in this isolated check.
const engineStatusHook = registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.endsWith("/noname.js") && context.parentURL?.endsWith("/mengsan/battle/combat-rules.js")) {
            return { url: "data:text/javascript,export const _status = %7B%7D", shortCircuit: true };
        }
        return nextResolve(specifier, context);
    },
});
const { createSharedCardRuntime } = await import("../cards/packs/shared/runtime.js");
engineStatusHook.deregister();

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
function fixture(run,{encounter={},onCounterChange}={}){
    let hand=[],drawn=0,alive=true;const drawPile=run.player.deck.map(data=>({name:data.name,storage:{mengsanCard_shuying:copy(data)}}));
    const owner={hp:run.player.hp,maxHp:run.player.maxHp,hujia:0,storage:{mengsanEnergy_shuying:3},getCards:()=>hand,isAlive:()=>alive};
    const piles={drawCards:()=>drawPile,addToDraw(data,index){const card={name:data.name,storage:{mengsanCard_shuying:copy(data)}};drawPile.splice(index,0,card);return card;},async addToHand(data){const card={name:data.name,storage:{mengsanCard_shuying:copy(data)}};hand.push(card);return card;}};
    const effects=[];
    const controller=createRelicBattle(run,{active:()=>alive,owner,piles,encounter,draw:async n=>{drawn+=n;return [];},log:()=>{},
        onCounterChange, effect:async relic=>{effects.push([relic.effect,relic.amount]);if(["openingBlock","nextBlock","plating"].includes(relic.effect))owner.hujia+=relic.amount;if(["energy","nextEnergy"].includes(relic.effect))owner.storage.mengsanEnergy_shuying=Math.max(0,owner.storage.mengsanEnergy_shuying+relic.amount);if(["openingHeal","healAbsolute"].includes(relic.effect))owner.hp=Math.min(owner.maxHp,owner.hp+relic.amount);},});
    return {owner,piles,controller,effects,get drawn(){return drawn;},setHand(cards){hand=cards;},stop(){alive=false;},
        counter(id){return controller.counter(getRelic(id))?.value ?? null;},
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
    const run = makeRun();
    add(run, "paels_tooth");
    const valid = newRelicCard(run, "sha");
    const bagua = newRelicCard(run, "bagua");
    const muniu = { ...valid, id: "old-muniu", name: "muniu" };
    relicState(run).storedCards = [muniu, bagua, valid];
    const lib = { storage: { [config.saveKey]: run }, status: { reload: 0 }, version: 1 };
    let written;
    const store = createModeStorage({
        lib, config, game: { reload2() { lib.status.reload--; } },
        localStorage: { setItem(key, value) { written = JSON.parse(value); } },
    });
    eq(store.read()[config.saveKey].player.relicState.storedCards.map(card => card.id), [valid.id]);
    await store.update(storage => { storage[config.saveKey] = copy(run); });
    eq(written[config.saveKey].player.relicState.storedCards.map(card => card.id), [valid.id]);

    applyBattleEndRelics(run, "victory");
    eq(run.player.deck.map(card => [card.id, card.upgrade]), [[valid.id, 1]]);
    eq(relicState(run).storedCards, []);
    check(!canAcquireCard(run.player.character, "bagua"));
    check(canAcquireCard("another_character", "bagua"));
    assert.throws(() => addCardToDeck(run, bagua), /无法获得牌/);
    assert.throws(() => addPermanentRelicCard(run, bagua.name), /无法获得牌/);
    assert.throws(() => addPermanentRelicCard(run, "sha", { name: "bagua" }), /无法获得牌/);
    checks += 3;
}
{
    const run=makeRun();add(run,"meal_ticket");const shop={id:'shop',type:'shop'};
    eq(applyRoomRelics(run,shop,'enter').recovered,15);eq(applyRoomRelics(run,shop,'enter'),null);
    add(run,"membership_card");add(run,"the_courier");eq(relicShopPrice(run,120),48);
    add(run,"regal_pillow");const rest={id:'rest',type:'rest'};applyRoomRelics(run,rest,'enter');eq(applyRoomRelics(run,rest,'heal').recovered,23);eq(applyRoomRelics(run,rest,'heal'),null);
    recordRelicShopPurchase(run);
    eq(relicState(run).mawBankBroken, undefined, "shopping before pickup does not break the bank");
    relicState(run).mawBankBroken = true; // Old save that purchased something before the pickup.
    add(run, "maw_bank");
    applyRelicNodeEnter(run, { id: "1" });
    eq(run.player.gold, 12, "pickup clears stale pre-ownership failure");
    applyRelicNodeEnter(run, { id: "1" });
    eq(run.player.gold, 12);
    recordRelicShopPurchase(run);
    applyRelicNodeEnter(run, { id: "2" });
    eq(run.player.gold, 12, "shopping while holding the bank breaks it");
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
    for(let i=1;i<9;i++)await f.use();
    eq(f.counter("nunchaku"),9);eq(f.counter("pen_nib"),9);
    const next=fixture(copy(run));await next.controller.start();await next.turn();
    eq(next.counter("nunchaku"),0);eq(next.counter("pen_nib"),9);
    use=await next.use();
    eq(next.controller.outgoingDamage({source:next.owner,card:{name:'sha'},num:6,parent:use}),34,"pen nib persists + fresh battle vigor");
    eq(next.counter("nunchaku"),1);eq(next.counter("pen_nib"),0);
    eq(next.owner.storage.mengsanEnergy_shuying,3,"nunchaku does not trigger from the previous battle's attacks");
    await next.turn();
    await next.use("mengsan_fangyu");
    eq(next.counter("nunchaku"),1,"progress survives an own turn boundary and ignores skills");
    for(let i=1;i<9;i++)await next.use();
    eq(next.counter("nunchaku"),9);eq(next.owner.storage.mengsanEnergy_shuying,3);
    const battle = { session: { active: true }, relics: next.controller };
    const responseSkill = createRelicSkills(() => battle, () => next.owner).mengsan_relics_shuying;
    check(responseSkill.trigger.global.includes("respond"));
    const respond = async response => {
        check(responseSkill.filter(response, next.owner));
        await responseSkill.content({ triggername: "respond" }, response);
    };
    await respond({ name: "respond", player: next.owner, card: { name: "shan" } });
    eq(next.counter("nunchaku"),9);
    next.controller.globalTurnStart(f.owner);
    const duelResponse = { name: "respond", player: next.owner, card: { name: "sha" } };
    check(!responseSkill.filter({ ...duelResponse, player: f.owner }, next.owner));
    await respond(duelResponse);
    eq(next.counter("nunchaku"),0);eq(next.owner.storage.mengsanEnergy_shuying,4);
    await respond(duelResponse);
    eq(next.counter("nunchaku"),0);eq(next.owner.storage.mengsanEnergy_shuying,4);
    eq(next.counter("pen_nib"),8,"responses only advance Nunchaku");
    await next.use();eq(next.counter("nunchaku"),1);eq(next.counter("pen_nib"),9);
}
{
    for (const name of ["nanman", "wanjian", "huogong"]) {
        const run = makeRun();
        add(run, "pen_nib"); add(run, "nunchaku"); add(run, "the_boot");
        const f = fixture(run);
        await f.controller.start(); await f.turn();
        for (let i = 0; i < 9; i++) await f.use();
        const use = await f.use(name);
        eq(f.counter("pen_nib"), 0);
        eq(f.counter("nunchaku"), 0);
        eq(f.owner.storage.mengsanEnergy_shuying, 4);
        const hit = { source: f.owner, card: use.card, num: 4, parent: use };
        eq(f.controller.outgoingDamage(hit), 8);
        eq(f.controller.lateOutgoingDamage(hit), 5);
    }
}
{
    const run=makeRun();add(run,"pendulum");add(run,"pollinous_core");
    const first=fixture(run);await first.controller.start();await first.turn();await first.turn();
    eq(first.counter("pendulum"),2);eq(first.counter("pollinous_core"),2);eq(first.drawn,0);

    const next=fixture(copy(run));await next.controller.start();await next.turn();
    eq(next.counter("pendulum"),0);eq(next.counter("pollinous_core"),3);eq(next.drawn,1);
    await next.turn();
    eq(next.counter("pendulum"),1);eq(next.counter("pollinous_core"),0);eq(next.drawn,3);
}
{
    const run=makeRun();add(run,"ornamental_fan");add(run,"letter_opener");
    let updates=0;
    const f=fixture(run,{onCounterChange:()=>updates++});
    await f.controller.start();await f.turn();
    await f.use();await f.use();
    eq(f.counter("ornamental_fan"),2);eq(f.owner.hujia,0);
    const before=updates;
    f.controller.globalTurnStart({});
    eq(f.counter("ornamental_fan"),0);eq(updates,before+1);
    await f.use();await f.use();await f.use();
    eq(f.counter("ornamental_fan"),0);eq(f.owner.hujia,4);
    await f.use("mengsan_fangyu");await f.use("mengsan_fangyu");
    eq(f.counter("letter_opener"),2);
    f.controller.globalTurnStart({});
    await f.use("mengsan_fangyu");
    eq(f.counter("letter_opener"),1);eq(f.effects.filter(([key])=>key==="openingDamage").length,0);
    await f.use("mengsan_fangyu");await f.use("mengsan_fangyu");
    eq(f.counter("letter_opener"),0);eq(f.effects.filter(([key])=>key==="openingDamage").length,1);
}
{
    const run=makeRun();add(run,"tuning_fork");add(run,"iron_club");add(run,"joss_paper");
    const f=fixture(run);await f.controller.start();await f.turn();
    for(let i=0;i<9;i++)await f.use("mengsan_fangyu");
    for(let i=0;i<4;i++)f.controller.queueExhaust({});
    await f.controller.flushExhaust();
    eq([f.counter("tuning_fork"),f.counter("iron_club"),f.counter("joss_paper")],[9,1,4]);
    const next=fixture(copy(run));await next.controller.start();await next.turn();
    eq([next.counter("tuning_fork"),next.counter("iron_club"),next.counter("joss_paper")],[9,1,4]);
    await next.use("mengsan_fangyu");await next.use();await next.use();
    next.controller.queueExhaust({});await next.controller.flushExhaust();
    eq([next.counter("tuning_fork"),next.counter("iron_club"),next.counter("joss_paper")],[0,0,0]);
    eq(next.owner.hujia,7);eq(next.drawn,2);
}
{
    const run=makeRun();add(run,"stone_calendar");add(run,"horn_cleat");add(run,"pumpkin_candle");add(run,"centennial_puzzle");
    const f=fixture(run);await f.controller.start();
    eq([f.counter("stone_calendar"),f.counter("horn_cleat"),f.counter("pumpkin_candle")],[7,2,5]);
    for(let i=0;i<6;i++){await f.turn();await f.controller.turnEnd();}
    await f.turn();
    eq(f.counter("stone_calendar"),1);
    await f.controller.turnEnd();
    eq(f.counter("stone_calendar"),0);eq(f.effects.filter(([key])=>key==="openingDamage").length,1);
    await f.controller.loseHp({num:-1});
    eq(f.counter("centennial_puzzle"),0);
    applyBattleEndRelics(run,"victory");
    const next=fixture(copy(run));await next.controller.start();
    eq([next.counter("stone_calendar"),next.counter("horn_cleat"),next.counter("pumpkin_candle"),next.counter("centennial_puzzle")],[7,2,4,1]);
    eq(next.counter("burning_blood"),null);
    await next.turn();await next.use();
    eq(next.controller.status(getRelic("burning_blood")),null,"non-counting relic has no battle progress");
    eq(next.controller.status(getRelic("stone_calendar")),"触发前剩余回合结束次数 7");
}
{
    const run=makeRun();add(run,"art_of_war");add(run,"paels_tears");
    const f=fixture(run);await f.controller.start();await f.turn();await f.controller.turnEnd();
    eq([f.counter("art_of_war"),f.counter("paels_tears"),f.controller.displayState().nextEnergy],[1,2,3]);
    await f.turn();
    eq([f.counter("art_of_war"),f.counter("paels_tears"),f.controller.displayState().nextEnergy],[0,0,0]);
    eq(f.owner.storage.mengsanEnergy_shuying,6);
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
    eq(skills.mengsan_relic_attack_shuying.trigger, { source: "damageBegin1" });
    eq(skills.mengsan_relic_boot_shuying.trigger, { source: "damageBegin2" });
    f.owner.storage.mengsanCamp_shuying = "ally";
    const enemy = { isAlive: () => true, storage: { mengsanWeak_shuying: 1, mengsanCamp_shuying: "enemy" } };
    const event = { source: enemy, card: null, mengsanAttack_shuying: true, num: 10 };
    check(skills.mengsan_relic_attack_shuying.filter(event),'explicit scripted attack marker supports Weak');
    await skills.mengsan_relic_attack_shuying.content({},event);eq(event.num,6);
    check(!skills.mengsan_relic_attack_shuying.filter({...event,mengsanScriptedSkill_shuying:true}),'relic damage is not an attack');
    check(!skills.mengsan_relic_attack_shuying.filter({source:f.owner,card:{name:'tao'},num:1}),'non-attack cards do not receive Strength');

    const hits = [];
    f.owner.damage = num => { const hit = { num }; hits.push(hit); return hit; };
    const battle = { session: { active: true }, owner: f.owner, relics: f.controller };
    const executeIntent = createIntentExecutor({ players: [f.owner, enemy] }, () => battle);
    eq(previewAttackDamage({ damage: 20 }, enemy, f.owner, battle), 12);
    eq(previewAttackDamage({ damage: 20 }, enemy, f.owner), 15);
    await executeIntent(enemy, { damage: 20, hits: 2 });
    await executeIntent(enemy, { damage: 20, intentType: "death_blow" });
    eq(hits.map(hit => hit.num), [12, 12, 12]);
    check(hits.every(hit => hit.mengsanAttack_shuying && hit.mengsanScriptedSkill_shuying));
    check(hits.every(hit => !skills.mengsan_relic_attack_shuying.filter({ ...hit, source: enemy })), "intent Weak is applied before native damage, once");

    const ally = { storage: { mengsanCamp_shuying: "ally" } };
    f.owner.playerid = "preview-owner";
    f.owner.isFriendOf = player => player === f.owner || player === ally;
    f.owner.isEnemyOf = player => player === enemy;
    battle.players = new Set([f.owner, ally, enemy]);
    const bodyguardSession = { active: true, ownResource() {} };
    bindIroncladHooks(f.owner, bodyguardSession, { valid: () => true, hasBodyguard: () => true });
    eq([f.owner, ally].map(target => previewAttackDamage({ damage: 20 }, enemy, target, battle)), [24, 6]);
    const root = battle.root = {};
    battle.session.ownResource = () => {};
    f.owner.addSkill = () => {};
    f.owner.changeHujia = async amount => { f.owner.hujia += amount; };
    ally.isAlive = () => true;
    enemy.addSkill = () => assert.fail("Intent preview should not register skills");
    const runtime = createSharedCardRuntime({
        game: { me: f.owner }, lib: {}, status: {}, getBattle: () => battle,
    });
    const bridge = runtime.skills.mengsan_shared_bridge_shuying;
    const resolve = async (triggername, trigger) => {
        check(bridge.filter(trigger, f.owner, triggername));
        await bridge.content({ triggername }, trigger);
    };
    const preview = () => [f.owner, ally].map(target => previewAttackDamage({ damage: 20 }, enemy, target, battle));
    eq(preview(), [24, 6]);
    const play = async name => runtime.cards[name].content({
        parent: root, card: { name }, target: ally,
    }, null, f.owner);
    const interceptName = "mengsan_colorless_intercept";
    for (const [upgrade, block] of [[0, 9], [1, 13]]) {
        const data = { name: interceptName, upgrade };
        const card = { name: interceptName, storage: { mengsanCard_shuying: data } };
        const prompt = runtime.cards[interceptName].cardPrompt(card);
        eq(prompt, `梦三：1费。获得${block}点格挡。选择一名其他友方角色。直到你的下个回合开始，敌人对其的攻击伤害归零，对你的攻击伤害翻倍。`);
    }
    await play(interceptName);
    eq(preview(), [48, 0]);
    const settle = async target => {
        const hit = { parent: root, player: target, source: enemy, num: 12, mengsanAttack_shuying: true };
        await resolve("damageBegin2", hit);
        hit.num = applyBodyguardDamage(hit.num, enemy, target, battle.players);
        await resolve("damageBegin4", hit);
        return hit.num;
    };
    eq(await Promise.all([f.owner, ally].map(settle)), preview());
    await play("mengsan_event_apparition");
    eq(preview(), [1, 0]);
    eq(await Promise.all([f.owner, ally].map(settle)), preview());
    await resolve("phaseAfter", { parent: root, player: f.owner });
    eq(preview(), [1, 0]);
    await resolve("phaseBefore", { parent: root, player: f.owner });
    eq(preview(), [24, 6]);
    bodyguardSession.active = false;
    eq(previewAttackDamage({ damage: 20 }, enemy, ally, battle), 12);
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
