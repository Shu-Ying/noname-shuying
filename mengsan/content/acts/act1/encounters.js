import { createRaiderTrioBattlePlan } from "./raider-trio.js";
import { createInkletBattlePlan } from "./inklet-group.js";
import { createNibbitPairBattlePlan } from "./nibbit-pair.js";
import { createKinBattlePlan } from "./kin-group.js";

const monsters = Object.freeze({
    crawler: "mengsan_fuzzy_wurm_crawler_shuying", nibbit: "mengsan_nibbit_shuying",
    shrinker: "mengsan_shrinker_beetle_shuying", leafS: "mengsan_leaf_slime_s_shuying",
    leafM: "mengsan_leaf_slime_m_shuying", twigS: "mengsan_twig_slime_s_shuying",
    twigM: "mengsan_twig_slime_m_shuying", cubex: "mengsan_cubex_construct_shuying",
    flyconid: "mengsan_flyconid_shuying", jaxfruit: "mengsan_snapping_jaxfruit_shuying",
    fogmog: "mengsan_fogmog_shuying", mawler: "mengsan_mawler_shuying",
    strangler: "mengsan_slithering_strangler_shuying", vine: "mengsan_vine_shambler_shuying",
    byrdonis: "mengsan_byrdonis_shuying", effigy: "mengsan_bygone_effigy_shuying",
    phrog: "mengsan_phrog_parasite_shuying", vantom: "mengsan_vantom_shuying",
    beast: "mengsan_ceremonial_beast_shuying",
});
const group = (id, name, variants, tier = "normal") => ({
    id: `act1.encounter.${id}`, name, tier,
    variants: variants.map(members => members.map((member, index) => ({
        id: `enemy_${index + 1}`, character: monsters[member], camp: "enemy",
        tier, hand: 4, inheritSkills: false,
    }))),
});
const single = (id, name, member, tier) => group(id, name, [[member]], tier);
const custom = (id, name, createBattlePlan, tier = "normal") => ({id: `act1.encounter.${id}`, name, tier, createBattlePlan});

// 一个条目是一种遭遇；条目中的 variants 等概率选一组，同组成员同时上场。
const weak = [
    single("weak.crawler", "毛绒伏地虫", "crawler"),
    single("weak.nibbit", "小啃兽", "nibbit"),
    single("weak.shrinker", "缩小甲虫", "shrinker"),
    group("weak.slimes", "史莱姆三只", [["leafS", "leafM", "twigS"], ["leafS", "twigM", "twigS"]]),
];
const strong = [
    single("strong.cubex", "立柱构造体", "cubex"),
    group("strong.slimeFlyconid", "中型史莱姆与飞蝇菌子", [["leafM", "flyconid"], ["twigM", "flyconid"]]),
    group("strong.jaxfruitFlyconid", "闪光贾克斯果与飞蝇菌子", [["jaxfruit", "flyconid"]]),
    single("strong.fogmog", "雾菇", "fogmog"),
    custom("strong.inklets", "墨宝三只", createInkletBattlePlan),
    single("strong.mawler", "蛮兽", "mawler"),
    custom("strong.nibbits", "小啃兽双只", createNibbitPairBattlePlan),
    group("strong.shrinkerCrawler", "缩小甲虫与毛绒伏地虫", [["shrinker", "crawler"]]),
    custom("strong.raiders", "劫掠者团伙", createRaiderTrioBattlePlan),
    group("strong.slimes", "史莱姆四只", [["leafM", "twigM", "leafS", "twigS"]]),
    group("strong.stranglerParty", "蛇行扼杀者与同行怪物", [
        ["jaxfruit", "strangler"], ["leafM", "strangler"], ["twigM", "strangler"],
        ["leafS", "twigS", "strangler"],
    ]),
    single("strong.vine", "藤蔓蹒跚者", "vine"),
];
const elite = [
    single("elite.byrdonis", "多尼斯异鸟", "byrdonis", "elite"),
    single("elite.effigy", "旧日雕像", "effigy", "elite"),
    single("elite.phrog", "异蛙寄生虫", "phrog", "elite"),
];
const boss = [
    single("boss.vantom", "墨影幻灵", "vantom", "boss"),
    single("boss.beast", "仪式兽", "beast", "boss"),
    custom("boss.kin", "同族神官与两名信徒", createKinBattlePlan, "boss"),
];

export const encounterPools = Object.freeze(Object.fromEntries(
    Object.entries({weak, strong, elite, boss}).map(([key, entries]) => [key, Object.freeze(entries.map(entry => entry.id))]),
));
export const encounters = Object.fromEntries([...weak, ...strong, ...elite, ...boss].map(entry => [entry.id, entry]));
