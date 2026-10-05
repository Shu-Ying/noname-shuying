import { lib, game, ui, get, ai, _status } from "../../noname.js";
import updater from "./update.js"
import func from "./function.js"
import initShuYingMenu from "./menu.js";

export const type = "extension";
export let shuYing = new Object();
const shuYingLocalVersion = "2.0.2.3-rc.2";

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
shuYing.updateOnlineVersionMenu = (version, status = "检测中...") => {
    if (version) game.saveConfig("shuYing_online_version", version);

    const text = `最新版本：${version || status}`;
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
    lib.config.characters.push(name);
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

shuYing.getVersion = (callback) => {
    const requestId = (shuYing.versionRequestId || 0) + 1;
    shuYing.versionRequestId = requestId;
    return updater.getOnlineVersion()
        .then(version => {
            if (requestId != shuYing.versionRequestId) return null;
            shuYing.updateOnlineVersionMenu(version?.online_version);
            if (typeof callback == "function") {
                callback(version);
            }
            return version;
        })
        .catch(error => {
            if (requestId != shuYing.versionRequestId) return null;
            console.error("术樱包获取在线版本失败：", error);
            shuYing.updateOnlineVersionMenu(null, "获取失败");
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
    // //崩坏3包
    // if (lib.config.extension_shuYing_bengHuai_Off == undefined) {
    //     game.saveConfig('extension_shuYing_bengHuai_Off', true);
    // }

    // //原神包
    // if (lib.config.extension_术樱包_yuanShenOff == undefined) {
    //     game.saveConfig('extension_术樱包_yuanShenOff', true);
    // }

    // //崩铁包
    // if (lib.config.extension_术樱包_bengTieOff == undefined) {
    //     game.saveConfig('extension_术樱包_bengTieOff', true);
    // }

    //天书乱斗
    if (lib.config.extension_术樱包_tianShu_Off == undefined) {
        game.saveConfig('extension_术樱包_tianShu_Off', true);
    }

    //
    // if(lib.config.extension_术樱包_skillsoff==undefined) game.saveConfig('extension_术樱包_skillsoff',false);

    //版本号
    game.saveConfig('shuYing_local_version', shuYingLocalVersion);
};

//术樱包初始化武将包
shuYing.initCharacter = async () => {
    let shuYingList;
    if (lib.config.mode == 'boss' && lib.config.extension_术樱包_tianShu_Off) {
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
    const mengsanState = lib.config.shuYing_mengsan_installed_version;
    const mengsanInstallation = lib.config.shuYing_mengsan_installation;
    let hasMengsan = mengsanInstallation
        ? mengsanInstallation.status == "installed"
        : !!mengsanState && mengsanState != "disabled";
    if (!mengsanInstallation && !mengsanState && typeof game.checkFile != "function") {
        hasMengsan = true;
    }
    else if (!mengsanInstallation && !mengsanState && typeof game.checkFile == "function") {
        hasMengsan = await new Promise(resolve => {
            game.checkFile("extension/术樱包/mengsan/register.js",
                result => resolve(result == 1), () => resolve(false));
        });
    }
    if (hasMengsan) {
        const registerMengsan = await shuYing.loadModule(
            "./mengsan/register.js", "梦三模式", true
        );
        if (typeof registerMengsan == "function") registerMengsan();
    }
    initShuYingMenu({ lib, game, ui, shuYing, updater });
    shuYing.getVersion();
    await shuYing.initCharacter();
};

shuYing.config = () => {

};

shuYing.help = () => {

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
