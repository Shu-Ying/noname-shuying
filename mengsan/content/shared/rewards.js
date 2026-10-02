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
    "shared.reward.card.songjianwushi": {
        card: { name: "mengsan_songjianwushi" }, name: "获得一张【耸肩无视】",
        description: "1费：获得8点格挡，然后抽1张牌。",
    },
    "shared.reward.card.pomie": {
        card: { name: "mengsan_pomie" }, name: "获得一张【破灭】",
        description: "1费：免费使用抽牌堆顶部的牌，然后将该原牌消耗。",
    },
    "shared.reward.card.jianyi": {
        card: { name: "mengsan_jianyi" }, name: "获得一张【坚毅】",
        description: "1费：获得7点格挡，然后随机消耗一张你的手牌。",
    },
    "shared.reward.card.fangxue": {
        card: { name: "mengsan_fangxue" }, name: "获得一张【放血】",
        description: "0费：失去3点生命，然后获得2点费用。",
    },
    "shared.reward.card.yujin": {
        card: { name: "mengsan_yujin" }, name: "获得一张【余烬】",
        description: "2费：造成18点伤害，然后随机消耗一张你的手牌。",
    },
    "shared.reward.card.wanmeidaji": {
        card: { name: "mengsan_wanmeidaji" }, name: "获得一张【完美打击】",
        description: "2费：造成6点伤害，本场战斗的牌中每有一张名称含“打击”的牌，伤害增加2点。",
    },
    "shared.reward.card.yubeidaji": {
        card: { name: "mengsan_yubeidaji" }, name: "获得一张【预备打击】",
        description: "1费：造成7点伤害，然后在本回合内获得2点力量。",
    },
    "shared.reward.card.tupo": {
        card: { name: "mengsan_tupo" }, name: "获得一张【突破】",
        description: "1费：失去1点生命，然后对所有敌人造成9点伤害。",
    },
    "shared.reward.card.touchui": {
        card: { name: "mengsan_touchui" }, name: "获得一张【头槌】",
        description: "1费：造成9点伤害，将个人弃牌堆中的一张牌放到个人抽牌堆顶部。",
    },
    "shared.reward.card.tiezhanbo": {
        card: { name: "mengsan_tiezhanbo" }, name: "获得一张【铁斩波】",
        description: "1费：获得5点格挡，然后对一名敌人造成5点伤害。",
    },
    "shared.reward.card.shuangchongdaji": {
        card: { name: "mengsan_shuangchongdaji" }, name: "获得一张【双重打击】",
        description: "1费：对一名敌人造成5点伤害两次，两次分别结算。",
    },
    "shared.reward.card.shandianpili": {
        card: { name: "mengsan_shandianpili" }, name: "获得一张【闪电霹雳】",
        description: "1费：对所有敌人造成4点伤害，给予1层易伤。",
    },
    "shared.reward.card.feijianhuixuanbiao": {
        card: { name: "mengsan_feijianhuixuanbiao" }, name: "获得一张【飞剑回旋镖】",
        description: "1费：每次随机对一名敌人造成3点伤害，共3次。",
    },
    "shared.reward.card.jianbingdaji": {
        card: { name: "mengsan_jianbingdaji" }, name: "获得一张【剑柄打击】",
        description: "1费：造成9点伤害，然后抽1张牌。",
    },
    "shared.reward.card.quanshenzhuangji": {
        card: { name: "mengsan_quanshenzhuangji" }, name: "获得一张【全身撞击】",
        description: "1费：造成当前格挡值的伤害，不消耗格挡。",
    },
    "shared.reward.card.rongrongzhiquan": {
        card: { name: "mengsan_rongrongzhiquan" }, name: "获得一张【熔融之拳】",
        description: "1费：造成10点伤害，再将目标已有易伤层数翻倍。消耗。",
    },
    "shared.reward.card.fennu": {
        card: { name: "mengsan_fennu" }, name: "获得一张【愤怒】",
        description: "0费：造成6点伤害，将一张自身复制品加入个人弃牌堆。",
    },
    "shared.reward.card.fangyu": {
        card: { name: "mengsan_fangyu" }, name: "获得一张【防御】",
        description: "1费：获得5点格挡。",
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
        "shared.reward.card.fangyu",
        "shared.reward.card.fennu",
        "shared.reward.card.rongrongzhiquan",
        "shared.reward.card.quanshenzhuangji",
        "shared.reward.card.jianbingdaji",
        "shared.reward.card.feijianhuixuanbiao",
        "shared.reward.card.shandianpili",
        "shared.reward.card.shuangchongdaji",
        "shared.reward.card.tiezhanbo",
        "shared.reward.card.touchui",
        "shared.reward.card.tupo",
        "shared.reward.card.yujin",
        "shared.reward.card.fangxue",
        "shared.reward.card.jianyi",
        "shared.reward.card.pomie",
        "shared.reward.card.songjianwushi", "shared.reward.card.wanmeidaji", "shared.reward.card.yubeidaji",
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
