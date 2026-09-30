# 刘备首关配置

新征程仅显示梦三私有界刘备：4/4、无初始技能。原版界刘备和其他模式不变；旧征程不强行换主角。

## 编辑入口
`content/acts/act1/stories/liubei-opening.js`：
- `openingDialogue`：开战前播放。原先填写的穿越与关张对话误放在第四回合支援台词里，现已移到这里。
- `openingDialogue` 中的 `type:"choice"` 可让玩家选择刘备发言；`flag` 指定征程存档的 `storyFlags` 键，选中后存入选项 `id`。后续台词可用 `when:{flag:"...",equals:"选项id"}` 控制是否显示。选项会随本关胜利结算写入征程存档，后续关卡可据此分支；中途退出战斗不会单独保存选择。
- 每段对话左上角可点“跳过对话”。尚未选择的发言会采用该行的 `defaultChoice`；未配置时采用 `choices` 第一项，并照常写入 `storyFlags`。已手动选择的发言不会被跳过操作覆盖。一个选项的发言也有效。
- `reinforcementDialogue`：刘备第四次完整回合结束时的台词，空数组跳过。
- `victoryDialogue`：胜利后、奖励结算前台词；失败不播放，不给马。
- `battlePlan.units`：敌人；`skills` 添加技能，`inheritSkills:false` 不加载原武将技能。
- `hand` 初始手牌数（可为0）、`hp` 当前体力、`maxHp` 上限；`equipment` 初始装备，指定 name/suit/number，可选nature。同一普通装备槽不可重复。
- `when:{event:"turnEnd",actor:"player",actorTurns:4}`：主角本人第四次回合结束，不是全场第四回合，也不是第四轮开始。额外完整回合也计数。
- 支援单位 `after:"player"` 插入刘备下家；该支援仅当前战斗有效，不写入永久道具/羁绊。
- 苏双&张世平为一名男性蜀势力武将，暂设无技能、4/4、4张初始手牌，可自行调整。
- `discardEquipment` 弃置指定单位装备区的指定牌；已不在装备区则不重复弃置，不影响其他装备。
- `fixedRewards` 固定获得梅花5的卢一张，加入征程个人牌库；此关关闭随机三选一。奖励与节点完成一起事务提交，重试不会重复发牌。
- 初始士兵/支援手牌仍来自公共牌堆；弃掉的敌方的卢走原生弃牌流程，胜利所得的卢是持久牌库新卡，并非再从弃牌区拾取。
- 提前击败敌人允许正常获胜，此时未到第四次回合的支援不会触发。不强行等待、不添加免死。

## 新角色立绘
`assets/portraits/sushuang-zhangshiping.png` 为本次 image_gen 生成的原创双人立绘，不是官方素材。

## 验证边界
隔离脚本检查配置、回合计数、效果顺序及奖励幂等，不等于游戏/十周年UI验收。请开始新征程检查真实引擎的装备、座次、AI和剧情显示。
