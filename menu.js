export default function initShuYingMenu({ lib, game, ui, shuYing, updater }) {
    const menu = lib.extensionMenu.extension_术樱包;
    const createCollapseMenu = (title, endId) => ({
        name: `<div class="hth_menu">▼ ${title}</div>`,
        clear: true,
        onclick() {
            if (!this.shuyingCollapseNodes) {
                const nodes = [];
                let node = this.nextSibling;

                while (node && !node.querySelector?.(`#${endId}`)) {
                    nodes.push(node);
                    node = node.nextSibling;
                }
                this.shuyingCollapseNodes = nodes;
            }

            const collapsed = !this.shuyingCollapsed;
            this.shuyingCollapsed = collapsed;
            this.shuyingCollapseNodes.forEach(node => {
                node.style.display = collapsed ? "none" : "";
            });
            this.innerHTML = `<span><div class="hth_menu">${collapsed ? "▶" : "▼"} ${title}</div></span>`;
        },
    });

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
                "-----< 2.0.0.9 改动 >-----",
                "新增可以自定义虚拟偶像随机助战池功能",
                "现在过关奖励提供的技能池会过滤武将牌上的技能",
                "新增BOSS：子鼠、午马、日夜游神、董卓、旱魃",
                "适配部分技能需要依赖BOSS的起始手牌",
                "适配部分技能需要选择已经死亡的BOSS为目标时，提供一个按钮来列出已死亡的BOSS列表",
                "-----< 2.0.0.9 修复 >-----",
                "修复BOSS死亡尸体不会消失的BUG",
                "修正曹操AI会更加正确判断何时发动【疑神】",
                "修正过关后BOSS的初始手牌不再是摸牌事件",
                "-----< 2.0.0.8 改动 >-----",
                "新增BOSS：玄女！",
                "不用担心困难，虚拟偶像前来援助！",
                "新增BOSS选项开启，现在可以在扩展选项中开启新增1位BOSS来提高难度！",
                "-----< 2.0.0.8 修复 >-----",
                "修复当过关奖励执行完毕轮数和下轮角色异常的BUG",
                "修复了一个BUG，该BUG会导致进入下关时BOSS的初始牌会被技能检索",
                "修复黄蜂技能【冥虫】无法正常发动的BUG",
                "修正司马懿AI向其友方发动【反馈】【狼顾】的问题",
            ];
            const keywordColors = {
                BOSS: "#ff6b6b",
                武将牌: "#ff6b6b",
                BUG: "#ff9800",
                虚拟偶像: "#66ccff",
                玄女: "#d77cff",
                "【冥虫】": "#7ed957",
                "【反馈】": "#7ed957",
                "【狼顾】": "#7ed957",
                黄蜂: "#d77cff",
                司马懿: "#d77cff",
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

    menu.tianShuGroup = createCollapseMenu("天书乱斗选项", "shuying_tianshu_menu_end");

    menu.tianShuOff = {
        name: "天书乱斗开关",
        init: true,
        intro: "关闭后，关闭天书乱斗模式（在非挑战模式下自动关闭）",
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
