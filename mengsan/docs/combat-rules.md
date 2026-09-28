# 梦三战斗规则（测试阶段）

只影响梦三模式，不修改 noname 的标准/军争原始牌包。`content/mode-cards.js` 从标准、军争实体牌列表逐一复制模式专属定义，沿用原牌名以保留响应、装备、转化兼容性；图鉴说明在梦三模式覆盖。新征程的界刘备为 50/50 生命，默认每回合摸 2 张、手牌上限 3、回合费用恢复至 3。主动使用牌消耗费用，转化牌按转化后的牌名计费；响应【闪】、救援【桃】等不消耗费用。默认主动牌 1 费，`runtime/combat-rules.js` 中列出例外。【杀】1 费、可多次使用，牌定义的基础伤害为 4；【桃】及【桃园结义】回复 8 点生命；【南蛮入侵】、【万箭齐发】、【决斗】、【火攻】基础伤害 4，【闪电】命中伤害 12。其余卡牌保留原有效果，并加上梦三费用与图鉴说明。

## 怪物

`runtime/monster.js` 的 `Monster` 类统一提供阶级默认值。普通／精英／Boss 分别每回合摸 1／2／3 张、手牌上限 3／5／7、回合费用 2／3／4。每名敌人拥有自己的抽牌堆、弃牌堆与手牌；怪物默认使用阶级牌堆，不再从公共牌堆摸牌。友方支援仍用公共牌堆。

`HEALTH` 为目前各敌人的独立生命值；新怪物未配置时使用阶级兜底生命值。`OpeningSoldier extends Monster` 是继承示例；新子类在 `MONSTER_TYPES` 注册。关卡单位可以写 `tier`、`hp/maxHp`、`draw`、`handLimit`、`energy`、`deck` 覆盖默认值；`deck` 可为牌名数组（如 `deck:["sha","shan","tao"]`），也可用 `{name,suit,number}` 指定单张牌。牌名必须在 noname 中存在。

## 配置位置

- 玩家费用、手牌上限、卡牌费用与【杀】伤害：`runtime/combat-rules.js`
- 梦三模式卡牌复制、内容与图鉴文案：`content/mode-cards.js`
- 怪物阶级、默认牌堆、生命与继承示例：`runtime/monster.js`
- 刘备角色初始生命：`content/scenario-characters.js`
- 刘备专属初始牌组：`content/card-library.js`
- 首关小兵覆盖数值：`content/acts/act1/stories/liubei-opening.js`

旧存档不作迁移。源码检查不等于游戏内、十周年 UI 或 AI 行为验收。
