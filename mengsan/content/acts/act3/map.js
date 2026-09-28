const act3Map = {
    id: "act3",
    name: "第三关·终梦",
    floorNodes: [1, 4, 4, 4, 4, 4, 1],
    minFloorNodes: [1, 3, 2, 3, 2, 3, 1],
    nodeWeights: { battle: 45, elite: 20, event: 15, rest: 10, shop: 10 },
    enemies: ["re_simayi", "re_sunben", "dongzhuo", "re_yuanshao"],
    eliteEnemies: ["shen_zhaoyun", "shen_simayi"],
    boss: "shen_caocao",
    baseGold: 40,
};

export default act3Map;
