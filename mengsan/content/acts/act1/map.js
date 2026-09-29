const act1Map = {
    id: "act1",
    name: "第一关·初梦",
    floorNodes: [
        1, 4, 4, 4, 4, 4, 4, 4, 4,
        4, 4, 4, 4, 4, 4, 4, 1,
    ],
    minFloorNodes: [
        1, 3, 3, 3, 3, 3, 3, 3, 3,
        3, 3, 3, 3, 3, 3, 3, 1,
    ],
    nodeWeights: { battle: 65, event: 15, rest: 10, shop: 10 },
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
    enemies: ["mengsan_flyconid_shuying", "mengsan_raider_trio_shuying"],
    eliteEnemies: ["re_xiahoudun", "re_zhangliao", "re_xuzhu"],
    boss: "re_lvbu",
    baseGold: 20,
};

export default act1Map;
