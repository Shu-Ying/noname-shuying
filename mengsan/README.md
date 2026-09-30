# 梦三模式目录

`register.js` 是扩展加载入口，`mode.js` 负责组装模式、注册技能并连接各领域模块，`config.js` 提供模式配置。发布器和外部扩展应继续从 `register.js` 加载，避免依赖内部文件路径。

| 目录 | 职责 |
| --- | --- |
| `battle/` | 战斗会话、回合、结算、费用与通用战斗效果 |
| `monsters/` | 怪物阶级、牌堆默认值和各怪物意图选择 |
| `cards/` | 卡牌定义、词缀、生成和个人牌堆 |
| `progression/` | 征程状态、存档、剧情选择和奖励逻辑 |
| `content/` | 章节、遭遇、剧本、角色与内容注册表 |
| `ui/` | 地图、对话、意图、奖励、图鉴及样式 |
| `assets/intent/` | 意图图标 |
| `assets/portraits/` | 角色立绘 |
| `docs/` | 战斗和关卡配置说明 |

新增功能优先放入所属领域；界面代码放在 `ui/`，怪物行动逻辑放在 `monsters/`。跨领域引用使用相对路径，避免新增一个涵盖所有功能的扁平 `runtime/` 目录。模块资源文件随 `tools/generate_manifest.py` 自动收录，发布入口仍为 `mengsan/register.js`。
