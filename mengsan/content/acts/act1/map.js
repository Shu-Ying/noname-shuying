const act1Map = {
    id: "act1",
    name: "第一关·初梦",
    floorNodes: [1, 4, 4, 4, 1],
    minFloorNodes: [1, 3, 3, 3, 1],
    nodeWeights: { battle: 65, event: 15, rest: 10, shop: 10 },
    fixedNodes: [
        {
            floor: 0,
            position: "start",
            type: "battle",
            contentId: "act1.battle.liubeiOpening",
        },
    ],
    enemies: ["re_xiahoudun", "re_zhangliao", "re_xuzhu"],
    boss: "re_lvbu",
    baseGold: 20,
};

export default act1Map;
