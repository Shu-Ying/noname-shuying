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
