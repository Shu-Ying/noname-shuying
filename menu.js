import tianshuConfig from "./tianshu/config.js";

export default function initShuYingMenu({ lib, game, ui, shuYing, updater }) {
    const menu = lib.extensionMenu.extension_术樱包;
    // 创建可指定默认状态的折叠菜单，并在菜单节点延迟生成后应用初始状态。
    const createCollapseMenu = (title, endId, defaultCollapsed = false) => {
        const markerId = `${endId}_collapse`;
        const renderTitle = collapsed => `<span><div id="${markerId}" class="hth_menu">${collapsed ? "▶" : "▼"} ${title}</div></span>`;
        const getCollapseNodes = node => {
            if (node.shuyingCollapseNodes) return node.shuyingCollapseNodes;
            const nodes = [];
            let current = node.nextSibling;
            while (current && !current.querySelector?.(`#${endId}`)) {
                nodes.push(current);
                current = current.nextSibling;
            }
            node.shuyingCollapseNodes = nodes;
            return nodes;
        };
        const setCollapsed = (node, collapsed) => {
            if (!node) return false;
            node.shuyingCollapsed = Boolean(collapsed);
            getCollapseNodes(node).forEach(current => {
                current.style.display = node.shuyingCollapsed ? "none" : "";
            });
            node.innerHTML = renderTitle(node.shuyingCollapsed);
            return true;
        };
        const config = {
            name: `<div id="${markerId}" class="hth_menu">${defaultCollapsed ? "▶" : "▼"} ${title}</div>`,
            clear: true,
            onclick() {
                setCollapsed(this, !this.shuyingCollapsed);
            },
            setCollapsed(collapsed) {
                const node = document.getElementById(markerId)?.closest?.(".config");
                return setCollapsed(node, collapsed);
            },
        };

        if (defaultCollapsed) {
            const observer = new MutationObserver(() => {
                if (!config.setCollapsed(true)) return;
                observer.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
            queueMicrotask(() => {
                if (!config.setCollapsed(true)) return;
                observer.disconnect();
            });
        }
        return config;
    };

    const getBondLevelCondition = (bond, level) => {
        const source = level?.condition || bond?.condition;
        if (source) {
            const condition = { ...source };
            if (condition.count == null && level?.count != null) condition.count = level.count;
            return condition;
        }
        return bond?.keyword ? { type: "keyword", keyword: bond.keyword, count: level?.count } : null;
    };
    // 汇总羁绊涉及的技能名称；候选技能只在卡片顶部展示一次。
    const getBondSkillLabels = condition => {
        if (!condition || typeof condition != "object") return [];
        if (!condition.type) {
            return Array.from(new Set([
                ...(condition.all || []).flatMap(getBondSkillLabels),
                ...(condition.any || []).flatMap(getBondSkillLabels),
                ...getBondSkillLabels(condition.not),
            ].filter(Boolean)));
        }
        if (condition.type == "keyword") return condition.keyword ? [`含【${condition.keyword}】的技能`] : [];
        if (condition.type == "skill") return condition.skill ? [get.translation(condition.skill)] : [];
        if (condition.type == "skillName") return condition.name ? [condition.name] : [];
        if (condition.type == "skills") {
            return Array.from(new Set([...(condition.all || []), ...(condition.any || [])].map(skill => get.translation(skill)).filter(Boolean)));
        }
        if (condition.type == "skillNames") {
            return Array.from(new Set([...(condition.all || []), ...(condition.any || [])].filter(Boolean)));
        }
        if (condition.type == "characterSkillNames") {
            return Array.from(new Set([...(condition.all || []), ...(condition.any || [])].filter(Boolean)));
        }
        return [];
    };
    const getBondRuleHint = condition => {
        if (!condition || typeof condition != "object") return "";
        if (condition.type == "skillNames") return "按不同译名统计；同译名的不同技能 ID 只计 1 种过关技能";
        if (condition.type == "characterSkillNames") {
            const characters = Array.isArray(condition.characters) ? condition.characters : [condition.character];
            return `武将译名包含【${characters.filter(Boolean).join("】或【")}】且取得上述过关技能后触发`;
        }
        if (condition.type == "keyword") return `按描述中包含【${condition.keyword}】的不同技能译名统计`;
        if (!condition.type && [...(condition.all || []), ...(condition.any || [])].some(item => item?.type == "skillNames")) {
            return "按不同译名统计；同译名的不同技能 ID 只计 1 种过关技能";
        }
        return "";
    };
    const getBondLevelRequirement = (bond, level) => {
        const condition = getBondLevelCondition(bond, level);
        const count = Math.max(0, Math.floor(Number(condition?.count ?? level?.count) || 0));
        if (count) return condition?.type == "skillNames" ? `需 ${count} 种` : `需 ${count} 个`;
        if (condition?.type == "skills" && condition.all?.length) return `需 ${new Set(condition.all).size} 个`;
        if (condition?.type == "skillNames" && condition.all?.length) return `需 ${new Set(condition.all).size} 种`;
        return "";
    };
    const getBondRewardText = level => {
        if (level?.text) return level.text;
        const skills = Array.isArray(level?.skills) ? level.skills : (level?.skill ? [level.skill] : []);
        return skills.length ? `获得技能${skills.map(skill => `【${get.translation(skill)}】`).join("、")}` : "未配置奖励效果";
    };
    let closeTianshuBondDialog = null;
    // 创建独立羁绊谱册；每次打开都直接读取当前 tianshuConfig.bonds。
    const openTianshuBondDialog = () => {
        closeTianshuBondDialog?.();
        const previousFocus = document.activeElement;
        const createNode = (tag, className, text, parent) => {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (text !== undefined && text !== null) node.textContent = text;
            if (parent) parent.appendChild(node);
            return node;
        };
        const bonds = Array.isArray(tianshuConfig.bonds) ? tianshuConfig.bonds : [];
        const mask = createNode("div", "shuYing-bond-book-mask", null, document.body);
        const dialog = createNode("section", "shuYing-bond-book", null, mask);
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-label", "天书羁绊谱册");

        const header = createNode("header", "shuYing-bond-book-header", null, dialog);
        const heading = createNode("div", "shuYing-bond-book-heading", null, header);
        createNode("div", "shuYing-bond-book-eyebrow", "天书乱斗 · 羁绊谱册", heading);
        createNode("h2", "shuYing-bond-book-title", "羁绊系统", heading);
        createNode("div", "shuYing-bond-book-count", `${bonds.length} 条羁绊`, header);
        createNode("p", "shuYing-bond-book-intro", "羁绊只统计玩家过关时选择且当前仍持有的技能；达到更高等级时，高等级效果会覆盖低等级。", dialog);

        const content = createNode("div", "shuYing-bond-book-content", null, dialog);
        if (!bonds.length) {
            createNode("div", "shuYing-bond-book-empty", "config.js 中暂未配置可展示的羁绊。", content);
        }
        bonds.forEach((bond, bondIndex) => {
            const card = createNode("article", "shuYing-bond-book-card", null, content);
            const cardHead = createNode("div", "shuYing-bond-book-card-head", null, card);
            createNode("span", "shuYing-bond-book-seal", String(bondIndex + 1).padStart(2, "0"), cardHead);
            const nameWrap = createNode("div", "shuYing-bond-book-name-wrap", null, cardHead);
            createNode("h3", "shuYing-bond-book-name", bond.name || "未命名羁绊", nameWrap);

            const levels = (bond.levels || []).map((level, index) => ({
                ...level,
                rank: Number(level.level ?? level.count ?? index + 1) || index + 1,
            })).sort((a, b) => a.rank - b.rank);
            const summaryCondition = bond.condition || getBondLevelCondition(bond, levels[0]);
            const skillLabels = getBondSkillLabels(summaryCondition);
            if (skillLabels.length) {
                const summary = createNode("div", "shuYing-bond-book-summary", null, card);
                const tags = createNode("div", "shuYing-bond-book-tags", null, summary);
                skillLabels.forEach(name => createNode("span", "shuYing-bond-book-tag", name, tags));
                const hint = getBondRuleHint(summaryCondition);
                if (hint) createNode("div", "shuYing-bond-book-rule", hint, summary);
            }
            const levelList = createNode("div", "shuYing-bond-book-levels", null, card);
            if (!levels.length) createNode("div", "shuYing-bond-book-level-empty", "尚未配置等级", levelList);
            levels.forEach(level => {
                const row = createNode("div", "shuYing-bond-book-level", null, levelList);
                createNode("span", "shuYing-bond-book-level-dot", "", row);
                const detail = createNode("div", "shuYing-bond-book-level-detail", null, row);
                const requirement = getBondLevelRequirement(bond, level);
                createNode("div", "shuYing-bond-book-level-name", `第 ${level.rank} 级${requirement ? ` · ${requirement}` : ""}`, detail);
                createNode("div", "shuYing-bond-book-reward", getBondRewardText(level), detail);
            });
        });

        const controls = createNode("footer", "shuYing-bond-book-controls", null, dialog);
        const closeButton = createNode("button", "shuYing-bond-book-close", "关闭谱册", controls);
        closeButton.type = "button";
        const close = () => {
            document.removeEventListener("keydown", onKeydown);
            mask.remove();
            closeTianshuBondDialog = null;
            previousFocus?.focus?.({ preventScroll: true });
        };
        const onKeydown = event => {
            if (event.key == "Escape") close();
        };
        closeTianshuBondDialog = close;
        closeButton.addEventListener("click", close);
        mask.addEventListener("click", event => {
            if (event.target == mask) close();
        });
        document.addEventListener("keydown", onKeydown);
        closeButton.focus({ preventScroll: true });
    };

    menu.local_version = {
        name: `扩展版本：${lib.config.shuYing_local_version}`,
        clear: true,
        nopointer: true,
    };

    menu.online_version = {
        name: shuYing.getOnlineVersionText(),
        clear: true,
        nopointer: true,
    };

    const channelText = channel => `更新通道：${channel == "preview" ? "测试版" : "正式版"}（点击切换）`;
    menu.update_channel = {
        name: channelText(updater.getUpdateChannel()),
        clear: true,
        intro: "切换后立即从 Gitea 对应标签下载并校验文件，完成后需重启游戏。测试版可能回退到较早的内容。",
        async onclick() {
            if (!shuYing.m_bIsDownload) {
                alert("有其他文件正在下载，请稍后再试吧。");
                return;
            }

            const current = updater.getUpdateChannel();
            const next = current == "preview" ? "stable" : "preview";
            shuYing.m_bIsDownload = false;
            this.innerHTML = `正在切换到${next == "preview" ? "测试版" : "正式版"}…`;
            try {
                const version = await updater.checkVersion(shuYing, {
                    channel: next,
                    switchChannel: true,
                });
                if (version) {
                    game.saveConfig("shuYing_update_channel", next);
                    shuYing.updateOnlineVersionMenu(version);
                }
            }
            finally {
                const text = channelText(updater.getUpdateChannel());
                menu.update_channel.name = text;
                this.innerHTML = text;
            }
        },
    };

    menu.updateLog = {
        name: '<div class="hth_menu">▶更新日志</div>',
        clear: true,
        onclick() {
            if (this.hth_more) {
                this.hth_more.remove();
                delete this.hth_more;
                this.innerHTML = '<div class="hth_menu">▶更新日志</div>';
                return;
            }

            const logs = [
                "-----< 2.0.1.1 改动 >-----",
                "新增“旧轮次”选项，可在过关后按照旧规则将行动权交给玩家方1号位上家的Boss",
                "新增“羁绊技能倾向”选项，已激活羁绊的相关技能将按羁绊等级获得温和的出现概率提升",
                "羁绊技能倾向权重现可在天书配置中按等级独立调整",
                "新增“虚拟偶像参与奖励”选项，开启后虚拟偶像可以选择过关技能并激活、升级羁绊效果",
                "-----< 2.0.1.1 修复 >-----",
                "修复多次触发青龙偃月刀追加【杀】并击杀Boss后，过关奖励结束时无法正确跳过当前角色剩余回合的问题",
                "修复旧轮次在新Boss召唤前提前判断座位，导致行动权交接条件无法正常触发的问题",
                "修复当前行动角色为虚拟偶像时，旧轮次无法将行动权交给玩家方1号位上家Boss的问题",
                "修复“南蛮入侵”和“群雄逐鹿”羁绊虽然对友方无效，但AI仍会将友方计入用牌收益而拒绝使用相关牌的问题",
            ];
            const keywordColors = {
                BOSS: "#ff6b6b",
                PVE: "#ff6b6b",
                PVP: "#ff6b6b",
                天书乱斗: "#66ccff",
                羁绊: "#d77cff",
                动态难度: "#d77cff",
                过关技能: "#7ed957",
                十周年UI: "#ffb74d",
                移动端: "#ffb74d",
                removeDirectories: "#ff9800",
                remove: "#ff9800",
            };
            const highlightKeywords = text => {
                for (const [keyword, color] of Object.entries(keywordColors)) {
                    text = text.replaceAll(
                        keyword,
                        `<span style="color:${color};font-weight:bold;text-shadow:0 0 2px rgba(0,0,0,0.6)">${keyword}</span>`
                    );
                }
                return text;
            };
            const formatLog = text => {
                if (text.includes("改动 >")) {
                    return `<span style="color:#66ccff;font-weight:bold">${text}</span>`;
                }
                if (text.includes("修复 >")) {
                    return `<span style="color:#ffb74d;font-weight:bold">${text}</span>`;
                }
                return `<span>${highlightKeywords(text)}</span>`;
            };
            const more = ui.create.div(
                ".hth_more",
                `<div style="display:block;text-align:left;font-size:15px;line-height:1.5;padding:5px 8px">${logs.map(formatLog).join("<br>")}</div>`
            );

            this.parentNode.insertBefore(more, this.nextSibling);
            this.hth_more = more;
            this.innerHTML = '<div class="hth_menu">▼更新日志</div>';
        },
    };

    menu.updata = {
        name: "版本检测",
        clear: true,
        onclick() {
            if (confirm("点击确定会检测版本") && shuYing.m_bIsDownload) {
                shuYing.m_bIsDownload = false;
                updater.checkVersion(shuYing);
            } else if (!shuYing.m_bIsDownload) {
                alert("有其他文件正在下载，请稍后再试吧。");
            }
        },
    };

    menu.repairBug = {
        name: "本地资源修复",
        clear: true,
        onclick() {
            if (confirm("点击确定会检测本地资源，并尝试修复。") && shuYing.m_bIsDownload) {
                shuYing.m_bIsDownload = false;
                shuYing.RepairBug();
            } else if (!shuYing.m_bIsDownload) {
                alert("有其他文件正在下载，请稍后再试吧。");
            }
        },
    };

    menu.filling = {
        name: "查漏补缺&nbsp;<--补齐丢失资源 建议更新后必点",
        clear: true,
        onclick() {
            if (
                confirm("点击确定会检测本地丢失资源，并开始修补；若是武将立绘则是静态，若需动态请手动下载（请注意流量使用情况！务必在WIFI状态下修补）") &&
                shuYing.m_bIsDownload
            ) {
                shuYing.m_bIsDownload = false;
                updater.repairMissingFiles(shuYing);
            } else if (!shuYing.m_bIsDownload) {
                alert("有其他文件正在下载，请稍后再试吧。");
            }
        },
    };

    menu.br4 = {
        clear: true,
        nopointer: true,
        name: "--------------------",
    };

    menu.tianShuGroup = createCollapseMenu(
        "天书乱斗选项",
        "shuying_tianshu_menu_end",
        lib.config.extension_术樱包_tianShu_Off === false
    );

    menu.tianShu_Off = {
        name: "天书乱斗开关",
        init: true,
        intro: "关闭后，关闭天书乱斗模式（在非挑战模式下自动关闭）",
        onclick(enabled) {
            game.saveConfig("extension_术樱包_tianShu_Off", enabled);
            if (!enabled) menu.tianShuGroup.setCollapsed(true);
        },
    };

    menu.tianShu_bonds = {
        name: "查看羁绊谱册",
        clear: true,
        intro: "同步读取天书配置，展示当前可激活的羁绊、等级条件和奖励效果",
        onclick() {
            openTianshuBondDialog();
        },
    };

    menu.tianShu_bondPreference = {
        name: "羁绊技能倾向",
        init: false,
        intro: "开启后，过关选择技能时会小幅提高当前已激活羁绊相关技能的出现概率，羁绊等级越高增幅越高",
    };

    menu.giveAiSkill = {
        name: "单人控制AI技能",
        init: false,
        intro: "开启后，天书乱斗模式每次过关且处于单人控制规则下则玩家给AI选择技能。",
    };

    menu.tianShu_Xvni = {
        name: "虚拟偶像",
        init: "random",
        item: {
            Xiaojiu: "小酒",
            Xiaosha: "小杀",
            Xiaoshan: "小闪",
            Xiaole: "小乐",
            Xiaotao: "小桃",
            random: "随机",
            off: "关闭",
        },
        onclick(layout) {
            game.saveConfig("extension_术樱包_tianShu_Xvni", layout);
        },
    };

    menu.tianShu_XvniReward = {
        name: "虚拟偶像参与奖励",
        init: false,
        intro: "开启后，虚拟偶像会参与每次过关技能选择，并可通过取得的过关技能激活和升级羁绊效果。",
    };

    const virtualIdols = [
        { key: "Xiaojiu", id: "vtb_xiaojiu", name: "小酒" },
        { key: "Xiaosha", id: "vtb_xiaosha", name: "小杀" },
        { key: "Xiaoshan", id: "vtb_xiaoshan", name: "小闪" },
        { key: "Xiaole", id: "vtb_xiaole", name: "小乐" },
        { key: "Xiaotao", id: "vtb_xiaotao", name: "小桃" },
    ];
    const virtualIdolNames = Object.fromEntries(virtualIdols.map(item => [item.key, item.name]));
    const getVirtualIdolPoolName = () => {
        const list = lib.config.extension_术樱包_tianShu_XvniRandomPool;
        if (!Array.isArray(list) || !list.length) return "虚拟偶像随机池：全部";
        return `虚拟偶像随机池：${list.map(key => virtualIdolNames[key]).filter(Boolean).join("、") || "全部"}`;
    };

    menu.tianShu_XvniRandomPool = {
        name: getVirtualIdolPoolName(),
        clear: true,
        intro: "点击后选择允许被随机到的虚拟偶像。全选时视为全部随机。",
        async onclick() {
            const current =
                Array.isArray(lib.config.extension_术樱包_tianShu_XvniRandomPool) &&
                    lib.config.extension_术樱包_tianShu_XvniRandomPool.length
                    ? lib.config.extension_术樱包_tianShu_XvniRandomPool
                    : virtualIdols.map(item => item.key);
            const node = this;
            const result = await shuYing.chooseCharacterPoolDialog({
                title: "选择虚拟偶像随机池",
                intro: "只会影响“虚拟偶像：随机”。全选时保存为全部随机。",
                list: virtualIdols,
                selected: current,
            });
            if (result === false) return;

            const list = result.length === virtualIdols.length ? [] : result;
            game.saveConfig("extension_术樱包_tianShu_XvniRandomPool", list);
            node.firstChild.innerHTML = getVirtualIdolPoolName();
        },
    };

    menu.tianShu_dead = {
        name: "虚拟偶像复活",
        init: false,
        intro: "开启后，进入下一关后若虚拟偶像阵亡则复活",
    };

    menu.tianShu_revivePlayers = {
        name: "过关复活玩家",
        init: false,
        intro: "开启后，进入下一关前复活玩家方已阵亡的角色。虚拟偶像不会因此复活。",
    };

    menu.tianShu_legacyRound = {
        name: "旧轮次",
        init: false,
        intro: "开启后，玩家方角色（含虚拟偶像）的下家为Boss或虚拟偶像时，新关由玩家方1号位上家的Boss开始行动；关闭时始终由当前角色的实际下家行动。",
    };

    menu.tianShu_addBoss = {
        name: "增加Boss",
        init: false,
        intro: "开启后，可以新增一位Boss",
    };

    menu.br5 = {
        clear: true,
        nopointer: true,
        name: '<span id="shuying_tianshu_menu_end">--------------------</span>',
    };

    menu.Log = {
        name: "<span style='text-decoration: underline'>反馈BUG</span>",
        clear: true,
        onclick() {
            game.open("https://tieba.baidu.com/p/7934495658");
        },
    };

    menu.qq = {
        name: "QQ交流群：957537184",
        clear: true,
        nopointer: true,
    };

    menu.thank = {
        name: "感谢极光佬，诗笺佬和其他大佬网络上的文献。以及反馈BUG的玩家。谢谢！特别感谢少年A对本扩展进行的优化描述。",
        clear: true,
        nopointer: true,
    };
}
