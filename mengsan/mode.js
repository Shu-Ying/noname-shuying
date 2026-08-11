import { lib, game, ui, get, _status } from "../../../noname.js";
import config from "./config.js";
import {
    completeNode,
    createRun,
    enterNextAct,
    generateActMap,
    getNodeEncounter,
    getSelectableNodes,
    insertStoryNode,
    nextRandom,
} from "./state.js";

const MODE_ID = config.modeId;
const STYLE_PATH = `${lib.assetURL}extension/术樱包/mengsan`;

const copy = value => JSON.parse(JSON.stringify(value));

const persistModeStorage = async () => {
    lib.storage.version = lib.version;
    if (lib.db) {
        await game.putDB("data", MODE_ID, copy(lib.storage));
    }
    else {
        localStorage.setItem(`${lib.configprefix}${MODE_ID}`, JSON.stringify(lib.storage));
    }
};

const saveRun = async run => {
    try {
        lib.storage[config.saveKey] = copy(run);
        await persistModeStorage();
    }
    catch (error) {
        delete lib.storage[config.saveKey];
        try {
            await persistModeStorage();
        }
        catch {}
        alert("梦三存档失败，当前征程存档已清空。请查看控制台错误。");
        console.error("梦三存档失败：", error);
        throw error;
    }
};

const clearRun = async () => {
    delete lib.storage[config.saveKey];
    await persistModeStorage();
};

const createOverlay = (title, className = "") => {
    const overlay = ui.create.div(`.mengsan-overlay-shuying${className ? `.${className}` : ""}`, ui.window);
    const panel = ui.create.div(".mengsan-panel-shuying", overlay);
    ui.create.div(".mengsan-title-shuying", title, panel);
    return { overlay, panel };
};

const chooseButtons = (title, choices, description = "") => new Promise(resolve => {
    const { overlay, panel } = createOverlay(title);
    if (description) ui.create.div(".mengsan-description-shuying", description, panel);
    const buttons = ui.create.div(".mengsan-choice-list-shuying", panel);
    choices.forEach(choice => {
        const button = ui.create.div(".mengsan-choice-shuying", buttons);
        button.innerHTML = `<div class="mengsan-choice-name-shuying">${choice.name}</div>${choice.description ? `<div class="mengsan-choice-description-shuying">${choice.description}</div>` : ""}`;
        if (choice.disabled) button.classList.add("disabled");
        button.addEventListener(lib.config.touchscreen ? "touchend" : "click", event => {
            event.preventDefault();
            if (choice.disabled || overlay.dataset.resolved) return;
            overlay.dataset.resolved = "true";
            overlay.remove();
            resolve(choice.id);
        });
    });
});

const chooseRun = async savedRun => {
    if (!savedRun || savedRun.status != "running") return "new";
    const act = config.acts[savedRun.actIndex];
    return chooseButtons("梦三", [
        {
            id: "continue",
            name: "继续征程",
            description: `${act?.name || "未知区域"} · 已通过 ${savedRun.statistics?.completedNodes || 0} 个节点`,
        },
        {
            id: "new",
            name: "新的开始",
            description: "覆盖当前征程并重新生成第一关地图",
        },
    ], "Demo 采用单一自动存档。节点完成后才会覆盖检查点。" );
};

const chooseCharacter = async () => {
    const choices = config.characters.filter(name => lib.character[name]).map(name => ({
        id: name,
        name: get.translation(name),
        description: lib.translate[`${name}_title`] || "作为本次征程的角色",
    }));
    return chooseButtons("选择角色", choices.length ? choices : [{ id: "re_zhaoyun", name: "赵云" }]);
};

const nodeColor = {
    battle: "#9d4937",
    elite: "#7e3f79",
    event: "#477aa6",
    story: "#8c6a34",
    rest: "#3f8560",
    shop: "#a27b35",
    boss: "#a62727",
};

const showMap = run => new Promise(resolve => {
    const act = config.acts[run.actIndex];
    const selectable = getSelectableNodes(run);
    const selectableIds = new Set(selectable.map(node => node.id));
    const { overlay, panel } = createOverlay(act.name, "mengsan-map-overlay-shuying");
    panel.classList.add("mengsan-map-panel-shuying");
    const status = ui.create.div(".mengsan-map-status-shuying", panel);
    status.innerHTML = `体力：${run.player.hp == null ? "未初始化" : `${run.player.hp}/${run.player.maxHp}`}　金币：${run.player.gold}　牌组：${run.player.deck.length}`;
    const map = ui.create.div(".mengsan-map-shuying", panel);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("mengsan-lines-shuying");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    map.appendChild(svg);
    const nodeMap = new Map(run.map.nodes.map(node => [node.id, node]));
    run.map.edges.forEach(edge => {
        const source = nodeMap.get(edge[0]);
        const target = nodeMap.get(edge[1]);
        if (!source || !target) return;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", source.x);
        line.setAttribute("y1", source.y);
        line.setAttribute("x2", target.x);
        line.setAttribute("y2", target.y);
        if (source.completed) line.classList.add("completed");
        if (source.dynamic || target.dynamic) line.classList.add("dynamic");
        svg.appendChild(line);
    });
    run.map.nodes.forEach(node => {
        const button = ui.create.div(".mengsan-node-shuying", map);
        button.style.left = `${node.x}%`;
        button.style.top = `${node.y}%`;
        button.style.setProperty("--node-color", nodeColor[node.type] || "#666");
        button.innerHTML = `<span>${config.nodeNames[node.type] || node.type}</span>`;
        button.dataset.nodeId = node.id;
        if (node.completed) button.classList.add("completed");
        else if (selectableIds.has(node.id)) button.classList.add("selectable");
        else button.classList.add("locked");
        button.addEventListener(lib.config.touchscreen ? "touchend" : "click", event => {
            event.preventDefault();
            if (!selectableIds.has(node.id) || overlay.dataset.resolved) return;
            overlay.dataset.resolved = "true";
            overlay.remove();
            resolve(node);
        });
    });
});

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
            player.hp = Math.min(player.maxHp, player.hp + 2);
            break;
        case "max_hp":
            player.maxHp++;
            player.hp++;
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

const chooseBattleReward = async (run, boss) => {
    const choices = boss ? [
        { id: "skill_yingyong", name: "极品技能·英勇", description: "本次征程永久获得【英勇】" },
        { id: "item_hand", name: "极品道具·束带", description: "基础手牌上限额外 +1" },
        { id: "max_hp", name: "极品强化·生机", description: "体力上限与当前体力各 +1" },
    ] : [
        { id: "card_sha", name: "获得一张【杀】", description: "加入独立永久牌组" },
        { id: "card_tao", name: "获得一张【桃】", description: "加入独立永久牌组" },
        { id: "upgrade", name: "随机强化", description: "随机一张牌强化一级" },
    ];
    const reward = await chooseButtons(boss ? "极品奖励（三选一）" : "战斗奖励（三选一）", choices);
    applyReward(run, reward);
};

const finishUtilityNode = async (run, node) => {
    if (node.type == "rest") {
        const choice = await chooseButtons("休息节点", [
            { id: "heal", name: "休息", description: "回复 2 点体力" },
            { id: "upgrade", name: "磨砺", description: "随机强化一张卡牌" },
        ]);
        applyReward(run, choice);
    }
    else if (node.type == "shop") {
        const price = 20;
        const choice = await chooseButtons("商店 Demo", [
            { id: "card_sha", name: `购买【杀】（${price}金币）`, description: "加入个人牌组", disabled: run.player.gold < price },
            { id: "heal", name: `恢复体力（${price}金币）`, description: "回复 2 点体力", disabled: run.player.gold < price },
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
    game.reload();
};

const shuffleBattlePile = (run, cards) => {
    for (let index = cards.length - 1; index > 0; index--) {
        const target = Math.floor(nextRandom(run) * (index + 1));
        [cards[index], cards[target]] = [cards[target], cards[index]];
    }
};

const setupBattle = async (run, node) => {
    const encounter = getNodeEncounter(run, node);
    _status.mengsanRun_shuying = run;
    _status.mengsanNode_shuying = node;
    _status.mengsanEncounter_shuying = encounter;
    _status.mengsanBattle_shuying = {
        resolving: false,
        drawPile: copy(run.player.deck),
        discardPile: [],
        exhaustPile: [],
    };
    shuffleBattlePile(run, _status.mengsanBattle_shuying.drawPile);

    game.prepareArena(2);
    const me = game.me;
    const enemy = game.players.find(current => current != me);
    me.init(run.player.character);
    enemy.init(lib.character[encounter.enemy] ? encounter.enemy : "re_lvbu");
    me.identity = "zhu";
    enemy.identity = "fan";
    me.side = false;
    enemy.side = true;
    me.setIdentity("zhu");
    enemy.setIdentity("fan");
    me.ai.shown = 1;
    enemy.ai.shown = 1;
    me.storage.mengsanPlayer_shuying = true;
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
    game.addGlobalSkill("mengsan_draw_shuying");
    game.addGlobalSkill("mengsan_card_use_shuying");
    game.syncState();
    _status.event.trigger("gameStart");
    await game.mengsanDraw_shuying(me, 4);
    game.gameDraw(me, current => current == me ? 0 : 4);
    game.phaseLoop(me);
};

const createMode = identityMode => {
    const identityElement = identityMode.element || {};
    const identityPlayer = identityElement.player || {};
    return {
        ...identityMode,
        name: MODE_ID,
        connect: false,
        start: [
            async () => {
                lib.translate.restart = "返回";
                let run = copy(lib.storage[config.saveKey] || null);
                const action = await chooseRun(run);
                if (action == "new") {
                    if (run) {
                        const confirmNew = await chooseButtons("确认新的开始", [
                            { id: "cancel", name: "返回", description: "保留当前征程" },
                            { id: "confirm", name: "覆盖存档", description: "当前征程将被清除" },
                        ]);
                        if (confirmNew == "cancel") {
                            run = copy(lib.storage[config.saveKey]);
                        }
                        else {
                            const character = await chooseCharacter();
                            run = createRun(character);
                            await saveRun(run);
                        }
                    }
                    else {
                        const character = await chooseCharacter();
                        run = createRun(character);
                        await saveRun(run);
                    }
                }
                const canRefreshOldMap = !run.map?.completedNodeIds?.length && run.map?.layoutVersion != config.mapLayoutVersion;
                if (!run.map || run.map.actIndex != run.actIndex || canRefreshOldMap) {
                    run.map = generateActMap(run, run.actIndex);
                    await saveRun(run);
                }
                const node = await showMap(run);
                if (["event", "rest", "shop"].includes(node.type)) {
                    await finishUtilityNode(run, node);
                    return;
                }
                await setupBattle(run, node);
            },
        ],
        element: {
            ...identityElement,
            player: {
                ...identityPlayer,
                getHandcardLimit() {
                    if (this.storage?.mengsanPlayer_shuying) {
                        const run = _status.mengsanRun_shuying;
                        const bonus = Number(run?.player?.handLimitBonus || 0);
                        return Math.max(0, Math.min(8, this.hp) + bonus);
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
            ...(identityMode.game || {}),
            async mengsanPersistRun_shuying(run) {
                await saveRun(run);
            },
            async mengsanClearRun_shuying() {
                await clearRun();
            },
            async mengsanFailRun_shuying(reason = "征程失败") {
                if (_status.mengsanEnding_shuying) return;
                _status.mengsanEnding_shuying = true;
                await clearRun();
                game.log(reason);
                game.over(false);
            },
            async mengsanDraw_shuying(player, number = 1) {
                if (!player?.storage?.mengsanPlayer_shuying || number <= 0) return [];
                const battle = _status.mengsanBattle_shuying;
                const run = _status.mengsanRun_shuying;
                if (!battle || battle.drawPile.length + battle.discardPile.length < number) {
                    await game.mengsanFailRun_shuying("个人牌堆与弃牌堆不足，挑战失败");
                    return [];
                }
                const result = [];
                while (result.length < number) {
                    if (!battle.drawPile.length) {
                        battle.drawPile = battle.discardPile.splice(0);
                        shuffleBattlePile(run, battle.drawPile);
                        game.log(player, "洗切了个人弃牌堆");
                    }
                    const data = battle.drawPile.shift();
                    const card = game.createCard(data.name, data.suit, data.number, data.nature);
                    card.storage.mengsanCard_shuying = copy(data);
                    card.destroyLog = false;
                    card.destroyed = (current, position) => {
                        if (position != "discardPile") return false;
                        const info = copy(current.storage.mengsanCard_shuying);
                        if (info.affixes?.includes("annihilate") && current.storage.mengsanUsed_shuying) battle.exhaustPile.push(info);
                        else battle.discardPile.push(info);
                        return true;
                    };
                    if (data.affixes?.includes("annihilate")) card.addGaintag("湮灭");
                    if (data.upgrade) card.addGaintag(`强化+${data.upgrade}`);
                    result.push(card);
                }
                player.directgain(result);
                player.$draw(result.length);
                game.log(player, "从个人牌堆摸了", get.cnNumber(result.length), "张牌");
                return result;
            },
            async mengsanFinishBattle_shuying() {
                const battle = _status.mengsanBattle_shuying;
                if (!battle || battle.resolving || _status.mengsanEnding_shuying) return;
                battle.resolving = true;
                game.pause();
                const run = _status.mengsanRun_shuying;
                const node = _status.mengsanNode_shuying;
                const encounter = _status.mengsanEncounter_shuying;
                run.player.hp = Math.max(1, game.me.hp);
                run.player.gold += encounter.gold;
                run.statistics.goldEarned += encounter.gold;
                run.statistics.defeatedEnemies++;
                await chooseBattleReward(run, encounter.boss);
                completeNode(run, node.id);
                if (encounter.boss) {
                    if (!enterNextAct(run)) {
                        const profile = copy(lib.storage[config.profileKey] || { wins: 0, completedRuns: [] });
                        profile.wins++;
                        profile.completedRuns.push({
                            runId: run.runId,
                            character: run.player.character,
                            completedNodes: run.statistics.completedNodes,
                            goldEarned: run.statistics.goldEarned,
                            completedAt: Date.now(),
                        });
                        lib.storage[config.profileKey] = profile;
                        delete lib.storage[config.saveKey];
                        await persistModeStorage();
                        game.over(true);
                        return;
                    }
                }
                await saveRun(run);
                game.reload();
            },
            checkResult() {
                if (_status.mengsanEnding_shuying || _status.mengsanBattle_shuying?.resolving) return;
                if (!game.me || game.me.isDead()) {
                    game.mengsanFailRun_shuying("角色死亡，征程结束");
                    return;
                }
                const hasEnemy = game.players.some(current => current != game.me && current.side === true && current.isAlive());
                if (!hasEnemy) game.mengsanFinishBattle_shuying();
            },
        },
        skill: {
            ...(identityMode.skill || {}),
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
            mengsan_draw_shuying: "梦三牌组",
            mengsan_card_use_shuying: "梦三词缀",
            mengsan_yingyong_shuying: "英勇",
            mengsan_yingyong_shuying_info: "锁定技，每回合限一次，你于自己的回合内使用牌造成的伤害+1。",
        },
        config: {},
        help: {
            梦三: "梦三 Demo：每次完成节点后保存检查点；玩家使用个人牌组，敌人继续使用 noname 公共牌堆。",
        },
    };
};

export default async function initMengsan() {
    if (lib.config.all.mode.includes(MODE_ID)) return;
    await new Promise(resolve => {
        const style = lib.init.css(STYLE_PATH, "style", resolve);
        style.addEventListener("error", resolve, { once: true });
    });
    const identityMode = await game.loadModeAsync("identity");
    const mode = createMode(identityMode);
    mode.splash = "ext:术樱包/pve/images/tianshu.jpg";
    game.addMode(MODE_ID, mode, {
        translate: "梦三",
        config: {},
        extension: "术樱包",
    });
}
