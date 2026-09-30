import { relicRewards, relicRewardIds } from "../../relics/definitions.js";

export const rewards = {
    ...relicRewards,
    "shared.reward.support.scout": {
        name: "道具·斥候援令", description: "本次征程后续每场战斗，友方张辽携 4 张手牌参战；重复获得不叠加人数。",
        support: { category: "item", battles: -1, unit: { character: "re_zhangliao", camp: "ally", hand: 4 } },
    },
    "shared.reward.card.sha": { effectId: "card_sha", name: "获得一张【杀】", description: "加入独立永久牌组" },
    "shared.reward.card.zhongsha": {
        card: { name: "mengsan_zhongsha" }, name: "获得一张【重杀】",
        description: "2费：造成8点伤害，然后给予目标2层易伤。",
    },
    "shared.reward.card.tao": { effectId: "card_tao", name: "获得一张【桃】", description: "加入独立永久牌组" },
    "shared.reward.card.wuzhong": { card: { name: "wuzhong" }, name: "获得一张【无中生有】", description: "加入独立永久牌组" },
    "shared.reward.card.upgrade": { effectId: "upgrade", name: "随机强化", description: "随机强化一张尚未满级的可强化牌" },
    "shared.reward.heal": { effectId: "heal", name: "整顿伤势", description: "回复 8 点生命" },
    "shared.reward.item.handCharm": { effectId: "item_hand",
        relic: "mengsan_hand_charm_shuying", name: "道具·束带",
        description: "基础手牌上限额外 +1" },
    "shared.reward.skill.heroic": { effectId: "skill_yingyong", name: "极品技能·英勇", description: "本次征程永久获得【英勇】" },
    "shared.reward.maxHp": { effectId: "max_hp", name: "极品强化·生机", description: "生命上限与当前生命各 +5" },
};

export const rewardPools = {
    "shared.pool.battle.normal": [
        "shared.reward.card.sha",
        "shared.reward.card.zhongsha",
        "shared.reward.card.tao",
        "shared.reward.card.wuzhong",
    ],
    "shared.pool.boss.premium": [
        ...relicRewardIds,
        "shared.reward.skill.heroic",
        "shared.reward.item.handCharm",
        "shared.reward.maxHp",
    ],
};
