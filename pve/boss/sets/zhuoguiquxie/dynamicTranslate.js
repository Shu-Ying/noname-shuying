import { getTianshuDifficulty } from "../../shared.js";

const dynamicTranslates = {
    //孟婆
    aotang_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();

        if (difficulty == "nightmare") {
            return "锁定技，你的回合开始时，令随机两名敌方角色遗忘所有武将技能直到你的下回合开始。";
        }
        if (difficulty == "hard") {
            return "锁定技，你的回合开始时，令随机一名敌方角色遗忘所有武将技能直到你的下回合开始。";
        }

        return "锁定技，你的回合开始时，令随机一名敌方角色随机遗忘1个武将技能直到你的下回合开始。";
    },
    yunju_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let num = 1;

        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        return `锁定技，敌方角色的回合结束时，该角色随机弃置${num}张手牌。`;
    },

    //豹尾
    eli_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();

        if (difficulty == "nightmare") {
            return "锁定技，你对敌方角色造成伤害时，你进行一次判定：若结果为红色，此伤害+1；若结果为黑色，你摸1张牌并获得“完杀”直到回合结束。";
        }

        return "锁定技，你每回合首次对敌方角色造成伤害时，你进行一次判定：若结果为红色，此伤害+1；若结果为黑色，你获得“完杀”直到回合结束。";
    },

    //鸟嘴
    bingyi_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 8 : 5;

        return `锁定技，每回合首次失去最后的手牌时，你摸${num}张牌。`;
    },
    suoxue_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let num = 1;

        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        return `每回合限${get.cnNumber(num)}次，你使用伤害牌指定单一目标后，若其手牌数大于你，你可将手牌摸至与该角色相同（至多5张）；若其手牌数小于你，你可弃置一张手牌令此牌不能抵消。`;
    },

    //牛头马面
    xiaoshou_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 3 : 2;

        return `锁定技，准备阶段，你对随机一名敌方角色造成${num}点伤害。`;
    },
    manji_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let num = 1;

        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        const extra =
            difficulty == "nightmare"
                ? "且你此阶段使用【杀】次数+1"
                : "";

        return `你使用【杀】指定单一目标后，你可以弃置该角色${num}张手牌。若其中有【杀】，你本次【杀】的伤害+1${extra}。`;
    },

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

    //鬼王
    jizhou_shuying(player, skill) {
        const num = getTianshuDifficulty() == "nightmare" ? 2 : 1;

        return `锁定技，敌方角色的出牌阶段开始时，你进行一次判定，然后其选择一项：1.弃置任意张点数之和大于判定结果的牌，你获得${num}个“噬”标记；2.失去${num}点体力。`;
    },
    danshi_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let num = 1;

        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        return `锁定技，你受到伤害时此伤害+1，然后你摸${num}张牌并移去1个“噬”。`;
    },
};

export default dynamicTranslates;
