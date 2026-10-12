import { createScenarioCharacters, scenarioTranslations } from "./content/scenario-characters.js";
import { createMengsanCards } from "./cards/mode-cards.js";
import { createStrikeCounter, isStrikeCard } from "./cards/strike-counter.js";
import { resolveRetiredCardReward } from "./cards/retired-cards.js";
import { createBlockDrawer } from "./cards/block-draw.js";
import { createHandUpgrader } from "./cards/hand-upgrade.js";
import { createLifeLossBlocker } from "./cards/life-loss-block.js";
import { createRampage } from "./cards/rampage.js";
import { createSpite } from "./cards/spite.js";
import { createWhirlwind } from "./cards/whirlwind.js";
import { createHavocPlayer } from "./cards/havoc-play.js";
import { createHandExhauster } from "./cards/hand-exhaust.js";
import { createCardPackRuntime } from "./cards/packs/index.js";
import { ironcladBlocksDraw, ironcladPreservesBlock, afterIroncladDraw, beforeIroncladBlock } from "./cards/ironclad-hooks.js";
import { afterSharedDraw, beforeSharedBlock, sharedStrengthPenalty } from "./cards/shared-hooks.js";
import { hasCardAffix } from "./cards/intrinsic-affixes.js";
import { createBattleEnergy } from "./cards/battle-energy.js";
import { setBattleCamp, createCampPlayerMethods, campAttitude } from "./battle/camps.js";
import { createRandomHandExhauster } from "./cards/random-hand-exhaust.js";
import { createBattleCardCopier } from "./cards/battle-card-copy.js";
import { createBattleCardReclaimer } from "./cards/battle-card-reclaim.js";
import { createTemporaryStrength, temporaryStrengthAmount, temporaryStrengthExpires, expireTemporaryStrength, clearTemporaryStrength, forgetTemporaryStrength } from "./cards/temporary-strength.js";
import { createRelicBattle, createRelicSkills } from "./relics/battle.js";
import { grantRelic, getRelic, initializeRelicMaxHp, heldRelics, relicShopRewardIds, canAcquireRelic }
    from "./relics/definitions.js";
import { mountRelics } from "./ui/relics.js";
import { createOpeningEffects, createRelicCombatSkills }
    from "./relics/combat.js";
import { applyRoomRelics, restRecovery, relicRestChoices, relicShopPrice, recordRelicShopPurchase, applyRelicNodeEnter } from "./relics/rooms.js";
import { grantGold, resolveRelicChoices, relicState } from "./relics/progression.js";
import { bindRelicHooks, relicBlockAmount, relicBlocksDraw, flushRelicExhaust } from "./relics/hooks.js";
import { buildBattlePlan, consumeSupports, createBattleDirector, grantSupport } from "./battle/battle-director.js";
import { installPersonalPiles } from "./cards/personal-piles.js";
import { createMonster } from "./monsters/monster.js";
import { prepareBondBattle, bondBattleStatus } from "./bonds/state.js";
import { initializeBondUnit, recordBondDeath } from "./bonds/battle.js";
import { bondDefinitions } from "./bonds/definitions.js";
import { createBondIntentActions } from "./bonds/intents.js";
import {
    createMonsterIntentActions,
    getIntentHostiles,
    isFlyconid,
    isRaider,
} from "./monsters/actions.js";
import { constrictTotal, resolveConstrict, clearConstrictSource } from "./monsters/strangler-constrict.js";
import { isShrunk, clearShrinkSource, shrinkAttackDamage } from "./monsters/shrinker-status.js";
import { advanceTangled } from "./monsters/vine-tangled.js";
import { isMawler, recordMawlerAction } from "./monsters/mawler-intent.js";
import { isVine, recordVineAction } from "./monsters/vine-intent.js";
import { isCubex, recordCubexAction, initializeCubex } from "./monsters/cubex-intent.js";
import { isEffigy, recordEffigyAction, initializeEffigy } from "./monsters/effigy-intent.js";
import { isVantom, recordVantomAction, initializeVantom } from "./monsters/vantom-intent.js";
import { isBeast, initializeBeast, recoverBeastStun, canBreakPlow, breakPlow, ringingLimited, countRingingCard, clearRinging } from "./monsters/beast-intent.js";
import { KIN_FOLLOWER_CHARACTER, isKinActor, isKinFollower, canActKin, recordKinAction, initializeKin, rollKinFollowerHp, clearKinOwnerIntents } from "./monsters/kin-intent.js";
import { slowPercent, canCountSlowCard, recordSlowCard, resetSlow, slowApplies, slowAttackDamage } from "./monsters/effigy-slow.js";
import { BYRDONIS_CHARACTER, isByrdonis, rollByrdonisHp, recordByrdonisAction, initializeByrdonis, resolveTerritorial } from "./monsters/byrdonis-intent.js";
import { NIBBIT_CHARACTER, isNibbit, rollNibbitHp, recordNibbitAction, bindNibbitOpenings } from "./monsters/nibbit-intent.js";
import { SHRINKER_CHARACTER, isShrinker, rollShrinkerHp, recordShrinkerAction } from "./monsters/shrinker-intent.js";
import { TWIGMEDIUM_CHARACTER, isTwigmedium, rollTwigmediumHp, recordTwigmediumAction } from "./monsters/twigmedium-intent.js";
import { TWIGSLIME_CHARACTER, isTwigslime, rollTwigslimeHp, recordTwigslimeAction } from "./monsters/twigslime-intent.js";
import { LEAFMEDIUM_CHARACTER, isLeafslimeMedium, rollLeafslimeMediumHp, recordLeafslimeMediumAction } from "./monsters/leafmedium-intent.js";
import { LEAFSLIME_CHARACTER, isLeafslime, rollLeafslimeHp, recordLeafslimeAction } from "./monsters/leafslime-intent.js";
import { STRANGLER_CHARACTER, isStrangler, rollStranglerHp, recordStranglerAction } from "./monsters/strangler-intent.js";
import { JAXFRUIT_CHARACTER, isJaxfruit, rollJaxfruitHp, recordJaxfruitAction } from "./monsters/jaxfruit-intent.js";
import { CRAWLER_CHARACTER, isCrawler, rollCrawlerHp, recordCrawlerAction } from "./monsters/crawler-intent.js";
import { INKLET_CHARACTER, isInklet, rollInkletHp, recordInkletAction, capInkletHpLoss } from "./monsters/inklet-intent.js";
import { mountEnemyIntent, refreshEnemyIntents } from "./ui/intent-display.js";
import { createFogmogBattle } from "./monsters/fogmog-battle.js";
import { createPhrogBattle } from "./monsters/phrog-battle.js";
import { PHROG_CHARACTER, WRIGGLER_CHARACTER, INFESTED_COUNT, isPhrogActor, isWriggler, rollPhrogHp, rollWrigglerHp, recordPhrogAction, initializePhrog, skipSpawnedWriggler } from "./monsters/phrog-intent.js";
import { infectionHand, resolveInfection } from "./cards/infection-card.js";
import { isFogmog, isToothedEye, isFogmogActor, isEncounterEnemy,
    recordFogmogAction } from "./monsters/fogmog-intent.js";
import { mountEnergy } from "./ui/energy-display.js";
import { mountHandUI } from "./ui/hand/index.js";
import {
    finishDeathBlow,
    hasPendingDeathBlow,
} from "./battle/death-blow.js";
import {
    STUN_INTENT,
    applyStun,
    clearStun,
    finishStunnedTurn,
    isStunned,
    skipStunnedAction,
} from "./battle/stun-intent.js";
import { recordFlyconidAction } from "./monsters/flyconid-intent.js";
import { recordRaiderAction } from "./monsters/raider-intent.js";
import {
    PLAYER_ENERGY, PLAYER_HAND_LIMIT, cardCost,
    canPayCard, payCard, isActiveCardUse, isXCostCard,
} from "./battle/combat-rules.js";
import { mountBattlePiles } from "./ui/card-library.js";
import { mountGMManager } from "./ui/gm-manager.js";
import { createPlayerTeardown } from "./battle/skill-teardown.js";
import { createBattleResources } from "./battle/battle-resources.js";
import { createModeStorage } from "./progression/mode-storage.js";
import { getDiagnostics } from "../diagnostics/index.js";
import { createBattleSession } from "./battle/battle-session.js";
import { observeFreshEvent } from "./battle/engine-session.js";
import { runPhaseLoop, stopBattleTurn } from "./battle/battle-loop.js";
import { createBattleSettlement } from "./battle/battle-settlement.js";
import { createBattleFlow, quiesceEngine } from "./battle/battle-flow.js";
import { lib, game, ui, get, _status } from "../../../noname.js";
import config from "./config.js";
import { showMap as renderMap } from "./ui/map/index.js";
import { getRandomRewardChoices } from "./progression/reward.js";
import { canAcquireCard } from "./cards/card-definitions.js";
import { addCardToDeck, createRandomCardData } from "./cards/card-data.js";
import { hasUpgradeableCard, upgradeRandomCard } from "./cards/upgrades.js";
import { chooseBattleReward } from "./ui/reward-ui.js";
import { chooseRewardPackage } from "./ui/reward-package.js";
import { applyStoryOutcome, getAvailableStoryChoices } from "./progression/story.js";
import { playDialogue } from "./ui/dialogue.js";
import { chooseButtons } from "./ui/flow-ui.js";
import { openModeSelection } from "./ui/navigation.js";
import {
    completeNode,
    createRun,
    enterNextAct,
    generateActMap,
    getNodeEncounter,
    insertStoryNode,
    nextRandom,
} from "./progression/state.js";

const MODE_ID = config.modeId;
const STYLE_PATH = `${lib.assetURL}extension/术樱包/mengsan`;

const copy = value => JSON.parse(JSON.stringify(value));

const modeStorage = createModeStorage({lib, game, config, localStorage});
const saveRun = async run => {
    const snapshot = copy(run);
    while (true) {
        try { await modeStorage.saveRun(snapshot); return; }
        catch (error) {
            await chooseButtons("存档未完成", [{id:"retry",name:"重试保存"}], "尚未提交本次结果；保留旧存档，不会重新计算奖励或扣款。");
        }
    }
};
const clearRun = modeStorage.clearRun;
const showMap = run => renderMap(run, { saveRun });
let battleSequence = 0;
let activeBattle = null;
const diagnosticService = getDiagnostics();
const diagnostics = diagnosticService.scope("mengsan.mode");
diagnosticService.registerContext("mengsan", () => {
    const run = _status.mengsanRun_shuying;
    const manager = _status.eventManager;
    return {
        runId: run?.runId, revision: run?.revision, actIndex: run?.actIndex,
        character: run?.player?.character, hp: run?.player?.hp,
        sessionId: activeBattle?.session.id,
        flowState: activeBattle?.flow.state, pendingTasks: activeBattle?.session.pendingCount,
        save: modeStorage.lastWrite,
        engine: { paused: _status.paused, paused2: _status.paused2,
            tempEvent: manager?.tempEvent?.name,
            eventStack: manager?.eventStack?.slice(-8).map(event => ({ name: event?.name })) },
    };
});
const reportFlowError = error => {
    diagnostics.error("journey.failed", error);
    console.error("梦三流程暂停，未自动清档：", error);
};

const chooseRun = async savedRun => {
    const available = savedRun?.status === "running";
    const act = available ? config.acts[savedRun.actIndex] : null;
    return chooseButtons("梦三", [
        { id: "continue", name: "继续征程", disabled: !available,
          description: available ? `${get.translation(savedRun.player.character)} · ${act?.name || "未知区域"} · 已完成 ${savedRun.statistics?.completedNodes || 0} 个节点` : "暂无进行中的征程" },
        { id: "new", name: "开始新征程", description: available ? "选择角色，确认后替换当前自动存档" : "选择一名武将，踏入第一关" },
    ], "单一自动存档 · 完成节点后记录进度", { eyebrow: "水墨行军 · 存档选择" });
};

const chooseCharacter = async (backLabel = "返回存档选择") => {
    const choices = config.characters.filter(name => lib.character[name]).map(name => ({
        id: name,
        name: get.translation(name),
        description: lib.translate[`${name}_title`] || "作为本次征程的角色",
    }));
    return chooseButtons("选择出征武将", [...(choices.length ? choices : [{ id: "mengsan_liubei_shuying", name: "刘备" }]), { id: "back", name: backLabel, description: "不会修改现有征程" }], "此武将将陪伴你完成本次征程。", { back: "back", eyebrow: "出征准备" });
};

const chooseDefeatAction = async run => chooseButtons("角色阵亡", [
    {id:"restart", name:"重新开始", description:`以当前角色${get.translation(run.player.character)}从头开始新征程。`},
    {id:"menu", name:"返回主菜单", description:"结束本次征程，清除当前存档并返回模式选择。"},
], "选择前保留上一次地图存档，不自动处理。本次阵亡不发放战斗奖励。", {
    eyebrow:"征程结束", menu:false,
});

const createCardInstance = (run, name = "sha", upgrade = 0, affixes = []) =>
    createRandomCardData(run, name, { random: () => nextRandom(run), upgrade, affixes });

const applyReward = (run, rewardId) => {
    rewardId = resolveRetiredCardReward(rewardId);
    const player = run.player;
    const relicId = config.rewards[rewardId]?.relic;
    if (relicId) {
        if (grantRelic(run, relicId)) {
            game.log(`获得遗物【${getRelic(relicId).name}】`);
        }
        return;
    }
    const cardReward = config.rewards[rewardId]?.card;
    if (cardReward) {
        if (!canAcquireCard(player.character, cardReward.name)) throw new Error(`武将 ${player.character} 无法获得牌：${cardReward.name}`);
        addCardToDeck(run, { ...createCardInstance(run, cardReward.name), ...copy(cardReward) });
        return;
    }
    const support = config.rewards[rewardId]?.support;
    if (support) { grantSupport(run, rewardId, support); return; }
    switch (rewardId) {
        case "card_sha":
            addCardToDeck(run, createCardInstance(run, "sha"));
            break;
        case "card_tao":
            addCardToDeck(run, createCardInstance(run, "tao"));
            break;
        case "upgrade": {
            const card = upgradeRandomCard(player.deck, () => nextRandom(run));
            if (card) game.log("梦三：", get.translation(card.name),
                "强化至", card.upgrade, "级");
            else game.log("梦三：没有可强化卡牌");
            break;
        }
        case "heal":
            player.hp = Math.min(player.maxHp, player.hp + 8);
            break;
        case "max_hp":
            player.maxHp += 5;
            player.hp += 5;
            break;
        case "item_hand":
            grantRelic(run, "mengsan_hand_charm_shuying");
            break;
        case "skill_yingyong":
            if (!player.permanentSkills.includes("mengsan_yingyong_shuying")) {
                player.permanentSkills.push("mengsan_yingyong_shuying");
            }
            break;
    }
};

const chooseReward = async (run, rewardConfig = {}) => {
    const choices = getRandomRewardChoices(run, rewardConfig.rewardPool, 3, {
        allowSharedCards: rewardConfig.allowSharedCardRewards === true,
    }).filter(choice => choice.name);
    const title = rewardConfig.rewardTitle || (rewardConfig.boss ? "极品奖励（三选一）" : "战斗奖励（三选一）");
    const rewardId = await chooseButtons(title, choices, rewardConfig.description);
    const reward = choices.find(choice => choice.id == rewardId);
    if (reward) applyReward(run, reward.effectId || reward.id);
    await finishRelicChoices(run);
};

const finishRelicChoices = run => resolveRelicChoices(run,chooseButtons,{cardName:name=>get.translation(name) || name});

const finishStoryNode = async (run, node) => {
    applyRelicNodeEnter(run,node);
    const content = config.nodeContents?.[node.contentId];
    if (!content || content.kind != "dialogue") {
        await setupBattle(run, node);
        return false;
    }
    await playDialogue(content.dialogue, { run, title: content.name });
    const choices = getAvailableStoryChoices(run, content);
    if (!choices.length) {
        choices.push({ id: "continue", name: "继续", description: "当前没有其他可用选项。", outcome: {} });
    }
    const choiceId = await chooseButtons(content.name, choices, content.description);
    const choice = choices.find(current => current.id == choiceId);
    const outcome = applyStoryOutcome(run, choice?.outcome);
    await playDialogue(outcome.dialogue, { run, title: content.name });
    if (outcome.confirmResult && outcome.result) {
        await chooseButtons(content.name, [{ id: "continue", name: "继续" }], outcome.result);
    }
    if (outcome.battle) {
        await setupBattle(run, node, getNodeEncounter(run, node, outcome.battle));
        return false;
    }
    if (outcome.rewardPool) {
        await chooseReward(run, {
            ...outcome,
            description: outcome.rewardDescription || (!outcome.confirmResult ? outcome.result : ""),
        });
    }
    completeNode(run, node.id);
    await saveRun(run);
    return true;
};

const finishUtilityNode = async (run, node) => {
    applyRelicNodeEnter(run,node);
    applyRoomRelics(run,node,"enter");
    if (node.type == "rest") {
        const used=new Set(),tent=heldRelics(run).some(r=>r.rule.allRestOptions);
        while(true){
        const choices=[
            { id: "heal", name: "休息",
                description: `回复 ${restRecovery(run)} 点生命` },
            { id: "upgrade", name: "磨砺",
                description: hasUpgradeableCard(run.player.deck)
                    ? "随机强化一张尚未满级的可强化牌"
                    : "没有可强化卡牌",
                disabled: !hasUpgradeableCard(run.player.deck) },
        ...relicRestChoices(run)].filter(choice=>!used.has(choice.id));
        if(tent)choices.push({id:"done",name:"离开休息处"});
        if(!choices.some(choice=>!choice.disabled))break;
        const choice=await chooseButtons("休息节点",choices);
        if(choice==="done")break;
        const result=applyRoomRelics(run,node,choice); used.add(choice);
        if(result?.recovered)game.log(`回复${result.recovered}点生命`);
        await finishRelicChoices(run);
        if(!tent)break;
        }
    }
    else if (node.type == "chest") {
        await chooseReward(run, {
            rewardPool: config.acts[run.actIndex].chestRewardPool ||
                "shared.pool.boss.premium",
            rewardTitle: "宝箱奖励（三选一）",
        });
    }
    else if (node.type == "shop") {
        const stockKey=`${run.actIndex}:${node.id}`,state=relicState(run);
        const sampleRelic=(exclude=[])=>{
            const eligible=relicShopRewardIds.filter(id=>!exclude.includes(id) && canAcquireRelic(run,config.rewards[id]?.relic));
            return eligible.length ? eligible[Math.floor(nextRandom(run)*eligible.length)] : null;
        };
        state.shopStock ||= {};
        if(!state.shopStock[stockKey]){
            const stock=[];for(let i=0;i<3;i++)stock.push(sampleRelic(stock));state.shopStock[stockKey]=stock;
        }
        const purchased=new Set();
        await saveRun(run);
        while(true){
        const price = relicShopPrice(run,20),relicPrice=relicShopPrice(run,120);
        const stock=relicState(run).shopStock[stockKey];
        const choices=[
            { id: "card_sha", name: `购买【杀】（${price}金币）`, description: "加入个人牌组", disabled: run.player.gold < price || !canAcquireCard(run.player.character, "sha") },
            { id: "heal", name: `恢复生命（${price}金币）`, description: "回复 8 点生命", disabled: run.player.gold < price },
        ].filter(choice=>!purchased.has(choice.id));
        stock.forEach((id,index)=>{const reward=config.rewards[id];if(reward && canAcquireRelic(run,reward.relic))choices.push({id:`relic:${index}`,name:`${reward.name}（${relicPrice}金币）`,description:reward.description,image:reward.image,disabled:run.player.gold<relicPrice});});
        choices.push({id:"leave",name:"离开",description:"结束购物"});
        const choice=await chooseButtons("商店",choices);
        if (choice != "leave" && choice != null) {
            const selected=choices.find(item=>item.id===choice);
            if(!selected || selected.disabled)throw new Error("梦三商店购买资格无效");
            const relicIndex=choice.startsWith("relic:") ? Number(choice.slice(6)) : null;
            const cost=relicIndex!==null ? relicPrice : price;
            if(run.player.gold<cost)throw new Error("梦三商店金币不足");
            run.player.gold-=cost;recordRelicShopPurchase(run);
            applyReward(run,relicIndex!==null ? stock[relicIndex] : choice);
            await finishRelicChoices(run);
            if(relicIndex!==null)relicState(run).shopStock[stockKey][relicIndex]=heldRelics(run).some(r=>r.wikiId==="the_courier") ? sampleRelic(relicState(run).shopStock[stockKey]) : null;
            else if(!heldRelics(run).some(r=>r.wikiId==="the_courier"))purchased.add(choice);
        } else break;
        }
    }
    else {
        const choices = [
            { id: "gold", name: "收下钱袋", description: "获得 15 金币" },
        ];
        if (run.actIndex !== 0) {
            choices.unshift({
                id: "branch", name: "调查异象",
                description: "在当前路线后插入一个额外剧情战斗节点",
            });
        }
        const choice = await chooseButtons("随机事件", choices);
        if (choice == "branch") insertStoryNode(run, node.id);
        else if (choice == "gold") {
            grantGold(run,15);
        }
    }
    completeNode(run, node.id);
    await saveRun(run);
    return true;
};

const shuffleBattlePile = (run, cards) => {
    for (let index = cards.length - 1; index > 0; index--) {
        const target = Math.floor(nextRandom(run) * (index + 1));
        [cards[index], cards[target]] = [cards[target], cards[index]];
    }
};

const initBattleUnit = (player, spec) => {
    // 只在实际入场且未指定生命时，用征程随机源抽取各怪物的普通生命范围；资料列表不消耗随机数。
    const monsterSpec = spec.camp === "enemy" && spec.hp == null ?
        (spec.character === CRAWLER_CHARACTER ?
            { ...spec, hp: rollCrawlerHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === JAXFRUIT_CHARACTER ?
                { ...spec, hp: rollJaxfruitHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === STRANGLER_CHARACTER ?
                { ...spec, hp: rollStranglerHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === LEAFSLIME_CHARACTER ?
                { ...spec, hp: rollLeafslimeHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === LEAFMEDIUM_CHARACTER ?
                { ...spec, hp: rollLeafslimeMediumHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === TWIGSLIME_CHARACTER ?
                { ...spec, hp: rollTwigslimeHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === TWIGMEDIUM_CHARACTER ?
                { ...spec, hp: rollTwigmediumHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === SHRINKER_CHARACTER ?
                { ...spec, hp: rollShrinkerHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === PHROG_CHARACTER ?
                { ...spec, hp: rollPhrogHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === KIN_FOLLOWER_CHARACTER ?
                { ...spec, hp: rollKinFollowerHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === WRIGGLER_CHARACTER ?
                { ...spec, hp: rollWrigglerHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === BYRDONIS_CHARACTER ?
                { ...spec, hp: rollByrdonisHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === NIBBIT_CHARACTER ?
                { ...spec, hp: rollNibbitHp(() => nextRandom(_status.mengsanRun_shuying)) } :
            spec.character === INKLET_CHARACTER ?
                { ...spec, hp: rollInkletHp(() => nextRandom(_status.mengsanRun_shuying)) } : spec) : spec;
    const monster = spec.camp === "enemy" ? createMonster(monsterSpec) : null;
    player.storage.mengsanUnitId_shuying = spec.id;
    setBattleCamp(player, spec.camp);
    player.init(spec.character, null, spec.inheritSkills !== false);
    setBattleCamp(player, spec.camp);
    player.storage.mengsanUnitId_shuying = spec.id;
    if (monster) {
        player.storage.mengsanMonster_shuying = { tier: monster.tier, draw: monster.draw, handLimit: monster.handLimit };
        player.storage.mengsanMaxEnergy_shuying = monster.energy;
        player.storage.mengsanEnergy_shuying = monster.energy;
    }
    if (spec.maxHp != null || monster) player.maxHp = spec.maxHp ?? monster.hp;
    player.hp = Math.min(spec.hp ?? monster?.hp ?? player.hp, player.maxHp);
    initializeCubex(player, activeBattle);
    initializeByrdonis(player, activeBattle);
    initializeEffigy(player, activeBattle);
    initializeVantom(player, activeBattle);
    initializeBeast(player, activeBattle);
    initializeKin(player, spec, activeBattle);
    initializePhrog(player, spec, activeBattle);
    if (isInklet(player)) {
        const position = spec.inkletPosition ?? 1;
        if (!Number.isInteger(position) || position < 1 || position > 7) throw new RangeError("墨宝站位必须为1~7");
        player.storage.mengsanInkletState_shuying = { position, stage: "opening", turnsTaken: 0 };
        player.storage.mengsanInkletIntent_shuying = null;
        player.storage.mengsanSlippery_shuying = 1;
        player.addSkill("mengsan_slippery_shuying");
        player.markSkill("mengsan_slippery_shuying");
    }
    player.storage.mengsanInitialHand_shuying = spec.hand ?? 4;
    for (const skill of spec.skills || []) player.addSkill(skill);
    player.update();
    return monster || initializeBondUnit(player, spec,
        _status.mengsanRun_shuying);
};

const installMonsterPile = (player, monster, current) => {
    if (!monster) return;
    const run = _status.mengsanRun_shuying;
    const battle = { drawPile: monster.createDeck(`${run.runId}_${player.playerid}`), discardPile: [], exhaustPile: [] };
    for (const card of battle.drawPile) if (!lib.card[card.name]) throw new Error("怪物牌堆中的牌未加载：" + card.name);
    shuffleBattlePile(run, battle.drawPile);
    current.monsterPiles.set(player, installPersonalPiles(current.session, player, battle, run, current.resources, {
        game, ui, get, lib, _status, document, MutationObserver, shuffle: shuffleBattlePile,
        strict: false, refresh() {},
    }));
};

const {
    planEnemyIntent,
    executeFlyconidIntent,
    executeRaiderIntent,
    executeFogmogIntent,
    executeMawlerIntent,
    executeVineIntent,
    executeCubexIntent,
    executeByrdonisIntent,
    executeVantomIntent,
    executeBeastIntent,
    executeKinIntent,
    executeEffigyIntent,
    executePhrogIntent,
    executeNibbitIntent,
    executeShrinkerIntent,
    executeTwigmediumIntent,
    executeTwigslimeIntent,
    executeLeafslimeMediumIntent,
    executeLeafslimeIntent,
    executeStranglerIntent,
    executeJaxfruitIntent,
    executeCrawlerIntent,
    executeInkletIntent,
} = createMonsterIntentActions(game, () => activeBattle);
const { planBondIntent, executeBondIntent } =
    createBondIntentActions(game, () => activeBattle);
const equipBattleUnit = async (player, spec, resources) => {
    for (const info of spec.equipment || []) {
        const card = resources.card(game.createCard(info.name, info.suit, info.number, info.nature));
        await player.equip(card);
    }
};
const spawnBattleUnit = async (current, spec, anchor) => {
    const player = game.addPlayer(anchor ? Number(anchor.dataset.position) + 1 : game.players.length + game.dead.length);
    registerPlayers(current.session, [player]);
    current.resources.bindPlayers([player]);
    const join = game.createEvent("mengsanJoinBattle", false);
    join.player = player;
    join.setContent(async () => {
        const monster = initBattleUnit(player, spec);
        current.fogmog?.register(player, spec);
        installMonsterPile(player, monster, current);
        if (monster) {
            current.energyUI.set(player,
                mountEnergy(player, current.session, document));
            current.intentUI.set(player, mountEnemyIntent(player,
                current.session, STYLE_PATH, document,
                () => getIntentHostiles(game, player)));
        }
        for (const participant of [...game.players, ...game.dead]) participant.setSeatNum(Number(participant.dataset.position) + 1);
        await equipBattleUnit(player, spec, current.resources);
        await player.draw(spec.hand ?? 4);
        await game.triggerEnter(player);
        if (monster && current.session.active) {
            planEnemyIntent(player, _status.mengsanRun_shuying);
            planBondIntent(player);
        }
    });
    await join;
    game.log(player, "作为", spec.camp === "ally" ? "友方支援" : "敌方援军", "加入战斗");
    return player;
};
const createScenario = (plan, current) => {
    const director = createBattleDirector(plan, {
        active: () => current.session.active,
        state: player => ({ hp: player.hp, hand: player.countCards("h"), alive: player.isAlive(),
            camp: player.storage.mengsanCamp_shuying, linked: player.isLinked(), turnedOver: player.isTurnedOver() }),
        dialogue: lines => playDialogue(lines, { run: _status.mengsanRun_shuying, title: "关卡剧情" }),
        spawn: (spec, anchor) => spawnBattleUnit(current, spec, anchor),
        async effect(player, effect) {
            if (effect.type === "draw") await player.draw(effect.amount);
            else if (effect.type === "recover") await player.recover(effect.amount);
            else if (effect.type === "maxHp") await player.gainMaxHp(effect.amount);
            else if (effect.type === "skill") await player.addSkills(effect.skill);
            else if (effect.type === "camp") setBattleCamp(player, effect.camp);
            else if (effect.type === "discardEquipment") {
                const cards = player.getCards("e", card => card.name === effect.name);
                if (cards.length) await player.discard(cards);
            }
        },
        log: name => game.log("关卡条件触发：", name),
    });
    current.session.ownResource(director, () => director.dispose());
    return director;
};

const prepareBattle = async (run, node, encounter, session, resources) => {
    // Old saves keep their deck instances, but the retired affix no longer exists.
    for (const card of run.player.deck) if (Array.isArray(card.affixes)) card.affixes = card.affixes.filter(key => key !== "annihilate");
    if (encounter.requiredCharacter && run.player.character !== encounter.requiredCharacter) throw new Error("该关卡仅限指定主角，请开始刘备的新征程");
    const bondUnit = prepareBondBattle(run, () => nextRandom(run), node);
    const plan = buildBattlePlan(encounter, run, bondUnit);
    const scheduledUnits = [...plan.units, ...plan.rules.flatMap(rule =>
        rule.effects.filter(effect => effect.type === "spawn").map(effect => effect.unit))];
    const fogmogCount = scheduledUnits.filter(spec => spec.character === "mengsan_fogmog_shuying").length;
    const phrogCount = scheduledUnits.filter(spec => spec.character === PHROG_CHARACTER).length;
    if (scheduledUnits.length + fogmogCount + phrogCount * INFESTED_COUNT > 7) throw new Error("召唤需要预留空席位；请减少本场支援数量");
    if (run.bondBattle) {
        game.log(`羁绊助战：${bondDefinitions[run.bondBattle.id].name}，${bondBattleStatus(run.bondBattle)}`);
    }
    if (encounter.encounterPool === "weak" || encounter.encounterPool === "strong") {
        game.log(`普通战斗第${encounter.normalBattleNumber}场：${encounter.encounterPool === "weak" ? "弱怪池" : "强怪池"}，${encounter.name}`);
    }
    for (const spec of [...plan.units, ...plan.rules.flatMap(r => r.effects.filter(e => e.type === "spawn").map(e => e.unit))]) {
        // Bond NPCs may belong to a disabled character pack. Resolve them the
        // same way as native Player.init, without enabling the whole pack.
        if (spec.bondId && !lib.character[spec.character]) {
            const character = get.character(spec.character);
            if (character && !character.isNull) lib.character[spec.character] = character;
        }
        if (!lib.character[spec.character]) throw new Error("关卡武将未加载：" + spec.character);
        for (const skill of spec.skills || []) if (!lib.skill[skill]) throw new Error("关卡技能未加载：" + skill);
        const slots = new Set();
        for (const card of spec.equipment || []) {
            const info = lib.card[card.name];
            if (!info || info.type !== "equip" || !info.subtype || slots.has(info.subtype)) throw new Error("初始装备不存在、不是装备或槽位重复：" + card.name);
            slots.add(info.subtype);
        }
    }
    for (const rule of plan.rules) for (const effect of rule.effects) {
        if (effect.type === "skill" && !lib.skill[effect.skill]) throw new Error("关卡增益技能未加载：" + effect.skill);
    }
    consumeSupports(run);
    document.body.classList.add("mengsan-battle-ui-shuying");
    session.ownResource({}, () => document.body.classList.remove("mengsan-battle-ui-shuying"));
    resources.field(_status, "mengsanRun_shuying", run);
    resources.field(_status, "mengsanNode_shuying", node);
    resources.field(_status, "mengsanEncounter_shuying", encounter);
    resources.field(_status, "mengsanBattle_shuying", {
        resolving: false,
        drawPile: copy(run.player.deck),
        discardPile: [],
        exhaustPile: [],
    });
    shuffleBattlePile(run, _status.mengsanBattle_shuying.drawPile);

    game.prepareArena(1 + plan.units.length);
    resources.capturePreparedArena();
    // Register runtime IDs before card ownership transfers (gain/lose).
    for (const current of game.players) current.getId();
    registerPlayers(session, game.players.slice());
    resources.bindPlayers(game.players);
    const currentBattle = activeBattle;
    currentBattle.phrog = createPhrogBattle(game, currentBattle,
        (spec, anchor) => spawnBattleUnit(currentBattle, spec, anchor));
    currentBattle.fogmog = createFogmogBattle(game, currentBattle,
        (spec, anchor) => spawnBattleUnit(currentBattle, spec, anchor));
    let teardown;
    activeBattle.releaseSkills = () => (teardown ||= createPlayerTeardown([...currentBattle.players], {lib,game,get,_status}))();
    const me = game.me;

    activeBattle.personalPiles = installPersonalPiles(session, me, _status.mengsanBattle_shuying, run, resources, {
        game, ui, get, lib, _status, document, MutationObserver, shuffle: shuffleBattlePile,
        refresh: () => activeBattle?.session === session && activeBattle.pilesUI?.refresh(),
    });
    activeBattle.personalPiles.withOwner(() => me.init(run.player.character));
    me.storage.mengsanUnitId_shuying = "player";
    setBattleCamp(me, "ally");
    const participants = game.players.filter(player => player !== me);
    const monsters = plan.units.map((spec, index) => initBattleUnit(participants[index], spec));
    bindNibbitOpenings(participants);
    plan.units.forEach((spec, index) => installMonsterPile(participants[index], monsters[index], currentBattle));
    if (run.bondBattle?.arrived) game.log(`羁绊助战：${bondDefinitions[run.bondBattle.id].name}已到场，使用独立牌堆`);
    participants.forEach((player, index) => {
        if (monsters[index]) currentBattle.intentUI.set(player,
            mountEnemyIntent(player, session, STYLE_PATH, document,
                () => getIntentHostiles(game, player)));
    });
    participants.forEach(player => {
        if (player.storage.mengsanBond_shuying) {
            currentBattle.energyUI.set(player,
                mountEnergy(player, session, document));
        }
    });
    activeBattle.director = createScenario(plan, currentBattle);
    activeBattle.director.bind("player", me);
    plan.units.forEach((spec, index) => activeBattle.director.bind(spec.id, participants[index]));
    me.storage.mengsanPlayer_shuying = true;
    me.storage.mengsanMaxEnergy_shuying = PLAYER_ENERGY;
    me.storage.mengsanEnergy_shuying = PLAYER_ENERGY;
    currentBattle.energyUI.set(me, mountEnergy(me, session, document));
    currentBattle.handUI = await mountHandUI(me, session, {
        game, ui, get, lib, _status, document, window, cardCost,
        canPayCard, isActiveCardUse,
        styleURL: `${STYLE_PATH}/ui/hand/style.css`,
        log: message => game.log(message),
    });
    if (!session.active) return;
    if (run.player.maxHp == null) {
        run.player.maxHp = me.maxHp;
        run.player.hp = me.hp;
    }
    delete run.sharedBattleCardEffects;
    initializeRelicMaxHp(run);
    me.maxHp = run.player.maxHp;
    me.hp = Math.max(1, Math.min(run.player.hp, me.maxHp));
    me.update();
    currentBattle.relics = createRelicBattle(run, {
        active: () => session.active,
        owner: me, node, encounter,
        piles:currentBattle.personalPiles,
        isStrike: card => isStrikeCard(card,lib),
        draw: number => game.mengsanDraw_shuying(me, number),
        effect: createOpeningEffects(game, me,
            () => currentBattle.energyUI.get(me)?.(), () => nextRandom(run)),
        log: (relic, effect) => {
            game.log(me, `遗物【${relic.name}】发动：${effect}`);
            currentBattle.relicUI?.refresh();
        },
    });
    bindRelicHooks(me,session,currentBattle.relics);
    run.player.permanentSkills.forEach(skill => {
        if (lib.skill[skill] && !me.hasSkill(skill)) me.addSkill(skill);
    });
    for (const skill of [
        "mengsan_draw_shuying", "mengsan_card_use_shuying", "mengsan_ic_bridge_shuying", "mengsan_shared_bridge_shuying",
        "mengsan_card_affixes_shuying", "mengsan_scenario_shuying", "mengsan_intent_refresh_shuying",
        "mengsan_card_payment_shuying", "mengsan_monster_draw_shuying",
        "mengsan_flyconid_action_shuying", "mengsan_raider_action_shuying",
        "mengsan_fogmog_action_shuying", "mengsan_mawler_action_shuying",
        "mengsan_phrog_action_shuying", "mengsan_wriggler_spawned_shuying", "mengsan_infection_damage_shuying", "mengsan_beast_action_shuying", "mengsan_kin_action_shuying", "mengsan_kin_orphan_shuying", "mengsan_vantom_action_shuying", "mengsan_effigy_action_shuying", "mengsan_byrdonis_action_shuying", "mengsan_cubex_action_shuying", "mengsan_vine_action_shuying", "mengsan_nibbit_action_shuying",
        "mengsan_shrinker_action_shuying",
        "mengsan_twigmedium_action_shuying",
        "mengsan_twigslime_action_shuying",
        "mengsan_leafmedium_action_shuying",
        "mengsan_leafslime_action_shuying",
        "mengsan_strangler_action_shuying",
        "mengsan_jaxfruit_action_shuying",
        "mengsan_crawler_action_shuying", "mengsan_inklet_action_shuying",
        "mengsan_bond_action_shuying",
        "mengsan_raider_card_strength_shuying",
        "mengsan_death_blow_finish_shuying",
        "mengsan_stun_skip_shuying", "mengsan_stun_recover_shuying",
        "mengsan_stun_clear_shuying",
        "mengsan_relics_shuying",
        "mengsan_relic_attack_shuying",
        "mengsan_relic_boot_shuying",
    ]) {
        if (!lib.skill.global.includes(skill)) {
            game.addGlobalSkill(skill);
            session.ownResource({}, () => game.removeGlobalSkill(skill));
        }
    }
    activeBattle.pilesUI = mountBattlePiles(session, _status.mengsanBattle_shuying);
    currentBattle.relicUI = mountRelics(session, run, currentBattle.relics);
    activeBattle.gmUI = mountGMManager(session, me, activeBattle.personalPiles, _status.mengsanBattle_shuying, resources, game);
    for (let index = 0; index < plan.units.length; index++) await equipBattleUnit(participants[index], plan.units[index], resources);
    game.syncState();
    _status.event.trigger("gameStart");
    for (const participant of participants) await participant.draw(participant.storage.mengsanInitialHand_shuying ?? 4);
    for (const participant of participants) currentBattle.monsterPiles.get(participant)?.drawInnate();
    if (!session.active) return;
    activeBattle.personalPiles.resetOpeningHand();
    await game.mengsanDraw_shuying(me, Math.max(0,4+currentBattle.relics.drawAdjustment));
    if (!session.active) return;
    activeBattle.personalPiles.drawInnate();
    await currentBattle.relics.start();
    if (!session.active) return;
    await playDialogue(encounter.openingDialogue, { run, title: encounter.name || "开场剧情" });
    if (!session.active) return;
    await currentBattle.director.start();
    if (!session.active) return;
    game.checkResult();
    const loop = game.createEvent("phaseLoop", false);
    loop.player = me;
    loop._isStandardLoop = true;
    let openingHandChecked = false;
    loop.setContent(async event => runPhaseLoop(event, me, session, {game, lib, _status, get, beforeTurn: async player => {
        if (player === me && !openingHandChecked) {
            openingHandChecked = true;
            currentBattle.personalPiles.trimOpeningHand(
                4 + currentBattle.relics.openingHandBonus);
        }
        if (currentBattle.players.has(player) && player.hujia > 0 && !ironcladPreservesBlock(player)) {
            const keep=player===me ? currentBattle.relics.retainedBlock(player.hujia) : 0;
            if(player.hujia>keep)await player.changeHujia(keep-player.hujia);
        }
        if (player.storage.mengsanMaxEnergy_shuying != null) {
            player.storage.mengsanEnergy_shuying = player===me ? currentBattle.relics.resetEnergy(player.storage.mengsanMaxEnergy_shuying,player.storage.mengsanEnergy_shuying) : player.storage.mengsanMaxEnergy_shuying;
            currentBattle.energyUI.get(player)?.();
        }
        if (player === me) currentBattle.fogmog.beforeRound();
        await currentBattle.director.beforeTurn(player);
        if (isFogmogActor(player) || isPhrogActor(player)) planEnemyIntent(player, run);
        if (player === me && session.active) {
            for (const participant of game.players) {
                planEnemyIntent(participant, run);
                planBondIntent(participant);
            }
        }
        game.checkResult();
    }}));
};


const registerPlayers = (session, players) => {
    for (const player of players) {
        activeBattle.players.add(player);
        const id = player.playerid;
        session.ownResource(player, () => {
            if (game.playerMap[id] === player) delete game.playerMap[id];
            for (const list of [game.players, game.dead]) {
                const index = list.indexOf(player); if (index >= 0) list.splice(index, 1);
            }
            if (game.me === player) game.me = null;
            player.remove();
        });
    }
};
const makeFlow = (releaseSkills = async () => {}, releaseBattle = () => {}) => createBattleFlow({
    releaseSkills,
    releaseBattle,
    presentVictory: pending => {
        if (pending.bondGrowth) {
            const growth = pending.bondGrowth;
            game.log(`羁绊【${bondDefinitions[growth.id].name}】进度增加${
                growth.gain}%，当前${growth.level}级（${growth.progress}%）`);
        }
        if (pending.relicRecovery > 0) {
            game.log(`遗物战后回复${pending.relicRecovery}点生命`);
        }
        return playDialogue(pending.victoryDialogue,
            { run: pending.base, title: "战后剧情" });
    },
    settlement:createBattleSettlement({store:modeStorage, config,
        resolveRelicChoices:finishRelicChoices,
        getRandomRewardChoices, applyReward, completeNode, enterNextAct, createRun,
        logRewardPackage: (pack, selection) => {
            const card = pack.upgradeChoices.find(card =>
                card.id === selection.cardId);
            game.log(`梦三：过关奖励 ${pack.gold} 金币，` +
                (card ? `强化【${get.translation(card.name)}】` : "未强化卡牌"));
        },
    }),
    chooseReward: (choices, options) => (options.rewardPackage
        ? chooseRewardPackage : chooseBattleReward)(choices, {
        ...options,
        fixedRewards: options.fixedRewards.map(id => ({
            ...config.rewards[id], id,
        })),
    }),
    chooseDefeat:chooseDefeatAction,
    showMap,
    showEnding:async (route, run) => {
        if (route === "menu") { await openModeSelection(); return; }
        if (route === "victory") {
            await playDialogue(config.acts[run?.actIndex]?.completionDialogue,
                { run, title: "未完待续" });
        }
        game.over(route === "victory");
    },
    quiesce:() => quiesceEngine(_status),
});
const requestBattleFinish = outcome => {
    const current = activeBattle;
    if (!current) return false;
    // Complete the original card and all queued replays before snapshotting a victory.
    if(outcome==="victory" && current.sharedPendingUses?.size){
        diagnostics.info("victory.deferred", { pendingUses: current.sharedPendingUses.size });
        current.sharedDeferredVictory=true;return false;
    }
    for (const player of game.dead) {
        recordBondDeath(player, _status.mengsanRun_shuying,
            message => game.log(message));
    }
    const accepted = current.flow.requestFinish({session:current.session, hp:game.me?.hp || 0, outcome, defeatedEnemies:current.director?.defeatedEnemies ?? 1});
    if (accepted) {
        current.pilesUI?.dispose();
        current.gmUI?.dispose();
        current.relicUI?.dispose();
        current.handUI?.dispose();
        stopBattleTurn(current.session, _status.eventManager);
        if (_status.mengsanBattle_shuying) _status.mengsanBattle_shuying.resolving = true;
        current.finished();
    }
    return accepted;
};
const awaitSettlement = async (flow, initial = flow.wait()) => {
    let operation = initial;
    while (true) {
        try { return await operation; }
        catch (error) {
            if (flow.state !== "retryable") throw error;
            diagnostics.error("settlement.prompt", error, { flowState: flow.state });
            const action = await chooseButtons("结算未完成", [
                {id:"retry",name:"重试保存与结算"},
                {id:"exit",name:"保留已保存进度并返回模式选择"},
            ], "已提交的奖励不会重发。技能释放失败时请返回模式选择，避免重复调用释放回调。");
            diagnostics.info("settlement.prompt.action", { action });
            if (action === "exit") { await openModeSelection(); throw error; }
            operation = flow.retry();
        }
    }
};
const playBattle = async (run, node, encounter) => {
    // Wait for engine boot callbacks BEFORE arena creation; cardsAsync then builds synchronously.
    if (lib.onfree) await new Promise(resolve => lib.onfree.push(resolve));
    await quiesceEngine(_status);
    const session = createBattleSession(`${run.runId}:${++battleSequence}`);
    let resources = createBattleResources(session, {game,ui,_status});
    let current, root;
    const flow = makeFlow(() => current.releaseSkills?.(), () => {
        if (activeBattle === current) activeBattle = null;
        for (const key of Object.keys(current)) {
            if (key !== "session" && key !== "flow") delete current[key];
        }
        root = null; resources = null;
    });
    let finished;
    const signal = new Promise(resolve => { finished = resolve; });
    current = {session, flow, finished, resources, players: new Set(), monsterPiles: new Map(), energyUI: new Map(), intentUI: new Map()};
    activeBattle = current;
    root = new lib.element.GameEvent("mengsanBattle", false, _status.eventManager);
    current.root = root;
    const previousRoot = _status.eventManager.rootEvent;
    session.ownResource({}, () => {
        if (_status.eventManager.rootEvent === root) _status.eventManager.rootEvent = previousRoot;
    });
    root.setContent(async () => { await prepareBattle(run, node, encounter, session, resources); });
    observeFreshEvent(session, root);
    await flow.enterBattle({session,run,node,encounter,start() {
        root.start().catch(error => { current.engineError = error; finished(); });
    }});
    await signal; // External controller, never an engine event content await.
    if (current.engineError) {
        reportFlowError(current.engineError);
        session.requestStop();
        current.handUI?.dispose();
        document.body.classList.remove("mengsan-battle-ui-shuying");
        const reason = current.engineError?.message || String(current.engineError);
        await chooseButtons("战斗流程异常", [{id:"exit",name:"保留存档并返回模式选择"}],
            `错误原因：${reason}。已停止继续开战，上次成功存档仍保留。`);
        await openModeSelection(); return;
    }
    const result = await awaitSettlement(flow);
    if (activeBattle === current) activeBattle = null;
    return result;
};
const setupBattle = async (run, node, encounter = getNodeEncounter(run, node)) => {
    applyRelicNodeEnter(run,node);
    const result = await playBattle(run, node, encounter);
    if (!result) return;
    if (result.route === "map") await routeRun(result.run, result.nextNode, true);
    else if (result.route === "new") await routeRun(result.run);
};
const routeRun = async (run, selected = null, supplied = false) => {
    while (true) {
        const node = supplied ? selected : await showMap(run);
        supplied = false;
        if (!node) { await openModeSelection(); return; }
        if (["event", "rest", "shop", "chest"].includes(node.type)) {
            await finishUtilityNode(run, node);
            continue;
        }
        if (node.type === "story" && config.nodeContents?.[node.contentId]?.kind === "dialogue") {
            if (await finishStoryNode(run, node)) continue;
            return;
        }
        await setupBattle(run, node); return;
    }
};
const startJourney = async () => {
                lib.translate.restart = "返回";
                let run = modeStorage.read()[config.saveKey] || null;
                while (true) {
                    const action = await chooseRun(run);
                    if (action === "continue") break;
                    const character = await chooseCharacter();
                    if (character === "back") continue;
                    if (run) {
                        const decision = await chooseButtons("替换当前存档？", [
                            { id: "cancel", name: "保留原征程", description: "返回存档选择，不作任何修改" },
                            { id: "confirm", name: "确认覆盖并出征", danger: true, description: `以${get.translation(character)}开始新征程，原进度无法撤销` },
                        ], "只有确认后才会创建并写入新征程。", { back: "cancel", eyebrow: "覆盖确认" });
                        if (decision !== "confirm") continue;
                    }
                    run = createRun(character);
                    await saveRun(run);
                    break;
                }
                const canRefreshOldMap = config.characters.includes(run.player.character) && !run.map?.completedNodeIds?.length && run.map?.layoutVersion != config.mapLayoutVersion;
                if (!run.map || run.map.actIndex != run.actIndex || canRefreshOldMap) {
                    run.map = generateActMap(run, run.actIndex);
                    await saveRun(run);
                }
                await routeRun(run);
};

const createMode = () => {
    const nativeChangeHujia = lib.element.Player.prototype.changeHujia;
    const nativeChangeHp = lib.element.Player.prototype.changeHp;
    const nativeAddSkill = lib.element.Player.prototype.addSkill;
    const cardContext = {
        game, get, lib, random:nextRandom, status:_status, getBattle:()=>activeBattle,
        copyToDiscard: createBattleCardCopier(game, () => activeBattle),
        reclaimFromDiscard: createBattleCardReclaimer(game, () => activeBattle, get),
        temporaryStrength: createTemporaryStrength(game, () => activeBattle),
        countStrikeCards: createStrikeCounter(game, () => activeBattle, lib),
        blockDraw: createBlockDrawer(game, () => activeBattle),
        blockUpgrade: createHandUpgrader(game, () => activeBattle, get),
        lifeLossBlock: createLifeLossBlocker(() => activeBattle),
        whirlwind: createWhirlwind(game, () => activeBattle),
        spite: createSpite(game, () => activeBattle),
        rampage: createRampage(game, () => activeBattle),
        playDrawTop: createHavocPlayer(game, () => activeBattle, _status),
        handExhaust: createHandExhauster(game, () => activeBattle, get,
            createRandomHandExhauster(game, () => activeBattle, () => _status.mengsanRun_shuying, nextRandom)),
        battleEnergy: createBattleEnergy(game, () => activeBattle),
        randomHandExhaust: createRandomHandExhauster(game, () => activeBattle, () => _status.mengsanRun_shuying, nextRandom),
        isBattleActive: () => Boolean(activeBattle?.session.active),
    };
    const cardPacks = createCardPackRuntime(cardContext);
    const modeCards = createMengsanCards({cardPacks,isBattleActive:cardContext.isBattleActive});

    return {
        name: MODE_ID,
        character: createScenarioCharacters(lib.element.Character),
        card: modeCards.card,
        connect: false,
        start: [
            async () => {
                // Let the engine start event finish before starting the external controller.
                setTimeout(() => startJourney().catch(reportFlowError), 0);
            },
        ],
        element: {
            player: {
                ...createCampPlayerMethods(game),
                addSkill(skill, ...args) {
                    // 初始武将技能由核心过滤；同时阻止奖励、剧情等动态授予主公技。
                    if (Array.isArray(skill)) skill = skill.filter(name => !lib.skill[name]?.zhuSkill);
                    else if (lib.skill[skill]?.zhuSkill) return;
                    return nativeAddSkill.call(this, skill, ...args);
                },
                async dieAfter() {
                    // 原生死亡已成立；在战斗结算关闭会话前落实斩杀的永久收益。
                    if(this.isDead())await cardPacks.onDeath(_status.event);
                    if(this.isDead())await activeBattle?.relics?.enemyDeath(this);
                    clearKinOwnerIntents(game, activeBattle, this);
                    clearConstrictSource(activeBattle, this);
                    clearShrinkSource(activeBattle, this);
                    activeBattle?.fogmog?.onDeath(this);
                    if (activeBattle?.phrog) await activeBattle.phrog.onDeath(this);
                    recordBondDeath(this, _status.mengsanRun_shuying,
                        message => game.log(message));
                    game.checkResult();
                },
                dieAfter2() {}, // 击杀不额外摸牌或弃牌，奖励由梦三结算流程处理。
                changeHp(num, popup) {
                    const next = nativeChangeHp.call(this, num, popup);
                    if (activeBattle?.session.active) capInkletHpLoss(this, next);
                    if(this===game.me && activeBattle?.session.active && next.num<0){
                        const parent=next.getParent(),armor=parent?.name==="damage" && !parent.nohujia && !this.hasSkillTag("nohujia") ? this.hujia || 0 : 0;
                        next.num=activeBattle.relics?.beforeHpLoss(next.num,armor) ?? next.num;
                    }
                    return next;
                },
                changeHujia(num, type) {
                    if(activeBattle?.session.active && type!=="damage")num=relicBlockAmount(this,beforeIroncladBlock(this,beforeSharedBlock(this,num??1,_status.event),_status.event),_status.event);
                    // 脆弱只削减正向获得的护甲，不改变受伤时消耗护甲的数值。
                    if (this.storage?.mengsanFrail_shuying > 0 && (num == null || num > 0) && type !== "damage") {
                        num = Math.floor((num ?? 1) * 0.75);
                    }
                    return nativeChangeHujia.call(this, num, type, false);
                },
                getHandcardLimit() {
                    if (this.storage?.mengsanPlayer_shuying) {
                        const run = _status.mengsanRun_shuying;
                        const bonus = Number(run?.player?.handLimitBonus || 0);
                        return PLAYER_HAND_LIMIT + bonus;
                    }
                    if (this.storage?.mengsanMonster_shuying) return this.storage.mengsanMonster_shuying.handLimit;
                    if (this.storage?.mengsanBond_shuying) {
                        return this.storage.mengsanBond_shuying.handLimit;
                    }
                    let number = Math.max(this.hp, 0);
                    number = game.checkMod(this, number, "maxHandcardBase", this);
                    number = game.checkMod(this, number, "maxHandcard", this);
                    number = game.checkMod(this, number, "maxHandcardFinal", this);
                    return Math.max(0, number);
                },
            },
        },
        game: {
            getVideoName() {
                const me = game.me;
                const names = [me?.name1 || me?.name, me?.name2].filter(Boolean);
                return [names.map(name => get.translation(name)).join("/") || "梦三",
                    "梦三" + (_status.mengsanEncounter_shuying?.name ? " · " + _status.mengsanEncounter_shuying.name : "")];
            },
            mengsanSetEnemyIntent_shuying(player, intent) {
                const update = activeBattle?.intentUI.get(player);
                if (!update) return false;
                update(intent);
                return true;
            },
            mengsanStunEnemy_shuying(player, options = {}) {
                const update = activeBattle?.intentUI.get(player);
                if (!activeBattle?.session.active || !update ||
                    !player?.isAlive() ||
                    player.storage?.mengsanCamp_shuying !== "enemy") {
                    return false;
                }
                if (isStunned(player)) return false;
                const { resume = "advance", recover } = options;
                const flyconid = isFlyconid(player);
                const raider = isRaider(player);
                const fogmog = isFogmogActor(player);
                const mawler = isMawler(player);
                const vine = isVine(player);
                const cubex = isCubex(player);
                const byrdonis = isByrdonis(player);
                const effigy = isEffigy(player);
                const vantom = isVantom(player);
                const beast = isBeast(player);
                const kin = isKinActor(player);
                const phrog = isPhrogActor(player);
                const nibbit = isNibbit(player);
                const shrinker = isShrinker(player);
                const twigmedium = isTwigmedium(player);
                const twigslime = isTwigslime(player);
                const leafmedium = isLeafslimeMedium(player);
                const leafslime = isLeafslime(player);
                const strangler = isStrangler(player);
                const jaxfruit = isJaxfruit(player);
                const crawler = isCrawler(player);
                const inklet = isInklet(player);
                const intent = options.intent ?? (flyconid ?
                    player.storage.mengsanFlyconidIntent_shuying : raider ?
                    player.storage.mengsanRaiderIntent_shuying : fogmog ?
                    player.storage.mengsanFogmogIntent_shuying : mawler ?
                    player.storage.mengsanMawlerIntent_shuying : crawler ?
                    player.storage.mengsanCrawlerIntent_shuying : inklet ?
                    player.storage.mengsanInkletIntent_shuying : jaxfruit ?
                    player.storage.mengsanJaxfruitIntent_shuying : strangler ?
                    player.storage.mengsanStranglerIntent_shuying : leafslime ?
                    player.storage.mengsanLeafslimeIntent_shuying : leafmedium ?
                    player.storage.mengsanLeafslimeMediumIntent_shuying : twigslime ?
                    player.storage.mengsanTwigslimeIntent_shuying : twigmedium ?
                    player.storage.mengsanTwigmediumIntent_shuying : shrinker ?
                    player.storage.mengsanShrinkerIntent_shuying : vine ?
                    player.storage.mengsanVineIntent_shuying : nibbit ?
                    player.storage.mengsanNibbitIntent_shuying : cubex ?
                    player.storage.mengsanCubexIntent_shuying : byrdonis ?
                    player.storage.mengsanByrdonisIntent_shuying : effigy ?
                    player.storage.mengsanEffigyIntent_shuying : phrog ?
                    player.storage.mengsanPhrogIntent_shuying : vantom ?
                    player.storage.mengsanVantomIntent_shuying : kin ?
                    player.storage.mengsanKinIntent_shuying : beast ?
                    player.storage.mengsanBeastIntent_shuying : null);
                const restore = recover || (flyconid ?
                    (choice, original) => {
                        const state =
                            player.storage.mengsanFlyconidState_shuying || {};
                        player.storage.mengsanFlyconidState_shuying =
                            recordFlyconidAction(state, null, false);
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanFlyconidIntent_shuying = next;
                        return next;
                    } : raider ? (choice, original) => {
                        player.storage.mengsanRaiderState_shuying = recordRaiderAction(player.storage.mengsanRaiderState_shuying || {});
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanRaiderIntent_shuying = next;
                        return next;
                    } : fogmog ? (choice, original) => {
                        if (isFogmog(player)) player.storage.mengsanFogmogState_shuying =
                            recordFogmogAction(player.storage.mengsanFogmogState_shuying || {}, null, false);
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanFogmogIntent_shuying = next;
                        return next;
                    } : mawler ? (choice, original) => {
                        player.storage.mengsanMawlerState_shuying =
                            recordMawlerAction(player.storage.mengsanMawlerState_shuying || {}, null, false);
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanMawlerIntent_shuying = next;
                        return next;
                    } : crawler ? (choice, original) => {
                        player.storage.mengsanCrawlerState_shuying =
                            recordCrawlerAction(player.storage.mengsanCrawlerState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanCrawlerIntent_shuying = next;
                        return next;
                    } : inklet ? (choice, original) => {
                        player.storage.mengsanInkletState_shuying =
                            recordInkletAction(player.storage.mengsanInkletState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanInkletIntent_shuying = next;
                        return next;
                    } : jaxfruit ? (choice, original) => {
                        player.storage.mengsanJaxfruitState_shuying =
                            recordJaxfruitAction(player.storage.mengsanJaxfruitState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanJaxfruitIntent_shuying = next;
                        return next;
                    } : strangler ? (choice, original) => {
                        player.storage.mengsanStranglerState_shuying =
                            recordStranglerAction(player.storage.mengsanStranglerState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanStranglerIntent_shuying = next;
                        return next;
                    } : leafslime ? (choice, original) => {
                        player.storage.mengsanLeafslimeState_shuying =
                            recordLeafslimeAction(player.storage.mengsanLeafslimeState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanLeafslimeIntent_shuying = next;
                        return next;
                    } : leafmedium ? (choice, original) => {
                        player.storage.mengsanLeafslimeMediumState_shuying =
                            recordLeafslimeMediumAction(player.storage.mengsanLeafslimeMediumState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanLeafslimeMediumIntent_shuying = next;
                        return next;
                    } : twigslime ? (choice, original) => {
                        player.storage.mengsanTwigslimeState_shuying =
                            recordTwigslimeAction(player.storage.mengsanTwigslimeState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanTwigslimeIntent_shuying = next;
                        return next;
                    } : twigmedium ? (choice, original) => {
                        player.storage.mengsanTwigmediumState_shuying =
                            recordTwigmediumAction(player.storage.mengsanTwigmediumState_shuying || {}, original, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanTwigmediumIntent_shuying = next;
                        return next;
                    } : shrinker ? (choice, original) => {
                        player.storage.mengsanShrinkerState_shuying =
                            recordShrinkerAction(player.storage.mengsanShrinkerState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanShrinkerIntent_shuying = next;
                        return next;
                    } : vine ? (choice, original) => {
                        player.storage.mengsanVineState_shuying =
                            recordVineAction(player.storage.mengsanVineState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanVineIntent_shuying = next;
                        return next;
                    } : nibbit ? (choice, original) => {
                        player.storage.mengsanNibbitState_shuying =
                            recordNibbitAction(player.storage.mengsanNibbitState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanNibbitIntent_shuying = next;
                        return next;
                    } : cubex ? (choice, original) => {
                        player.storage.mengsanCubexState_shuying =
                            recordCubexAction(player.storage.mengsanCubexState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanCubexIntent_shuying = next;
                        return next;
                    } : byrdonis ? (choice, original) => {
                        player.storage.mengsanByrdonisState_shuying =
                            recordByrdonisAction(player.storage.mengsanByrdonisState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanByrdonisIntent_shuying = next;
                        return next;
                    } : phrog ? (choice, original) => {
                        player.storage.mengsanPhrogState_shuying =
                            recordPhrogAction(player.storage.mengsanPhrogState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanPhrogIntent_shuying = next;
                        return next;
                    } : effigy ? (choice, original) => {
                        player.storage.mengsanEffigyState_shuying =
                            recordEffigyAction(player.storage.mengsanEffigyState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanEffigyIntent_shuying = next;
                        return next;
                    } : vantom ? (choice, original) => {
                        player.storage.mengsanVantomState_shuying =
                            recordVantomAction(player.storage.mengsanVantomState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanVantomIntent_shuying = next;
                        return next;
                    } : kin ? (choice, original) => {
                        player.storage.mengsanKinState_shuying =
                            recordKinAction(player.storage.mengsanKinState_shuying || {}, choice !== "retry");
                        const next = choice === "retry" ? original : null;
                        player.storage.mengsanKinIntent_shuying = next;
                        return next;
                    } : beast ? (choice, original) => recoverBeastStun(player, choice, original) : null);
                const onRecover = async (choice, original) => {
                    const next = await restore(choice, original);
                    update(next === undefined ?
                        (choice === "retry" ? original : null) : next);
                };
                if (typeof restore !== "function") {
                    throw new TypeError("此怪物需要击晕恢复回调");
                }
                if (!applyStun(player, intent, { resume, recover: onRecover })) {
                    return false;
                }
                update(STUN_INTENT);
                return true;
            },
            async mengsanPersistRun_shuying(run) {
                // 战斗中（包括阵亡等待选择期间）的永久成长先留在内存，过关才提交。
                if (activeBattle && activeBattle.session.state !== "disposed") return;
                await saveRun(run);
            },
            async mengsanClearRun_shuying() {
                await clearRun();
            },
            mengsanFailRun_shuying(reason = "征程失败") {
                game.log(reason);
                return requestBattleFinish("defeat");
            },
            async mengsanDraw_shuying(player, number = 1) {
                if (!player?.storage?.mengsanPlayer_shuying || number <= 0) return [];
                if(ironcladBlocksDraw(player) || relicBlocksDraw(player))return [];
                const battle = _status.mengsanBattle_shuying;
                const run = _status.mengsanRun_shuying;
                if (!battle || battle.drawPile.length + battle.discardPile.length < number) {
                    await game.mengsanFailRun_shuying("个人牌堆与弃牌堆不足，挑战失败");
                    return [];
                }
                const result = activeBattle.personalPiles.take(number);
                if (!result.length) return [];
                player.directgain(result);
                player.$draw(result.length);
                game.log(player, "从个人牌堆摸了", get.cnNumber(result.length), "张牌");
                await afterSharedDraw(player,result);
                await afterIroncladDraw(player,result);
                await flushRelicExhaust(player);
                return result;
            },
            mengsanFinishBattle_shuying() {
                return requestBattleFinish("victory");
            },
            checkResult() {
                const current = activeBattle;
                if (!current?.session.active || !current.director?.ready || current.director.busy || current.phrog?.pending || current.resultCheckQueued) return;
                if(current.sharedPendingUses?.size && game.me?.isAlive())return;
                current.resultCheckQueued = true;
                const next = game.createEvent("mengsanScenarioResult", false);
                next.setContent(async () => {
                    try {
                        await current.director.evaluate("state");
                        if (!current.session.active) return;
                        if (!game.me || game.me.isDead()) game.mengsanFailRun_shuying("角色死亡，征程结束");
                        else if (!game.players.some(isEncounterEnemy) && !current.director.pendingEnemies && !current.phrog?.pending) game.mengsanFinishBattle_shuying();
                    } finally { current.resultCheckQueued = false; }
                });
            },
        },
        get: {
            rawAttitude: campAttitude,
            realAttitude: campAttitude,
        },
        skill: {
            ...cardPacks.skills,
            ...createRelicSkills(() => activeBattle, () => game.me),
            ...createRelicCombatSkills(() => activeBattle, () => game.me),
            mengsan_taoyuan_bond_shuying: {
                locked: true, mark: true, marktext: "义",
                intro: { content: "先天结识关羽、张飞，初始羁绊均为8级，默认选择关羽助战。可在行军菜单中更换。" },
            },
            mengsan_card_payment_shuying: {
                forced: true, silent: true, popup: false,
                firstDo: true, priority: 10000,
                trigger: { global: "useCard0" },
                filter(event) { return event.player?.storage?.mengsanMaxEnergy_shuying != null &&
                    lib.card[event.card?.name]?.mengsanCost_shuying != null &&
                    (isActiveCardUse(event, event.player) ||
                        isXCostCard(event.card) && event.name === "useCard"); },
                async content(event, trigger) {
                    if (trigger.mengsanPaid_shuying) return;
                    if (!payCard(trigger.player, trigger.card, trigger, activeBattle)) {
                        trigger.cancel();
                        game.log(trigger.player, "费用不足，不能使用", trigger.card);
                        return;
                    }
                    trigger.mengsanPaid_shuying = true;
                    activeBattle?.energyUI.get(trigger.player)?.();
                },
            },
            mengsan_monster_draw_shuying: {
                trigger: { player: "phaseDrawBegin2" },
                forced: true, silent: true, popup: false,
                filter(event, player) {
                    return Boolean(player.storage?.mengsanMonster_shuying ||
                        player.storage?.mengsanBond_shuying);
                },
                async content(event, trigger, player) {
                    trigger.num = isStunned(player) || isToothedEye(player) ||
                        isKinFollower(player) && !canActKin(game, activeBattle, player) ? 0 :
                        (player.storage.mengsanMonster_shuying ||
                            player.storage.mengsanBond_shuying).draw;
                },
            },
            mengsan_flyconid_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    !isStunned(event.player) && isFlyconid(event.player) &&
                    event.player.storage.mengsanFlyconidIntent_shuying); },
                async content(event, trigger) { await executeFlyconidIntent(trigger.player); },
            },
            mengsan_raider_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    !isStunned(event.player) && isRaider(event.player) &&
                    event.player.storage.mengsanRaiderIntent_shuying); },
                async content(event, trigger) { await executeRaiderIntent(trigger.player); },
            },
            mengsan_inklet_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isInklet(event.player) &&
                    event.player.storage.mengsanInkletIntent_shuying); },
                async content(event, trigger) { await executeInkletIntent(trigger.player); },
            },
            mengsan_slippery_shuying: {
                mark: true, marktext: "滑",
                onremove(player) { delete player.storage.mengsanSlippery_shuying; },
                intro: { content(storage, player) { return `滑溜${player.storage.mengsanSlippery_shuying || 0}：下一次实际生命损失限制为1，完全格挡不消耗`; } },
                trigger: { player: "changeHp" },
                forced: true, silent: true, popup: false,
                filter(event, player) { return Boolean(activeBattle?.session.active && (isInklet(player) || isVantom(player)) &&
                    player.storage.mengsanSlippery_shuying > 0 && event.num < 0 && event.changedHp < 0); },
                async content(event, trigger, player) {
                    player.storage.mengsanSlippery_shuying = Math.max(0, player.storage.mengsanSlippery_shuying - 1);
                    if (player.storage.mengsanSlippery_shuying) player.markSkill("mengsan_slippery_shuying");
                    else player.removeSkill("mengsan_slippery_shuying");
                },
            },
            mengsan_crawler_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isCrawler(event.player) &&
                    event.player.storage.mengsanCrawlerIntent_shuying); },
                async content(event, trigger) { await executeCrawlerIntent(trigger.player); },
            },
            mengsan_jaxfruit_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isJaxfruit(event.player) &&
                    event.player.storage.mengsanJaxfruitIntent_shuying); },
                async content(event, trigger) { await executeJaxfruitIntent(trigger.player); },
            },
            mengsan_strangler_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isStrangler(event.player) &&
                    event.player.storage.mengsanStranglerIntent_shuying); },
                async content(event, trigger) { await executeStranglerIntent(trigger.player); },
            },
            mengsan_leafslime_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isLeafslime(event.player) &&
                    event.player.storage.mengsanLeafslimeIntent_shuying); },
                async content(event, trigger) { await executeLeafslimeIntent(trigger.player); },
            },
            mengsan_leafmedium_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isLeafslimeMedium(event.player) &&
                    event.player.storage.mengsanLeafslimeMediumIntent_shuying); },
                async content(event, trigger) { await executeLeafslimeMediumIntent(trigger.player); },
            },
            mengsan_twigslime_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isTwigslime(event.player) &&
                    event.player.storage.mengsanTwigslimeIntent_shuying); },
                async content(event, trigger) { await executeTwigslimeIntent(trigger.player); },
            },
            mengsan_twigmedium_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isTwigmedium(event.player) &&
                    event.player.storage.mengsanTwigmediumIntent_shuying); },
                async content(event, trigger) { await executeTwigmediumIntent(trigger.player); },
            },
            mengsan_shrinker_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isShrinker(event.player) &&
                    event.player.storage.mengsanShrinkerIntent_shuying); },
                async content(event, trigger) { await executeShrinkerIntent(trigger.player); },
            },
            mengsan_vine_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isVine(event.player) &&
                    event.player.storage.mengsanVineIntent_shuying); },
                async content(event, trigger) { await executeVineIntent(trigger.player); },
            },
            mengsan_cubex_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isCubex(event.player) &&
                    event.player.storage.mengsanCubexIntent_shuying); },
                async content(event, trigger) { await executeCubexIntent(trigger.player); },
            },
            mengsan_byrdonis_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isByrdonis(event.player) &&
                    event.player.storage.mengsanByrdonisIntent_shuying); },
                async content(event, trigger) { await executeByrdonisIntent(trigger.player); },
            },
            mengsan_vantom_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isVantom(event.player) &&
                    event.player.storage.mengsanVantomIntent_shuying); },
                async content(event, trigger) { await executeVantomIntent(trigger.player); },
            },
            mengsan_beast_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isBeast(event.player) &&
                    event.player.storage.mengsanBeastIntent_shuying); },
                async content(event, trigger) { await executeBeastIntent(trigger.player); },
            },
            mengsan_kin_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isKinActor(event.player) &&
                    event.player.storage.mengsanKinIntent_shuying); },
                async content(event, trigger) { await executeKinIntent(trigger.player, trigger); },
            },
            mengsan_kin_orphan_shuying: {
                trigger: { global: "phaseBefore" },
                forced: true, silent: true, popup: false, priority: 1000,
                filter(event) { return Boolean(activeBattle?.session.active && event.player?.isAlive() &&
                    isKinFollower(event.player) && !canActKin(game, activeBattle, event.player)); },
                async content(event, trigger) { trigger.cancel(); },
            },
            mengsan_kin_minion_shuying: {
                mark: true, marktext: "爪",
                intro: { content: "爪牙：击败所属同族神官即可获胜，不需要击败信徒；神官死亡后不再行动。" },
            },
            mengsan_phrog_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && !event.player?.storage?.mengsanPhrogState_shuying?.spawned && isPhrogActor(event.player) &&
                    event.player.storage.mengsanPhrogIntent_shuying); },
                async content(event, trigger) { await executePhrogIntent(trigger.player); },
            },
            mengsan_effigy_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isEffigy(event.player) &&
                    event.player.storage.mengsanEffigyIntent_shuying); },
                async content(event, trigger) { await executeEffigyIntent(trigger.player, trigger); },
            },
            mengsan_nibbit_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isNibbit(event.player) &&
                    event.player.storage.mengsanNibbitIntent_shuying); },
                async content(event, trigger) { await executeNibbitIntent(trigger.player); },
            },
            mengsan_mawler_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    event.player?.isAlive() && !isStunned(event.player) && isMawler(event.player) &&
                    event.player.storage.mengsanMawlerIntent_shuying); },
                async content(event, trigger) { await executeMawlerIntent(trigger.player); },
            },
            mengsan_fogmog_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) { return Boolean(activeBattle?.session.active &&
                    !isStunned(event.player) && isFogmogActor(event.player)); },
                async content(event, trigger) {
                    await executeFogmogIntent(trigger.player);
                    if (isToothedEye(trigger.player)) trigger.cancel();
                },
            },
            mengsan_fogmog_illusion_shuying: {
                mark: true, marktext: "幻",
                intro: { content: "爪牙：雾菇存活时，死亡后的下一轮以6点生命复活；不单独阻止战斗胜利。" },
            },
            mengsan_bond_action_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 100,
                filter(event) {
                    return Boolean(activeBattle?.session.active &&
                        !isStunned(event.player) &&
                        event.player.storage?.mengsanBond_shuying?.intent);
                },
                async content(event, trigger) {
                    await executeBondIntent(trigger.player);
                },
            },
            mengsan_setup_strength_shuying: {
                trigger: { source: "damageBegin1", global: ["phaseAfter", "dieAfter"] },
                forced: true, silent: true, popup: false, priority: 85, forceDie: true, forceOut: true,
                mark: true, marktext: "力",
                intro: { content(storage, player) { return `临时力量：攻击伤害增加${player.storage.mengsanSetupStrength_shuying || 0}点`; } },
                onremove(player) { forgetTemporaryStrength(player); },
                filter(event, player) {
                    if (event.name === "damage") {
                        return Boolean(temporaryStrengthAmount(player, activeBattle) > 0 &&
                            (event.card || event.mengsanAttack_shuying) &&
                            !event.mengsanScriptedSkill_shuying && !event.mengsanSetupStrengthApplied_shuying);
                    }
                    return event.name === "die" ? event.player === player &&
                        Boolean(player.storage.mengsanSetupStrength_shuying) : temporaryStrengthExpires(player, event);
                },
                async content(event, trigger, player) {
                    if (event.triggername === "damageBegin1") {
                        trigger.num += temporaryStrengthAmount(player, activeBattle);
                        trigger.mengsanSetupStrengthApplied_shuying = true;
                    } else if(trigger.name==="phase")expireTemporaryStrength(player,trigger);
                    else clearTemporaryStrength(player);
                },
            },
            mengsan_raider_card_strength_shuying: {
                trigger: { source: "damageBegin1" },
                forced: true, silent: true, popup: false, priority: 90,
                filter(event, player) { return Boolean(activeBattle?.session.active &&
                    (isRaider(player) || isFogmog(player) || isCrawler(player) || isInklet(player) || isJaxfruit(player) || isStrangler(player) || isLeafslime(player) || isLeafslimeMedium(player) || isTwigslime(player) || isTwigmedium(player) || isShrinker(player) || isVine(player) || isNibbit(player) || isCubex(player) || isByrdonis(player) || isEffigy(player) || isPhrogActor(player) || isVantom(player) || isKinActor(player) || isBeast(player) && !isStunned(player) || player.storage.mengsanBond_shuying) &&
                    (player.storage.mengsanStrength_shuying > 0 || sharedStrengthPenalty(player)>0) &&
                    event.card && !event.mengsanScriptedSkill_shuying &&
                    !event.mengsanCardStrengthApplied_shuying); },
                async content(event, trigger, player) {
                    trigger.num = Math.max(0,trigger.num+(player.storage.mengsanStrength_shuying||0)-sharedStrengthPenalty(player));
                },
            },
            mengsan_plow_shuying: {
                mark: true, marktext: "撞",
                intro: { content(storage, player) { return `横冲直撞${player.storage.mengsanPlow_shuying || 0}层：受到伤害后生命不高于此值，击晕、清零力量并进入第二阶段。`; } },
                onremove(player) { delete player.storage.mengsanPlow_shuying; },
                trigger: { player: "damageEnd" }, forced: true, silent: true, popup: false, priority: 1000,
                filter(event, player) { return canBreakPlow(player, activeBattle, event); },
                async content(event, trigger, player) { breakPlow(game, activeBattle, player, trigger); },
            },
            mengsan_ringing_shuying: {
                mark: true, marktext: "眩",
                intro: { content: "昏眩：本次自身回合至多主动使用1张牌，回合结束解除；不限制响应。不可叠加。" },
                onremove(player) { clearRinging(player); },
                mod: {
                    cardEnabled(card, player) { if (activeBattle?.session.active && ringingLimited(player, _status.event)) return false; },
                    cardEnabled2(card, player) { if (activeBattle?.session.active && ringingLimited(player, _status.event)) return false; },
                },
                trigger: { player: ["useCard0", "useCard1", "phaseBefore", "phaseAfter", "dieAfter"] },
                forced: true, silent: true, popup: false, firstDo: true, priority: 11000,
                filter(event, player) { return Boolean(activeBattle?.session.active && player.storage.mengsanRinging_shuying &&
                    (event.name !== "useCard" || isActiveCardUse(event, player))); },
                async content(event, trigger, player) {
                    if (event.triggername === "useCard0") { if (ringingLimited(player, trigger)) trigger.cancel(); }
                    else if (event.triggername === "useCard1") countRingingCard(player, activeBattle, trigger);
                    else if (event.triggername === "phaseBefore") player.storage.mengsanRingingUsed_shuying = 0;
                    else { player.removeSkill("mengsan_ringing_shuying"); activeBattle?.handUI?.refresh(); }
                },
            },
            mengsan_raider_strength_shuying: {
                mark: true, marktext: "力",
                intro: { content(storage, player) { return `攻击伤害增加${player.storage.mengsanStrength_shuying || 0}点`; } },
                onremove(player) { delete player.storage.mengsanStrength_shuying; },
            },
            mengsan_stun_skip_shuying: {
                trigger: { global: "phaseUseBefore" },
                forced: true, silent: true, popup: false, priority: 200,
                filter(event) {
                    return Boolean(activeBattle?.session.active &&
                        isStunned(event.player));
                },
                async content(event, trigger) {
                    skipStunnedAction(trigger.player, trigger);
                },
            },
            mengsan_stun_recover_shuying: {
                trigger: { global: "phaseAfter" },
                forced: true, silent: true, popup: false, priority: 200,
                filter(event) {
                    return Boolean(activeBattle?.session.active &&
                        isStunned(event.player));
                },
                async content(event, trigger) {
                    await finishStunnedTurn(trigger.player);
                },
            },
            mengsan_stun_clear_shuying: {
                trigger: { global: "dieAfter" },
                forced: true, silent: true, popup: false,
                filter(event) { return isStunned(event.player); },
                async content(event, trigger) {
                    clearStun(trigger.player);
                },
            },
            mengsan_death_blow_finish_shuying: {
                trigger: { global: "phaseUseAfter" },
                forced: true, silent: true, popup: false,
                filter(event) {
                    return Boolean(activeBattle?.session.active &&
                        hasPendingDeathBlow(event.player));
                },
                async content(event, trigger) {
                    await finishDeathBlow(trigger.player);
                },
            },
            mengsan_frail_shuying: {
                mark: true, marktext: "脆",
                onremove(player) { delete player.storage.mengsanFrail_shuying; },
                intro: { content(storage, player) { return `剩余${player.storage.mengsanFrail_shuying || 0}回合：获得护甲减少25%（向下取整）`; } },
                trigger: { player: "phaseAfter" },
                forced: true, silent: true, popup: false,
                async content(event, trigger, player) {
                    const remaining = Math.max(0, (player.storage.mengsanFrail_shuying || 0) - 1);
                    player.storage.mengsanFrail_shuying = remaining;
                    if (remaining) player.markSkill("mengsan_frail_shuying");
                    else player.removeSkill("mengsan_frail_shuying");
                },
            },
            mengsan_constrict_shuying: {
                mark: true, marktext: "缠",
                intro: { content(storage, player) { return `紧缠${player.storage.mengsanConstrict_shuying || 0}层：自身回合结束时受到等量非攻击伤害，来源死亡解除。`; } },
                onremove(player) { delete player.storage.mengsanConstrict_shuying; activeBattle?.stranglerConstrict?.delete(player); },
                trigger: { player: "phaseJieshuBegin" },
                forced: true, silent: true, popup: false,
                filter(event, player) { return constrictTotal(activeBattle, player) > 0; },
                async content(event, trigger, player) { await resolveConstrict(activeBattle, player); },
            },
            mengsan_slow_shuying: {
                mark: true, marktext: "缓",
                intro: {
                    markcount(storage, player) { return slowPercent(player); },
                    content(storage, player) { return `缓慢${player.storage.mengsanSlow_shuying || 0}层：本回合攻击伤害增加${slowPercent(player)}%。友方每使用一张牌增加10%，换回合清零。`; },
                },
                onremove(player) { delete player.storage.mengsanSlow_shuying; delete player.storage.mengsanSlowCards_shuying; },
                trigger: { player: "damageBegin3", global: ["useCardAfter", "phaseBefore", "phaseAfter"] },
                forced: true, silent: true, popup: false, priority: 20,
                filter(event, player) {
                    if (!activeBattle?.session.active || !isEffigy(player) || !player.isAlive() || !player.storage.mengsanSlow_shuying) return false;
                    if (event.name === "damage") return slowApplies(player, event);
                    if (event.name === "useCard") return canCountSlowCard(player, activeBattle, event, _status.currentPhase);
                    return event.name === "phase";
                },
                async content(event, trigger, player) {
                    if (event.triggername === "damageBegin3") {
                        trigger.num = slowAttackDamage(trigger.num, player);
                        trigger.mengsanSlowApplied_shuying = true;
                    } else if (event.triggername === "useCardAfter") recordSlowCard(player, activeBattle, trigger, _status.currentPhase);
                    else resetSlow(player);
                },
            },
            mengsan_territorial_shuying: {
                mark: true, marktext: "领",
                intro: { content(storage, player) { return `多尼斯异鸟的领地意识${player.storage.mengsanTerritorial_shuying || 0}层：自身回合结束时获得等量力量。`; } },
                onremove(player) { delete player.storage.mengsanTerritorial_shuying; },
                trigger: { player: "phaseAfter" },
                forced: true, silent: true, popup: false,
                filter(event, player) { return Boolean(activeBattle?.session.active && isByrdonis(player) &&
                    event.player === player && player.isAlive() && player.storage.mengsanTerritorial_shuying > 0); },
                async content(event, trigger, player) { resolveTerritorial(player, activeBattle); },
            },
            mengsan_artifact_shuying: {
                mark: true, marktext: "制",
                intro: { content(storage, player) { return `人工制品${player.storage.mengsanArtifact_shuying || 0}层：每层抵消一次梦三负面状态施加，不抵消伤害。`; } },
                onremove(player) { delete player.storage.mengsanArtifact_shuying; },
            },
            mengsan_tangled_shuying: {
                mark: true, marktext: "藤",
                intro: { content(storage, player) { return `剩余${player.storage.mengsanTangled_shuying || 0}回合：攻击牌费用增加1（持续回合可叠加，加费不叠加）。`; } },
                onremove(player) { delete player.storage.mengsanTangled_shuying; activeBattle?.tangledTargets?.delete(player); if (activeBattle?.session.active) activeBattle.handUI?.refresh(); },
                trigger: { player: "phaseAfter" },
                forced: true, silent: true, popup: false,
                filter(event, player) { return Boolean(activeBattle?.session.active && player.storage.mengsanTangled_shuying > 0); },
                async content(event, trigger, player) { advanceTangled(activeBattle, player); },
            },
            mengsan_shrink_shuying: {
                mark: true, marktext: "缩",
                intro: { content: "攻击伤害减少30%（向下取整），不重复叠加；来源死亡解除。" },
                onremove(player) { delete player.storage.mengsanShrink_shuying; activeBattle?.shrinkerSources?.delete(player); },
                trigger: { source: "damageBegin1" },
                forced: true, silent: true, popup: false, priority: 70,
                filter(event, player) {
                    return Boolean(activeBattle?.session.active && !event.mengsanScriptedSkill_shuying &&
                        !event.mengsanShrinkApplied_shuying && (event.card || event.mengsanAttack_shuying) &&
                        isShrunk(activeBattle, player));
                },
                async content(event, trigger, player) {
                    trigger.num = shrinkAttackDamage(trigger.num, player);
                    trigger.mengsanShrinkApplied_shuying = true;
                },
            },
            mengsan_vulnerable_shuying: {
                mark: true, marktext: "易",
                onremove(player) { delete player.storage.mengsanVulnerable_shuying; },
                intro: { content(storage, player) { return `剩余${player.storage.mengsanVulnerable_shuying || 0}回合：受到攻击伤害增加50%（向上取整）`; } },
                trigger: { player: ["damageBegin1", "phaseAfter"] },
                forced: true, silent: true, popup: false,
                filter(event, player) {
                    if (!player.storage?.mengsanVulnerable_shuying) return false;
                    return event.name !== "damage" || Boolean(event.card || event.mengsanAttack_shuying);
                },
                async content(event, trigger, player) {
                    if (event.triggername === "damageBegin1") {
                        trigger.num = Math.ceil(trigger.num * ((trigger.source===game.me && activeBattle?.relics?.has("paper_phrog") ? 1.75 : 1.5) + cardPacks.vulnerableBonus(trigger.source, player)));
                        return;
                    }
                    const remaining = Math.max(0, (player.storage.mengsanVulnerable_shuying || 0) - 1);
                    player.storage.mengsanVulnerable_shuying = remaining;
                    if (remaining) player.markSkill("mengsan_vulnerable_shuying");
                    else player.removeSkill("mengsan_vulnerable_shuying");
                },
            },
            mengsan_intent_refresh_shuying: {
                trigger: { global: ["useCardAfter", "useSkillAfter", "respondAfter", "changeHpAfter", "dieAfter", "phaseAfter"] },
                forced: true, silent: true, popup: false, priority: -1000,
                filter() { return Boolean(activeBattle?.session.active); },
                async content() {
                    const session = activeBattle?.session;
                    if (session?.active) refreshEnemyIntents(session);
                },
            },
            mengsan_scenario_shuying: {
                trigger: { global: ["changeHpAfter", "gainAfter", "loseAfter", "dieAfter", "turnOverAfter", "linkAfter", "phaseAfter"] },
                forced: true, silent: true, popup: false, priority: -100,
                filter() { return Boolean(activeBattle?.session.active && activeBattle.director?.ready); },
                async content(event, trigger) {
                    if (event.triggername === "phaseAfter") await activeBattle.director.afterTurn(trigger.player, trigger);
                    else await activeBattle.director.evaluate("state");
                    game.checkResult();
                },
            },
            mengsan_draw_shuying: {
                trigger: { player: "drawBegin" },
                firstDo: true,
                forced: true,
                silent: true,
                priority: 10000,
                filter(event, player) {
                    return Boolean(event.num > 0 && (player.storage?.mengsanPlayer_shuying || ironcladBlocksDraw(player)));
                },
                async content(event, trigger, player) {
                    const number = trigger.num;
                    trigger.cancel();
                    const cards=ironcladBlocksDraw(player)?[]:await game.mengsanDraw_shuying(player, number);
                    trigger.result={bool:true,cards};trigger.mengsanIcDrawHandled_shuying=true;
                },
            },
            mengsan_card_use_shuying: {
                trigger: { global: ["useCard1", "respond"] },
                forced: true,
                silent: true,
                popup: false,
                filter(event) {
                    return Boolean(activeBattle?.session.active && event.cards?.some(card => card.storage?.mengsanCard_shuying));
                },
                async content(event, trigger) {
                    trigger.cards.forEach(card => {
                        if (card.storage?.mengsanCard_shuying) card.storage.mengsanConsumed_shuying = true;
                    });
                },
            },
            mengsan_infested_shuying: {
                mark: true, marktext: "寄",
                intro: { markcount(storage, player) { return player.storage.mengsanInfested_shuying || 0; },
                    content: "死亡后立即召唤4只扭动虫，扭动虫出场的首回合跳过；须消灭扭动虫才能获胜。" },
                onremove(player) { delete player.storage.mengsanInfested_shuying; },
            },
            mengsan_wriggler_spawned_shuying: {
                trigger: { global: "phaseBefore" },
                forced: true, silent: true, popup: false, priority: 1000,
                filter(event) { return Boolean(activeBattle?.session.active && isWriggler(event.player) && event.player.storage.mengsanPhrogState_shuying?.spawned); },
                async content(event, trigger) {
                    if (skipSpawnedWriggler(trigger.player, trigger)) {
                        clearStun(trigger.player);
                        game.mengsanSetEnemyIntent_shuying(trigger.player, null);
                        game.log(trigger.player, "生成眩晕，跳过首回合");
                    }
                },
            },
            mengsan_infection_damage_shuying: {
                trigger: { global: "phaseDiscardBegin" },
                forced: true, silent: true, popup: false, priority: 200,
                filter(event) { return Boolean(activeBattle?.session.active && event.player?.isAlive() && infectionHand(event.player).length); },
                async content(event, trigger) { await resolveInfection(activeBattle, trigger.player, trigger); },
            },
            mengsan_card_affixes_shuying: {
                forced: true, silent: true, popup: false, priority: 100,
                trigger: { global: ["phaseDiscardBegin", "cardsDiscardAfter"] },
                filter(event) {
                    if (!activeBattle?.session.active) return false;
                    if (event.name === "phaseDiscard") return event.player?.getCards("h").some(card => hasCardAffix(card,"void"));
                    return event.cards?.some(card => card.storage?.mengsanCard_shuying?.affixes?.includes("ingenious"));
                },
                async content(event, trigger) {
                    if (event.triggername === "phaseDiscardBegin") {
                        const cards = trigger.player.getCards("h").filter(card => hasCardAffix(card,"void"));
                        if (cards.length) {
                            await trigger.player.lose(cards, ui.special);
                            for (const card of cards) card.remove();
                            activeBattle.pilesUI?.refresh();
                        }
                        return;
                    }
                    if (trigger.getParent("phaseDiscard")) return;
                    for (const card of trigger.cards || []) {
                        if (!activeBattle?.session.active || get.position(card, true) !== "d" || !card.storage?.mengsanCard_shuying?.affixes?.includes("ingenious") || card.storage.mengsanIngeniousResolving_shuying) continue;
                        const use = trigger.getParent("useCard"), respond = trigger.getParent("respond");
                        if (use?.cards?.includes(card) || respond?.cards?.includes(card)) continue;
                        const owner = game.playerMap[card.storage.mengsanOwnerId_shuying];
                        if (!owner?.isAlive() || !lib.filter.cardEnabled(card, owner) || !canPayCard(owner, card) || !owner.hasUseTarget(card)) continue;
                        card.storage.mengsanIngeniousResolving_shuying = true;
                        try { await owner.chooseUseTarget({ card, cards: [card], forced: true, prompt: "奇巧：使用此牌" }); }
                        finally { card.storage.mengsanIngeniousResolving_shuying = false; }
                    }
                },
                mod: {
                    ignoredHandcard(card) { if (hasCardAffix(card,"retain")) return true; },
                    cardEnabled2(card) { if (hasCardAffix(card,"unplayable")) return false; },
                },
            },
            mengsan_yingyong_shuying: {
                trigger: { source: "damageBegin1" },
                forced: true,
                usable: 1,
                filter(event, player) {
                    return Boolean(event.card && _status.currentPhase == player);
                },
                async content(event, trigger) {
                    trigger.num++;
                },
            },
        },
        translate: {
            mengsan_ally_shuying: "友",
            mengsan_ally_shuying2: "友方",
            mengsan_enemy_shuying: "敌",
            mengsan_enemy_shuying2: "敌方",
            ...modeCards.translate,
            ...scenarioTranslations,
            mengsan_draw_shuying: "梦三牌组",
            mengsan_card_use_shuying: "梦三词缀",
            mengsan_yingyong_shuying: "英勇",
            mengsan_yingyong_shuying_info: "锁定技，每回合限一次，你于自己的回合内使用牌造成的伤害+1。",
            mengsan_flyconid_action_shuying: "孢子行动",
            mengsan_raider_action_shuying: "劫掠行动",
            mengsan_fogmog_action_shuying: "雾菇行动",
            mengsan_mawler_action_shuying: "蛮兽行动",
            mengsan_vine_action_shuying: "藤蔓蹒跚者行动",
            mengsan_nibbit_action_shuying: "小啃兽行动",
            mengsan_cubex_action_shuying: "立柱构造体行动",
            mengsan_byrdonis_action_shuying: "多尼斯异鸟行动",
            mengsan_effigy_action_shuying: "旧日雕像行动",
            mengsan_vantom_action_shuying: "墨影幻灵行动",
            mengsan_beast_action_shuying: "仪式兽行动",
            mengsan_plow_shuying: "横冲直撞",
            mengsan_ringing_shuying: "昏眩",
            mengsan_kin_action_shuying: "同族行动",
            mengsan_kin_orphan_shuying: "爪牙退场",
            mengsan_kin_minion_shuying: "爪牙",
            mengsan_phrog_action_shuying: "异蛙寄生行动",
            mengsan_wriggler_spawned_shuying: "生成眩晕",
            mengsan_infection_damage_shuying: "感染结算",
            mengsan_infested_shuying: "寄生物",
            mengsan_slow_shuying: "缓慢",
            mengsan_slow_shuying_info: "本回合友方每使用一张牌，旧日雕像受到的攻击伤害增加10%，回合结束清零。",
            mengsan_territorial_shuying: "领地意识",
            mengsan_territorial_shuying_info: "自身回合结束时，每层领地意识获得1点力量。",
            mengsan_shrinker_action_shuying: "缩小甲虫行动",
            mengsan_twigmedium_action_shuying: "树枝史莱姆（中）行动",
            mengsan_twigslime_action_shuying: "树枝史莱姆（小）行动",
            mengsan_leafmedium_action_shuying: "树叶史莱姆（中）行动",
            mengsan_leafslime_action_shuying: "树叶史莱姆（小）行动",
            mengsan_strangler_action_shuying: "蛇行扼杀者行动",
            mengsan_jaxfruit_action_shuying: "闪光贾克斯果行动",
            mengsan_crawler_action_shuying: "毛绒伏地虫行动",
            mengsan_inklet_action_shuying: "墨宝行动",
            mengsan_slippery_shuying: "滑溜",
            mengsan_slippery_shuying_info: "下一次实际失去生命时只失去1点生命；完全格挡不消耗。",
            mengsan_fogmog_illusion_shuying: "幻象·爪牙",
            mengsan_weak_shuying: "虚弱",
            mengsan_weak_shuying_info:
                "攻击伤害减少25%（向下取整），自身回合结束减少1层。",
            mengsan_relic_attack_shuying: "遗物攻击修正",
            mengsan_setup_strength_shuying: "临时力量",
            mengsan_setup_strength_shuying_info: "本回合内增加攻击伤害，回合结束时移除。",
            mengsan_raider_card_strength_shuying: "力量加成",
            mengsan_raider_strength_shuying: "力量",
            mengsan_raider_strength_shuying_info: "攻击造成的伤害按力量层数增加。",
            mengsan_frail_shuying: "脆弱",
            mengsan_frail_shuying_info: "接下来相应回合获得护甲减少25%（向下取整）。",
            mengsan_constrict_shuying: "紧缠",
            mengsan_constrict_shuying_info: "自身回合结束受到层数对应的非攻击伤害；可叠加，来源死亡解除。",
            mengsan_artifact_shuying: "人工制品",
            mengsan_artifact_shuying_info: "每层抵消一次梦三负面状态施加，不抵消伤害、正面增益或既有状态的自然结算。",
            mengsan_tangled_shuying: "缠结",
            mengsan_tangled_shuying_info: "攻击牌费用增加1，持续对应回合，自身回合结束减少1回合；不影响响应。",
            mengsan_shrink_shuying: "缩小",
            mengsan_shrink_shuying_info: "攻击伤害减少30%（向下取整），不重复叠加；来源死亡解除。",
            mengsan_vulnerable_shuying: "易伤",
            mengsan_vulnerable_shuying_info: "接下来相应回合受到的攻击伤害增加50%（向上取整）。",
        },
        config: {},
        help: {
            梦三: "梦三：玩家、敌方怪物和羁绊助战各有独立牌堆与弃牌堆，其他友方支援使用公共牌堆。主动出牌消耗费用，转化牌按转化后牌名计费；响应不耗费。DIY须在技能所属角色事件内访问牌堆，不可缓存公共牌堆节点。",
        },
    };
};

export async function createMengsanMode() {
    if (!lib.group.includes("han")) {
        game.addGroup("han", "汉", "汉", { color: [
            [255, 252, 250, 1], [255, 241, 238, 1],
            [245, 196, 193, 1], [192, 85, 91, 1],
        ] });
    }
    await new Promise(resolve => {
        const style = lib.init.css(`${STYLE_PATH}/ui`, "style", resolve);
        style.addEventListener("error", resolve, { once: true });
    });
    const mode = createMode();
    mode.splash = "ext:术樱包/pve/images/tianshu.jpg";
    return mode;
}

export default async function initMengsan() {
    if (lib.config.all.mode.includes(MODE_ID)) return;
    const mode = await createMengsanMode();
    game.addMode(MODE_ID, mode, {
        translate: "梦三",
        config: {},
        extension: "术樱包",
    });
}
