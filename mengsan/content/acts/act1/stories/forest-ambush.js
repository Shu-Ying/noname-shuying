const forestAmbush = {
    id: "act1.story.forestAmbush",
    kind: "dialogue",
    name: "林中伏兵",
    mapName: "林中伏兵",
    description: "你在密林中遇到一名负伤的斥候。他声称前方有伏兵，并请求你决定下一步行动。",
    dialogue: [
        {
            type: "narrator",
            text: "暮色压进密林，归巢的鸟雀忽然一齐噤声。",
        },
        {
            type: "sound",
            speaker: "林间异响",
            text: "沙沙……咔嚓！",
            speed: 45,
        },
        {
            type: "character",
            character: "re_zhangliao",
            speaker: "负伤斥候",
            text: "且慢！前方埋伏着一队精兵。我侥幸逃出，已无力再探。",
        },
        {
            type: "character",
            character: "$player",
            speaker: "$player",
            text: "先把你知道的情形说清楚，我再决定如何行动。",
        },
    ],
    choices: [
        {
            id: "listen_and_leave",
            name: "听完警告后离开",
            description: "结束对话，不发生战斗，也不获得奖励。",
            outcome: {
                result: "你记下了斥候的警告，绕开了危险区域。",
                dialogue: [
                    { type: "narrator", text: "你记下警告，沿着一条隐蔽的小径绕开了危险区域。" },
                ],
                flags: {
                    "story.act1.heardAmbushWarning": true,
                    "story.act1.ambushResult": "left",
                },
            },
        },
        {
            id: "help_scout",
            name: "帮助斥候处理伤势",
            description: "不进入战斗，从随机出现的三个谢礼中选择一个。",
            outcome: {
                result: "斥候恢复了行动能力，并拿出随身物资作为谢礼。",
                dialogue: [
                    {
                        type: "character",
                        character: "re_zhangliao",
                        speaker: "负伤斥候",
                        text: "多谢相助。这些随身物资，请务必收下。",
                    },
                ],
                rewardPool: "act1.pool.story.scoutGift",
                rewardTitle: "斥候的谢礼（三选一）",
                flags: {
                    "story.act1.helpedScout": true,
                    "story.act1.ambushResult": "helped",
                },
            },
        },
        {
            id: "hunt_ambushers",
            name: "主动追击伏兵",
            description: "迎战两名伏兵，第 3 轮还有敌军增援；胜利后获得金币并选择战利品。",
            outcome: {
                result: "你循着林间留下的痕迹追了上去。",
                dialogue: [
                    { type: "character", character: "$player", speaker: "$player", text: "与其绕路，不如趁他们尚未察觉，先发制人。" },
                    { type: "sound", text: "刀剑出鞘之声划破寂静。" },
                ],
                battle: {
                    enemies: ["re_xiahoudun", "re_zhangliao", "re_xuzhu"],
                    gold: 30,
                    // Two initial enemies; a third-round reinforcement demonstrates the rule system.
                    battlePlan: {
                        units: [
                            { id: "captain", character: "re_xiahoudun", camp: "enemy", hand: 4 },
                            { id: "guard", character: "re_xuzhu", camp: "enemy", hand: 2 },
                        ],
                        rules: [
                            { id: "enemy_reinforcement", name: "伏兵增援", blocksVictory: true, when: { event: "roundStart", round: 3 },
                              effects: [{ type: "spawn", unit: { id: "reinforcement", character: "re_zhangliao", camp: "enemy", hand: 3 } }] },
                            { id: "captain_rally", name: "困兽犹斗", when: { event: "state", all: [
                                { unit: "captain", field: "alive", value: true }, { unit: "captain", field: "hp", op: "lte", value: 2 },
                              ] }, effects: [{ type: "draw", target: "captain", amount: 2 }] },
                            { id: "player_supply", name: "临阵补给", when: { event: "state", all: [
                                { unit: "player", field: "hand", op: "lte", value: 1 },
                              ] }, effects: [{ type: "draw", target: "player", amount: 2 }] },
                        ],
                    },
                    rewardPool: "act1.pool.story.ambushLoot",
                    rewardTitle: "伏兵战利品（三选一）",
                    description: "击败伏兵后，从随机出现的三个奖励中选择一个。",
                },
                flags: {
                    "story.act1.huntedAmbushers": true,
                    "story.act1.ambushResult": "fought",
                },
            },
        },
    ],
};

export default forestAmbush;
