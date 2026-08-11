import { lib, game, ui, get, ai, _status } from "../../noname.js";
import updater from "./update.js"
import func from "./function.js"
import initShuYingMenu from "./menu.js";

export const type = "extension";
export let shuYing = new Object();
const shuYingLocalVersion = "2.0.0.9";

shuYing.name = "术樱包";
shuYing.editable = false;
shuYing.localVersion = shuYingLocalVersion;
shuYing.m_bIsDownload = true;                               //用于判断下载状态，true: 可以下载，false：下载被占用
shuYing.url = `${lib.assetURL}extension/术樱包`;            //包路径
shuYing.text = {};                                          //中上方文本
shuYing.text_style = {};                                    //中上方文本样式
shuYing.moduleCache = {};                                   //动态加载模块缓存，避免同一文件重复import
shuYing.voices = {};                                        //语音台词表，voices.js缺失时保持为空

//按需加载扩展内部模块。optional为true时，文件缺失只关闭对应功能，不中断整个扩展入口。
shuYing.loadModule = async (path, label, optional = true) => {
    if (!shuYing.moduleCache[path]) {
        shuYing.moduleCache[path] = import(path)
            .then(module => module.default ?? module)
            .catch(error => {
                const message = `术樱包：${label || path}加载失败`;
                if (!optional) throw error;
                console.warn(message, error);
                return null;
            });
    }
    return shuYing.moduleCache[path];
};

//加载语音翻译表。该文件只影响台词显示，缺失时不影响武将包主体加载。
shuYing.loadVoices = async () => {
    const voices = await shuYing.loadModule("./voices.js", "语音台词表", true);
    shuYing.voices = voices || {};
    return shuYing.voices;
};

// 公共函数需要在菜单创建前初始化，扩展菜单可在选将预备阶段被点击
shuYing.initFunction = () => {
    if (shuYing.functionInitialized) return;
    if (typeof func == "function") {
        func(lib, game, ui, get, ai, _status, shuYing);
        shuYing.functionInitialized = true;
    }
};

shuYing.getOnlineVersionText = () => `最新版本：${lib.config.shuYing_online_version || "检测中..."}`;
shuYing.updateOnlineVersionMenu = (version) => {
    if (!version) return;

    game.saveConfig("shuYing_online_version", version);

    const text = `最新版本：${version}`;
    if (lib.extensionMenu.extension_术樱包?.online_version) {
        lib.extensionMenu.extension_术樱包.online_version.name = text;
    }

    if (typeof document != "undefined") {
        const nodes = document.querySelectorAll(".config");
        for (const node of nodes) {
            if (node.textContent && node.textContent.trim().startsWith("最新版本：")) {
                node.innerHTML = `<span>${text}</span>`;
            }
        }
    }
};

/**
 * @param { String } name              扩展包英文名
 * @param { String } translate         扩展包翻译名
 * @param { Object } obj               类对象
 */
shuYing.appendExtension = function (name, translate, obj) {
    let oobj = get.copy(obj);
    oobj.name = name;
    oobj.character = obj.character;
    oobj.skill = obj.skill;
    Object.assign(obj.translate, shuYing.voices || {});
    oobj.translate = obj.translate;
    game.import('character', () => { return oobj; });
    lib.config.all.characters.push(name);
    if (!lib.config.characters.contains(name)) {
        lib.config.characters.push(name);
    }
    lib.translate[name + '_character_config'] = translate;
};

// 将玩法模块的数据合并进同一个武将包，重复 ID 保留主包内容，避免生成额外的武将包菜单项。
shuYing.mergeCharacterPack = function (target, source, sourceName = "附加模块") {
    if (!target || !source) return target;
    const sections = [
        "character", "card", "skill", "translate", "characterSort", "characterFilter",
        "characterTitle", "dynamicTranslate", "characterIntro", "perfectPair", "pinyins",
        "boss", "game", "characterReplace",
    ];
    for (const section of sections) {
        const data = source[section];
        if (!data || typeof data != "object") continue;
        const targetData = target[section] || (target[section] = {});
        for (const [id, value] of Object.entries(data)) {
            if (Object.prototype.hasOwnProperty.call(targetData, id)) {
                console.warn(`术樱包：跳过${sourceName}中重复的${section} ID“${id}”`);
                continue;
            }
            targetData[id] = value;
        }
    }
    return target;
};

// 清理旧版本曾注册的独立武将包，防止历史配置让已合并模块继续出现在武将包列表。
shuYing.removeLegacyCharacterPack = function (name) {
    const removeFrom = list => {
        if (!Array.isArray(list)) return false;
        let changed = false;
        for (let index = list.indexOf(name); index >= 0; index = list.indexOf(name)) {
            list.splice(index, 1);
            changed = true;
        }
        return changed;
    };
    removeFrom(lib.config.all.characters);
    if (removeFrom(lib.config.characters)) {
        game.saveConfig("characters", lib.config.characters);
    }
    removeFrom(lib.connectCharacterPack);
    delete lib.characterPack[name];
    delete lib.translate[`${name}_character_config`];
};

shuYing.getVersion = (callback) => {
    return updater.getOnlineVersion()
        .then(version => {
            shuYing.updateOnlineVersionMenu(version?.online_version);
            if (typeof callback == "function") {
                callback(version);
            }
            return version;
        })
        .catch(error => {
            console.error("术樱包获取在线版本失败：", error);
            return null;
        });
}

//进入游戏时
shuYing.content = (config, pack) => {
};

//术樱包初始化CSS样式
shuYing.initCSS = () => {
    //初始化加载CSS
    lib.init.css(lib.assetURL + 'extension/术樱包', 'extension');

    shuYing.text = document.createElement("div");
    shuYing.text_style =
    {
        width: "360px",
        minHeight: "92px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "8px",
        background: "linear-gradient(135deg, rgba(22,24,30,0.94), rgba(42,38,50,0.94))",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "8px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        padding: "14px 16px",
        position: "absolute",
        top: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "10",
        color: "#f5f1e8",
        textAlign: "left",
        writingMode: "horizontal-tb",
        textOrientation: "mixed",
        whiteSpace: "normal",
        wordBreak: "keep-all",
        fontSize: "14px",
        lineHeight: "1.35",
        fontFamily: "'Microsoft YaHei','STXinwei','xinwei',sans-serif",
        pointerEvents: "none",
    };

    for (let k in shuYing.text_style) {
        shuYing.text.style[k] = shuYing.text_style[k];
    };
}

//术樱包初始化Config配置文件
shuYing.initConfig = () => {
    if (lib.config.show_splash != 'off') game.saveConfig('show_splash', 'off'); //关闭启动页

    //崩坏3包
    if (lib.config.extension_shuYing_bengHuai_Off == undefined) {
        game.saveConfig('extension_shuYing_bengHuai_Off', true);
    }

    //原神包
    if (lib.config.extension_术樱包_yuanShenOff == undefined) {
        game.saveConfig('extension_术樱包_yuanShenOff', true);
    }

    //崩铁包
    if (lib.config.extension_术樱包_bengTieOff == undefined) {
        game.saveConfig('extension_术樱包_bengTieOff', true);
    }

    //天书包
    if (lib.config.extension_shuYing_tianShu_Off == undefined) {
        game.saveConfig('extension_shuYing_tianShu_Off', true);
    }

    //天书一共多少层
    if (lib.config.extension_shuYing_tianShu_Instances == undefined) {
        game.saveConfig('extension_shuYing_tianShu_Instances', 4);
    }

    //天书自定义Boss列表
    if (lib.config.extension_shuYing_tianShu_DiyBoss == undefined) {
        game.saveConfig('extension_shuYing_tianShu_DiyBoss', '');
    }

    //天书狂暴
    if (lib.config.extension_shuYing_tianShu_KuangBao == undefined) {
        game.saveConfig('extension_shuYing_tianShu_KuangBao', '');
    }

    //百战天书
    if (lib.config.extension_shuYing_baiZhan_Off == undefined) {
        game.saveConfig('extension_shuYing_baiZhan_Off', false);
    }

    //
    // if(lib.config.extension_术樱包_skillsoff==undefined) game.saveConfig('extension_术樱包_skillsoff',false);

    //版本号
    game.saveConfig('shuYing_local_version', shuYingLocalVersion);

};

//术樱包初始化武将包
shuYing.initCharacter = async () => {
    let shuYingList;
    if (lib.config.mode == 'boss') {
        shuYing.removeLegacyCharacterPack("shuYing_pve_tianshu");
        let shuying_boss = await shuYing.loadModule("./pve/boss/index.js", "活动BOSS", true);

        const initTianShu = await shuYing.loadModule("./tianshu/extension.js", "天书乱斗", true);
        if (typeof initTianShu == "function") {
            const tianshu = initTianShu(lib, game, ui, get, ai, _status, shuYing);
            if (tianshu) {
                if (shuying_boss) shuYing.mergeCharacterPack(shuying_boss, tianshu, "天书乱斗");
                else shuying_boss = tianshu;
            }
        }

        if (shuying_boss) {
            shuYing.appendExtension("shuYing_pve_boss", "活动BOSS", shuying_boss);
        }
        // shuYingList =
        //     [
        //         "yuanshen",
        //     ];
    }

    const shuying_character = await shuYing.loadModule("./character/index.js", "术樱包", true);
    if (shuying_character) {
        shuYing.appendExtension("shuYing_character", "术樱包", shuying_character);
    }

    // shuYingList.forEach(url => {
    //     let extUrl = shuYing.url + "/" + url;

    //     lib.init.js(extUrl, "extension", () => {
    //         window.func(lib, game, ui, get, ai, _status, shuYing);
    //     });
    // });
}

//初始化游戏时
shuYing.precontent = async () => {
    await shuYing.loadVoices();
    shuYing.initCSS();
    shuYing.initFunction();
    shuYing.initConfig();
    // const initMengsan = await shuYing.loadModule("./mengsan/mode.js", "梦三模式", true);
    // if (typeof initMengsan == "function") {
    //     await initMengsan();
    // }
    initShuYingMenu({ lib, game, ui, shuYing, updater });
    shuYing.getVersion();
    await shuYing.initCharacter();
};

shuYing.config = () => {

};

shuYing.help = () => {

};

//添加自定义Boss TODO
shuYing.newTianShuBossList = function () {
    _status.buttonNode; //用于判断输入框回车之后响应事件
    _status.nameList;
    let manual = ui.create.div('.manual', manual);
    let menu = ui.create.div('.menu', manual);
    let input = menu.appendChild(document.createElement('input'));
    input.onkeydown = function (e) {
        if (e && e.keyCode == 13) {
            if (_status.buttonNode == 2) {
                this.deleteBossList(dialog, manual, input.value);
            }
            else {
                this.searchBossList(dialog, manual, input.value);
            }
        }
    };

    let addNewBoss = ui.create.div('.addNewBoss', menu); //加入新boss
    let newBossList = ui.create.div('.newBossList', menu);
    let deleteNewBossAllList = ui.create.div('.deleteNewBossAllList', menu);
    let deleteNewBoss = ui.create.div('.deleteNewBoss', menu);
    let playerList = ui.create.div('.playerList', menu);

    let close = ui.create.div('.close', menu);
    let dialog = ui.create.dialog();
    dialog.noImage = true;
    dialog.style.backgroundImage = "";

    let content = manual.appendChild(dialog);
    content.classList.remove('nobutton');
    content.classList.add('content');
    content.style.transform = '';
    content.style.opacity = '';
    content.style.height = '';

    newBossList.innerHTML = '列表';
    newBossList.id = 'newBossList';
    newBossList.addEventListener('click', function () {
        this.addBossShow(dialog, manual);
    });

    deleteNewBossAllList.innerHTML = '清除';
    deleteNewBossAllList.addEventListener('click', function () {
        if (confirm('点击确定清除全部自定义Boss')) {
            game.saveConfig('extension_shuYing_tianShu_DiyBoss', '');
            this.addBossShow(dialog, manual);
            alert('清除完毕!');
        }
    });

    addNewBoss.innerHTML = '搜索';
    addNewBoss.addEventListener('click', function () {
        this.searchBossList(dialog, manual, input.value);

        input.value = "";
        _status.buttonNode = 1;
    });

    deleteNewBoss.innerHTML = '登陆'; //暂时弃用
    deleteNewBoss.addEventListener('click', function () {
        alert('暂未开放');
        //deleteNewBossList(dialog,manual,input.value);
        //input.value="";
        //_status.buttonNode=2;
    });

    playerList.innerHTML = '排行榜';
    playerList.addEventListener('click', function () {
        alert('暂未开放');
    });

    dialog.addText("使用说明: 点击列表查看自定义BOSS列表<br><br>" +
        "点击清空按钮清空自定义BOSS列表中全部Boss<br><br>" +
        "点击列表列举出Boss列表，并可以删除列表中的Boss<br><br>" +
        "点击搜索并在输入框内输入武将名称即可罗列相似武将<br><br>" +
        "需要注意的是，输入框需要输入武将名称而不是英文<br>一旦启用自定义Boss，那么必须保持不禁用武将和Boss列表大于1");

    // close1.addEventListener('click', function(){
    // 	alert(close1.value);
    // 	//game.tujianBegin(content , close , input.value , manual);
    // 	//input.value="";
    // });

    close.innerHTML = '关闭';
    close.addEventListener('click', function () {
        manual.remove();
        ui.arena.show();
        ui.system.show();

        game.resume2();
        if (game.onresume2) {
            game.onresume2();
        }
        ui.arena.classList.remove('menupaused');
        ui.historybar.classList.remove('menupaused');
        ui.window.classList.remove('touchinfohidden');
        ui.config2.classList.remove('pressdown2');
        ui.menuContainer.show();
    });

    _status.paused = true;
    ui.arena.classList.remove('menupaused');
    ui.arena.hide();
    ui.system.hide();
    ui.menuContainer.hide();
    ui.window.appendChild(manual);
},

    //添加自定义Boss TODO
    shuYing.addBossShow = function (dialog, manual) {
        dialog = ui.create.dialog();
        dialog.noImage = true;
        dialog.style.backgroundImage = "";

        let content = manual.appendChild(dialog);
        content.classList.remove('nobutton');
        content.classList.add('content');
        content.style.transform = '';
        content.style.opacity = '';
        content.style.height = '';

        let list = lib.config.extension_术樱_tianshu_add_list;
        if (list == undefined || list == '') {
            dialog.addText("无BOSS");
        } else {
            list = list.split(",");

            for (let i = 0; i < list.length; i++) {
                for (let j in lib.character) {
                    if (j == list[i]) {
                        dialog.addSmall([[j], 'character']);
                        let del = ui.create.div('.shadowed.reduce_radius.pointerdiv.tdnode');
                        del.link = i;
                        del.innerHTML = '<span>' + '删除' + '</span>';
                        del.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', function () {
                            if (lib.config.extension_术樱_tianshu_add_list.length <= 1) {
                                game.saveConfig('extension_术樱_tianshu_add_list', '');
                            } else if (lib.config.extension_术樱_tianshu_add_list.length == 2) {
                                if (this.link != 1) {
                                    game.saveConfig('extension_术樱_tianshu_add_list', list[this.link]);
                                } else {
                                    game.saveConfig('extension_术樱_tianshu_add_list', list[0]);
                                }
                            } else {
                                game.saveConfig('extension_术樱_tianshu_add_list', '');
                                for (let k = 0; k < list.length; k++) {
                                    if (k == this.link) continue;
                                    if (lib.config.extension_术樱_tianshu_add_list == undefined || lib.config.extension_术樱_tianshu_add_list == '') {
                                        game.saveConfig('extension_术樱_tianshu_add_list', list[k]);
                                    } else {
                                        game.saveConfig('extension_术樱_tianshu_add_list', lib.config.extension_术樱_tianshu_add_list + ',' + list[k]);
                                    }
                                }
                                document.getElementById('newBossList').click(); //刷新列表
                            }
                        });
                        dialog.addAuto(del);
                    }
                }
            }
        }
    },

    //搜索Boss TODO
    shuYing.searchBossList = function (dialog, manual, val) {
        dialog = ui.create.dialog();
        dialog.noImage = true;
        dialog.style.backgroundImage = "";

        let content = manual.appendChild(dialog);
        content.classList.remove('nobutton');
        content.classList.add('content');
        content.style.transform = '';
        content.style.opacity = '';
        content.style.height = '';

        let result = val;
        let value = false;
        let list = [];

        if (result == "" || result == null) {
            result = "请输入武将名称";
            alert(result);
        } else {
            for (let a in lib.character) {
                if (lib.translate[a] && lib.translate[a].indexOf(result) != -1) {
                    list.add(a);
                    value = true;
                }
            }

            for (let i = 0; i < list.length; i++) {
                dialog.addSmall([[list[i]], 'character']);
                let add = ui.create.div('.shadowed.reduce_radius.pointerdiv.tdnode');
                add.link = i;
                add.innerHTML = '<span>' + '加入' + '</span>';
                add.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', function () {
                    if (lib.config.extension_术樱_tianshu_add_list == undefined || lib.config.extension_术樱_tianshu_add_list == '') {
                        game.saveConfig('extension_术樱_tianshu_add_list', list[this.link]);
                    } else {
                        game.saveConfig('extension_术樱_tianshu_add_list', lib.config.extension_术樱_tianshu_add_list + ',' + list[this.link]);
                    }
                    alert('成功加入至列表');
                });
                dialog.addAuto(add);
            }

            _status.nameList = list;

            if (value == false) {
                alert('找不到名为' + result + '的武将!');
            }
        }
    },

    //删除Boss TODO
    shuYing.deleteBossList = function (dialog, manual, val) {
        dialog = ui.create.dialog();
        dialog.noImage = true;
        dialog.style.backgroundImage = "";

        let content = manual.appendChild(dialog);
        content.classList.remove('nobutton');
        content.classList.add('content');
        content.style.transform = '';
        content.style.opacity = '';
        content.style.height = '';

        let result = val;

        if (result == "" || result == null) {
            result = "你没有输入名称";
            alert(result);
            return;
        }

        let list = lib.config.extension_术樱_tianshu_add_list.split(",");
        let value = false;
        let newList = [];

        for (let i = 0; i < list.length; i++) {
            let pushBool = true;
            if (String(lib.translate[list[i]]) == String(result)) {
                if (confirm('已找到' + result + '武将，点击确定移除自定义Boss列表。')) {
                    pushBool = false;
                }
                value = true;
            }
            if (pushBool) newList.push(list[i]);
        }
        if (newList) {
            game.saveConfig('extension_术樱_tianshu_add_list', '');
            for (let j = 0; j < newList.length; j++) {
                if (lib.config.extension_术樱_tianshu_add_list == undefined || lib.config.extension_术樱_tianshu_add_list == '') {
                    game.saveConfig('extension_术樱_tianshu_add_list', newList[j]);
                } else {
                    game.saveConfig('extension_术樱_tianshu_add_list', lib.config.extension_术樱_tianshu_add_list + ',' + newList[j]);
                }
            }
        }


        if (value == false) {
            alert('找不到名为' + result + '的武将或者武将不存在自定义Boss列表中。');
        }
    },

    shuYing.download_beta_version = function () {
        let online_version;
        let httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", 'http://diuse.hao1237.top/Diuse/beta_extension/online_version.js', true);
        httpRequest.send(null);
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                online_version = httpRequest.responseText;
                game.saveConfig('Diuse_online_version', httpRequest.responseText)
                lib.init.js(url, 'version', function () {
                    try {
                        let local_version = Diuse_version;
                        let Diuse_num = 1;
                    } catch (error) {
                        if (confirm('本地资源不完整！点击确认重新获取！')) {
                            game.download('http://diuse.hao1237.top/Diuse/beta_extension/files.js', 'extension/术樱/files.js', function () { }, function () { });
                            game.download('http://diuse.hao1237.top/Diuse/beta_extension/version.js', 'extension/术樱/version.js', function () { }, function () { });
                            game.download('http://diuse.hao1237.top/Diuse/beta_extension/extension.js', 'extension/术樱/extension.js', function () {
                                game.saveConfig('Diuse_local_version', online_version);
                                Diuse_Button = true;
                                alert('下载完成，重启生效');
                            }, function () {
                                Diuse_Button = true;
                                alert('下载失败');
                            });
                        } else {
                            Diuse_Button = true;
                        }
                    }
                    if (local_version != online_version && Diuse_num == 1) {
                        if (confirm('检测到最新测试版本为:' + online_version + '本地版本为:' + local_version)) {
                            game.download('http://diuse.hao1237.top/Diuse/beta_extension/files.js', 'extension/术樱/files.js', function () { }, function () { });
                            game.download('http://diuse.hao1237.top/Diuse/beta_extension/version.js', 'extension/术樱/version.js', function () { }, function () { });
                            game.download('http://diuse.hao1237.top/Diuse/beta_extension/extension.js', 'extension/术樱/extension.js', function () {
                                game.saveConfig('Diuse_local_version', online_version);
                                Diuse_Button = true;
                                alert('下载完成，重启生效');
                            }, function () {
                                Diuse_Button = true;
                                alert('下载失败');
                            });
                        } else {
                            Diuse_Button = true;
                        }
                    } else {
                        if (Diuse_num == 1) {
                            Diuse_Button = true;
                            alert('本地版本为最新版');
                        }
                    }
                }, function () {
                    if (confirm('本地资源不完整！点击确认重新获取！')) {
                        game.download('http://diuse.hao1237.top/Diuse/beta_extension/files.js', 'extension/术樱/files.js', function () { }, function () { });
                        game.download('http://diuse.hao1237.top/Diuse/beta_extension/version.js', 'extension/术樱/version.js', function () { }, function () { });
                        game.download('http://diuse.hao1237.top/Diuse/beta_extension/extension.js', 'extension/术樱/extension.js', function () {
                            game.saveConfig('Diuse_local_version', online_version);
                            Diuse_Button = true;
                            alert('下载完成，重启生效');
                        }, function () {
                            Diuse_Button = true;
                            alert('下载失败');
                        });
                    } else {
                        Diuse_Button = true;
                    }
                });
            }
        };
    };

shuYing.download_mp3 = function () {
    lib.init.js(url, 'files', function () {
        let list = Diuse_mp3;
        let num = 0;
        let num1 = list.length;
        document.body.appendChild(Diuse_Text);
        let download1 = function () {
            game.download('http://diuse.hao1237.top/Diuse/skin/' + list[0], 'extension/术樱/' + list[0], function () {
                num++
                list.remove(list[0]);
                if (list.length > 0) {
                    Diuse_Text.innerHTML = '正在下载（' + num + '/' + num1 + '）';
                    download1();
                } else {
                    Diuse_Text.innerHTML = '下载完毕';
                    Diuse_Button = true;
                    alert('语音下载完毕!');
                    document.body.removeChild(Diuse_Text);
                };
            }, function () {
                if (confirm('下载' + list[0] + '失败，是否继续下载？')) {
                    download1();
                }
            });
        }
        download1();
    }, function () {
        Diuse_Button = true;
        alert('本地资源不完整！请检查文件完整性。');
    });
};

shuYing.download_static = function () {
    lib.init.js(url, 'files', function () {
        let list = Diuse_static;
        let num = 0;
        let num1 = list.length;
        document.body.appendChild(Diuse_Text);
        let download1 = function () {
            game.download('http://diuse.hao1237.top/Diuse/image/static/' + list[0], 'extension/术樱/' + list[0], function () {
                num++
                list.remove(list[0]);
                if (list.length > 0) {
                    Diuse_Text.innerHTML = '正在下载（' + num + '/' + num1 + '）';
                    download1();
                } else {
                    Diuse_Text.innerHTML = '下载完毕';
                    Diuse_Button = true;
                    alert('静态皮肤下载完毕!');
                    document.body.removeChild(Diuse_Text);
                };
            }, function () {
                if (confirm('下载' + list[0] + '失败，是否继续下载？')) {
                    download1();
                }
            });
        }
        download1();
    }, function () {
        Diuse_Button = true;
        alert('本地资源不完整！请检查文件完整性。');
    });
};

shuYing.download_tianshu = function () {
    lib.init.js(url, 'files', function () {
        let list = Diuse_tianshu;
        let num = 0;
        let num1 = list.length;
        document.body.appendChild(Diuse_Text);
        let download1 = function () {
            game.download('http://diuse.hao1237.top/Diuse/image/tianshu/' + list[0], 'extension/术樱/' + list[0], function () {
                num++
                list.remove(list[0]);
                if (list.length > 0) {
                    Diuse_Text.innerHTML = '正在下载（' + num + '/' + num1 + '）';
                    download1();
                } else {
                    Diuse_Text.innerHTML = '下载完毕';
                    Diuse_Button = true;
                    alert('天书皮肤下载完毕!');
                    document.body.removeChild(Diuse_Text);
                };
            }, function () {
                if (confirm('下载' + list[0] + '失败，是否继续下载？')) {
                    download1();
                }
            });
        }
        download1();
    }, function () {
        Diuse_Button = true;
        alert('本地资源不完整！请检查文件完整性。');
    });
};

shuYing.download_dynamic = function (dynamic_name) {
    if (lib.config.extension_术樱_Skin) {
        let url_files = dynamic_name.substring(0, dynamic_name.length - 4);
        skinList(url_files);
    } else {
        game.download('http://diuse.hao1237.top/Diuse/image/dynamic/' + dynamic_name, 'extension/术樱/' + dynamic_name, function () {
            Diuse_Button = true;
            alert('所选皮肤下载完毕!');
        }, function () {
            if (confirm('下载' + dynamic_name + '失败，是否继续下载？')) {
                download_dynamic(dynamic_name);
            }
        });
    }
};

shuYing.download_dynamic_all = function () {
    lib.init.js(url, 'files', function () {
        let list = Diuse_dynamic;
        let num = 0;
        let num1 = list.length;
        document.body.appendChild(Diuse_Text);
        let download1 = function () {
            game.download('http://diuse.hao1237.top/Diuse/image/dynamic/' + list[0], 'extension/术樱/' + list[0], function () {
                num++
                list.remove(list[0]);
                if (list.length > 0) {
                    Diuse_Text.innerHTML = '正在下载（' + num + '/' + num1 + '）';
                    download1();
                } else {
                    Diuse_Text.innerHTML = '下载完毕';
                    Diuse_Button = true;
                    alert('动态皮肤下载完毕!');
                    document.body.removeChild(Diuse_Text);
                };
            }, function () {
                if (confirm('下载' + list[0] + '失败，是否继续下载？')) {
                    download1();
                }
            });
        }
        download1();
    }, function () {
        Diuse_Button = true;
        alert('本地资源不完整！请检查文件完整性。');
    });
};

shuYing.download_files_all = function () {
    lib.init.js(url, 'files', function () {
        let list = Diuse_dynamic;
        let num = 0;
        let num1 = list.length;
        document.body.appendChild(Diuse_Text);
        let download1 = function () {
            game.download('http://diuse.hao1237.top/Diuse/image/dynamic/' + list[0], 'extension/术樱/' + list[0], function () {
                num++
                list.remove(list[0]);
                if (list.length > 0) {
                    Diuse_Text.innerHTML = '正在下载（' + num + '/' + num1 + '）';
                    download1();
                } else {
                    Diuse_Text.innerHTML = '下载完毕';
                    Diuse_Button = true;
                    alert('动态皮肤下载完毕!');
                    document.body.removeChild(Diuse_Text);
                };
            }, function () {
                if (confirm('下载' + list[0] + '失败，是否继续下载？')) {
                    download1();
                }
            });
        }
        download1();
    }, function () {
        Diuse_Button = true;
        alert('本地资源不完整！请检查文件完整性。');
    });
};

shuYing.skinList = function () {
    lib.init.js(url, 'files', function () {
        let num = 0;
        let skin_list = Skin;
        let skin_num;
        let file_url = 'image/skin/';
        let file_length = 0;
        document.body.appendChild(Diuse_Text);
        let down = function () {
            switch (skin_list[0]) {
                case 'Diuse_Fuhua': {
                    skin_num = Diuse_Fuhua_Skin;
                    break;
                }
                case 'Diuse_Bachongying': {
                    skin_num = Diuse_Bachongying_Skin;
                    break;
                }
                case 'Diuse_Buluoniya': {
                    skin_num = Diuse_Buluoniya_Skin;
                    break;
                }
                case 'Diuse_Kalian': {
                    skin_num = Diuse_Kalian_Skin;
                    break;
                }
                case 'Diuse_Shangxian': {
                    skin_num = Diuse_Shangxian_Skin;
                    break;
                }
                case 'Diuse_Shilv': {
                    skin_num = Diuse_Shilv_Skin;
                    break;
                }
                case 'Diuse_Xier': {
                    skin_num = Diuse_Xier_Skin;
                    break;
                }
                case 'Diuse_Yayi': {
                    skin_num = Diuse_Yayi_Skin;
                    break;
                }
                case 'Diuse_Yuexia': {
                    skin_num = Diuse_Yuexia_Skin;
                    break;
                }
                case 'Diuse_Konglv': {
                    skin_num = Diuse_Konglv_Skin;
                    break;
                }
                case 'Diuse_Heixi': {
                    skin_num = Diuse_Heixi_Skin;
                    break;
                }
                case 'Diuse_Bachongshenzi': {
                    skin_num = Diuse_Bachongshenzi_Skin;
                    break;
                }
                case 'Diuse_Keli': {
                    skin_num = Diuse_Keli_Skin;
                    break;
                }
                case 'Diuse_Shuangzi': {
                    skin_num = Diuse_Shuangzi_Skin;
                    break;
                }
                case 'Diuse_Lanmei': {
                    skin_num = Diuse_Lanmei_Skin;
                    break;
                }
                case 'Diuse_Yingtao': {
                    skin_num = Diuse_Yingtao_Skin;
                    break;
                }
            }
            url_Diuse_search = file_url + skin_list[0] + '/' + skin_num[0] + '.jpg';
            file_length += skin_list.length;
            game.readFile(url_Diuse_search, function () {
                num++;
                skin_num.remove(skin_num[0]);
                if (skin_list.length > 0 || skin_num.length > 0) {
                    if (skin_num.length <= 0) skin_list.remove(skin_list[0]);
                    Diuse_Text.innerHTML = '正在补充Skin（' + num + '/' + file_length + '）';
                    down();
                } else {
                    Diuse_Text.innerHTML = '补充完毕';
                    Diuse_Button = true;
                    alert('皮肤下载完毕!');
                    document.body.removeChild(Diuse_Text);
                }
            }, function () {
                num++;
                skin_num.remove(skin_num[0]);
                if (skin_list.length > 0 || skin_num.length > 0) {
                    if (skin_num.length <= 0) skin_list.remove(skin_list[0]);
                    Diuse_Text.innerHTML = '正在补充Skin（' + num + '/' + file_length + '）';
                    down();
                } else {
                    Diuse_Text.innerHTML = '补充完毕';
                    Diuse_Button = true;
                    alert('皮肤下载完毕!');
                    document.body.removeChild(Diuse_Text);
                };
                // game.download('https://diuse.coding.net/p/extension/d/noname_Skin/git/raw/master/Skin/'+skin_list[0]+'/'+skin_num[0]+'.jpg','image/skin/'+skin_list[0]+'/'+skin_num[0]+'.jpg',function(){
                //     num++;
                //     skin_num.remove(skin_num[0]);
                //     if(skin_list.length>0||skin_num.length>0){
                //         if(skin_num.length<=0) skin_list.remove(skin_list[0]);
                //         Diuse_Text.innerHTML='正在补充Skin（'+num+'/'+file_length+'）';
                //         down();
                //     }else{
                //         Diuse_Text.innerHTML='补充完毕';
                //         Diuse_Button=true;
                //         alert('皮肤下载完毕!');
                //         document.body.removeChild(Diuse_Text);
                //     };
                // },function(){
                //     if(confirm('下载'+skin_list[0]+'失败，是否继续下载？')){
                //         down();
                //     }
                // });
            });
        }
        down();
    }, function () {
        Diuse_Button = true;
        alert('本地资源不完整！请检查文件完整性。');
    });
};

//本地资源修复
shuYing.RepairBug = () => {
    updater.repairCoreFiles(shuYing);
};

//重新下载重要js文件
shuYing.RepairBugGo = () => {
    updater.repairCoreFiles(shuYing);
};

shuYing.Diuse_downText = function () {
    time = setTimeout(() => {
    }, 1000)
};

shuYing.Diuse_upText = function (type) {
    clearTimeout(time);
    switch (type) {
        case 0:
            alert();
        case 1:
            alert('三张重复' +
                '\n【桃】 恢复两点体力并摸三张牌' +
                '\n【闪】 此杀必须两张闪响应 然后你摸两张牌' +
                '\n【杀】 此杀不可被响应 出杀次数上限+2' +
                '\n【酒】 此杀伤害+3\n' +
                '\n两张重复' +
                '\n【桃】 恢复一点体力并摸两张牌' +
                '\n【闪】 此杀需要打出两张闪响应' +
                '\n【杀】 不可以被响应' +
                '\n【酒】 此杀伤害+2\n' +
                '\n一张重复' +
                '\n【桃】 命中后恢复一点体力' +
                '\n【闪】 命中后摸一张牌' +
                '\n【杀】 出杀次数上限+1' +
                '\n【酒】 此杀伤害+1');
            break;
        case 2:
            alert('根据武器攻击距离获得相应技能\n' +
                '一:当你于你的回合内使用一张牌后，你可以弃置一张手牌并摸一张牌。\n' +
                '二:当你于回合内获得一张牌且不是因为此技能获得牌时，你摸一张牌。\n' +
                '三:出牌阶段限两次。你造成伤害后你可以让场上的一名角色受到一点无伤害来源的伤害。\n' +
                '四:你使用杀或普通锦囊后你可以多增加一个目标，如果取消则摸X张牌(X为你已损失的体力，如果为0则摸1)\n' +
                '五:出牌阶段限一次，当你使用可造成伤害的牌指定目标后你可以选择其一个目标然后你摸X张牌。(X为目标当前体力)\n' +
                '六:获得全部技能效果。\n');

            break;
    }
};

// game.导入card=function(英文名,翻译名,obj){let oobj=get.copy(obj);oobj.list=obj.card.list;oobj.card=obj.card.card;oobj.skill=obj.skill.skill;oobj.translate=Object.assign({},obj.card.translate,obj.skill.translate);game.import('card',function(){return oobj});lib.config.all.cards.push(英文名);if(!lib.config.cards.contains(英文名))lib.config.cards.push(英文名);lib.translate[英文名+'_card_config']=翻译名;};
// game.新增势力=function(名字,映射,渐变){let n,t;if(!名字)return;if(typeof 名字=="string"){n=名字;t=名字}else if(Array.isArray(名字)&&名字.length==2&&typeof 名字[0]=="string"){n=名字[0];t=名字[1]}else return;if(!映射||!Array.isArray(映射)||映射.length!=3)映射=[199,21,133];let y="("+映射[0]+","+映射[1]+","+映射[2];let y1=y+",1)",y2=y+")";let s=document.createElement('style');let l;l=".player .identity[data-color='diy"+n+"'],";l+="div[data-nature='diy"+n+"'],";l+="span[data-nature='diy"+n+"'] {text-shadow: black 0 0 1px,rgba"+y1+" 0 0 2px,rgba"+y1+" 0 0 5px,rgba"+y1+" 0 0 10px,rgba"+y1+" 0 0 10px}";l+="div[data-nature='diy"+n+"m'],";l+="span[data-nature='diy"+n+"m'] {text-shadow: black 0 0 1px,rgba"+y1+" 0 0 2px,rgba"+y1+" 0 0 5px,rgba"+y1+" 0 0 5px,rgba"+y1+" 0 0 5px,black 0 0 1px;}";l+="div[data-nature='diy"+n+"mm'],";l+="span[data-nature='diy"+n+"mm'] {text-shadow: black 0 0 1px,rgba"+y1+" 0 0 2px,rgba"+y1+" 0 0 2px,rgba"+y1+" 0 0 2px,rgba"+y1+" 0 0 2px,black 0 0 1px;}";s.innerHTML=l;document.head.appendChild(s);if(渐变&&Array.isArray(渐变)&&Array.isArray(渐变[0])&&渐变[0].length==3){let str="",st2=[];for(let i=0;i<渐变.length;i++){str+=",rgb("+渐变[i][0]+","+渐变[i][1]+","+渐变[i][2]+")";if(i<2)st2[i]="rgb("+渐变[i][0]+","+渐变[i][1]+","+渐变[i][2]+")";}let tenUi = document.createElement('style');tenUi.innerHTML = ".player>.camp-zone[data-camp='"+n+"']>.camp-back {background: linear-gradient(to bottom"+str+");}";tenUi.innerHTML += ".player>.camp-zone[data-camp='"+n+"']>.camp-name {text-shadow: 0 0 5px "+st2[0]+", 0 0 10px "+st2[1]+";}";document.head.appendChild(tenUi);}lib.group.add(n);lib.translate[n]= t;lib.groupnature[n]= "diy"+n;};


shuYing.package =
{
    character: {
        character: {
        },
        translate: {
        },
    },
    card: {
        game:
        {
        },
        card:
        {
        },
        skill:
        {
        },
        translate:
        {
        },
        list: [],
    },
    skill: {
        skill: {
        },
        translate: {
        },
    },
    intro: "所有素材均来自互联网，侵权必删。",
    author: "术樱",
    diskURL: "",
    forumURL: "",
    version: "1.0",
};

shuYing.files =
{
    "character": [],
    "card": [],
    "skill": [],
    "audio": []
}

export default function () {
    return shuYing;
}
