export const openingDialogue = [
    { type: "narrator", text: "你是21世纪的一名普通牛马。" },
    { type: "narrator", text: "某天你晚上9点照常下班，刚出公司大门，就撞大运了。" },
    { type: "narrator", text: "等你睁开眼发现自己竟已身在三国，成为桃园结义后的刘备了。" },
    { type: "character", character: "$player", text: "（内心）我叫刘备。眼前这两位，便是与我结为兄弟的关羽和张飞。此刻，三弟正与二弟谈论黄巾之乱。" },
    { type: "character", character: "zhangfei", text: "大哥！如今黄巾作乱，官府正在招募义兵。俺们既已结为兄弟，何不召集乡勇，起兵讨伐黄巾贼？" },
    { type: "character", character: "guanyu", text: "三弟所言有理。只是起兵讨贼，须备足钱粮、兵器，方能成事。此事如何安排，还请大哥定夺。" },
    {
        type: "choice", text: "还好我历史满分！但是我不想干活啊。", flag: "story.act1.liubeiOpening.reply", defaultChoice: "gather", choices: [
            { id: "gather", text: "眼下先召集乡亲，整备人手，再从长计议。待我上山巡视一番，说不定有一张SSR呢。" },
        ]
    },
    { type: "character", character: "zhangfei", text: "SSR为何物？" },
    { type: "narrator", text: "你不等张飞吐槽，转身拂袖而去。" },
    { type: "narrator", text: "乡间小道之上，忽听前方有人高声喝道：“黄巾军押运辎重，闲人速速避让，莫要挡路！”" },
    { type: "narrator", text: "只见一人一马疾驰而来。" },
    { type: "character", character: "$player", text: "（内心）这就开始刷怪了？白送的物资来了。" },
    { type: "narrator", text: "只见你伸腿一拦，只见对方勒马拔剑，进入战斗。" },

];
export const reinforcementDialogue = [
    { type: "character", character: "$player", text: "（内心）我靠，对面有马我没马啊。" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "将军莫急，我等前来助战。" },
];
export const victoryDialogue = [
    { type: "character", character: "$player", text: "方才多谢二位出手相助，尚未请教二位尊姓大名？" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "在下苏双，这位是张世平。我二人皆是中山商贾。" },
    { type: "character", character: "$player", text: "原来是苏兄、张兄。不知二位为何来到此处？" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "我二人贩马经商，途经涿郡。久闻玄德素有豪侠之名，特来拜会。" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "入城打听之时，恰遇张壮士。听闻玄德正在此处，我二人便一路寻来。" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "不料刚到此地，便见玄德与黄巾贼交战。今日一见，果然名不虚传。" },
    { type: "character", character: "$player", text: "二位过誉了。既然远道而来，不如随我回寒舍一叙？" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "玄德盛情，我二人心领了。只是商队不日便要启程，实不便久留。" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "听闻玄德正欲招募乡勇、讨伐黄巾。我二人虽是商贾，也愿略尽绵薄之力。" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "我二人常年贩马，别的或许帮不上忙，良马倒有一些，愿赠与玄德，助义兵一臂之力。" },
    { type: "character", character: "mengsan_sushuang_zhangshiping_shuying", text: "至于甲胄兵器，我二人并不经营。听闻蜀郡有一年轻匠人，名唤蒲元，颇善锻造，如今在刘焉麾下。玄德若欲寻他，不妨前往投靠刘焉。" }
];

export const openingRewards = {
    "act1.reward.dilu": {
        id: "act1.reward.dilu", name: "的卢", description: "+1坐骑，加入本次征程的个人牌库。",
        card: { name: "dilu", suit: "club", number: 5, nature: null },
    },
};

export default {
    id: "act1.battle.liubeiOpening", kind: "battle", name: "刘备初始剧情", mapName: "初识的卢",
    requiredCharacter: "mengsan_liubei_shuying",
    enemies: ["mengsan_soldier_shuying"], gold: 20,
    skipRandomReward: true, fixedRewards: ["act1.reward.dilu"], openingDialogue, victoryDialogue,
    battlePlan: {
        units: [{
            id: "soldier", character: "mengsan_soldier_shuying", camp: "enemy",
            inheritSkills: false, skills: [], hand: 4, hp: 24, maxHp: 24,
            equipment: [{ name: "dilu", suit: "club", number: 5 }],
        }],
        rules: [{
            id: "merchants_arrive", name: "苏双与张世平支援",
            when: { event: "turnEnd", actor: "player", actorTurns: 4 },
            effects: [
                { type: "dialogue", lines: reinforcementDialogue },
                {
                    type: "spawn", unit: {
                        id: "merchants", character: "mengsan_sushuang_zhangshiping_shuying", camp: "ally",
                        after: "player", inheritSkills: false, skills: [], hand: 4, hp: 4, maxHp: 4,
                    }
                },
                { type: "discardEquipment", target: "soldier", name: "dilu" },
            ],
        }],
    },
};
