import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import tianshuConfig from "../../tianshu/config.js";

const getTianshuDifficulty = () => {
    return _status[tianshuConfig.settings.difficultyStatusKey] || "normal";
};

const dynamicTranslates = {
    //黑白无常
    mizui_shuying(player, skill) {
        const num = getTianshuDifficulty() == "normal" ? 1 : 2

        return `锁定技，你的伤害牌造成伤害后，你随机弃置受伤角色的${num}张牌。`
    },
    qiangzheng_shuying(player, skill) {
        let num = 2;
        if (getTianshuDifficulty() == "hard") num = 4;
        if (getTianshuDifficulty() == "nightmare") num = 6;

        return `锁定技，敌方角色的结束阶段，若其手牌数小于${num}，你获得其所有手牌。`
    },
    xixing_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        if (difficulty == "nightmare") {
            return "锁定技，准备阶段，你对每名敌方角色各造成2点雷电伤害，然后你回复等量体力";
        }

        return "锁定技，准备阶段，随机对敌方体力最多的一名角色造成2点雷电伤害，然后你回复等量体力。";
    },

    //鱼鳃
    guixi_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 2 : 1

        return `锁定技，当你受到伤害后，你进行一次判定，若结果为红色，你回复1点体力；若结果不为红色，你摸${num}张牌。`;
    },

    //黄蜂
    mingchong_shuying(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "锁定技，你死亡时，杀死你的角色弃置所有牌。"
        }

        return "锁定技，你死亡时，杀死你的角色随机弃置一半的牌。"
    },
    duzhen_shuyingg(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "锁定技，你使用牌指定单一敌方角色为目标后，该角色随机弃置1张牌（优先装备区的牌）。"
        }

        return "锁定技，你使用牌指定单一敌方角色为目标后，该角色随机弃置2张牌（优先装备区的牌）。"

    },

    //日夜游神
    mingchong_shuying(player, skill) {
        const num = getTianshuDifficulty() == "normal" ? 1 : 2

        return `出牌阶段限一次，你可以展示一名敌方角色的手牌，并弃置其中至多两张牌。然后你可以弃置一张与该角色弃置牌牌名相同的牌，对其造成${num}点伤害。`
    },
    yezhong_shuying(player, skill) {
        let num = 1;
        if (getTianshuDifficulty() == "hard") num = 2;
        if (getTianshuDifficulty() == "nightmare") num = 3;

        return `锁定技，结束阶段，你进行一次判定并获得判定牌，若次牌为黑色，每名敌方角色随机弃${num}张手牌。`
    },
    zhoucha_shuying(player, skill) {
        let num = 1;
        if (getTianshuDifficulty() == "hard") num = 2;
        if (getTianshuDifficulty() == "nightmare") num = 3;

        return `锁定技，准备阶段，你进行一次判定并获得判定牌，若此牌为红色，你本回合使用【杀】的次数+${num}。`
    },


    //曹操
    lingba_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 2 : 1

        return `锁定技，你的回合开始时，若你手牌数为全场最多，则对一名随机敌人造成${num}点伤害。若你手牌数大于等于你体力值的两倍，则改为对所有敌人造成伤害。`
    },
    yishen_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        if (difficulty == "nightmare") {
            return "当你回复体力时，可以改为获得所有敌人各一张随机装备。";
        }

        return "当你回复体力时，可以改为获得一名随机敌方角色一张随机装备。";
    },

    //司马懿
    yuanlv_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();

        if (difficulty == "nightmare") {
            return "当你使用锦囊牌对敌方角色造成伤害时，你可以防止该伤害，改为摸一张牌且该敌方角色对你造成过1点伤害。";
        }

        return "当你使用锦囊牌对敌方角色造成伤害时，你可以防止该伤害，改为摸一张牌且该敌方角色对你造成1点伤害。";

    },

    //吕布
    wushuang_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 2 : 1

        return `锁定技。①你使用的【杀】需两张【闪】才能抵消；与你进行【决斗】的角色每次需要打出两张【杀】。②每回合限${num}次，当你使用【杀】或【决斗】造成伤害时，若受伤角色没有使用或打出过【杀】或【闪】响应此牌，则此伤害+1。`;
    },
    shenij_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let card = 2;
        let sha = 1;
        let target = 1;

        if (difficulty == "hard") {
            card = 3;
            sha = 2;
        } else if (difficulty == "nightmare") {
            card = 4;
            sha = 2;
            target = 2;
        }

        return `判定阶段，你可以弃置两张手牌，然后弃置你判定区里的牌；摸牌阶段，你多摸${card}张牌；出牌阶段，你可以多使用${sha}张【杀】，你的【杀】可以多指定${target}名角色为目标。`;
    },
    zhanjia_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 3 : 2

        return `锁定技，每回合限一次，当你受到大于2点的伤害时，将此伤害减至2点，然后摸${num}张牌。`
    },

    //董卓
    baonue_shuying(player, skill) {
        let num = 3;
        if (getTianshuDifficulty() == "hard") num = 4;
        if (getTianshuDifficulty() == "nightmare") num = 5;

        return `锁定技，回合开始时，你摸X张牌并对至多X名角色造成1点伤害，然后你失去1点体力。X为你已损失体力且最大为${num}。`
    },

    //水神共工
    tuanliu_shuying(player, skill) {
        let hp = 2;
        let card = 4;
        let damage = 1;

        if (getTianshuDifficulty() == "nightmare") {
            hp = 3;
            card = 6;
        }
        return `锁定技，结束阶段，若本回合进入弃牌堆的卡牌数量：大于4，你回复${hp}点体力；大于5，你摸${card}张牌；大于9，你对所有敌方角色造成${damage}点伤害。`
    },

    //少昊
    baiyi_shuying(player, skill) {
        let num = 1;
        const difficulty = getTianshuDifficulty();
        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        return `锁定技，每名敌方角色的回合开始时，若当前轮数小于3，你随机获得其${num}张牌；若当前轮数小于5，对其造成${num}点雷电伤害；若当前轮数小于7，其随机弃置${num}张牌。`;
    },

    //玄女
    xuanlie_shuying(player, skill) {
        let num = 2;
        if (getTianshuDifficulty() == "normal") num = 1;

        return `锁定技，回合结束时，对所有本回合你获得过其牌的敌方角色依次造成${num}点伤害。`;
    },
    jiutian_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        const num = difficulty == "normal" ? 1 : 2;
        const extra =
            difficulty == "normal" || difficulty == "hard"
                ? ""
                : "若这些牌包含4种花色，这些角色再额外失去1点体力。";

        return `锁定技，准备阶段，你获得所有敌方角色各${num}张手牌。若你以此法获得的牌包含2种颜色，则对所有你以此法获得其牌的敌方角色造成1点伤害。${extra}`;
    }
};

export default dynamicTranslates;
