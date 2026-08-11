import { getTianshuDifficulty } from "../../shared.js";

const dynamicTranslates = {
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

};

export default dynamicTranslates;
