const act2Map = {
    id: "act2",
    name: "第二关·迷梦",
    floorNodes: [1, 4, 4, 4, 4, 1],
    minFloorNodes: [1, 3, 2, 3, 3, 1],
    nodeWeights: { battle: 55, elite: 15, event: 12, rest: 9, shop: 9 },
    enemies: ["re_ganning", "re_zhangfei", "re_huangzhong", "re_weiyan"],
    eliteEnemies: ["re_guanyu", "dianwei"],
    boss: "shen_guanyu",
    baseGold: 30,
};

export default act2Map;
