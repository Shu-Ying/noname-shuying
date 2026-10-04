import { encounterPools } from "./encounters.js";

const act1Map = {
    id: "act1",
    name: "第一关·初梦",
    endsCurrentContent: true,
    completionDialogue: [
        { type: "narrator", text: "战斗还未完结，等待后续更新。" },
    ],
    floorNodes: [
        1, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 1,
    ],
    minFloorNodes: [
        1, 3, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3, 1,
    ],
    nodeWeights: { battle: 50, elite: 15, event: 15, rest: 10, shop: 10 },
    encounterPools,
    requiredFloors: { 2: "battle", 10: "chest", 16: "rest" },
    chestRewardPool: "act1.pool.chest",
    fixedNodes: [
        {
            floor: 0,
            position: "start",
            type: "battle",
            contentId: "act1.battle.liubeiOpening",
        },
    ],
    enemies: [
        "mengsan_flyconid_shuying", "mengsan_raider_trio_shuying",
        "mengsan_soldier_shuying", "mengsan_fogmog_shuying",
        "mengsan_mawler_shuying", "mengsan_vine_shambler_shuying",
        "mengsan_nibbit_shuying", "mengsan_nibbit_pair_shuying", "mengsan_cubex_construct_shuying", "mengsan_shrinker_beetle_shuying", "mengsan_twig_slime_m_shuying", "mengsan_twig_slime_s_shuying", "mengsan_leaf_slime_m_shuying", "mengsan_leaf_slime_s_shuying", "mengsan_slithering_strangler_shuying", "mengsan_snapping_jaxfruit_shuying", "mengsan_fuzzy_wurm_crawler_shuying",
        "mengsan_inklet_shuying",
    ],
    eliteEnemies: ["mengsan_byrdonis_shuying", "mengsan_bygone_effigy_shuying", "mengsan_phrog_parasite_shuying"],
    boss: "mengsan_vantom_shuying",
    bossEnemies: ["mengsan_vantom_shuying", "mengsan_kin_priest_shuying", "mengsan_ceremonial_beast_shuying"],
    baseGold: 20,
};

export default act1Map;
