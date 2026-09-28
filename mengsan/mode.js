import { createScenarioCharacters, scenarioTranslations } from "./content/scenario-characters.js";
import { createMengsanCards } from "./content/mode-cards.js";
import { buildBattlePlan, consumeSupports, createBattleDirector, grantSupport } from "./runtime/battle-director.js";
import { installPersonalPiles } from "./runtime/personal-piles.js";
import { createMonster } from "./runtime/monster.js";
import { PLAYER_ENERGY, PLAYER_HAND_LIMIT, payCard, isActiveCardUse } from "./runtime/combat-rules.js";
import { mountBattlePiles } from "./runtime/card-library.js";
import { createPlayerTeardown } from "./runtime/skill-teardown.js";
import { createBattleResources } from "./runtime/battle-resources.js";
import { createModeStorage } from "./runtime/mode-storage.js";
import { createBattleSession } from "./runtime/battle-session.js";
import { observeFreshEvent } from "./runtime/engine-session.js";
import { runPhaseLoop, stopBattleTurn } from "./runtime/battle-loop.js";
import { createBattleSettlement } from "./runtime/battle-settlement.js";
import { createBattleFlow, quiesceEngine } from "./runtime/battle-flow.js";
import { lib, game, ui, get, _status } from "../../../noname.js";
import config from "./config.js";
import { showMap } from "./map/index.js";
import { getRandomRewardChoices } from "./runtime/reward.js";
import { applyStoryOutcome, getAvailableStoryChoices } from "./runtime/story.js";
import { playDialogue } from "./runtime/dialogue.js";
import { chooseButtons } from "./runtime/flow-ui.js";
import { openModeSelection } from "./runtime/navigation.js";
import {
    completeNode,
    createRun,
    enterNextAct,
    generateActMap,
    getNodeEncounter,
    insertStoryNode,
    nextRandom,
} from "./state.js";

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
let battleSequence = 0;
let activeBattle = null;
const reportFlowError = error => { console.error("梦三流程暂停，未自动清档：", error); };

const chooseRun = async savedRun => {
    const available = savedRun?.status === "running";
    const act = available ? config.acts[savedRun.actIndex] : null;
    return chooseButtons("梦三", [
        { id: "continue", name: "继续征程", disabled: !available,
          description: available ? `${get.translation(savedRun.player.character)} · ${act?.name || "未知区域"} · 已完成 ${savedRun.statistics?.completedNodes || 0} 个节点` : "暂无进行中的征程" },
        { id: "new", name: "开始新征程", description: available ? "选择角色，确认后替换当前自动存档" : "选择一名武将，踏入第一关" },
    ], "单一自动存档 · 完成节点后记录进度", { eyebrow: "水墨行军 · 存档选择" });
};

const chooseCharacter = async () => {
    const choices = config.characters.filter(name => lib.character[name]).map(name => ({
        id: name,
        name: get.translation(name),
        description: lib.translate[`${name}_title`] || "作为本次征程的角色",
    }));
    return chooseButtons("选择出征武将", [...(choices.length ? choices : [{ id: "mengsan_liubei_shuying", name: "界刘备" }]), { id: "back", name: "返回存档选择", description: "不会修改现有征程" }], "此武将将陪伴你完成本次征程。", { back: "back", eyebrow: "出征准备" });
};

const createCardInstance = (run, name = "sha", upgrade = 0, affixes = []) => ({
    id: `mengsan_card_${Date.now()}_${Math.floor(nextRandom(run) * 1e6)}`,
    suit: ["spade", "heart", "club", "diamond"][Math.floor(nextRandom(run) * 4)],
    number: 1 + Math.floor(nextRandom(run) * 13),
    name,
    nature: null,
    upgrade,
    affixes: affixes.slice(),
});

const applyReward = (run, rewardId) => {
    const player = run.player;
    const cardReward = config.rewards[rewardId]?.card;
    if (cardReward) {
        player.deck.push({ ...createCardInstance(run, cardReward.name), ...copy(cardReward) });
        return;
    }
    const support = config.rewards[rewardId]?.support;
    if (support) { grantSupport(run, rewardId, support); return; }
    switch (rewardId) {
        case "card_sha":
            player.deck.push(createCardInstance(run, "sha"));
            break;
        case "card_tao":
            player.deck.push(createCardInstance(run, "tao"));
            break;
        case "upgrade": {
            const card = player.deck[Math.floor(nextRandom(run) * player.deck.length)];
            if (card) card.upgrade = Number(card.upgrade || 0) + 1;
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
            if (!player.items.includes("mengsan_hand_charm_shuying")) {
                player.items.push("mengsan_hand_charm_shuying");
                player.handLimitBonus++;
            }
            break;
        case "skill_yingyong":
            if (!player.permanentSkills.includes("mengsan_yingyong_shuying")) {
                player.permanentSkills.push("mengsan_yingyong_shuying");
            }
            break;
    }
};

const chooseReward = async (run, rewardConfig = {}) => {
    const choices = getRandomRewardChoices(run, rewardConfig.rewardPool).filter(choice => choice.name);
    const title = rewardConfig.rewardTitle || (rewardConfig.boss ? "极品奖励（三选一）" : "战斗奖励（三选一）");
    const rewardId = await chooseButtons(title, choices, rewardConfig.description);
    const reward = choices.find(choice => choice.id == rewardId);
    if (reward) applyReward(run, reward.effectId || reward.id);
};

const finishStoryNode = async (run, node) => {
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
    if (node.type == "rest") {
        const choice = await chooseButtons("休息节点", [
            { id: "heal", name: "休息", description: "回复 8 点生命" },
            { id: "upgrade", name: "磨砺", description: "随机强化一张卡牌" },
        ]);
        applyReward(run, choice);
    }
    else if (node.type == "shop") {
        const price = 20;
        const choice = await chooseButtons("商店 Demo", [
            { id: "card_sha", name: `购买【杀】（${price}金币）`, description: "加入个人牌组", disabled: run.player.gold < price },
            { id: "heal", name: `恢复生命（${price}金币）`, description: "回复 8 点生命", disabled: run.player.gold < price },
            { id: "leave", name: "离开", description: "暂不购买" },
        ]);
        if (choice != "leave") {
            run.player.gold -= price;
            applyReward(run, choice);
        }
    }
    else {
        const choice = await chooseButtons("随机事件", [
            { id: "branch", name: "调查异象", description: "在当前路线后插入一个额外剧情战斗节点" },
            { id: "gold", name: "收下钱袋", description: "获得 15 金币" },
        ]);
        if (choice == "branch") insertStoryNode(run, node.id);
        else {
            run.player.gold += 15;
            run.statistics.goldEarned += 15;
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

const setBattleCamp = (player, camp) => {
    player.storage.mengsanCamp_shuying = camp;
    player.side = camp === "enemy";
    player.identity = player === game.me ? "zhu" : camp === "ally" ? "zhong" : "fan";
    player.setIdentity(player.identity);
    player.identityShown = true;
    player.ai.shown = 1;
    player.classList.add("mengsan-hide-identity-shuying");
};
const initBattleUnit = (player, spec) => {
    const monster = spec.camp === "enemy" ? createMonster(spec) : null;
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
    player.storage.mengsanInitialHand_shuying = spec.hand ?? 4;
    for (const skill of spec.skills || []) player.addSkill(skill);
    player.update();
    return monster;
};

const installMonsterPile = (player, monster, current) => {
    if (!monster) return;
    const run = _status.mengsanRun_shuying;
    const battle = { drawPile: monster.createDeck(`${run.runId}_${player.playerid}`), discardPile: [] };
    for (const card of battle.drawPile) if (!lib.card[card.name]) throw new Error("怪物牌堆中的牌未加载：" + card.name);
    shuffleBattlePile(run, battle.drawPile);
    current.monsterPiles.set(player, installPersonalPiles(current.session, player, battle, run, current.resources, {
        game, ui, get, _status, document, MutationObserver, shuffle: shuffleBattlePile,
        strict: false, refresh() {},
    }));
};

const mountEnergy = (player, session) => {
    const badge = document.createElement("div");
    badge.className = "mengsan-energy-shuying";
    const refresh = () => { badge.textContent = `费用 ${player.storage.mengsanEnergy_shuying}/${player.storage.mengsanMaxEnergy_shuying}`; };
    player.appendChild(badge);
    session.ownResource(badge, () => badge.remove());
    refresh();
    return refresh;
};
const equipBattleUnit = async (player, spec, resources) => {
    for (const info of spec.equipment || []) {
        const card = resources.card(game.createCard(info.name, info.suit, info.number, info.nature));
        await player.equip(card);
    }
};
const createScenario = (plan, current) => {
    const director = createBattleDirector(plan, {
        active: () => current.session.active,
        state: player => ({ hp: player.hp, hand: player.countCards("h"), alive: player.isAlive(),
            camp: player.storage.mengsanCamp_shuying, linked: player.isLinked(), turnedOver: player.isTurnedOver() }),
        dialogue: lines => playDialogue(lines, { run: _status.mengsanRun_shuying, title: "关卡剧情" }),
        async spawn(spec, anchor) {
            const player = game.addPlayer(anchor ? Number(anchor.dataset.position) + 1 : game.players.length + game.dead.length);
            registerPlayers(current.session, [player]);
            current.resources.bindPlayers([player]);
            const join = game.createEvent("mengsanJoinBattle", false);
            join.player = player;
            join.setContent(async () => {
                const monster = initBattleUnit(player, spec);
                installMonsterPile(player, monster, current);
                if (monster) current.energyUI.set(player, mountEnergy(player, current.session));
                for (const participant of [...game.players, ...game.dead]) participant.setSeatNum(Number(participant.dataset.position) + 1);
                await equipBattleUnit(player, spec, current.resources);
                await player.draw(spec.hand ?? 4);
                await game.triggerEnter(player);
            });
            await join;
            game.log(player, "作为", spec.camp === "ally" ? "友方支援" : "敌方援军", "加入战斗");
            return player;
        },
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
    if (encounter.requiredCharacter && run.player.character !== encounter.requiredCharacter) throw new Error("该关卡仅限指定主角，请开始刘备的新征程");
    const plan = buildBattlePlan(encounter, run);
    for (const spec of [...plan.units, ...plan.rules.flatMap(r => r.effects.filter(e => e.type === "spawn").map(e => e.unit))]) {
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
    let teardown;
    activeBattle.releaseSkills = () => (teardown ||= createPlayerTeardown([...currentBattle.players], {lib,game,get,_status}))();
    const me = game.me;

    activeBattle.personalPiles = installPersonalPiles(session, me, _status.mengsanBattle_shuying, run, resources, {
        game, ui, get, _status, document, MutationObserver, shuffle: shuffleBattlePile,
        showCosts: true,
        refresh: () => activeBattle?.session === session && activeBattle.pilesUI?.refresh(),
    });
    activeBattle.personalPiles.withOwner(() => me.init(run.player.character));
    me.storage.mengsanUnitId_shuying = "player";
    setBattleCamp(me, "ally");
    const participants = game.players.filter(player => player !== me);
    const monsters = plan.units.map((spec, index) => initBattleUnit(participants[index], spec));
    plan.units.forEach((spec, index) => installMonsterPile(participants[index], monsters[index], currentBattle));
    activeBattle.director = createScenario(plan, currentBattle);
    activeBattle.director.bind("player", me);
    plan.units.forEach((spec, index) => activeBattle.director.bind(spec.id, participants[index]));
    me.storage.mengsanPlayer_shuying = true;
    me.storage.mengsanMaxEnergy_shuying = PLAYER_ENERGY;
    me.storage.mengsanEnergy_shuying = PLAYER_ENERGY;
    currentBattle.energyUI.set(me, mountEnergy(me, session));
    game.zhu = me;
    if (run.player.maxHp == null) {
        run.player.maxHp = me.maxHp;
        run.player.hp = me.hp;
    }
    me.maxHp = run.player.maxHp;
    me.hp = Math.max(1, Math.min(run.player.hp, me.maxHp));
    me.update();
    run.player.permanentSkills.forEach(skill => {
        if (lib.skill[skill] && !me.hasSkill(skill)) me.addSkill(skill);
    });
    for (const skill of ["mengsan_draw_shuying", "mengsan_card_use_shuying", "mengsan_scenario_shuying", "mengsan_card_payment_shuying", "mengsan_monster_draw_shuying"]) {
        if (!lib.skill.global.includes(skill)) {
            game.addGlobalSkill(skill);
            session.ownResource({}, () => game.removeGlobalSkill(skill));
        }
    }
    activeBattle.pilesUI = mountBattlePiles(session, _status.mengsanBattle_shuying);
    for (let index = 0; index < plan.units.length; index++) await equipBattleUnit(participants[index], plan.units[index], resources);
    game.syncState();
    _status.event.trigger("gameStart");
    for (const participant of participants) await participant.draw(participant.storage.mengsanInitialHand_shuying ?? 4);
    if (!session.active) return;
    activeBattle.personalPiles.resetOpeningHand();
    await game.mengsanDraw_shuying(me, 4);
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
            currentBattle.personalPiles.trimOpeningHand(4);
        }
        if (player.storage.mengsanMaxEnergy_shuying != null) {
            player.storage.mengsanEnergy_shuying = player.storage.mengsanMaxEnergy_shuying;
            currentBattle.energyUI.get(player)?.();
        }
        await currentBattle.director.beforeTurn(player);
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
            if (game.zhu === player) game.zhu = null;
            player.remove();
        });
    }
};
const makeFlow = (releaseSkills = async () => {}) => createBattleFlow({
    releaseSkills,
    presentVictory: pending => playDialogue(pending.victoryDialogue, { run: pending.base, title: "战后剧情" }),
    settlement:createBattleSettlement({store:modeStorage, config, getRandomRewardChoices, applyReward, completeNode, enterNextAct}),
    chooseReward:choices => chooseButtons("战斗奖励（三选一）", choices),
    showMap,
    showEnding:async route => { game.over(route === "victory"); },
    quiesce:() => quiesceEngine(_status),
});
const requestBattleFinish = outcome => {
    const current = activeBattle;
    if (!current) return false;
    const accepted = current.flow.requestFinish({session:current.session, hp:game.me?.hp || 0, outcome, defeatedEnemies:current.director?.defeatedEnemies ?? 1});
    if (accepted) {
        current.pilesUI?.dispose();
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
            const action = await chooseButtons("结算未完成", [
                {id:"retry",name:"重试保存与结算"},
                {id:"exit",name:"保留已保存进度并返回模式选择"},
            ], "已提交的奖励不会重发。技能释放失败时请返回模式选择，避免重复调用释放回调。");
            if (action === "exit") { await openModeSelection(); throw error; }
            operation = flow.retry();
        }
    }
};
const setupBattle = async (run, node, encounter = getNodeEncounter(run, node)) => {
    // Wait for engine boot callbacks BEFORE arena creation; cardsAsync then builds synchronously.
    if (lib.onfree) await new Promise(resolve => lib.onfree.push(resolve));
    await quiesceEngine(_status);
    const session = createBattleSession(`${run.runId}:${++battleSequence}`);
    const resources = createBattleResources(session, {game,ui,_status});
    let current;
    const flow = makeFlow(() => current.releaseSkills?.());
    let finished;
    const signal = new Promise(resolve => { finished = resolve; });
    current = {session, flow, finished, resources, players: new Set(), monsterPiles: new Map(), energyUI: new Map()};
    activeBattle = current;
    const root = new lib.element.GameEvent("mengsanBattle", false, _status.eventManager);
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
        session.requestStop();
        await chooseButtons("战斗流程异常", [{id:"exit",name:"保留存档并返回模式选择"}], "无法确认旧事件已退出，已停止继续开战。上次成功存档仍保留。");
        await openModeSelection(); return;
    }
    const result = await awaitSettlement(flow);
    if (activeBattle === current) activeBattle = null;
    if (result.route === "map") await routeRun(result.run, result.nextNode, true);
};
const routeRun = async (run, selected = null, supplied = false) => {
    while (true) {
        const node = supplied ? selected : await showMap(run);
        supplied = false;
        if (!node) { await openModeSelection(); return; }
        if (["event", "rest", "shop"].includes(node.type)) { await finishUtilityNode(run, node); continue; }
        if (node.type === "story" && config.nodeContents?.[node.contentId]?.kind === "dialogue") {
            if (await finishStoryNode(run, node)) continue;
            return;
        }
        await setupBattle(run, node); return;
    }
};
const startJourney = async () => {
                lib.translate.restart = "返回";
                let run = copy(lib.storage[config.saveKey] || null);
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
                if (run.battleFlow?.pending) {
                    const flow = makeFlow();
                    const result = await awaitSettlement(flow, flow.resumePending({session:createBattleSession(`recovery-${++battleSequence}`)}));
                    if (result.route === "map") await routeRun(result.run, result.nextNode, true);
                    return;
                }
                const canRefreshOldMap = config.characters.includes(run.player.character) && !run.map?.completedNodeIds?.length && run.map?.layoutVersion != config.mapLayoutVersion;
                if (!run.map || run.map.actIndex != run.actIndex || canRefreshOldMap) {
                    run.map = generateActMap(run, run.actIndex);
                    await saveRun(run);
                }
                await routeRun(run);
};

const createMode = identityMode => {
    const identityElement = identityMode.element || {};
    const identityPlayer = identityElement.player || {};
    const modeCards = createMengsanCards();
    return {
        ...identityMode,
        name: MODE_ID,
        character: { ...(identityMode.character || {}), ...createScenarioCharacters(lib.element.Character) },
        card: { ...(identityMode.card || {}), ...modeCards.card },
        connect: false,
        start: [
            async () => {
                // Let the engine start event finish before starting the external controller.
                setTimeout(() => startJourney().catch(reportFlowError), 0);
            },
        ],
        element: {
            ...identityElement,
            player: {
                ...identityPlayer,
                dieAfter() { game.checkResult(); },
                dieAfter2() {}, // Identity-mode kill rewards/loyalist penalties do not apply here.
                isFriendOf(player) { return this === player || (this.storage.mengsanCamp_shuying === player?.storage?.mengsanCamp_shuying); },
                isEnemyOf(player) { return Boolean(player && this.storage.mengsanCamp_shuying !== player.storage?.mengsanCamp_shuying); },
                getEnemies(filter, includeDie) { return game[includeDie ? "filterPlayer2" : "filterPlayer"](p => this.isEnemyOf(p) && (!filter || filter(p))); },
                getFriends(filter, includeDie) { const self = filter === true; return game[includeDie ? "filterPlayer2" : "filterPlayer"](p => (p !== this || self) && this.isFriendOf(p) && (typeof filter !== "function" || filter(p))); },
                getHandcardLimit() {
                    if (this.storage?.mengsanPlayer_shuying) {
                        const run = _status.mengsanRun_shuying;
                        const bonus = Number(run?.player?.handLimitBonus || 0);
                        return PLAYER_HAND_LIMIT + bonus;
                    }
                    if (this.storage?.mengsanMonster_shuying) return this.storage.mengsanMonster_shuying.handLimit;
                    let number = Math.max(this.hp, 0);
                    number = game.checkMod(this, number, "maxHandcardBase", this);
                    number = game.checkMod(this, number, "maxHandcard", this);
                    number = game.checkMod(this, number, "maxHandcardFinal", this);
                    return Math.max(0, number);
                },
            },
        },
        game: {
            ...(identityMode.game || {}),
            async mengsanPersistRun_shuying(run) {
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
                return result;
            },
            mengsanFinishBattle_shuying() {
                return requestBattleFinish("victory");
            },
            checkResult() {
                const current = activeBattle;
                if (!current?.session.active || !current.director?.ready || current.director.busy || current.resultCheckQueued) return;
                current.resultCheckQueued = true;
                const next = game.createEvent("mengsanScenarioResult", false);
                next.setContent(async () => {
                    try {
                        await current.director.evaluate("state");
                        if (!current.session.active) return;
                        if (!game.me || game.me.isDead()) game.mengsanFailRun_shuying("角色死亡，征程结束");
                        else if (!game.players.some(p => p.storage.mengsanCamp_shuying === "enemy" && p.isAlive()) && !current.director.pendingEnemies) game.mengsanFinishBattle_shuying();
                    } finally { current.resultCheckQueued = false; }
                });
            },
        },
        get: {
            ...(identityMode.get || {}),
            rawAttitude(from, to) { return from === to || from.storage.mengsanCamp_shuying === to.storage.mengsanCamp_shuying ? 8 : -8; },
        },
        skill: {
            ...(identityMode.skill || {}),
            mengsan_card_payment_shuying: {
                forced: true, silent: true, popup: false,
                firstDo: true, priority: 10000,
                trigger: { global: "useCard0" },
                filter(event) { return event.player?.storage?.mengsanMaxEnergy_shuying != null &&
                    lib.card[event.card?.name]?.mengsanCost_shuying != null && isActiveCardUse(event, event.player); },
                async content(event, trigger) {
                    if (trigger.mengsanPaid_shuying) return;
                    if (!payCard(trigger.player, trigger.card)) {
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
                filter(event, player) { return Boolean(player.storage?.mengsanMonster_shuying); },
                async content(event, trigger, player) { trigger.num = player.storage.mengsanMonster_shuying.draw; },
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
                    return Boolean(player.storage?.mengsanPlayer_shuying && event.num > 0);
                },
                async content(event, trigger, player) {
                    const number = trigger.num;
                    trigger.cancel();
                    await game.mengsanDraw_shuying(player, number);
                },
            },
            mengsan_card_use_shuying: {
                trigger: { global: "useCard1" },
                forced: true,
                silent: true,
                popup: false,
                filter(event) {
                    return event.player?.storage?.mengsanPlayer_shuying && event.cards?.some(card => card.storage?.mengsanCard_shuying);
                },
                async content(event, trigger) {
                    trigger.cards.forEach(card => {
                        if (card.storage?.mengsanCard_shuying) card.storage.mengsanUsed_shuying = true;
                    });
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
            ...(identityMode.translate || {}),
            ...modeCards.translate,
            ...scenarioTranslations,
            mengsan_draw_shuying: "梦三牌组",
            mengsan_card_use_shuying: "梦三词缀",
            mengsan_yingyong_shuying: "英勇",
            mengsan_yingyong_shuying_info: "锁定技，每回合限一次，你于自己的回合内使用牌造成的伤害+1。",
        },
        config: {},
        help: {
            梦三: "梦三：玩家和敌方怪物各有独立牌堆与弃牌堆，友方支援仍使用公共牌堆。主动出牌消耗费用，转化牌按转化后牌名计费；响应不耗费。DIY须在技能所属角色事件内访问牌堆，不可缓存公共牌堆节点。",
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
        const style = lib.init.css(STYLE_PATH, "style", resolve);
        style.addEventListener("error", resolve, { once: true });
    });
    const identityMode = await game.loadModeAsync("identity");
    const mode = createMode(identityMode);
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
