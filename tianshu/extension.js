import tianshuConfig from "./config.js";
import { lib, game, ui, get, ai, _status } from "../../../noname.js";

export default function initTianshu(lib, game, ui, get, ai, _status, shuYing) {
    if (!lib.config.extension_术樱包_tianShuOff) return;

    let tianshu = new Object();

    const state = {
        difficulty: "normal",
        stageIndex: 0,
        currentBosses: [],
        selectedSkills: {},
        selectedSkillSet: {},
        playerSideIds: {},
        roundStartPlayer: null,
        roundStartSeat: 0,
        originalIsRoundFilter: null,
        roundFilterInstalled: false,
        originalGameCheck: null,
        checkHookInstalled: false,
        corpseChooseCleanup: null,
        corpseChooseEvent: null,
        initialBoss: null,
        virtualIdol: null,
        running: false,
        pendingSpawn: false,
        clearingStage: false,
    };

    // 生成玩家的稳定标识，用于跨死亡/复活状态追踪玩家方成员。
    const getPlayerKey = player => player ? (player.playerid || player.dataset?.position || player.name || "") : "";
    // 获取菜单中选择的虚拟偶像配置。
    const getVirtualIdolConfig = () => lib.config[tianshuConfig.settings.virtualIdolConfigKey] || "random";
    // 判断是否启用虚拟偶像。
    const isVirtualIdolEnabled = () => getVirtualIdolConfig() != "off";
    // 读取虚拟偶像随机池；仅在菜单选择“随机”时用于筛选可随机角色。
    const getVirtualIdolRandomPool = () => {
        const list = lib.config[tianshuConfig.settings.virtualIdolRandomPoolConfigKey];
        if (!Array.isArray(list) || !list.length) return tianshuConfig.virtualIdolList;
        const pool = list.map(key => tianshuConfig.virtualIdols?.[key]).filter(id => typeof id == "string" && tianshuConfig.virtualIdolList.includes(id));
        return pool.length ? pool : tianshuConfig.virtualIdolList;
    };
    // 根据菜单选择获取本局虚拟偶像角色 id。
    const getSelectedVirtualIdol = () => {
        const key = getVirtualIdolConfig();
        if (key == "random") return getVirtualIdolRandomPool().randomGet();
        const value = tianshuConfig.virtualIdols?.[key];
        if (Array.isArray(value)) return value.randomGet ? value.randomGet() : value[Math.floor(Math.random() * value.length)];
        return value || null;
    };
    // 判断是否启用第三个 Boss。
    const shouldAddExtraBoss = () => Boolean(lib.config[tianshuConfig.settings.addBossConfigKey]);
    // 根据 Boss 数量返回实战确认后的 Boss 座位
    const getBossSeats = () => shouldAddExtraBoss() ? [5, 6, 7] : [5, 7];
    // 根据 Boss 数量返回虚拟偶像座位；未启用时返回 null。
    const getVirtualIdolSeat = () => !isVirtualIdolEnabled() ? null : (shouldAddExtraBoss() ? 4 : 6);
    // 从 config 中获取所有虚拟偶像角色 id。
    const getVirtualIdolIds = () => tianshuConfig.virtualIdolList || Object.values(tianshuConfig.virtualIdols).flat();
    // 判断指定角色是否为虚拟偶像。
    const isVirtualIdol = player => Boolean(player && (getVirtualIdolIds().includes(player.name1) || getVirtualIdolIds().includes(player.name)));
    // 判断指定角色是否属于当前关卡 Boss 列表。
    const isCurrentStageBoss = player => Boolean(player && (state.currentBosses.includes(player.name1) || state.currentBosses.includes(player.name)));
    // 判断指定角色是否属于开局捕获的玩家方。
    const isCapturedPlayerSide = player => Boolean(getPlayerKey(player) && state.playerSideIds[getPlayerKey(player)]);
    // 获取玩家方角色列表，可按是否存活、是否包含虚拟偶像过滤。
    const getPlayerSidePlayers = ({ aliveOnly = true, includeVirtual = true } = {}) => {
        const list = aliveOnly ? game.players : game.players.concat(game.dead);
        return list.filter(current => {
            if (!current || !isCapturedPlayerSide(current)) return false;
            if (!includeVirtual && isVirtualIdol(current)) return false;
            if (aliveOnly && !game.players.includes(current)) return false;
            return true;
        });
    };
    // 判断玩家方是否还有非虚拟偶像角色存活，供死亡事件中避开通用列表过滤。
    const hasAliveRealPlayerSide = () => game.players.some(current => current && isCapturedPlayerSide(current) && !isVirtualIdol(current));
    // 将虚拟偶像登记为玩家方 AI 队友。
    const markVirtualIdolAsPlayerSide = player => {
        if (!player) return;
        player.side = false;
        player.identity = "cai";
        player.setIdentity?.("cai");
        game.addVideo?.("setIdentity", player, "cai");
        const key = getPlayerKey(player);
        if (key) state.playerSideIds[key] = true;
    };
    // 获取玩家方 1 号位，用于首轮起手和回合游标修正。
    const getPlayerSeatOne = () => {
        const players = getPlayerSidePlayers({ aliveOnly: true, includeVirtual: false });
        players.sort((a, b) => (Number(a.dataset.position) || 0) - (Number(b.dataset.position) || 0));
        return players[0] || null;
    };
    // 获取开局保存的玩家方 1 号位；该角色即使阵亡，也作为天书乱斗的理论轮起点。
    const getTianshuRoundStartPlayer = () => {
        if (state.roundStartPlayer) return state.roundStartPlayer;
        return getPlayerSeatOne();
    };
    // 当理论 1 号位阵亡时，选其后第一个仍存活的玩家方角色作为 roundStart 触发兜底。
    const getAliveRoundStartFallback = () => {
        const players = getPlayerSidePlayers({ aliveOnly: true, includeVirtual: false });
        if (!players.length) return null;
        const baseSeat = Number(state.roundStartSeat || getTianshuRoundStartPlayer()?.dataset?.position || 0);
        players.sort((a, b) => {
            const seatA = Number(a.dataset.position) || 0;
            const seatB = Number(b.dataset.position) || 0;
            const offsetA = seatA >= baseSeat ? seatA - baseSeat : seatA + 100 - baseSeat;
            const offsetB = seatB >= baseSeat ? seatB - baseSeat : seatB + 100 - baseSeat;
            return offsetA - offsetB;
        });
        return players[0] || null;
    };
    // 判断某个即将进入回合的角色是否会被天书规则视为新一轮起点。
    const isTianshuRoundStartTrigger = player => {
        const roundStart = getTianshuRoundStartPlayer();
        if (!roundStart || !player) return false;
        if (player == roundStart) return true;
        if (!game.players.includes(roundStart)) return player == getAliveRoundStartFallback();
        return false;
    };
    // 安装天书专用轮起点判断。1号位活着时按1号位；1号位死亡时按其后的首个存活玩家方角色推进轮数。
    const installTianshuRoundFilter = () => {
        if (!state.roundFilterInstalled) {
            state.originalIsRoundFilter = _status.isRoundFilter || null;
            state.roundFilterInstalled = true;
        }
        _status.isRoundFilter = (event, player) => {
            if (isTianshuRoundStartTrigger(player)) return true;
            return state.originalIsRoundFilter ? state.originalIsRoundFilter(event, player) : false;
        };
    };
    // 获取天书奖励选择的主控视角；game.me 在 Boss 模式换控后不一定是玩家方 1 号位。
    const getMainControlPlayer = () => game.me?._trueMe || getPlayerSeatOne() || game.me;
    // 从当前事件链向上查找指定名称的父事件。
    const getParentEvent = name => {
        let evt = _status.event;
        while (evt && evt.name != name) evt = evt.parent;
        return evt || null;
    };
    // 将 boss 模式 phaseLoop 游标设置到目标角色前一位，使下一轮轮到目标角色。
    const setPhaseLoopBefore = target => {
        if (!target) return;
        const phaseLoop = getParentEvent("phaseLoop");
        if (phaseLoop) phaseLoop.player = target.previous || target.previousSeat || target;
        _status.roundStart = getTianshuRoundStartPlayer() || target;
        installTianshuRoundFilter();
        if (game.bossinfo) game.bossinfo.loopType = 1;
    };
    // 结束当前 phase 事件，把后续行动权交给指定角色；保留旧版重置轮数与阶段的做法。
    const finishCurrentPhaseTo = target => {
        if (!target) return;
        const phase = _status.event?.getParent ? _status.event.getParent("phase") : getParentEvent("phase");
        if (phase) {
            if (typeof game.resetSkills == "function") game.resetSkills();
            let current = _status.event;
            let guard = 20;
            while (current && current != phase && guard-- > 0) {
                current.finish();
                current.untrigger(true);
                current = current.getParent ? current.getParent() : current.parent;
            }
            phase.finish();
            phase.untrigger(true);
        }
        const phaseLoop = _status.event?.getParent ? _status.event.getParent("phaseLoop") : getParentEvent("phaseLoop");
        if (phaseLoop) phaseLoop.player = target.previous || target.previousSeat || target;
        if (_status.event) {
            _status.event.player = target;
            _status.event.step = 0;
        }
        const roundStart = getTianshuRoundStartPlayer() || target;
        _status.roundStart = roundStart;
        installTianshuRoundFilter();
        game.phaseNumber = 1;
        game.roundNumber = isTianshuRoundStartTrigger(target) ? 0 : 1;
        _status.paused = false;
        if (phase) {
            game.broadcastAll?.(() => {
                _status.paused = false;
            });
        }
    };
    // 开局捕获玩家方成员，避免后续 game.boss 变化导致阵营误判。
    const capturePlayerSide = () => {
        state.playerSideIds = {};
        const initialBoss = state.initialBoss || game.boss;
        game.players.forEach(current => {
            if (!current || current == initialBoss || current == game.boss) return;
            if (initialBoss && current.isFriendOf(initialBoss)) return;
            const key = getPlayerKey(current);
            if (key) state.playerSideIds[key] = true;
        });
        if (state.virtualIdol) markVirtualIdolAsPlayerSide(state.virtualIdol);
        const players = getPlayerSidePlayers({ aliveOnly: true, includeVirtual: false });
        players.sort((a, b) => (Number(a.dataset.position) || 0) - (Number(b.dataset.position) || 0));
        state.roundStartPlayer = players[0] || null;
        state.roundStartSeat = Number(state.roundStartPlayer?.dataset?.position) || 0;
        if (state.roundStartPlayer) _status.roundStart = state.roundStartPlayer;
        installTianshuRoundFilter();
    };
    // 开局按配置召唤虚拟偶像，并固定到预留座位。
    const spawnVirtualIdol = () => {
        if (!isVirtualIdolEnabled() || state.virtualIdol) return null;
        const name = getSelectedVirtualIdol();
        const seat = getVirtualIdolSeat();
        if (!name || seat == null) return null;
        const idol = game.addFellow(seat, name, "zoominanim");
        idol.dataset.position = seat;
        state.virtualIdol = idol;
        markVirtualIdolAsPlayerSide(idol);
        game.arrangePlayers();
        return idol;
    };
    // 按设置在过关时复活虚拟偶像；虚拟偶像不参与玩家复活配置。
    const reviveVirtualIdolIfNeeded = async () => {
        const idol = state.virtualIdol;
        if (!idol || !lib.config[tianshuConfig.settings.virtualIdolReviveConfigKey] || !idol.isDead()) return;
        if (idol.maxHp <= 0) return;
        await idol.revive(Math.max(1, idol.maxHp));
        markVirtualIdolAsPlayerSide(idol);
    };
    // 开局弹出难度选择，并把难度写入运行状态与全局状态。
    const chooseDifficulty = async (player = game.me) => {
        const keys = Object.keys(tianshuConfig.difficulties);
        const controls = keys.map(key => tianshuConfig.difficulties[key].name);
        const result = await player.chooseControl(controls).set("prompt", "请选择天书乱斗难度").set("ai", () => 0).forResult();
        state.difficulty = keys[Math.max(0, controls.indexOf(result.control))] || "normal";
        _status[tianshuConfig.settings.difficultyStatusKey] = state.difficulty;
    };
    // 在指定座位创建关卡 Boss；初始主 Boss 已静默死亡，所以关卡 Boss 全部使用忠臣身份。
    const addStageBoss = (position, name) => {
        const boss = game.addFellow(position, name, "zoominanim");
        boss.dataset.position = position;
        boss.side = true;
        boss.identity = "zhong";
        boss.setIdentity(boss.identity);
        boss.storage.shuYing_tianshu_stageBoss = true;
        boss.storage.shuYing_tianshu_stageIndex = state.stageIndex;
        game.addVideo("setIdentity", boss, boss.identity);
        if (game.playerMap) game.playerMap[boss.dataset.position] = boss;
        game.arrangePlayers();
        return boss;
    };
    const getConfigNumber = value => {
        if (value === null || value === undefined || value === "") return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    };
    const getBossConfigName = player => player?.name1 || player?.name || "";
    // 读取当前 Boss 在当前难度下的数值配置；单 Boss 配置覆盖默认难度配置。
    const getBossDifficultyConfig = player => {
        const defaultConfig = tianshuConfig.bossDifficulty?.default?.[state.difficulty] || {};
        const bossConfig = tianshuConfig.bossDifficulty?.bosses?.[getBossConfigName(player)]?.[state.difficulty] || {};
        return Object.assign({}, defaultConfig, bossConfig);
    };
    // 补充技能只读取当前难度配置，不跨难度继承低难度技能。
    const getBossDifficultySkills = player => {
        const defaultSkills = tianshuConfig.bossDifficulty?.default?.[state.difficulty]?.skills || [];
        const bossSkills = tianshuConfig.bossDifficulty?.bosses?.[getBossConfigName(player)]?.[state.difficulty]?.skills || [];
        const skills = [];
        for (const skill of defaultSkills.concat(bossSkills)) {
            if (skill && !skills.includes(skill)) skills.push(skill);
        }
        return skills;
    };
    // Boss 难度数值属于出场面板修正
    const applyBossDifficultyConfig = player => {
        const config = getBossDifficultyConfig(player);
        const maxHp = getConfigNumber(config.maxHp);
        const maxHpBonus = getConfigNumber(config.maxHpBonus) || 0;
        const hp = getConfigNumber(config.hp);
        const hpBonus = getConfigNumber(config.hpBonus) || 0;
        player.maxHp = Math.max(1, maxHp ?? player.maxHp + maxHpBonus);
        player.hp = Math.min(Math.max(0, hp ?? player.hp + hpBonus), player.maxHp);
        for (const skill of getBossDifficultySkills(player)) {
            if (!player.hasSkill(skill)) player.addSkill(skill);
        }
        player.update();
        return config;
    };
    // 让开局占位主 Boss 静默死亡，避免作为关卡 Boss 参与后续流程。
    const killInitialBossSilently = async () => {
        const boss = state.initialBoss;
        if (!boss || boss.isDead() || boss.storage.shuYing_tianshu_initialBossKilled) return;
        boss.storage.shuYing_tianshu_initialBossKilled = true;
        boss.storage.shuYing_tianshu_ignoreDie = true;
        if (_status.roundStart == boss) _status.roundStart = boss.next || boss.getNext() || game.players[0];
        game.broadcastAll(player => {
            player.classList.add("dead");
            player.removeLink();
            player.classList.remove("turnedover");
            player.classList.remove("out");
            player.node.count.innerHTML = "0";
            player.node.hp.hide();
            player.node.equips.hide();
            player.node.count.hide();
            if (player.previous && player.next) {
                player.previous.next = player.next;
                player.next.previous = player.previous;
            }
            game.players.remove(player);
            game.dead.add(player);
            _status.dying.remove(player);
            player.hp = 0;
            player.update();
        }, boss);
        boss.hide();
        game.addVideo("hidePlayer", boss);
    };
    // 隐藏已经阵亡的当前关卡 BOSS 尸体；在召唤下一关前执行，避免尸体继续占用视觉布局。
    const hideCurrentStageBossCorpses = () => {
        game.dead.filter(player => player?.storage?.shuYing_tianshu_stageBoss && player.storage.shuYing_tianshu_stageIndex == state.stageIndex).forEach(player => {
            player.storage.shuYing_tianshu_hiddenBossCorpse = true;
            player.hide();
            game.addVideo("hidePlayer", player);
        });
    };
    // 获取当前事件可选的隐藏 Boss 尸体；仅当本次选择只面向阵亡角色时返回列表。
    const getHiddenBossCorpseTargets = event => {
        if (!event?.filterTarget) return [];
        const card = get.card();
        const skillInfo = event.skill ? get.info(event.skill) : null;
        const cardInfo = card ? get.info(card) : null;
        if (!event.deadTarget && !skillInfo?.deadTarget && !cardInfo?.deadTarget) return [];
        const canSelect = target => {
            try {
                return Boolean(event.filterTarget(card, event.player, target));
            } catch (e) {
                return false;
            }
        };
        if (game.players.some(canSelect)) return [];
        return game.dead.filter(player => player?.storage?.shuYing_tianshu_hiddenBossCorpse && canSelect(player));
    };
    // 在纯阵亡目标选择时提供独立列表，避免隐藏尸体因同座位或 UI 扩展而互相遮挡。
    const addHiddenBossCorpseChooseButton = event => {
        const main = getMainControlPlayer();
        const canOperate = Boolean(event?.player && (event.isMine?.() || !_status.connectMode && main && event.player.isUnderControl?.(true, main)));
        const corpses = canOperate && !event.shuYing_tianshu_corpseButton ? getHiddenBossCorpseTargets(event) : [];
        if (!corpses.length) return;
        let dialog = null;
        let control = null;
        let closed = false;
        const closeDialog = () => {
            if (dialog) {
                dialog.close();
                dialog = null;
            }
        };
        const cleanup = () => {
            if (closed) return;
            closed = true;
            closeDialog();
            if (control) {
                control.close();
                control = null;
            }
            delete event.shuYing_tianshu_corpseButton;
            if (state.corpseChooseEvent == event) {
                state.corpseChooseEvent = null;
                state.corpseChooseCleanup = null;
            }
        };
        const refreshRows = () => {
            if (!dialog) return;
            dialog.content.querySelectorAll(".shuYing-tianshu-corpse-row").forEach(row => {
                row.style.outline = ui.selected.targets.includes(row.link) ? "2px solid #f6d365" : "";
            });
        };
        const chooseTarget = target => {
            const max = get.select(event.selectTarget)[1];
            if (ui.selected.targets.includes(target)) ui.selected.targets.remove(target);
            else {
                if (max == 1) ui.selected.targets.length = 0;
                ui.selected.targets.add(target);
            }
            refreshRows();
            if (typeof event.custom?.add?.target == "function") event.custom.add.target();
            game.check();
            if (max == 1 && ui.selected.targets.includes(target)) {
                closeDialog();
                ui.click.ok();
            }
        };
        const openDialog = () => {
            closeDialog();
            dialog = ui.create.dialog("hidden");
            dialog.classList.add("fullwidth");
            dialog.style.maxWidth = "560px";
            dialog.style.border = "1px solid rgba(246,211,101,0.75)";
            dialog.style.boxShadow = "0 0 18px rgba(0,0,0,0.65)";
            dialog.add('<div class="text center" style="font-size:20px;line-height:28px;color:#f6d365;text-shadow:0 0 5px #000;margin:4px 0 10px;">选择隐藏Boss尸体</div>');
            dialog.add('<div class="text center" style="font-size:13px;line-height:20px;color:#ddd;margin-bottom:6px;">点击列表项后直接指定对应阵亡Boss</div>');
            corpses.forEach(target => {
                const stage = Number(target.storage.shuYing_tianshu_stageIndex || 0) + 1;
                const row = ui.create.div(".shuYing-tianshu-corpse-row", dialog.content);
                row.link = target;
                row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;box-sizing:border-box;margin:7px auto;padding:10px 14px;width:86%;max-width:500px;border:1px solid rgba(246,211,101,0.55);background:rgba(20,16,14,0.82);color:#f6d365;text-align:left;line-height:22px;cursor:pointer;border-radius:6px;box-shadow:inset 0 0 10px rgba(246,211,101,0.08);";
                row.innerHTML = `<span style="font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${get.translation(target)}</span><span style="font-size:13px;color:#ffffff;opacity:0.9;white-space:nowrap;">第${stage}关 / 已阵亡</span>`;
                row.listen(() => chooseTarget(target));
            });
            dialog.open();
            refreshRows();
        };
        const createControl = () => {
            if (closed || event.finished || event.shuYing_tianshu_corpseButton) return;
            control = ui.create.control("隐藏Boss", openDialog);
            event.shuYing_tianshu_corpseButton = control;
        };
        setTimeout(createControl, 0);
        event.custom ??= { add: {}, replace: {} };
        event.custom.add ??= {};
        const oldAddTarget = event.custom.add.target;
        event.custom.add.target = function () {
            createControl();
            if (typeof oldAddTarget == "function") oldAddTarget.apply(this, arguments);
        };
        const oldAddConfirm = event.custom.add.confirm;
        event.custom.add.confirm = function (bool) {
            if (bool === false || bool === true) cleanup();
            if (typeof oldAddConfirm == "function") oldAddConfirm.apply(this, arguments);
        };
        const oldOnResult = event.onresult;
        event.onresult = function () {
            cleanup();
            if (typeof oldOnResult == "function") oldOnResult.apply(this, arguments);
        };
        state.corpseChooseEvent = event;
        state.corpseChooseCleanup = cleanup;
    };
    // 当选择事件被 restore、切换或通过点击屏幕取消时，清理上一次隐藏 Boss 按钮。
    const cleanupStaleCorpseChooseButton = event => {
        if (!state.corpseChooseCleanup || !state.corpseChooseEvent) return;
        if (state.corpseChooseEvent != event || !getHiddenBossCorpseTargets(event).length) state.corpseChooseCleanup();
    };
    // 包装 game.check，从统一目标检查入口补充隐藏 Boss 尸体选择按钮，兼容 chooseToUse/chooseTarget 等多种事件。
    const installHiddenBossCorpseCheckHook = () => {
        if (state.checkHookInstalled) return;
        state.originalGameCheck = game.check;
        state.checkHookInstalled = true;
        game.check = function (event = _status.event) {
            const result = arguments.length ? state.originalGameCheck.apply(this, arguments) : state.originalGameCheck.call(this, event);
            cleanupStaleCorpseChooseButton(event);
            if (state.running) addHiddenBossCorpseChooseButton(event);
            return result;
        };
    };
    // 召唤指定关卡的 Boss，并完成初始 Boss 静默退场和难度强化。
    const spawnStage = async (stageIndex = state.stageIndex) => {
        state.stageIndex = stageIndex;
        state.clearingStage = false;
        const pool = tianshuConfig.stages[stageIndex]?.bosses?.slice() || [];
        const bosses = [];
        const bossCount = Math.min(shouldAddExtraBoss() ? 3 : 2, pool.length);
        while (bosses.length < bossCount) {
            const boss = pool.randomRemove();
            if (boss) bosses.push(boss);
        }
        state.currentBosses = bosses.slice();
        const seats = getBossSeats();
        if (stageIndex == 0) await killInitialBossSilently();
        bosses.forEach((boss, index) => {
            addStageBoss(seats[index] || 8, boss);
        });
        game.arrangePlayers();
        for (const player of game.players.filter(current => isCurrentStageBoss(current))) {
            const config = applyBossDifficultyConfig(player);
            const startCards = getConfigNumber(config.startCards);
            if (startCards === null) continue;
            const needCards = startCards - player.countCards("h");
            if (needCards > 0) {
                const cards = get.cards(needCards);
                player.directgain(cards);
                if (!Array.isArray(player._start_cards)) player._start_cards = [];
                player._start_cards.addArray(cards);
            }
        }
    };
    // 读取玩家当前武将牌上自带的技能，避免过关奖励重复刷出本体技能。
    const getCharacterCardSkills = player => {
        const skills = [];
        for (const name of [player?.name, player?.name1, player?.name2]) {
            if (!name || !lib.character[name]) continue;
            const character = lib.character[name];
            const characterSkills = Array.isArray(character) ? character[3] : character.skills;
            if (Array.isArray(characterSkills)) skills.addArray(characterSkills);
        }
        return skills;
    };
    // 从全武将技能中构建可供指定玩家过关选择的技能池。
    const getAllSkillPool = player => {
        const skills = [];
        const banned = tianshuConfig.skillPool.banned || [];
        const ownCharacterSkills = getCharacterCardSkills(player);
        for (const name in lib.character) {
            const character = lib.character[name];
            if (!character || lib.filter.characterDisabled(name) || name.indexOf("boss_") == 0) continue;
            const characterSkills = Array.isArray(character) ? character[3] : character.skills;
            if (!Array.isArray(characterSkills)) continue;
            const list = characterSkills.slice();
            for (const skill of characterSkills) {
                const info = get.info(skill);
                if (!info) continue;
                if (typeof info.derivation == "string") list.add(info.derivation);
                else if (Array.isArray(info.derivation)) list.addArray(info.derivation);
            }
            for (const skill of list) {
                if (skills.includes(skill) || banned.includes(skill) || state.selectedSkillSet[skill] || ownCharacterSkills.includes(skill)) continue;
                const info = get.info(skill);
                if (!info || info.charlotte || info.equipSkill || info.cardSkill || info.ruleSkill || info.temp || info.sub || info.silent) continue;
                if (info.unique || info.juexingji || info.limited || info.zhuSkill || info.hiddenSkill || info.dutySkill || info.boss || info.superCharlotte) continue;
                if (skill.includes("_boss") || skill.startsWith("boss_") || skill.startsWith("_") || skill.includes("_sub")) continue;
                skills.push(skill);
            }
        }
        return skills;
    };
    // 单人控制规则下，可由主视角玩家代替同阵营 AI 选择过关奖励技能。
    const getRewardSkillChooser = player => {
        const main = getMainControlPlayer();
        const underControl = Boolean(main && typeof player.isUnderControl == "function" && player.isUnderControl(true, main));
        const tianshuSingleControl = Boolean(main && !_status.connectMode && lib.config.mode == "boss" && isCapturedPlayerSide(player) && !isVirtualIdol(player));
        let chooser = player;
        if (lib.config.extension_术樱包_giveAiSkill && main && player != main && (underControl || tianshuSingleControl)) chooser = main;
        return chooser;
    };
    // 让指定玩家从 UI 中选择一个奖励技能。
    const chooseRewardSkill = async (player, choices) => {
        const chooser = getRewardSkillChooser(player);
        const controls = choices.map(skill => get.translation(skill));
        const result = await chooser.chooseControl(controls)
            .set("prompt", `<span style="color:#f6d365">${get.translation(player)}</span> 请选择获得一个技能`)
            .set("choiceList", choices.map(skill => `<div class="skill" style="white-space:normal;word-break:break-all;line-height:22px;">【${get.translation(skill)}】</div><div class="popup text" style="width:calc(100% - 10px);display:inline-block;white-space:normal;word-break:break-all;">${lib.translate[`${skill}_info`] || "暂无技能描述"}</div>`))
            .set("displayIndex", false)
            .set("ai", () => controls[0])
            .forResult();
        const index = controls.indexOf(result.control);
        return choices[index] || null;
    };
    // 过关后让每个存活玩家方角色依次选择奖励技能。
    const chooseSkillsForStageClear = async () => {
        for (const player of getPlayerSidePlayers({ aliveOnly: true, includeVirtual: false })) {
            const pool = getAllSkillPool(player);
            const choices = [];
            while (choices.length < tianshuConfig.reward.skillChoiceCount && pool.length) {
                const choice = pool.randomRemove();
                if (choice) choices.push(choice);
            }
            if (!choices.length) continue;
            const skill = await chooseRewardSkill(player, choices);
            if (!skill || !choices.includes(skill)) continue;
            await player.addSkill(skill);
            const id = getPlayerKey(player);
            state.selectedSkills[id] ??= [];
            state.selectedSkills[id].push(skill);
            state.selectedSkillSet[skill] = true;
            player.storage.shuYing_tianshu_selectedSkills = state.selectedSkills[id].slice();
            game.log(player, "获得了技能", `#g【${get.translation(skill)}】`);
        }
    };
    // 获取 1 号位上家的最终 Boss，用于让 Boss 回合结束后立刻回到 1 号位玩家。
    const getFinalBossBeforeSeatOne = () => {
        const firstPlayer = getPlayerSeatOne();
        if (!firstPlayer) return game.boss || null;
        const target = firstPlayer.previous || game.boss || null;
        return target;
    };
    // 完成关卡清算：发奖励、选技能、进入下一关或结束游戏。
    const clearStage = async () => {
        if (state.clearingStage) return;
        state.clearingStage = true;
        if (state.stageIndex >= tianshuConfig.stages.length - 1) {
            game.over(game.me !== game.boss);
            return;
        }
        await reviveVirtualIdolIfNeeded();
        if (lib.config[tianshuConfig.settings.revivePlayersConfigKey]) {
            const deadPlayers = getPlayerSidePlayers({ aliveOnly: false, includeVirtual: false }).filter(player => player.isDead());
            const reviveConfig = {
                hard: { hp: 4, cards: 4 },
                nightmare: { hp: 1, cards: 2 },
            }[state.difficulty] || null;
            for (const player of deadPlayers) {
                if (player.maxHp <= 0) continue;
                const hp = reviveConfig ? Math.min(player.maxHp, reviveConfig.hp) : Math.max(1, player.maxHp);
                await player.revive(Math.max(1, hp));
                if (reviveConfig?.cards) {
                    const needCards = reviveConfig.cards - player.countCards("h");
                    if (needCards > 0) await player.draw(needCards);
                }
            }
        }
        for (const player of getPlayerSidePlayers({ aliveOnly: true, includeVirtual: true })) {
            if (tianshuConfig.reward.stageRecover) await player.recover(tianshuConfig.reward.stageRecover);
            if (tianshuConfig.reward.stageDraw) await player.draw(tianshuConfig.reward.stageDraw);
        }
        await chooseSkillsForStageClear();
        await game.washCard();
        hideCurrentStageBossCorpses();
        const currentTurnPlayer = getParentEvent("phase")?.player || _status.currentPhase;
        state.stageIndex++;
        await spawnStage(state.stageIndex);
        let nextTurnTarget = null;
        if (currentTurnPlayer && isCapturedPlayerSide(currentTurnPlayer)) {
            if (isVirtualIdol(currentTurnPlayer)) {
                nextTurnTarget = getFinalBossBeforeSeatOne();
            }
            else {
                const next = currentTurnPlayer.next;
                nextTurnTarget = next && !next.isDead() && isCapturedPlayerSide(next) && !isVirtualIdol(next) ? next : getFinalBossBeforeSeatOne();
            }
        }
        if (nextTurnTarget) finishCurrentPhaseTo(nextTurnTarget);
    };
    // 处理 Boss 死亡事件：击杀奖励、隐藏尸体、判断是否清关。
    const handleBossDie = async event => {
        const deadBoss = event.player;
        if (!isCurrentStageBoss(deadBoss)) return;
        if (deadBoss.storage.shuYing_tianshu_bossDieHandled) return;
        deadBoss.storage.shuYing_tianshu_bossDieHandled = true;
        const stageCleared = !state.currentBosses.some(name => game.players.some(current => current.name1 == name || current.name == name));
        const finalCleared = stageCleared && state.stageIndex >= tianshuConfig.stages.length - 1;
        if (!finalCleared && event.source && event.source.isIn()) {
            if (event.source.hp < event.source.maxHp) await event.source.recover(tianshuConfig.reward.killRecover);
            else await event.source.draw(tianshuConfig.reward.killDrawIfFullHp);
        }
        if (!stageCleared) return;
        await clearStage();
    };
    // gameStart 时启动天书乱斗流程，完成难度选择并等待 gameDrawAfter 召唤第一关。
    const startRun = async (player = game.me) => {
        if (state.running) return;
        state.running = true;
        state.initialBoss = game.boss || null;
        installHiddenBossCorpseCheckHook();
        spawnVirtualIdol();
        capturePlayerSide();
        state.pendingSpawn = true;
        await chooseDifficulty(player);
        _status.additionalReward = () => 500;
        ["shandian", "huoshan", "hongshui", "fulei", "lebu", "bingliang"].forEach(name => lib.inpile.remove(name));
        Array.from(ui.cardPile.childNodes).forEach(node => {
            if (["huoshan", "hongshui", "fulei", "lebu", "bingliang", "shandian", "muniu"].includes(node.name)) node.remove();
        });
        lib.inpile.sort(lib.sort.card);
        _status.shuYing_Tianshu_Bool = false;
        await game.washCard();
        getPlayerSidePlayers({ aliveOnly: true, includeVirtual: true }).forEach(current => {
            if (!isCurrentStageBoss(current)) current.addSkill("shuYing_Tianshu_Protection");
        });
    };

    const tianshuRuntime = {
        state,
        startRun,
        // 外部可调用的第一关延迟召唤入口，供调试和旧兼容入口查看。
        spawnPendingStage: async () => {
            if (!state.pendingSpawn) return;
            state.pendingSpawn = false;
            await spawnStage(0);
            setPhaseLoopBefore(getPlayerSeatOne());
        },
        handleBossDie,
        isCurrentStageBoss,
        // 判断角色是否为玩家方成员，默认要求角色仍在场。
        isPlayerSideMember: (player, aliveOnly = true) => Boolean(player && (!aliveOnly || player.isIn()) && isCapturedPlayerSide(player) && !isVirtualIdol(player)),
        // 判断玩家方是否已经全灭。
        isPlayerSideDefeated: () => !hasAliveRealPlayerSide(),
        // 判断角色是否还能触发开局保护。
        canReceiveOpeningProtection: player => Boolean(player && player.isIn() && !isCurrentStageBoss(player) && (isCapturedPlayerSide(player) || isVirtualIdol(player))),
        // 玩家死亡后检查是否达到失败条件。
        checkPlayerDefeat() {
            if (this.isPlayerSideDefeated()) game.over(game.me === game.boss);
        },
        getPlayerSeatOne,
        getVirtualIdolSeat,
    };

    tianshu.character = {
        tianshu_boss_shuYing: ["male", "qun", 0,
            ["shuYing_Skill_Tianshu_Go", "shuYing_Tianshu_NewNoStartCards", "shuYing_Skill_Tianshu_intro1", "shuYing_Skill_Tianshu_intro2", "shuYing_Skill_Tianshu_intro3",
                "shuYing_Skill_Tianshu_intro4", "shuYing_Skill_Tianshu_intro5"],
            ["boss", 'ext:术樱包/pve/images/tianshu.jpg']]
    };
    tianshu.init = () => {
        for (let i in lib.character.character) {
            if (lib.character.character[i][4].includes('hiddenboss')) continue;
            lib.character.character.config[i + '_boss_config'] = {
                name: get.translation(i),
                init: true,
                unfrequent: true,
            }
        }
    };
    tianshu.game = {};
    tianshu.boss = {
        tianshu_boss_shuYing:
        {
            chongzheng: 0,
            loopFirst() {
                return getPlayerSeatOne() || game.me;
            },
            checkResult() {
                return false;
            },
        },
    };
    tianshu.skill = {
        shuYing_Skill_Tianshu_Go:
        {
            mode: ["boss"],
            trigger: { global: "gameStart" },
            forced: true,
            popup: false,
            fixed: true,
            unique: true,
            async content(event, trigger, player) {
                await player.smoothAvatar();
                await tianshuRuntime.startRun();

                game.addGlobalSkill("shuYing_Tianshu_NewSpawnStage");
                game.addGlobalSkill("shuYing_Tianshu_NewBossDie");
                game.addGlobalSkill("shuYing_Tianshu_NewPlayerDie");
            },
        },
        shuYing_Tianshu_NewNoStartCards: {
            mode: ["boss"],
            trigger: { player: "gameDrawBegin" },
            forced: true,
            popup: false,
            charlotte: true,
            priority: 999,
            filter() {
                return Boolean(state.running);
            },
            content(event, trigger, player) {
                const origin = trigger.num;
                trigger.num = current => current == player ? 0 : (typeof origin == "function" ? origin(current) : origin);
            },
        },
        shuYing_Tianshu_NewSpawnStage: {
            mode: ["boss"],
            trigger: { global: "gameDrawAfter" },
            forced: true,
            popup: false,
            charlotte: true,
            filter() {
                return Boolean(state.pendingSpawn);
            },
            async content() {
                if (!state.pendingSpawn) return;
                state.pendingSpawn = false;
                await spawnStage(0);
                setPhaseLoopBefore(getPlayerSeatOne());
            },
        },
        shuYing_Tianshu_NewBossDie: {
            mode: ["boss"],
            trigger: { global: "dieAfter" },
            forced: true,
            popup: false,
            charlotte: true,
            forceDie: true,
            filter(event) {
                return isCurrentStageBoss(event.player);
            },
            async content(event, trigger) {
                await handleBossDie(trigger);
            },
        },
        shuYing_Tianshu_NewPlayerDie: {
            mode: ["boss"],
            trigger: { global: "dieAfter" },
            forced: true,
            popup: false,
            charlotte: true,
            forceDie: true,
            filter(event) {
                return Boolean(event.player && isCapturedPlayerSide(event.player) && !isVirtualIdol(event.player));
            },
            async content(event, trigger) {
                tianshuRuntime.checkPlayerDefeat();
            },
        },
        shuYing_Tianshu_Protection: {
            mode: ["boss"],
            trigger: { player: "damageBefore" },
            forced: true,
            priority: 100,
            charlotte: true,
            popup: false,
            // 仅玩家方/虚拟偶像可触发一次性保护。
            filter(event, player) {
                return Boolean(player && player.isIn() && !isCurrentStageBoss(player) && (isCapturedPlayerSide(player) || isVirtualIdol(player)));
            },
            // 防止本次伤害并移除保护技能。
            async content(event, trigger, player) {
                trigger.cancel();
                player.removeSkill("shuYing_Tianshu_Protection");
            },
        },
        shuYing_Skill_Tianshu_intro1: { nobracket: true },
        shuYing_Skill_Tianshu_intro2: { nobracket: true },
        shuYing_Skill_Tianshu_intro3: { nobracket: true },
        shuYing_Skill_Tianshu_intro4: { nobracket: true },
        shuYing_Skill_Tianshu_intro5: { nobracket: true },
    };
    tianshu.translate = {
        tianshu_boss_shuYing: "天书乱斗",
        shuYing_Skill_Tianshu_Go: "天书乱斗",
        shuYing_Skill_Tianshu_intro1: "&nbsp;第一关",
        shuYing_Skill_Tianshu_intro1_info: "挑战第一关Boss组合。",
        shuYing_Skill_Tianshu_intro2: "&nbsp;第二关",
        shuYing_Skill_Tianshu_intro2_info: "挑战第二关Boss组合。",
        shuYing_Skill_Tianshu_intro3: "&nbsp;第三关",
        shuYing_Skill_Tianshu_intro3_info: "挑战第三关Boss组合。",
        shuYing_Skill_Tianshu_intro4: "&nbsp;第四关",
        shuYing_Skill_Tianshu_intro4_info: "挑战第四关Boss组合。",
        shuYing_Skill_Tianshu_intro5: "&nbsp;规则：",
        shuYing_Skill_Tianshu_intro5_info: "共四关。击杀Boss获得奖励；过关后玩家方回复、摸牌并选择技能。",
        shuYing_Tianshu_Protection: "保护",
        shuYing_Tianshu_Protection_info: "锁定技。防止你受到的一次伤害，然后移除此技能。",
    };
    tianshu.perfectPair = {};
    tianshu.characterTitle = {};
    tianshu.characterReplace = {};

    shuYing.appendExtension("shuYing_pve_tianshu", "天书乱斗", tianshu);
}
