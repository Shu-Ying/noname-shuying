# 梦三：关卡条件与战斗支援

## 约定
- 本模块是梦三玩法规则，不批量修改武将技能源码。
- 主角固定单位 ID：`player`；`ally` 为友方，`enemy` 为敌方。
- `neutral` 仅保留预设，目前配置为中立会报错，不启用中立行为。
- 主角使用个人牌堆；友方支援和敌人仍使用公共牌堆。
- 没有 `battlePlan` 的旧关卡继续使用原来随机的一名敌人。
- 本版单场累计最多 8 个席位，包含主角、初始单位、奖励支援、以后出现的援军。

## 配置位置
节点内容或剧情选项的 `outcome.battle` 中增加 `battlePlan`。
Boss 也可以在大关配置的 `bossBattlePlan` 中定义。
`units` 中每一项是一名初始角色，因此数组长度就是初始非主角人数。

```js
battlePlan: {
  units: [
    { id: "captain", character: "re_xiahoudun", camp: "enemy", hand: 4 },
    { id: "guard", character: "re_xuzhu", camp: "enemy", hand: 2 },
  ],
  rules: [
    {
      id: "rescue", name: "友军驰援",
      when: { event: "roundStart", round: 3 },
      effects: [{ type: "spawn", unit: {
        id: "helper", character: "re_zhangliao", camp: "ally", hand: 4,
      } }],
    },
    {
      id: "low_hp", name: "背水一战",
      when: { event: "state", all: [
        { unit: "captain", field: "alive", value: true },
        { unit: "captain", field: "hp", op: "lte", value: 2 },
      ] },
      effects: [{ type: "draw", target: "captain", amount: 2 }],
    },
    {
      id: "supply", name: "主角补给",
      when: { event: "state", all: [
        { unit: "player", field: "hand", op: "lte", value: 1 },
      ] },
      effects: [{ type: "draw", target: "player", amount: 2 }],
    },
  ],
}
```

## 字段
初始/援军单位：`id`、`character`、`camp`；可选 `hand`（默认 4）、`hp`、`maxHp`、`skills`。
每个单位 ID 必须唯一，引用 ID 而不是武将名称，允许同武将的不同单位。

每条规则每场仅触发一次，效果按书写顺序执行；不支持任意脚本、eval 或无限重复规则。
- `when.event`：`battleStart` 开场、`roundStart` 新轮、`turnStart` 每名角色主循环回合开始、`state` 状态变化。
- `when.round`：至少到第 N 轮。主角第一次进入主循环为第 1 轮；额外技能回合不另计轮。
- `when.turn`：至少到主循环第 N 个回合；所有角色一起计数，额外技能回合不计。
- `when.actor`：限定当前主循环行动单位，可用于 turnStart/roundStart。
- `when.all`：所有条件同时满足。`hp`、`hand` 使用 `eq`/`gte`/`lte` 比较。
- `alive`、`linked`、`turnedOver` 比较布尔值；`camp` 比较 `ally`/`enemy`。
- state 在开场、回合边界及体力/手牌/死亡/横置/翻面事件后检查，不轮询。

效果：`spawn`（提供 unit）、`draw`/`recover`/`maxHp`（target + amount）、`skill`（target + skill）、`camp`（target + camp）。
主角不能改阵营；死亡或尚未出现的目标不会执行数值/技能增益。规则不会复活角色。
`skill` 为本场增加技能，战后随角色统一释放，不写入永久技能。

`blocksVictory: true` 用于必须等待的敌方援军波次；未触发时不会提前胜利。
默认 false，避免可选援军条件永久不成立导致战斗无法结束。
若设为 true，作者必须保证该条件可以达成。条件同样适用于玩家方。

## 奖励支援
在奖励注册表中配置 support，不设置旧的 effectId：
```js
"shared.reward.support.example": {
  name: "道具·援令", description: "本次征程后续每场战斗获得友方支援。",
  support: {
    category: "item", // item 道具、bond 羁绊来源（仅数据预留）、buff 其他增益
    battles: -1,      // -1 或省略：本征程持续；正整数 N：持续 N 场战斗
    unit: { character: "re_zhangliao", camp: "ally", hand: 4 },
  },
},
```
再将奖励 ID 加入指定 rewardPools。相同奖励来源不叠加人数；临时次数可累加，永久来源保持永久。
数据保存在 `run.player.supports`，旧存档没有该字段时按空列表处理。
有限次数只随结算事务提交；重载未完成战斗不会额外扣次，重试结算不会重复发放。
行囊的“战斗支援”显示来源名称和持续场数。此版本未实现羁绊系统本身。

## 已接入的示例
- 林中伏兵“主动追击”：两名初始敌人，第 3 轮必定出现一名敌军援军。
- 敌军队长体力不高于 2 时摸两张；主角手牌不多于 1 时补两张，各限一次。
- 斥候谢礼奖励池加入“道具·斥候援令”，本征程后续每场由友方张辽参战。

## 结算和清理
仅主角死亡判负；存活友军不阻碍胜利。清空敌军且没有必须等待的敌军规则后判胜。
援军使用原生加入座次/enterGame，登记玩家 ID、技能释放和战斗资源清理。
身份模式原有的杀反贼摸三张、误杀忠臣弃牌惩罚不沿用；奖励由梦三结算和上述规则决定。
统计记录实际战败敌军数量，而非固定每场加一。

已做隔离配置/规则/事务检查；未启动游戏、未进行实际战斗或界面验收。
