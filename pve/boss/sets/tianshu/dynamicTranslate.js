import { getTianshuDifficulty } from "../../shared.js";

const dynamicTranslates = {
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

    //火神祝融
    xingxia_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let discardNum = 1;
        let damageNum = 1;

        if (difficulty == "hard") {
            discardNum = 2;
        } else if (difficulty == "nightmare") {
            discardNum = 3;
            damageNum = 2;
        }

        return `锁定技，出牌阶段开始时，你对随机一名友方角色造成1点火焰伤害，然后令所有敌方角色选择一项：1.弃置${discardNum}张红色牌；2.受到你造成的${damageNum}点火焰伤害。`;
    },
    baoyan_shuying(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "锁定技，每当有角色造成火焰伤害后，你获得1个“炎”标记。你的回合结束时，弃置所有“炎”标记，随机对一名敌方角色造成X点火焰伤害。（X为弃置的“炎”标记数）";
        }

        return "锁定技，每当有角色造成火焰伤害后，你获得1个“炎”标记。你的回合结束时，弃置所有“炎”标记，随机对X名敌方角色各造成1点火焰伤害。（X为弃置的“炎”标记数）";
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

    //白起
    wuan_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        let num = 1;

        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        return `锁定技，你可使用的【杀】的次数+${num}，【杀】造成的伤害+1。`;
    },
    shashen_shuying(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "你可以将手牌中的任意牌当【杀】使用或打出。你使用的【杀】造成伤害后，摸3张牌。";
        }

        return "你可以将手牌中的任意牌当【杀】使用或打出。每回合你使用的第一张【杀】造成伤害后，摸2张牌。";
    },

    //夸父
    yinjiang_shuying(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "锁定技，当你在出牌阶段摸牌后，获得牌堆底的牌。若该牌为红色，则对所有敌方角色造成1点伤害。当你在同一阶段内以此法造成过两次或更多的伤害后，该技能失效直到回合结束。";
        }

        return "锁定技，当你在出牌阶段摸牌后，获得牌堆底的牌。若该牌为红色，则随机对一名敌方角色造成1点伤害。当你在同一阶段内以此法造成过两次或更多的伤害后，该技能失效直到回合结束。";
    },
    lieben_shuying(player, skill) {
        if (getTianshuDifficulty() == "nightmare") {
            return "锁定技，当你使用【杀】指定目标后，使用牌堆底的牌进行一次判定：若判定结果为红色，则此【杀】不计入出牌阶段使用次数且伤害+1。";
        }

        return "锁定技，当你使用【杀】指定目标后，使用牌堆底的牌进行一次判定：若判定结果为红色，则此【杀】不计入出牌阶段使用次数。";
    },

    //玄女
    xuanlie_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        const num = difficulty == "normal" ? 1 : 2;

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
    },

    xinji_shuying(player, skill) {
        const difficulty = getTianshuDifficulty();
        const num = difficulty == "nightmare" ? 2 : 1;

        return `锁定技，当友方于回合外因弃置而失去手牌时，你对当前角色造成${num}点伤害。`
    },
    zhiri_shuying(player, skill) {
        let num = 1;
        const difficulty = getTianshuDifficulty();
        if (difficulty == "hard") {
            num = 2;
        } else if (difficulty == "nightmare") {
            num = 3;
        }

        return `锁定技，当敌方角色使用红色锦囊牌指定目标后，你摸${num}张牌。`
    },
};

export default dynamicTranslates;
