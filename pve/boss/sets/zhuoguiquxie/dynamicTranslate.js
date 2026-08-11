import { getTianshuDifficulty } from "../../shared.js";

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
    duzhen_shuying(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "锁定技，你使用牌指定单一敌方角色为目标后，该角色随机弃置1张牌（优先装备区的牌）。"
        }

        return "锁定技，你使用牌指定单一敌方角色为目标后，该角色随机弃置2张牌（优先装备区的牌）。"

    },

    //日夜游神
    huiyun_shuying(player, skill) {
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


};

export default dynamicTranslates;
