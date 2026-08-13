import tianshuConfig from "./config.js";
import bondSkillPack from "./bondSkills.js";
import { lib, game, ui, get, ai, _status } from "../../../noname.js";

export default function initTianshu(lib, game, ui, get, ai, _status, shuYing) {
    if (!lib.config.extension_术樱包_tianShu_Off) return;

    let tianshu = new Object();

    const state = {
        difficulty: "normal",
        stageIndex: 0,
        selectedSkillSet: {},
        difficultyBossMap: {},
        originalBossMap: {},
        playerSideIds: {},
        roundStartPlayer: null,
        roundStartSeat: 0,
        originalIsRoundFilter: null,
        roundFilterInstalled: false,
        originalGameCheck: null,
        checkHookInstalled: false,
        bondHooksInstalled: false,
        corpseChooseCleanup: null,
        corpseChooseEvent: null,
        initialBoss: null,
        virtualIdol: null,
        running: false,
        pendingSpawn: false,
        clearingStage: false,
        bondOverviewButton: null,
        bondOverviewDialog: null,
    };

    const rewardSkillSource = "shuYing_tianshu_reward";
    const selectedSkillStorage = "shuYing_tianshu_selectedSkills";
    const bondSkillSourcePrefix = "shuYing_tianshu_bond_";
    const bondSyncingPlayers = new WeakSet();
    const bondQueuedPlayers = new WeakSet();

    // 读取玩家当前仍持有的天书过关选择技能；羁绊只能使用此列表判定。
    const getTianshuRewardSkills = player => {
        const skills = player?.additionalSkills?.[rewardSkillSource];
        if (Array.isArray(skills)) return skills.filter(skill => typeof skill == "string" && skill);
        return typeof skills == "string" && skills ? [skills] : [];
    };
    // 读取天书过关选择历史；技能永久失去后仍保留，用于识别是否需要刷新羁绊。
    const getTianshuRewardSkillHistory = player => {
        const skills = player?.storage?.[selectedSkillStorage];
        return Array.isArray(skills) ? skills.filter(skill => typeof skill == "string" && skill) : [];
    };
    // 捕获一次过关技能选择，同时登记实际技能来源和不可见的选择历史。
    const captureTianshuRewardSkill = async (player, skill) => {
        if (!player || typeof skill != "string" || !skill || !lib.skill[skill]) return false;
        if (!getTianshuRewardSkills(player).includes(skill)) {
            await player.addAdditionalSkills(rewardSkillSource, skill, true);
        }
        const history = getTianshuRewardSkillHistory(player);
        if (!history.includes(skill)) {
            history.push(skill);
            player.storage[selectedSkillStorage] = history;
            game.broadcast((current, key, value) => current.storage[key] = value, player, selectedSkillStorage, history);
            player.syncStorage?.(selectedSkillStorage);
        }
        return true;
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
    // 判断指定角色是否为当前关卡实际召唤的 Boss；玩家变身为同名动态武将时不会被误判。
    const isCurrentStageBoss = player => Boolean(player?.storage?.shuYing_tianshu_stageBoss && player.storage.shuYing_tianshu_stageIndex == state.stageIndex);
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
        const canChoose = player == game.me || player?.isUnderControl?.();
        if (canChoose && typeof shuYing.chooseSingleOptionDialog == "function") {
            state.difficulty = await shuYing.chooseSingleOptionDialog({
                title: "请选择天书乱斗难度",
                intro: "难度将改变Boss的起始手牌、体力上限与追加技能，本局确定后不可更改。",
                defaultKey: "normal",
                options: keys.map(key => ({ key, tone: key, ...tianshuConfig.difficulties[key] })),
            }) || "normal";
        }
        else {
            const controls = keys.map(key => tianshuConfig.difficulties[key].name);
            const result = await player.chooseControl(controls).set("prompt", "请选择天书乱斗难度").set("ai", () => 0).forResult();
            state.difficulty = keys[Math.max(0, controls.indexOf(result.control))] || "normal";
        }
        _status[tianshuConfig.settings.difficultyStatusKey] = state.difficulty;
    };
    // 在指定座位创建当前难度的动态 Boss；初始主 Boss 已静默死亡，所以关卡 Boss 全部使用忠臣身份。
    const addStageBoss = (position, originalName) => {
        const name = state.difficultyBossMap[originalName] || originalName;
        const boss = game.addFellow(position, name, "zoominanim");
        boss.dataset.position = position;
        boss.side = true;
        boss.identity = "zhong";
        boss.setIdentity(boss.identity);
        boss.storage.shuYing_tianshu_stageBoss = true;
        boss.storage.shuYing_tianshu_stageIndex = state.stageIndex;
        boss.storage.shuYing_tianshu_originalBossName = originalName;
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
    // 将动态难度武将 ID 还原为 config.js 中使用的原始 Boss ID。
    const getBossConfigName = source => {
        if (typeof source == "string") return state.originalBossMap[source] || source;
        const name = source?.storage?.shuYing_tianshu_originalBossName || source?.name1 || source?.name || "";
        return state.originalBossMap[name] || name;
    };
    // 读取当前 Boss 在当前难度下的数值配置；单 Boss 配置覆盖默认难度配置。
    const getBossDifficultyConfig = player => {
        const defaultConfig = tianshuConfig.bossDifficulty?.default?.[state.difficulty] || {};
        const bossConfig = tianshuConfig.bossDifficulty?.bosses?.[getBossConfigName(player)]?.[state.difficulty] || {};
        return Object.assign({}, defaultConfig, bossConfig);
    };
    // 补充技能只读取当前难度配置，不跨难度继承低难度技能。
    const getBossDifficultySkills = player => {
        const defaultSkills = tianshuConfig.bossDifficulty?.default?.[state.difficulty]?.skills || [];
        const bossConfig = tianshuConfig.bossDifficulty?.bosses?.[getBossConfigName(player)]?.[state.difficulty] || {};
        const bossSkills = [];
        if (Array.isArray(bossConfig.skills)) bossSkills.addArray(bossConfig.skills);
        const skills = [];
        for (const skill of defaultSkills.concat(bossSkills)) {
            if (skill && !skills.includes(skill)) skills.push(skill);
        }
        return skills;
    };
    // 根据原始武将和当前难度，生成包含准确体力、上限及追加技能的隐藏动态武将。
    const createDifficultyBossCharacter = originalName => {
        const original = lib.character[originalName];
        if (!original) return null;
        const source = get.convertedCharacter(original);
        const data = {};
        for (const [key, value] of Object.entries(source)) {
            data[key] = value && typeof value == "object" ? get.copy(value) : value;
        }
        const config = getBossDifficultyConfig(originalName);
        const maxHp = getConfigNumber(config.maxHp);
        const maxHpBonus = getConfigNumber(config.maxHpBonus) || 0;
        const hp = getConfigNumber(config.hp);
        const hpBonus = getConfigNumber(config.hpBonus) || 0;
        data.maxHp = Math.max(1, maxHp ?? source.maxHp + maxHpBonus);
        data.hp = Math.min(Math.max(1, hp ?? source.hp + hpBonus), data.maxHp);
        data.skills = source.skills.slice();
        data.skills.addArray(getBossDifficultySkills(originalName));
        data.isHiddenBoss = true;
        data.isBossAllowed = true;
        data.isAiForbidden = true;
        data.tempname = Array.isArray(source.tempname) ? source.tempname.slice() : [];
        data.tempname.add(originalName);
        return get.convertedCharacter(data);
    };
    // 难度选择后一次性注册本局全部动态 Boss，供召唤、变身及武将牌技能读取共同使用。
    const prepareDifficultyBossCharacters = () => {
        state.difficultyBossMap = {};
        state.originalBossMap = {};
        const names = tianshuConfig.stages.flatMap(stage => stage?.bosses || []);
        for (const originalName of Array.from(new Set(names))) {
            const character = createDifficultyBossCharacter(originalName);
            if (!character) continue;
            const dynamicName = `${originalName}_tianshu_${state.difficulty}`;
            state.difficultyBossMap[originalName] = dynamicName;
            state.originalBossMap[dynamicName] = originalName;
            lib.character[dynamicName] = character;
            lib.translate[dynamicName] = lib.translate[originalName] || get.translation(originalName);
            if (lib.translate[`${originalName}_ab`]) lib.translate[`${dynamicName}_ab`] = lib.translate[`${originalName}_ab`];
            if (lib.translate[`${originalName}_prefix`]) lib.translate[`${dynamicName}_prefix`] = lib.translate[`${originalName}_prefix`];
            if (lib.characterIntro?.[originalName]) lib.characterIntro[dynamicName] = lib.characterIntro[originalName];
            if (lib.characterTitle?.[originalName]) lib.characterTitle[dynamicName] = lib.characterTitle[originalName];
            lib.config.forbidai?.add(dynamicName);
            lib.hiddenCharacters?.add(dynamicName);
            lib.skilllist.addArray(character.skills);
        }
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
    // 召唤指定关卡的动态 Boss，并按配置补足仅属于登场流程的初始手牌。
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
        const seats = getBossSeats();
        if (stageIndex == 0) await killInitialBossSilently();
        bosses.forEach((boss, index) => {
            addStageBoss(seats[index] || 8, boss);
        });
        game.arrangePlayers();
        for (const player of game.players.filter(current => isCurrentStageBoss(current))) {
            const config = getBossDifficultyConfig(player);
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
    // 检查技能能否进入指定玩家的过关奖励池，并统一处理去重与规则过滤。
    const canAddRewardSkill = (skill, skills, ownCharacterSkills) => {
        if (typeof skill != "string" || !skill || skills.includes(skill)) return false;
        const banned = tianshuConfig.skillPool.banned || [];
        if (banned.includes(skill) || state.selectedSkillSet[skill] || ownCharacterSkills.includes(skill)) return false;
        const info = get.info(skill);
        if (!info || info.charlotte || info.equipSkill || info.cardSkill || info.ruleSkill || info.temp || info.sub || info.silent) return false;
        if (info.unique || info.juexingji || info.limited || info.zhuSkill || info.hiddenSkill || info.dutySkill || info.boss || info.superCharlotte) return false;
        return !skill.includes("_boss") && !skill.startsWith("boss_") && !skill.startsWith("_") && !skill.includes("_sub");
    };
    // 每次过关同步合并 config 额外奖励池和当前已加载的全武将技能池。
    const getAllSkillPool = player => {
        const skills = [];
        const ownCharacterSkills = getCharacterCardSkills(player);
        for (const skill of tianshuConfig.skillPool.additional || []) {
            if (canAddRewardSkill(skill, skills, ownCharacterSkills)) skills.push(skill);
        }
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
                if (canAddRewardSkill(skill, skills, ownCharacterSkills)) skills.push(skill);
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
    // 读取指定 additionalSkills 来源当前持有的技能。
    const getAdditionalSourceSkills = (player, source) => {
        const skills = player?.additionalSkills?.[source];
        if (Array.isArray(skills)) return skills.filter(skill => typeof skill == "string" && skill);
        return typeof skills == "string" && skills ? [skills] : [];
    };
    // 羁绊只读取玩家当前仍持有的过关选择技能，不读取武将牌或其他来源技能。
    const getBondConditionSkills = player => getTianshuRewardSkills(player);
    // 将过关技能按译名归一化；同译名的不同技能 ID 只贡献一次羁绊进度。
    const getUniqueBondSkillNames = skills => Array.from(new Set(
        skills.map(skill => lib.translate[skill]).filter(name => typeof name == "string" && name)
    ));
    // 获取玩家主副将译名，供武将名称关键词条件检索不同前后缀版本。
    const getBondCharacterNames = player => Array.from(new Set(
        [player?.name, player?.name1, player?.name2]
            .filter(name => typeof name == "string" && name)
            .map(name => lib.translate[name] || get.translation(name))
            .filter(name => typeof name == "string" && name)
    ));
    // 通用羁绊条件解释器，支持关键词、指定技能以及 all/any/not 组合。
    const matchesBondCondition = (player, condition) => {
        if (!condition || typeof condition != "object") return false;
        if (!condition.type && Array.isArray(condition.all)) return condition.all.every(item => matchesBondCondition(player, item));
        if (!condition.type && Array.isArray(condition.any)) return condition.any.some(item => matchesBondCondition(player, item));
        if (!condition.type && condition.not) return !matchesBondCondition(player, condition.not);

        const owned = getBondConditionSkills(player);
        if (condition.type == "keyword") {
            if (!condition.keyword) return false;
            const marker = `【${condition.keyword}】`;
            const matchedNames = new Set();
            owned.forEach(skill => {
                const info = typeof get.skillInfoTranslation == "function" ? get.skillInfoTranslation(skill, player) : lib.translate[`${skill}_info`];
                if (String(info || "").includes(marker)) matchedNames.add(lib.translate[skill] || skill);
            });
            return matchedNames.size >= Math.max(1, Number(condition.count) || 1);
        }
        if (condition.type == "skill") return typeof condition.skill == "string" && owned.includes(condition.skill);
        if (condition.type == "skillName") {
            return typeof condition.name == "string" && owned.some(skill => lib.translate[skill] == condition.name);
        }
        if (condition.type == "skills") {
            const all = Array.isArray(condition.all) ? condition.all : [];
            const any = Array.isArray(condition.any) ? condition.any : [];
            if (all.length && !all.every(skill => owned.includes(skill))) return false;
            if (any.length && !any.some(skill => owned.includes(skill))) return false;
            return Boolean(all.length || any.length);
        }
        if (condition.type == "skillNames") {
            const names = new Set(getUniqueBondSkillNames(owned));
            const all = Array.from(new Set(Array.isArray(condition.all) ? condition.all.filter(Boolean) : []));
            const any = Array.from(new Set(Array.isArray(condition.any) ? condition.any.filter(Boolean) : []));
            if (all.length && !all.every(name => names.has(name))) return false;
            const matchedAny = any.filter(name => names.has(name));
            const need = Number(condition.count);
            if (Number.isFinite(need) && need > 0) {
                const matched = new Set(all.filter(name => names.has(name)).concat(matchedAny));
                return matched.size >= Math.max(1, Math.floor(need));
            }
            if (any.length && !matchedAny.length) return false;
            return Boolean(all.length || any.length);
        }
        if (condition.type == "characterSkillNames") {
            const characters = Array.from(new Set(
                (Array.isArray(condition.characters) ? condition.characters : [condition.character]).filter(Boolean)
            ));
            if (!characters.length || !characters.some(keyword => getBondCharacterNames(player).some(name => name.includes(keyword)))) return false;
            const names = new Set(getUniqueBondSkillNames(owned));
            const all = Array.from(new Set(Array.isArray(condition.all) ? condition.all.filter(Boolean) : []));
            const any = Array.from(new Set(Array.isArray(condition.any) ? condition.any.filter(Boolean) : []));
            if (all.length && !all.every(name => names.has(name))) return false;
            if (any.length && !any.some(name => names.has(name))) return false;
            return Boolean(all.length || any.length);
        }
        return false;
    };
    // 兼容当前关键词配置，同时允许以后直接为等级填写任意 condition。
    const getBondLevelCondition = (bond, level) => {
        const source = level?.condition || bond?.condition;
        if (source) {
            const condition = { ...source };
            if (condition.count == null && level?.count != null) condition.count = level.count;
            return condition;
        }
        if (bond?.keyword) {
            return {
                type: "keyword",
                keyword: bond.keyword,
                count: level?.count,
            };
        }
        return null;
    };
    // 只选取条件成立且等级最高的一档，低等级效果不会与高等级叠加。
    const getActiveBondLevel = (player, bond) => {
        let active = null;
        (bond.levels || []).forEach((level, index) => {
            if (!matchesBondCondition(player, getBondLevelCondition(bond, level))) return;
            const rank = Number(level.level ?? level.count ?? index + 1) || index + 1;
            if (!active || rank > active.rank) active = { config: level, rank };
        });
        return active;
    };
    const getBondLevelSkills = level => {
        if (Array.isArray(level?.skills)) return level.skills.filter(Boolean);
        return level?.skill ? [level.skill] : [];
    };
    // 打开当前玩家方羁绊概览；只展示名称、等级和该等级的实际效果。
    const openBondOverview = () => {
        state.bondOverviewDialog?.remove();
        const createNode = (tag, className, text, parent) => {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined && text !== null) node.textContent = text;
            parent?.appendChild(node);
            return node;
        };
        const mask = createNode("div", "shuYing-bond-overview-mask", null, document.body);
        const dialog = createNode("section", "shuYing-bond-overview", null, mask);
        state.bondOverviewDialog = mask;
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        createNode("h2", "shuYing-bond-overview-title", "已激活羁绊", dialog);
        const content = createNode("div", "shuYing-bond-overview-content", null, dialog);
        let total = 0;
        for (const current of getPlayerSidePlayers({ aliveOnly: false, includeVirtual: false })) {
            const levels = current.storage?.shuYing_tianshu_bondLevels || {};
            const activeBonds = (tianshuConfig.bonds || []).map(bond => {
                const rank = Number(levels[bond.id]) || 0;
                const level = (bond.levels || []).find((item, index) => (Number(item.level ?? item.count ?? index + 1) || index + 1) == rank);
                return rank && level ? { bond, level, rank } : null;
            }).filter(Boolean);
            if (!activeBonds.length) continue;
            total += activeBonds.length;
            const group = createNode("article", "shuYing-bond-overview-player", null, content);
            createNode("h3", "shuYing-bond-overview-player-name", get.translation(current), group);
            activeBonds.forEach(({ bond, level, rank }) => {
                const row = createNode("div", "shuYing-bond-overview-item", null, group);
                const head = createNode("div", "shuYing-bond-overview-item-head", null, row);
                createNode("span", "shuYing-bond-overview-name", bond.name || "未命名羁绊", head);
                createNode("span", "shuYing-bond-overview-level", `第 ${rank} 级`, head);
                createNode("div", "shuYing-bond-overview-effect", level.text || "该等级暂未配置效果说明", row);
            });
        }
        if (!total) createNode("div", "shuYing-bond-overview-empty", "当前玩家方尚未激活羁绊", content);
        const close = createNode("button", "shuYing-bond-overview-close", "关闭", dialog);
        close.type = "button";
        const finish = () => {
            mask.remove();
            if (state.bondOverviewDialog == mask) state.bondOverviewDialog = null;
        };
        close.addEventListener("click", finish);
        mask.addEventListener("click", event => {
            if (event.target == mask) finish();
        });
        close.focus({ preventScroll: true });
    };
    // 创建独立于具体 UI 扩展的羁绊入口按钮。
    const installBondOverviewButton = () => {
        state.bondOverviewButton?.remove();
        const button = document.createElement("button");
        button.className = "shuYing-bond-overview-button";
        button.type = "button";
        button.textContent = "羁绊";
        button.title = "查看玩家方当前激活的羁绊效果";
        button.addEventListener("click", openBondOverview);
        document.body.appendChild(button);
        state.bondOverviewButton = button;
        lib.onover.push(() => {
            button.remove();
            state.bondOverviewDialog?.remove();
            if (state.bondOverviewButton == button) state.bondOverviewButton = null;
            state.bondOverviewDialog = null;
        });
    };
    const sameSkillList = (first, second) => first.length == second.length && first.every(skill => second.includes(skill));
    // 将一个羁绊来源精确同步为目标技能，保留武将牌或其他来源持有的同名技能。
    const syncAdditionalSkillSource = (player, source, desiredSkills) => {
        const desired = Array.from(new Set(desiredSkills)).filter(skill => {
            if (lib.skill[skill]) return true;
            console.warn(`[天书羁绊] 未找到奖励技能：${skill}`);
            return false;
        });
        const current = getAdditionalSourceSkills(player, source);
        if (sameSkillList(current, desired)) return false;

        const removable = new Set(player.getRemovableAdditionalSkills(source));
        for (const skill of current.filter(skill => !desired.includes(skill))) {
            if (removable.has(skill)) player.removeSkill(skill);
            else player.$removeAdditionalSkills(source, skill);
        }
        for (const skill of desired.filter(skill => !current.includes(skill))) {
            if (!player.hasSkill(skill, true, false, false)) player.addSkill(skill, null, true, true);
        }
        if (desired.length) player.additionalSkills[source] = desired.slice();
        else delete player.additionalSkills[source];
        game.broadcast((current, map) => current.additionalSkills = map, player, player.additionalSkills);
        player.checkConflict();
        _status.event?.clearStepCache?.();
        return true;
    };
    // 依据当前真实技能所有权重算一名玩家的全部羁绊来源和隐藏等级缓存。
    const refreshTianshuBonds = player => {
        if (!state.running || !player || !isCapturedPlayerSide(player) || isVirtualIdol(player) || bondSyncingPlayers.has(player)) return;
        bondSyncingPlayers.add(player);
        try {
            delete player.storage.shuYing_tianshu_keywordBondLevels;
            const levelCache = {};
            const activeSources = new Set();
            for (const bond of tianshuConfig.bonds || []) {
                if (!bond?.id) continue;
                const source = `${bondSkillSourcePrefix}${bond.id}`;
                const active = getActiveBondLevel(player, bond);
                const skills = active ? getBondLevelSkills(active.config) : [];
                activeSources.add(source);
                syncAdditionalSkillSource(player, source, skills);
                if (active) levelCache[bond.id] = active.rank;
            }
            for (const source of Object.keys(player.additionalSkills || {})) {
                if (source.startsWith(bondSkillSourcePrefix) && !activeSources.has(source)) syncAdditionalSkillSource(player, source, []);
            }
            if (Object.keys(levelCache).length) player.storage.shuYing_tianshu_bondLevels = levelCache;
            else delete player.storage.shuYing_tianshu_bondLevels;
        }
        finally {
            bondSyncingPlayers.delete(player);
        }
    };
    // 合并同一调用栈内的技能变化，确保 additionalSkills 映射更新完成后再重算。
    const queueTianshuBondRefresh = player => {
        if (!state.running || !player || bondSyncingPlayers.has(player) || bondQueuedPlayers.has(player)) return;
        bondQueuedPlayers.add(player);
        Promise.resolve().then(() => {
            bondQueuedPlayers.delete(player);
            refreshTianshuBonds(player);
        });
    };
    // 兜底监听直接 removeSkill，但只响应曾被捕获的天书过关选择技能。
    const installTianshuBondHooks = () => {
        if (state.bondHooksInstalled) return;
        state.bondHooksInstalled = true;
        const hook = (skill, player) => {
            if (getTianshuRewardSkillHistory(player).includes(skill)) queueTianshuBondRefresh(player);
        };
        (lib.hooks.removeSkillCheck ||= []).push(hook);
    };
    // 从当前奖励池随机生成候选；刷新时优先排除上一组技能。
    const createRewardSkillChoices = (player, excluded = []) => {
        const excludedSet = new Set(excluded);
        const pool = getAllSkillPool(player).filter(skill => !excludedSet.has(skill));
        const choices = [];
        while (choices.length < tianshuConfig.reward.skillChoiceCount && pool.length) {
            const choice = pool.randomRemove();
            if (choice) choices.push(choice);
        }
        return choices;
    };
    // 让指定玩家从 UI 中选择一个奖励技能，并返回刷新请求或最终技能。
    const chooseRewardSkill = async (player, choices, canRefresh) => {
        const chooser = getRewardSkillChooser(player);
        const canChoose = chooser == game.me || chooser?.isUnderControl?.();
        if (!canChoose || typeof shuYing.chooseSkillRewardDialog != "function") return choices[0] || null;
        const playerName = get.translation(player);
        return shuYing.chooseSkillRewardDialog({
            title: `第${state.stageIndex + 1}关 ${playerName}选择技能`,
            highlightText: playerName,
            choices,
            selectedSkills: getBondConditionSkills(player),
            bonds: tianshuConfig.bonds || [],
            player,
            canRefresh,
        });
    };
    // 过关后让每个存活玩家方角色依次选择奖励技能。
    const chooseSkillsForStageClear = async () => {
        for (const player of getPlayerSidePlayers({ aliveOnly: true, includeVirtual: false })) {
            let choices = createRewardSkillChoices(player);
            if (!choices.length) continue;
            let refreshed = false;
            let skill = await chooseRewardSkill(player, choices, true);
            if (skill?.refresh) {
                refreshed = true;
                const oldChoices = choices;
                const handCards = player.getCards("h");
                const discardCount = Math.ceil(handCards.length / 2);
                if (discardCount) await player.discard(handCards.randomGets(discardCount));
                choices = createRewardSkillChoices(player, oldChoices);
                if (!choices.length) choices = createRewardSkillChoices(player);
                if (!choices.length) continue;
                skill = await chooseRewardSkill(player, choices, !refreshed);
            }
            if (!skill || !choices.includes(skill)) continue;
            if (!await captureTianshuRewardSkill(player, skill)) continue;
            state.selectedSkillSet[skill] = true;
            refreshTianshuBonds(player);
        }
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
        // 过关后立即结束当前回合，并将新关的首个行动权交给当前角色的实际下家。
        if (currentTurnPlayer?.next) finishCurrentPhaseTo(currentTurnPlayer.next);
    };
    // 处理 Boss 死亡事件：击杀奖励、隐藏尸体、判断是否清关。
    const handleBossDie = async event => {
        const deadBoss = event.player;
        if (!isCurrentStageBoss(deadBoss)) return;
        if (deadBoss.storage.shuYing_tianshu_bossDieHandled) return;
        deadBoss.storage.shuYing_tianshu_bossDieHandled = true;
        const stageCleared = !game.players.some(current => isCurrentStageBoss(current));
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
        installTianshuBondHooks();
        installBondOverviewButton();
        state.pendingSpawn = true;
        await chooseDifficulty(player);
        prepareDifficultyBossCharacters();
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
        getBossConfigName,
        getDifficultyBossName: originalName => state.difficultyBossMap[originalName] || originalName,
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
        refreshBonds: refreshTianshuBonds,
        queueBondRefresh: queueTianshuBondRefresh,
        getPlayerSeatOne,
        getVirtualIdolSeat,
    };

    tianshu.character = {
        tianshu_boss_shuYing: {
            sex: "male",
            group: "",
            hp: 0,
            skills: [
                "shuYing_Skill_Tianshu_Go",
                "shuYing_Tianshu_NewNoStartCards",
                "shuYing_Skill_Tianshu_intro1",
                "shuYing_Skill_Tianshu_intro2",
                "shuYing_Skill_Tianshu_intro3",
                "shuYing_Skill_Tianshu_intro4",
                "shuYing_Skill_Tianshu_intro5",
            ],
            isBoss: true,
            extraModeData: "qun",
            img: "extension/术樱包/pve/images/tianshu.jpg",
        },
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
        ...bondSkillPack.skill,
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
                game.addGlobalSkill("shuYing_Tianshu_BondManager");
            },
        },
        shuYing_Tianshu_BondManager: {
            mode: ["boss"],
            trigger: { global: "changeSkillsAfter" },
            forced: true,
            silent: true,
            popup: false,
            charlotte: true,
            firstDo: true,
            filter(event) {
                if (!state.running || !event.player || !isCapturedPlayerSide(event.player) || isVirtualIdol(event.player)) return false;
                const removed = Array.isArray(event.removeSkill) ? event.removeSkill : [];
                const history = getTianshuRewardSkillHistory(event.player);
                return removed.some(skill => history.includes(skill));
            },
            content(event, trigger) {
                refreshTianshuBonds(trigger.player);
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
            trigger: { player: "damageBegin4" },
            forced: true,
            priority: -1000,
            charlotte: true,
            popup: false,
            filter(event, player) {
                return Boolean(event.num > 0 && player && player.isIn() && !isCurrentStageBoss(player) && (isCapturedPlayerSide(player) || isVirtualIdol(player)));
            },
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
        shuYing_Tianshu_BondManager: "天书羁绊",
    };
    tianshu.perfectPair = {};
    tianshu.characterTitle = {};
    tianshu.characterReplace = {};

    return tianshu;
}
