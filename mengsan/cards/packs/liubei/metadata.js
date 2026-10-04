import { ironcladCards, ironcladUpgradeRules } from "./data.js";
import { LIUBEI_CARD_OWNER } from "./names.js";
import { liubeiCardTraits } from "./traits.js";
const legacyDefinitions = [
    {
        "name": "mengsan_baozou",
        "category": "damage"
    },
    {
        "name": "mengsan_yuanhen",
        "category": "damage"
    },
    {
        "name": "mengsan_xuanfengzhan",
        "category": "damage"
    },
    {
        "name": "mengsan_qiling",
        "category": "damage"
    },
    {
        "name": "mengsan_xueqiang",
        "category": "utility"
    },
    {
        "name": "mengsan_zhanli",
        "category": "utility"
    },
    {
        "name": "mengsan_wuzhuang",
        "category": "utility"
    },
    {
        "name": "mengsan_songjianwushi",
        "category": "utility"
    },
    {
        "name": "mengsan_pomie",
        "category": "utility"
    },
    {
        "name": "mengsan_jianyi",
        "category": "utility"
    },
    {
        "name": "mengsan_fangxue",
        "category": "utility"
    },
    {
        "name": "mengsan_yujin",
        "category": "damage"
    },
    {
        "name": "mengsan_wanmeidaji",
        "category": "damage"
    },
    {
        "name": "mengsan_yubeidaji",
        "category": "damage"
    },
    {
        "name": "mengsan_tupo",
        "category": "damage"
    },
    {
        "name": "mengsan_touchui",
        "category": "damage"
    },
    {
        "name": "mengsan_tiezhanbo",
        "category": "damage"
    },
    {
        "name": "mengsan_shuangchongdaji",
        "category": "damage"
    },
    {
        "name": "mengsan_shandianpili",
        "category": "damage"
    },
    {
        "name": "mengsan_fennu",
        "category": "damage"
    },
    {
        "name": "mengsan_rongrongzhiquan",
        "category": "damage"
    },
    {
        "name": "mengsan_quanshenzhuangji",
        "category": "damage"
    },
    {
        "name": "mengsan_jianbingdaji",
        "category": "damage"
    },
    {
        "name": "mengsan_feijianhuixuanbiao",
        "category": "damage"
    },
    {
        "name": "mengsan_fangyu",
        "category": "utility"
    }
];
export const liubeiDefinitions = Object.freeze([
    ...legacyDefinitions,...ironcladCards.map(({name,category,base})=>({name,category,generatedOnly:Boolean(base.generatedOnly)})),
].map(definition=>Object.freeze({...definition,...liubeiCardTraits[definition.name],owner:LIUBEI_CARD_OWNER,deck:"liubei"})));
export const liubeiCosts = Object.freeze({
    ...{"mengsan_fangyu": 1, "mengsan_fennu": 0, "mengsan_feijianhuixuanbiao": 1, "mengsan_jianbingdaji": 1, "mengsan_quanshenzhuangji": 1, "mengsan_rongrongzhiquan": 1, "mengsan_shandianpili": 1, "mengsan_shuangchongdaji": 1, "mengsan_tiezhanbo": 1, "mengsan_touchui": 1, "mengsan_tupo": 1, "mengsan_yubeidaji": 1, "mengsan_wanmeidaji": 2, "mengsan_yujin": 2, "mengsan_fangxue": 0, "mengsan_jianyi": 1, "mengsan_pomie": 1, "mengsan_songjianwushi": 1, "mengsan_wuzhuang": 1, "mengsan_zhanli": 1, "mengsan_xueqiang": 2, "mengsan_qiling": 0, "mengsan_yuanhen": 0, "mengsan_baozou": 1, "mengsan_xuanfengzhan": "X"},
    ...Object.fromEntries(ironcladCards.map(card=>[card.name,card.cost])),
});
export const liubeiUpgradeRules = Object.freeze({
    ...ironcladUpgradeRules,
    mengsan_fangyu: Object.freeze({ maxLevel: 1, baseBlock: 5, block: 8 }),
    mengsan_baozou: Object.freeze({ maxLevel: 1, damage: 9, baseIncrease: 5, increase: 9 }),
    mengsan_yuanhen: Object.freeze({ maxLevel: 1, damage: 5, baseHits: 2, hits: 3 }),
    mengsan_xuanfengzhan: Object.freeze({ maxLevel: 1, baseDamage: 5, damage: 8 }),
    mengsan_qiling: Object.freeze({ maxLevel: 1, baseDamage: 4, basePerVulnerable: 2, perVulnerable: 3 }),
    mengsan_xueqiang: Object.freeze({ maxLevel: 1, loseHp: 2, baseBlock: 16, block: 20 }),
    mengsan_zhanli: Object.freeze({ maxLevel: 1, baseVulnerable: 3, vulnerable: 4 }),
    mengsan_wuzhuang: Object.freeze({ maxLevel: 1, block: 5 }),
    mengsan_songjianwushi: Object.freeze({ maxLevel: 1, baseBlock: 8, block: 11, draw: 1 }),
    mengsan_pomie: Object.freeze({ maxLevel: 1, baseCost: 1, cost: 0 }),
    mengsan_jianyi: Object.freeze({ maxLevel: 1, baseBlock: 7, block: 9, chooseExhaust: true }),
    mengsan_fangxue: Object.freeze({ maxLevel: 1, loseHp: 3, baseEnergy: 2, energy: 3 }),
    mengsan_yujin: Object.freeze({ maxLevel: 1, baseDamage: 18, damage: 24, exhaust: 1 }),
    mengsan_wanmeidaji: Object.freeze({ maxLevel: 1, baseDamage: 6, damage: 6, basePerStrike: 2, perStrike: 3 }),
    mengsan_yubeidaji: Object.freeze({ maxLevel: 1, baseDamage: 7, damage: 9, baseStrength: 2, strength: 3 }),
    mengsan_tupo: Object.freeze({ maxLevel: 1, baseDamage: 9, damage: 13, loseHp: 1 }),
    mengsan_touchui: Object.freeze({ maxLevel: 1, baseDamage: 9, damage: 12 }),
    mengsan_tiezhanbo: Object.freeze({ maxLevel: 1, baseBlock: 5, block: 7, baseDamage: 5, damage: 7 }),
    mengsan_shuangchongdaji: Object.freeze({ maxLevel: 1, baseDamage: 5, damage: 7, hits: 2 }),
    mengsan_shandianpili: Object.freeze({ maxLevel: 1, baseDamage: 4, damage: 7, vulnerable: 1 }),
    mengsan_rongrongzhiquan: Object.freeze({ maxLevel: 1, baseDamage: 10, damage: 14, exhaust: true }),
    mengsan_quanshenzhuangji: Object.freeze({ maxLevel: 1, baseCost: 1, cost: 0, damageFromBlock: true }),
    mengsan_jianbingdaji: Object.freeze({ maxLevel: 1, baseDamage: 9, damage: 10, baseDraw: 1, draw: 2 }),
    mengsan_feijianhuixuanbiao: Object.freeze({ maxLevel: 1, damage: 3, baseHits: 3, hits: 4 }),
    mengsan_fennu: Object.freeze({ maxLevel: 1, baseDamage: 6, damage: 8 }),
});
