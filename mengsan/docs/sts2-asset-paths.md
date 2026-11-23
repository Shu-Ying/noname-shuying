# Slay the Spire 2 素材路径对照

供梦三开发时查找本机参考资料。绝对路径可复制到 Windows 文件资源管理器，表内短路径以各节标注的目录为起点。

## 常用完整路径

**简体中文翻译目录**

```text
D:\workspace\术樱包-本地资料\参考资料\Slay the Spire 2\localization\zhs
```

**药水拆分 PNG**

```text
D:\workspace\术樱包-本地资料\参考资料\梦三\STS2拆分图集\Godot_Atlas_Sprites_v0.111.0\images\atlases\potion_atlas.sprites
```

**事件背景和插图**

```text
D:\workspace\术樱包-本地资料\参考资料\梦三\STS2拆分图集\Godot_Recovered_v0.111.0\images\events
```

## 简中翻译文件

以下文件都在上面的 `localization\zhs` 目录中。游戏目录里还有其他语言，可在 `localization` 下选择对应语言目录。

| 文件 | 查找内容 |
| --- | --- |
| `events.json` | 事件标题、选项与结果文本 |
| `potions.json`、`potion_lab.json` | 药水名称和效果说明、药水实验室界面文字 |
| `cards.json`、`card_keywords.json` | 卡牌名称和说明、卡牌关键词 |
| `relics.json`、`relic_collection.json` | 遗物名称和效果说明、遗物图鉴界面文字 |
| `powers.json`、`intents.json` | 状态名称和说明、战斗意图文字 |
| `monsters.json`、`encounters.json` | 怪物和遭遇相关文字 |
| `characters.json`、`ancients.json` | 角色和先古相关文字 |
| `afflictions.json`、`enchantments.json` | 苦痛和附魔相关文字 |
| `map.json`、`merchant_room.json`、`rest_site_ui.json` | 地图、商店和休息处界面文字 |

## 拆分图集

下表中的目录都位于这个图集根目录。

```text
D:\workspace\术樱包-本地资料\参考资料\梦三\STS2拆分图集\Godot_Atlas_Sprites_v0.111.0\images\atlases
```

| 查找内容 | 子目录 | 样例或数量 |
| --- | --- | --- |
| 药水图标 | `potion_atlas.sprites` | 64 张 PNG，例如 `energy_potion.png` |
| 药水描边 | `potion_outline_atlas.sprites` | 64 张同名 PNG |
| 遗物图标 | `relic_atlas.sprites` | 346 张 PNG，例如 `akabeko.png` |
| 遗物描边 | `relic_outline_atlas.sprites` | 346 张同名 PNG |
| 状态图标 | `power_atlas.sprites` | 271 张 PNG，例如 `accuracy_power.png` |
| 通用界面图标 | `ui_atlas.sprites` | 例如 `back_button.png`、`confirm_button.png` |
| 触控按钮小图 | `compressed.sprites` | 例如 `back_button_arrow.png` |
| 卡面图集条目 | `card_atlas.sprites` | 当前只有 `ancient_beta.png` 和 `beta.png` |

## 完整资料目录

下表路径均相对于这个目录。

```text
D:\workspace\术樱包-本地资料\参考资料\Slay the Spire 2
```

| 查找内容 | 相对路径 |
| --- | --- |
| 事件背景、插图和专用界面素材 | `images\events`、`images\events\custom`、`images\events\crystal_sphere` |
| 大号药水图 | `images\potions\large`，有 64 张 PNG |
| 药水合图及描边合图 | `images\atlases\potion_atlas.png`、`images\atlases\potion_outline_atlas.png` |
| 独立遗物、状态图标 | `images\relics`、`images\powers` |
| 选角界面资源 | `images\packed\character_select` |
| 战斗意图与抽牌堆、弃牌堆、结束回合图标 | `images\packed\intents`、`images\packed\combat_ui` |
| 地图绘制图标与房间场景素材 | `images\packed\map`、`images\rooms` |
| 通用界面图标和卡牌模板 | `images\packed\common_ui`、`images\packed\card_template` |
| 特效图和参考音效 | `images\vfx`、`debug_audio` |
| 药水、事件、遗物、卡牌的模型资料 | `src\Core\Models\Potions`、`src\Core\Models\Events`、`src\Core\Models\Relics`、`src\Core\Models\Cards` |

完整资料的 `images\atlases\*.sprites` 下通常是 Godot 的 `.tres` 图块描述。找单张药水、遗物或状态 PNG 时，直接查上面的拆分图集。事件素材可以先用 `events.json` 查事件文字，再在 `images\events` 中按英文文件名定位，例如 `abyssal_baths.png`。

梦三运行用的成品资源存放在项目的 `mengsan/assets/`。本页记录的绝对路径供本机查阅。
