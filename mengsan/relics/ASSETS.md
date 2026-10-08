# 遗物原图资源

298 件 Wiki 遗物已从用户提供的 v0.111.0 图集匹配，并逐字节复制至
`mengsan/assets/relics/<wikiId>.png`。没有重绘或生成占位图片。

每张原文件名、运行时路径、尺寸、字节数、透明通道与 SHA-256 见
[manifest.json](../assets/relics/manifest.json)，逐件映射也列入
[实现记录](IMPLEMENTATION-20261006.md)。所有图片在480×672、300 KiB以内。

| 特殊条目 | 图集源文件 | 运行时文件 |
| --- | --- | --- |
| 美味饼干 | yummy_cookie_ironclad.png | yummy_cookie.png |
| 遗忘之魂 | lost_soul.png | forgotten_soul.png |
| 布质果实 | looming_fruit_2.png | looming_fruit.png |

美味饼干的另外四种角色图仍保留在源图集；当前梦三默认只映射刘备/铁甲战士。
束带是既有梦三道具，不属于Wiki的298件遗物，无对应图集图片，继续文字展示。

战斗遗物栏、背包、选遗物、商店、战利品清单使用这些图片；加载错误保留名称和描述。
资源检查仅证明文件完整与对应，实际游戏内显示仍待验收。
