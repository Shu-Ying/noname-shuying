# 梦三遗物

本目录已登记灰机 Wiki 快照的 298 件 STS2 遗物，并保留原梦三束带。
完整效果、资源映射、实现状态、适配与待补充事项见
[2026-10-06 实现记录](IMPLEMENTATION-20261006.md)。

- `catalog.js`：原始分类、中文说明、原始描述及来源；图鉴顺序1—298。
- `rules.js`：效果参数、缺失机制与已接入接口白名单。
- `definitions.js`：稳定ID/旧ID兼容、角色池、获取资格和奖励池。
- `progression.js`：拾取、金币、永久牌组、选择及状态保存。
- `battle.js`：战斗计数、开场/回合/伤害/消耗与战后效果。
- `combat.js`：对实际引擎的格挡、状态、伤害与回复调用。
- `rooms.js`：商店、休息、事件与节点效果。
- `hooks.js`：会话绑定、费用、牌堆与添加牌桥接；销毁会话后释放。

未实现的遗物可以查询资料，但 `canAcquireRelic` 与 `grantRelic` 默认拒绝；
只有所有效果属性都有执行接口且不缺配套卡牌的条目，才能进入对应奖励池。
专用先古/事件池已经登记，具体会面剧情仍待补充。

保留蛇之戒指、长蛇戒指、百年积木、节日拉炮等既有内部ID；支持 Wiki ID 查询。
全部原图见 [资源记录](ASSETS.md)。图片和隔离检查通过不代表实机验收。

从术樱包目录运行检查：

```powershell
node mengsan/tools/check-sts2-relics.mjs
node mengsan/tools/write-sts2-relics-report.mjs
```

本次不修改三个既有 dist 发布清单，也没有执行版本发布/实际游戏安装测试。
