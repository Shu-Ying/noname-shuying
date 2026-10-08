# STS2 遗物接入记录（2026-10-06）

已登记全部 **298** 件 Wiki 遗物，匹配 **298** 张原图。**181** 件效果已接入，其中 **13** 件有明确梦三适配；**117** 件保留资料、图片及缺口记录，获取资格拒绝这些条目。另保留原梦三束带，不计入 Wiki 298 件。

本次直接修改实际梦三模块，未制作修复副本；没有生成或重绘三国杀风格图片。原有三个 dist 发布清单的既存改动未触碰。本记录中的“已接入”仅表示源码有对应执行接口，**不是实机验收结论**。

## 来源与完整性

- 使用本次对话此前抓取的 **2026-10-04** 网页快照；本次没有把旧快照宣称为 10 月 6 日 Wiki 的新修订。
- [遗物查找页](https://sts2.huijiwiki.com/wiki/模板:查找/遗物)；[结构化数据页](https://sts2.huijiwiki.com/wiki/Data:Relic.tabx)，快照修订号 `28579`。
- `relics/catalog.js` 保存池、原始稀有度、先古归属、图鉴顺序、中文名、可读描述、原始描述/原始 Wiki 标记、风味文字、前代及来源链接。
- 298 个唯一 Wiki ID；图鉴顺序完整覆盖 1—298。头环原始稀有度仍为“遗物”；先古归属与稀有度分别保存。
- 遗物池：铁甲战士 9；静默猎手 9；储君 9；亡灵契约师 9；故障机器人 9；通用 253。
- 稀有度：初始 10；普通 30；罕见 40；稀有 50；商店 30；先古之民 102；事件 35；遗物 1。
- 先古归属：无 196；涅奥 30；欧洛巴斯 10；佩尔 10；特兹卡塔拉 10；诺奴佩普 10；坦克斯 10；瓦库 10；达弗 12。

## 图片资源

来源为用户提供的 `assets/sts2/Godot_Atlas_Sprites_v0.111.0/images/atlases/relic_atlas.sprites/` 拆分 PNG 目录。运行时使用 `assets/relics/<wikiId>.png`，逐字节复制，不拉伸、不重新绘图。所有图片都在 480×672、300 KiB 以内。
298 张图片合计 **2,173,564 字节**。每张的源文件名、尺寸、透明通道、体积、SHA-256 见 [资源清单](../assets/relics/manifest.json)。

特殊映射：美味饼干使用 `yummy_cookie_ironclad.png`；遗忘之魂使用 `lost_soul.png`；布质果实使用 `looming_fruit_2.png`。美味饼干的其他角色图仍在原图集，当前仅接入铁甲战士图。原梦三束带没有对应 STS2 原图，继续显示文字。
战斗遗物栏、地图背包、遗物选择、商店和战利品清单已经接入图片；池/稀有度/先古归属可从遗物栏与背包查看。

## 效果与获取接线

- 拾取：最大生命、回血、金币、牌组强化、复制、移除、变化、变化并强化、加入卡牌、随机遗物、多组卡牌选择、临时移出永久牌组。
- 战斗：开场与指定回合效果、额外摸牌、费用、格挡、敏捷、力量、活力、易伤/虚弱倍率、攻击/技能/能力计数、伤害增幅、荆棘、覆甲、生命损失减免、尾巴复活、消耗及洗牌触发。
- 战斗生成牌和手牌/抽牌堆强化使用本场实体牌，强化不会写回永久牌组。艳丽围巾的第五张牌免费与天鹅绒项圈限制接入现有支付/禁用接口；化学物X接入 X 次数。
- 笔尖、双节棍、音叉、铁棒、香纸的累计计数保存在征程状态；新获得的遗物以获得时的累计值为起点。每回合三连击计数独立重置。
- 房间：餐券、活动星图、永恒羽毛、茶具、皇家枕头、捕梦网、铲子、壶铃、南瓜蜡烛添火、帐篷、烹饪与折扣。每个房间/动作有独立记录，重复进入不会重复回血。
- 战后：回血、敌人额外金币、最大生命、普通战斗/精英战强化、黑星、熔岩石、佩尔之齿逐张强化返还、石之剑变化、旺购神秘券。
- 金币统一经过 `grantGold`；圆顶礼帽/灵体外质/火龙果同时覆盖战斗、奖励包、事件、遗物拾取、添加牌和现有劫掠牌击杀收益。存钱罐在商店消费后失效。
- 商店保留【杀】与回复生命，新增3个遗物货位、折扣与信使补货。遗物基价暂设120金币；不是 Wiki 公布的商品价格。购买后完成所有遗物选牌，再提交房间结果。
- 普通/罕见/稀有遗物池登记 **81** 项；可售遗物池登记 **91** 项，均在实际获取时继续过滤重复与角色池。
- 原有精英固定遗物奖励、第一章宝箱和初次剧情遗物选择自动使用扩展后的可用池。Boss 极品卡牌池保留原有专属稀有卡约定。
- 新建刘备征程自动持有燃烧之血，符合铁甲战士初始池；既有存档不追补、不重复发放初始遗物。其他武将暂不指定初始遗物。
- 先古/事件/初始遗物已提供独立奖励池；**尚未创建对应先古会面和事件剧情**，不会把这些条目混入普通掉落。后续节点可以引用下表池名或调用已有 `grantRelic`。
- 拾取操作在可序列化副本上计算，成功后替换运行状态；尚未实现的遗物/重复获取不会改金币、随机数或牌组。战后效果在现有结算候选里只计算一次，存档失败重试不重新发奖。

| 专用奖励池 | 当前可用数 |
| --- | --- |
| `shared.pool.relic.shop` | 91 |
| `shared.pool.relic.event` | 27 |
| `shared.pool.relic.initial` | 4 |
| `shared.pool.relic.ancient.neow` | 20 |
| `shared.pool.relic.ancient.orobas` | 2 |
| `shared.pool.relic.ancient.pael` | 5 |
| `shared.pool.relic.ancient.tezcatara` | 5 |
| `shared.pool.relic.ancient.nonupep` | 5 |
| `shared.pool.relic.ancient.tanx` | 7 |
| `shared.pool.relic.ancient.vakuu` | 4 |
| `shared.pool.relic.ancient.darv` | 10 |

## 需要用户补充或确认

1. **烹饪数值与流程**：网页只说明能够烹饪，目前采用最大生命+5。确定原作具体数值后可替换适配值。
2. **非战斗生命归零流程**：危险剪刀/芬芳蘑菇当前扣血保留至少1生命。需要明确是否允许地图中直接死亡，以及对应失败弹窗/存档规则。
3. **先古会面及事件入口**：请确定梦三在哪些章节、节点或剧情中接入各先古和事件遗物。已有数据分类、效果、专用奖励池，但尚无原作的完整会面事件。
4. **角色池映射**：当前只把刘备映射为铁甲战士，其他四个 STS2 角色未绑定梦三武将；不擅自指定。
5. **原作机制**：辉星、充能球、集中、奥斯提、灾厄、仆从、铸造、可使用药水，以及 Wiki 指定附魔，需要对应玩法接口；完整逐件缺口见下表。现有词缀不会冒充原作附魔。
6. **先古牌与击杀口径**：尘封魔典当前抽取现有先古事件牌；石之剑按精英战胜利次数计数，需要完整原作候选表及精英单位身份口径。
7. **实机验收**：需要用户回来在实际梦三运行以下场景；此次不在正在进行的征程上自动操纵或替换存档。

## 已知梦三口径与限制

- 基础开场4张牌、每回合原有摸牌数、费用3和手牌上限3保持现有梦三规则。大蘑菇先减2张，再叠加正向开场额外摸牌。
- 增加最大生命本身不额外治疗当前生命，沿用既有草莓约定；李家华夫饼另外回满生命。降低最大生命会将当前生命限制到新上限。
- 休息基础回复8；皇家枕头额外15。多个折扣乘算后向下取整，最低1金币。
- 克制、防御、保留、能力牌、虚无等牌的现有规则优先保留；符文金字塔/三角铃鼓避免手牌上限弃牌，不阻止虚无牌消耗。
- 回合伤害上限在所有参与者的回合开始重置。钨合金棍和跳动残渣在预计护甲抵扣后限制实际生命损失，纯护甲损失不触发百年积木。伤害事件统计仍遵循引擎原有口径。
- 独立牌堆不足时，梦三现有规则会结束挑战；额外摸牌遗物同样遵循该规则，未擅自改成原作的不足时少抽。
- 尾巴仅本次征程触发一次；数值进位/舍入遵循梦三现有攻击、虚弱、易伤与护甲规则。
- 没有持有来源正确的图集之外的素材缺失；主要缺口属于玩法/入口，仍全部登记。

## 验证与待实机场景

已运行 `node mengsan/tools/check-sts2-relics.mjs`：完整目录/图片哈希及源字节、逐件可获得遗物拾取与基本战斗、禁用遗物不变更状态、角色池/重复资格、随机遗物/选牌、永恒限制、累计计数、格挡后的减伤、复活一次、临时强化不污染牌组、商店房间记录、战后提交只写一次等隔离回归。检查数量以本次运行输出为准。
已检查修改模块语法、内容注册表加载及本次改动差异。**尚未做实际游戏内的战斗、图片渲染或安装更新验收**；上述检查不能替代实机运行。

用户回来后建议覆盖：

- 持有锚开战并进入第一回合；比较格挡是否保留。
- 护甲完全抵挡/部分抵挡攻击时，测试钨合金棍、跳动残渣、百年积木。
- 同一多段攻击与第10张攻击，跨战斗测试笔尖、活力、双节棍。
- 能力牌首次/再次/下个回合测试永冻冰、木乃伊之手；X=0/大于0测试化学物X。
- 第5张免费、第6张后不能主动出牌；进入敌方回合后检查响应仍可用。
- 濒死测试蜥蜴尾巴，确保第二次不复活；荆棘/覆甲在实际攻击事件中测试。
- 休息点多选、选牌遗物、永久牌移除/变化、佩尔之齿逐场返还、商店折扣与补货。
- 保存失败后重试，确认不重复金币、遗物、牌组强化和房间效果；退出未完成战斗后继续旧地图检查点。

## 明确适配详情

- **送货员**：梦三商店出售【杀】、回复生命及三件随机遗物；购买后补货，折扣适用现有商品。药水尚无接口。遗物基价120金币，为梦三配置值。
- **微型帐篷**：每个休息选项可各选择一次，直至选择离开；不允许无限重复同一选项。
- **切肉刀**：网页没有烹饪细则；暂定每次烹饪最大生命+5，待用户确认。
- **大蘑菇**：沿用梦三初始手牌4张，扣减2张；未改成STS2的基础手牌数量。
- **长蛇戒指**：刘备仅映射铁甲战士池；其他角色池需配置player.relicPool才可获取。效果按前三个自身回合各摸2张接入。
- **符文金字塔**：梦三原本按手牌上限弃牌；这里让全部手牌不计入弃牌上限。虚无牌照常消耗。
- **松动羊毛剪**：选牌后扣除16点生命；当前地图流程保留至少1点生命，待补充非战斗死亡结算。
- **芳香蘑菇**：随机强化2张并扣除15点生命；当前地图流程保留至少1点生命，待补充非战斗死亡结算。
- **尘封魔典**：从已登记的先古事件牌池随机获得一张；网页未列出完整候选排除规则。
- **石之剑**：按5次精英战胜利计数，变化为玉之剑；尚无精英单位的独立击杀标签。
- **纸蛙**：依梦三易伤口径向上取整；作用于玩家发起的攻击，保留既有卡牌的额外易伤增幅。
- **纸鹤**：依梦三虚弱口径向下取整，敌人攻击倍率0.6。
- **巨口储蓄罐**：将进入一个新的梦三节点视为攀爬一层，先发12金币，再进行商店购买或战斗；原作楼层与额外剧情节点未单独区分。

## 逐件清单

图片路径统一为 `assets/relics/<Wiki ID>.png`。表中“执行/缺口”列给出接线属性或阻塞原因，原文效果原样保留可读表达；池、稀有度和先古归属没有合并。

| 序号 | 遗物 / Wiki ID | 池 | 稀有度 | 先古归属 | 原文效果 | 状态 | 执行 / 缺口 | 来源图片 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [燃烧之血](https://sts2.huijiwiki.com/wiki/%E7%87%83%E7%83%A7%E4%B9%8B%E8%A1%80)<br>`burning_blood` | 铁甲战士 | 初始 | — | 在战斗结束时，回复6点生命。 | 已接入，待实机 | battleHeal=6 | `burning_blood.png`<br>71×81；6202 B |
| 2 | [蛇之戒指](https://sts2.huijiwiki.com/wiki/%E8%9B%87%E4%B9%8B%E6%88%92%E6%8C%87)<br>`ring_of_the_snake` | 静默猎手 | 初始 | — | 在每场战斗开始时，额外抽2张牌。 | 已接入，待实机 | openingDraw=2 | `ring_of_the_snake.png`<br>81×81；9868 B |
| 3 | [天赋君权](https://sts2.huijiwiki.com/wiki/%E5%A4%A9%E8%B5%8B%E5%90%9B%E6%9D%83)<br>`divine_right` | 储君 | 初始 | — | 在每场战斗开始时，获得[辉星][辉星][辉星]。 | 待补充，禁入奖励 | 辉星系统 | `divine_right.png`<br>71×81；8739 B |
| 4 | [缚魂命匣](https://sts2.huijiwiki.com/wiki/%E7%BC%9A%E9%AD%82%E5%91%BD%E5%8C%A3)<br>`bound_phylactery` | 亡灵契约师 | 初始 | — | 在你的回合开始时，召唤1 | 待补充，禁入奖励 | 奥斯提召唤系统 | `bound_phylactery.png`<br>77×82；8874 B |
| 5 | [破损核心](https://sts2.huijiwiki.com/wiki/%E7%A0%B4%E6%8D%9F%E6%A0%B8%E5%BF%83)<br>`cracked_core` | 故障机器人 | 初始 | — | 在每场战斗开始时，生成1个闪电充能球。 | 待补充，禁入奖励 | 充能球系统 | `cracked_core.png`<br>79×78；8536 B |
| 6 | [黑暗之血](https://sts2.huijiwiki.com/wiki/%E9%BB%91%E6%9A%97%E4%B9%8B%E8%A1%80)<br>`black_blood` | 铁甲战士 | 初始 | — | 在战斗结束时，回复12点生命。 | 已接入，待实机 | battleHeal=12；replaces="burning_blood" | `black_blood.png`<br>66×79；6334 B |
| 7 | [长蛇戒指](https://sts2.huijiwiki.com/wiki/%E9%95%BF%E8%9B%87%E6%88%92%E6%8C%87)<br>`ring_of_the_drake` | 静默猎手 | 初始 | — | 在战斗开始时的前3个回合，你额外抽2张牌。 | 梦三适配，待实机 | 刘备仅映射铁甲战士池；其他角色池需配置player.relicPool才可获取。效果按前三个自身回合各摸2张接入。 | `ring_of_the_drake.png`<br>78×80；7525 B |
| 8 | [天命所归](https://sts2.huijiwiki.com/wiki/%E5%A4%A9%E5%91%BD%E6%89%80%E5%BD%92)<br>`divine_destiny` | 储君 | 初始 | — | 在每场战斗开始时，获得[辉星][辉星][辉星][辉星][辉星][辉星]。 | 待补充，禁入奖励 | 辉星系统 | `divine_destiny.png`<br>71×81；8401 B |
| 9 | [无界命匣](https://sts2.huijiwiki.com/wiki/%E6%97%A0%E7%95%8C%E5%91%BD%E5%8C%A3)<br>`phylactery_unbound` | 亡灵契约师 | 初始 | — | 在每场战斗开始时，召唤5。在你的回合开始时，召唤2。 | 待补充，禁入奖励 | 奥斯提召唤系统 | `phylactery_unbound.png`<br>76×80；9269 B |
| 10 | [注能核心](https://sts2.huijiwiki.com/wiki/%E6%B3%A8%E8%83%BD%E6%A0%B8%E5%BF%83)<br>`infused_core` | 故障机器人 | 初始 | — | 在每场战斗开始时，生成3个闪电充能球。闪电充能球额外造成1点伤害。 | 待补充，禁入奖励 | 充能球系统 | `infused_core.png`<br>80×78；10310 B |
| 11 | [百年积木](https://sts2.huijiwiki.com/wiki/%E7%99%BE%E5%B9%B4%E7%A7%AF%E6%9C%A8)<br>`centennial_puzzle` | 通用 | 普通 | — | 你在每场战斗中第一次损失生命值时，抽3张牌。 | 已接入，待实机 | firstHpLossDraw=3 | `centennial_puzzle.png`<br>82×78；5795 B |
| 12 | [摆动球](https://sts2.huijiwiki.com/wiki/%E6%91%86%E5%8A%A8%E7%90%83)<br>`pendulum` | 通用 | 普通 | — | 每3个回合，抽1张牌 | 已接入，待实机 | turnDraw=1；turnEvery=3 | `pendulum.png`<br>80×79；8656 B |
| 13 | [餐券](https://sts2.huijiwiki.com/wiki/%E9%A4%90%E5%88%B8)<br>`meal_ticket` | 通用 | 普通 | — | 每当你进入商店房间时，回复15点生命。 | 已接入，待实机 | shopHeal=15 | `meal_ticket.png`<br>81×77；6610 B |
| 14 | [草莓](https://sts2.huijiwiki.com/wiki/%E8%8D%89%E8%8E%93)<br>`strawberry` | 通用 | 普通 | — | 拾起时，将你的最大生命值提升7。 | 已接入，待实机 | maxHp=7 | `strawberry.png`<br>76×80；10517 B |
| 15 | [打击木偶](https://sts2.huijiwiki.com/wiki/%E6%89%93%E5%87%BB%E6%9C%A8%E5%81%B6)<br>`strike_dummy` | 通用 | 普通 | — | 名字中有“打击”的卡牌造成3点额外伤害。 | 已接入，待实机 | strikeDamage=3 | `strike_dummy.png`<br>81×79；9102 B |
| 16 | [弹珠袋](https://sts2.huijiwiki.com/wiki/%E5%BC%B9%E7%8F%A0%E8%A2%8B)<br>`bag_of_marbles` | 通用 | 普通 | — | 在每场战斗开始时，给予所有敌人1层易伤。 | 已接入，待实机 | openingVulnerable=1 | `bag_of_marbles.png`<br>80×60；4912 B |
| 17 | [灯笼](https://sts2.huijiwiki.com/wiki/%E7%81%AF%E7%AC%BC)<br>`lantern` | 通用 | 普通 | — | 在每场战斗的第一回合获得[能量]。 | 已接入，待实机 | firstTurnEnergy=1 | `lantern.png`<br>64×80；7201 B |
| 18 | [佛珠手链](https://sts2.huijiwiki.com/wiki/%E4%BD%9B%E7%8F%A0%E6%89%8B%E9%93%BE)<br>`juzu_bracelet` | 通用 | 普通 | — | 你在?房间中不会再遭遇常规战斗。 | 待补充，禁入奖励 | 当前问号事件没有随机常规战斗入口，暂无作用 | `juzu_bracelet.png`<br>81×81；8301 B |
| 19 | [古茶具套装](https://sts2.huijiwiki.com/wiki/%E5%8F%A4%E8%8C%B6%E5%85%B7%E5%A5%97%E8%A3%85)<br>`venerable_tea_set` | 通用 | 普通 | — | 到达休息处后的下一场战斗开始时额外获得[能量][能量]。 | 已接入，待实机 | afterRestEnergy=2 | `venerable_tea_set.png`<br>78×80；8208 B |
| 20 | [红面具](https://sts2.huijiwiki.com/wiki/%E7%BA%A2%E9%9D%A2%E5%85%B7)<br>`red_mask` | 通用 | 普通 | — | 在每场战斗开始时，给于所有敌人1层虚弱。 | 已接入，待实机 | openingWeak=1 | `red_mask.png`<br>73×79；6354 B |
| 21 | [护喉甲](https://sts2.huijiwiki.com/wiki/%E6%8A%A4%E5%96%89%E7%94%B2)<br>`gorget` | 通用 | 普通 | — | 在每场战斗开始时，获得4层覆甲。 | 已接入，待实机 | plating=4 | `gorget.png`<br>79×70；7239 B |
| 22 | [皇家枕头](https://sts2.huijiwiki.com/wiki/%E7%9A%87%E5%AE%B6%E6%9E%95%E5%A4%B4)<br>`regal_pillow` | 通用 | 普通 | — | 在休息时，额外回复15点生命。 | 已接入，待实机 | restHeal=15 | `regal_pillow.png`<br>80×74；5706 B |
| 23 | [节日拉炮](https://sts2.huijiwiki.com/wiki/%E8%8A%82%E6%97%A5%E6%8B%89%E7%82%AE)<br>`festive_popper` | 通用 | 普通 | — | 在每场战斗开始时，对所有敌人造成9点伤害。 | 已接入，待实机 | openingDamage=9 | `festive_popper.png`<br>79×80；8348 B |
| 24 | [金刚杵](https://sts2.huijiwiki.com/wiki/%E9%87%91%E5%88%9A%E6%9D%B5)<br>`vajra` | 通用 | 普通 | — | 在每场战斗开始时，获得1点力量。 | 已接入，待实机 | openingStrength=1 | `vajra.png`<br>79×78；5852 B |
| 25 | [开心小花](https://sts2.huijiwiki.com/wiki/%E5%BC%80%E5%BF%83%E5%B0%8F%E8%8A%B1)<br>`happy_flower` | 通用 | 普通 | — | 每3个回合，获得[能量]。 | 待补充，禁入奖励 | 尚未接入此效果 | `happy_flower.png`<br>54×82；7156 B |
| 26 | [锚](https://sts2.huijiwiki.com/wiki/%E9%94%9A)<br>`anchor` | 通用 | 普通 | — | 每场战斗开始时获得10点格挡。 | 已接入，待实机 | openingBlock=10 | `anchor.png`<br>74×82；7211 B |
| 27 | [磨刀石](https://sts2.huijiwiki.com/wiki/%E7%A3%A8%E5%88%80%E7%9F%B3)<br>`whetstone` | 通用 | 普通 | — | 拾起时，随机升级2张攻击牌。 | 已接入，待实机 | gainUpgrade=2；upgradeType="attack" | `whetstone.png`<br>78×67；7143 B |
| 28 | [铜质鳞片](https://sts2.huijiwiki.com/wiki/%E9%93%9C%E8%B4%A8%E9%B3%9E%E7%89%87)<br>`bronze_scales` | 通用 | 普通 | — | 在每场战斗开始时，获得3点荆棘。 | 已接入，待实机 | thorns=3 | `bronze_scales.png`<br>80×77；7094 B |
| 29 | [五轮书](https://sts2.huijiwiki.com/wiki/%E4%BA%94%E8%BD%AE%E4%B9%A6)<br>`book_of_five_rings` | 通用 | 普通 | — | 你每将5张牌加入你的牌组时，回复20点生命。 | 已接入，待实机 | deckAddHealEvery=5；deckAddHeal=20 | `book_of_five_rings.png`<br>81×81；8169 B |
| 30 | [小血瓶](https://sts2.huijiwiki.com/wiki/%E5%B0%8F%E8%A1%80%E7%93%B6)<br>`blood_vial` | 通用 | 普通 | — | 在每场战斗开始时，回复2点生命。 | 已接入，待实机 | openingHeal=2 | `blood_vial.png`<br>80×80；5729 B |
| 31 | [药水腰带](https://sts2.huijiwiki.com/wiki/%E8%8D%AF%E6%B0%B4%E8%85%B0%E5%B8%A6)<br>`potion_belt` | 通用 | 普通 | — | 拾起时，获得2个药水栏位。 | 待补充，禁入奖励 | 可使用的药水及栏位系统 | `potion_belt.png`<br>81×78；9220 B |
| 32 | [意外光滑的石头](https://sts2.huijiwiki.com/wiki/%E6%84%8F%E5%A4%96%E5%85%89%E6%BB%91%E7%9A%84%E7%9F%B3%E5%A4%B4)<br>`oddly_smooth_stone` | 通用 | 普通 | — | 在每场战斗开始时，获得1点敏捷。 | 已接入，待实机 | openingDexterity=1 | `oddly_smooth_stone.png`<br>81×66；4824 B |
| 33 | [战纹涂料](https://sts2.huijiwiki.com/wiki/%E6%88%98%E7%BA%B9%E6%B6%82%E6%96%99)<br>`war_paint` | 通用 | 普通 | — | 拾起时，随机升级2张技能牌。 | 已接入，待实机 | gainUpgrade=2；upgradeType="skill" | `war_paint.png`<br>80×53；7563 B |
| 34 | [准备背包](https://sts2.huijiwiki.com/wiki/%E5%87%86%E5%A4%87%E8%83%8C%E5%8C%85)<br>`bag_of_preparation` | 通用 | 普通 | — | 在每场战斗开始时，额外抽2张牌。 | 已接入，待实机 | openingDraw=2 | `bag_of_preparation.png`<br>81×74；8988 B |
| 35 | [紫水晶茄子](https://sts2.huijiwiki.com/wiki/%E7%B4%AB%E6%B0%B4%E6%99%B6%E8%8C%84%E5%AD%90)<br>`amethyst_aubergine` | 通用 | 普通 | — | 敌人额外掉落15金币。 | 已接入，待实机 | battleGold=15 | `amethyst_aubergine.png`<br>81×77；7960 B |
| 36 | [红头骨](https://sts2.huijiwiki.com/wiki/%E7%BA%A2%E5%A4%B4%E9%AA%A8)<br>`red_skull` | 铁甲战士 | 普通 | — | 当你的生命值低于或等于50%时，你额外获得3点力量 | 已接入，待实机 | lowHpStrength=3 | `red_skull.png`<br>76×81；8046 B |
| 37 | [异蛇头骨](https://sts2.huijiwiki.com/wiki/%E5%BC%82%E8%9B%87%E5%A4%B4%E9%AA%A8)<br>`snecko_skull` | 静默猎手 | 普通 | — | 每当你给予敌人中毒时，所给予的中毒层数增加1层。 | 待补充，禁入奖励 | 玩家中毒牌与中毒系统 | `snecko_skull.png`<br>80×73；6524 B |
| 38 | [击剑指南](https://sts2.huijiwiki.com/wiki/%E5%87%BB%E5%89%91%E6%8C%87%E5%8D%97)<br>`fencing_manual` | 储君 | 普通 | — | 在每场战斗开始时，铸造10。 | 待补充，禁入奖励 | 铸造系统 | `fencing_manual.png`<br>59×80；6554 B |
| 39 | [骨笛](https://sts2.huijiwiki.com/wiki/%E9%AA%A8%E7%AC%9B)<br>`bone_flute` | 亡灵契约师 | 普通 | — | 每当奥斯提攻击时，获得2点格挡。 | 待补充，禁入奖励 | 奥斯提攻击系统 | `bone_flute.png`<br>81×78；5418 B |
| 40 | [数据磁盘](https://sts2.huijiwiki.com/wiki/%E6%95%B0%E6%8D%AE%E7%A3%81%E7%9B%98)<br>`data_disk` | 故障机器人 | 普通 | — | 在每场战斗开始时，获得1点集中。 | 待补充，禁入奖励 | 集中与充能球系统 | `data_disk.png`<br>80×76；7979 B |
| 41 | [奥利哈钢](https://sts2.huijiwiki.com/wiki/%E5%A5%A5%E5%88%A9%E5%93%88%E9%92%A2)<br>`orichalcum` | 通用 | 罕见 | — | 如果你在回合结束时没有任何格挡，获得6点格挡。 | 已接入，待实机 | emptyBlock=6 | `orichalcum.png`<br>81×65；6289 B |
| 42 | [臂甲](https://sts2.huijiwiki.com/wiki/%E8%87%82%E7%94%B2)<br>`vambrace` | 通用 | 罕见 | — | 每场战斗中，你第一次从卡牌中获得的格挡值翻倍。 | 已接入，待实机 | firstCardBlockDouble=true | `vambrace.png`<br>77×79；6282 B |
| 43 | [波纹水盆](https://sts2.huijiwiki.com/wiki/%E6%B3%A2%E7%BA%B9%E6%B0%B4%E7%9B%86)<br>`ripple_basin` | 通用 | 罕见 | — | 如果你在本回合中没有打出过攻击牌，则获得4点格挡。 | 已接入，待实机 | noAttackBlock=4 | `ripple_basin.png`<br>81×56；7170 B |
| 44 | [吃不完的糖](https://sts2.huijiwiki.com/wiki/%E5%90%83%E4%B8%8D%E5%AE%8C%E7%9A%84%E7%B3%96)<br>`lasting_candy` | 通用 | 罕见 | — | 每两场战斗，你的卡牌奖励就会额外包含一张能力牌。 | 待补充，禁入奖励 | 独立的额外能力牌奖励组 | `lasting_candy.png`<br>79×80；9132 B |
| 45 | [赤牛](https://sts2.huijiwiki.com/wiki/%E8%B5%A4%E7%89%9B)<br>`akabeko` | 通用 | 罕见 | — | 在每场战斗开始时，获得8点活力。 | 已接入，待实机 | vigor=8 | `akabeko.png`<br>81×69；7370 B |
| 46 | [船夹板](https://sts2.huijiwiki.com/wiki/%E8%88%B9%E5%A4%B9%E6%9D%BF)<br>`horn_cleat` | 通用 | 罕见 | — | 在你的第二回合开始时，获得14点格挡。 | 已接入，待实机 | nthTurn=2；nthTurnBlock=14 | `horn_cleat.png`<br>81×51；4463 B |
| 47 | [地精之角](https://sts2.huijiwiki.com/wiki/%E5%9C%B0%E7%B2%BE%E4%B9%8B%E8%A7%92)<br>`gremlin_horn` | 通用 | 罕见 | — | 每当有一名敌人死亡时，获得[能量]并抽1张牌。 | 已接入，待实机 | killDraw=1；killEnergy=1 | `gremlin_horn.png`<br>81×79；6932 B |
| 48 | [钢笔尖](https://sts2.huijiwiki.com/wiki/%E9%92%A2%E7%AC%94%E5%B0%96)<br>`pen_nib` | 通用 | 罕见 | — | 你每打出的第10张攻击牌将会造成双倍伤害。 | 已接入，待实机 | nthAttackDouble=10 | `pen_nib.png`<br>80×77；4903 B |
| 49 | [活动星图](https://sts2.huijiwiki.com/wiki/%E6%B4%BB%E5%8A%A8%E6%98%9F%E5%9B%BE)<br>`planisphere` | 通用 | 罕见 | — | 每当你进入？房间的时候，回复5点生命。 | 已接入，待实机 | eventHeal=5 | `planisphere.png`<br>79×81；10303 B |
| 50 | [金纸](https://sts2.huijiwiki.com/wiki/%E9%87%91%E7%BA%B8)<br>`joss_paper` | 通用 | 罕见 | — | 你每消耗5张牌，就抽1张牌。 | 已接入，待实机 | exhaustDrawEvery=5 | `joss_paper.png`<br>82×81；10387 B |
| 51 | [精致折扇](https://sts2.huijiwiki.com/wiki/%E7%B2%BE%E8%87%B4%E6%8A%98%E6%89%87)<br>`ornamental_fan` | 通用 | 罕见 | — | 你每在同一回合内打出3张攻击牌，就获得4点格挡。 | 已接入，待实机 | tripleAttackBlock=4 | `ornamental_fan.png`<br>81×70；7744 B |
| 52 | [开信刀](https://sts2.huijiwiki.com/wiki/%E5%BC%80%E4%BF%A1%E5%88%80)<br>`letter_opener` | 通用 | 罕见 | — | 你每在同一回合内打出3张技能牌，就对所有敌人造成5点伤害。 | 已接入，待实机 | tripleSkillDamage=5 | `letter_opener.png`<br>80×81；5423 B |
| 53 | [梨子](https://sts2.huijiwiki.com/wiki/%E6%A2%A8%E5%AD%90)<br>`pear` | 通用 | 罕见 | — | 拾起时，将你的最大生命值提升10。 | 已接入，待实机 | maxHp=10 | `pear.png`<br>62×81；5863 B |
| 54 | [爬行动物饰品](https://sts2.huijiwiki.com/wiki/%E7%88%AC%E8%A1%8C%E5%8A%A8%E7%89%A9%E9%A5%B0%E5%93%81)<br>`reptile_trinket` | 通用 | 罕见 | — | 当你使用药水时，在本回合获得3力量。 | 待补充，禁入奖励 | 可使用的药水系统 | `reptile_trinket.png`<br>77×78；6845 B |
| 55 | [闪亮口红](https://sts2.huijiwiki.com/wiki/%E9%97%AA%E4%BA%AE%E5%8F%A3%E7%BA%A2)<br>`sparkling_rouge` | 通用 | 罕见 | — | 在你的第3回合开始时，获得1点力量和1点敏捷。 | 已接入，待实机 | nthTurn=3；nthTurnStrength=1；nthTurnDexterity=1 | `sparkling_rouge.png`<br>77×80；6177 B |
| 56 | [石化蟾蜍](https://sts2.huijiwiki.com/wiki/%E7%9F%B3%E5%8C%96%E8%9F%BE%E8%9C%8D)<br>`petrified_toad` | 通用 | 罕见 | — | 在每场战斗开始时，获得一瓶药水形状的石头 | 待补充，禁入奖励 | 药水形状的石头 | `petrified_toad.png`<br>81×74；8135 B |
| 57 | [双截棍](https://sts2.huijiwiki.com/wiki/%E5%8F%8C%E6%88%AA%E6%A3%8D)<br>`nunchaku` | 通用 | 罕见 | — | 你每打出10张攻击牌，获得[能量]。 | 已接入，待实机 | attackEnergyEvery=10 | `nunchaku.png`<br>80×81；5482 B |
| 58 | [水银沙漏](https://sts2.huijiwiki.com/wiki/%E6%B0%B4%E9%93%B6%E6%B2%99%E6%BC%8F)<br>`mercury_hourglass` | 通用 | 罕见 | — | 在你的回合开始时，对所有敌人造成3点伤害。 | 已接入，待实机 | turnDamage=3 | `mercury_hourglass.png`<br>65×81；6038 B |
| 59 | [碎石钻](https://sts2.huijiwiki.com/wiki/%E7%A2%8E%E7%9F%B3%E9%92%BB)<br>`stone_cracker` | 通用 | 罕见 | — | 在每场战斗开始时，在本场战斗中随机升级你抽牌堆中的2张牌。 | 已接入，待实机 | openingUpgradeDraw=2 | `stone_cracker.png`<br>74×76；6968 B |
| 60 | [缩放仪](https://sts2.huijiwiki.com/wiki/%E7%BC%A9%E6%94%BE%E4%BB%AA)<br>`pantograph` | 通用 | 罕见 | — | 在Boss战开始时，回复25点生命值。 | 已接入，待实机 | bossOpeningHeal=25 | `pantograph.png`<br>81×75；4490 B |
| 61 | [锁镰](https://sts2.huijiwiki.com/wiki/%E9%94%81%E9%95%B0)<br>`kusarigama` | 通用 | 罕见 | — | 你每在同一回合内打出3张攻击牌，就随机对一名敌人造成6点伤害。 | 已接入，待实机 | tripleAttackDamage=6 | `kusarigama.png`<br>81×79；6107 B |
| 62 | [微型大炮](https://sts2.huijiwiki.com/wiki/%E5%BE%AE%E5%9E%8B%E5%A4%A7%E7%82%AE)<br>`miniature_cannon` | 通用 | 罕见 | — | 升级的攻击牌额外造成3点伤害。 | 已接入，待实机 | upgradedAttackDamage=3 | `miniature_cannon.png`<br>80×80；8396 B |
| 63 | [小邮箱](https://sts2.huijiwiki.com/wiki/%E5%B0%8F%E9%82%AE%E7%AE%B1)<br>`tiny_mailbox` | 通用 | 罕见 | — | 每当你休息时，获得2瓶随机药水。 | 待补充，禁入奖励 | 可使用的药水系统 | `tiny_mailbox.png`<br>81×72；7945 B |
| 64 | [音叉](https://sts2.huijiwiki.com/wiki/%E9%9F%B3%E5%8F%89)<br>`tuning_fork` | 通用 | 罕见 | — | 你每打出10张技能牌，获得7点格挡。 | 已接入，待实机 | skillBlockEvery=10；skillBlock=7 | `tuning_fork.png`<br>81×76；3921 B |
| 65 | [永冻冰晶](https://sts2.huijiwiki.com/wiki/%E6%B0%B8%E5%86%BB%E5%86%B0%E6%99%B6)<br>`permafrost` | 通用 | 罕见 | — | 当你在战斗中第一次打出能力牌时，获得7点格挡。 | 已接入，待实机 | firstPowerBlock=7 | `permafrost.png`<br>75×81；6789 B |
| 66 | [永恒羽毛](https://sts2.huijiwiki.com/wiki/%E6%B0%B8%E6%81%92%E7%BE%BD%E6%AF%9B)<br>`eternal_feather` | 通用 | 罕见 | — | 你的牌组中每有5张牌，当你进入休息处时就会回复3点生命。 | 已接入，待实机 | restEntryHealPerFive=3 | `eternal_feather.png`<br>79×78；6627 B |
| 67 | [圆顶礼帽](https://sts2.huijiwiki.com/wiki/%E5%9C%86%E9%A1%B6%E7%A4%BC%E5%B8%BD)<br>`bowler_hat` | 通用 | 罕见 | — | 额外获得25%的金币。 | 已接入，待实机 | goldMultiplier=1.25 | `bowler_hat.png`<br>81×65；5589 B |
| 68 | [招财异鱼](https://sts2.huijiwiki.com/wiki/%E6%8B%9B%E8%B4%A2%E5%BC%82%E9%B1%BC)<br>`lucky_fysh` | 通用 | 罕见 | — | 每当你将一张卡牌加入你的牌组时，获得15金币。 | 已接入，待实机 | deckAddGold=15 | `lucky_fysh.png`<br>81×83；9458 B |
| 69 | [招架盾](https://sts2.huijiwiki.com/wiki/%E6%8B%9B%E6%9E%B6%E7%9B%BE)<br>`parrying_shield` | 通用 | 罕见 | — | 如果你在回合结束时拥有至少10点格挡，则对随机敌人造成6点伤害。 | 已接入，待实机 | endBlockThreshold=10；endBlockDamage=6 | `parrying_shield.png`<br>81×81；8633 B |
| 70 | [烛台](https://sts2.huijiwiki.com/wiki/%E7%83%9B%E5%8F%B0)<br>`candelabra` | 通用 | 罕见 | — | 在你的第2回合开始时，获得[能量][能量]。 | 已接入，待实机 | nthTurn=2；nthTurnEnergy=2 | `candelabra.png`<br>81×81；5701 B |
| 71 | [纸蛙](https://sts2.huijiwiki.com/wiki/%E7%BA%B8%E8%9B%99)<br>`paper_phrog` | 铁甲战士 | 罕见 | — | 有易伤状态的敌人受到的伤害增加75%而非50%。 | 梦三适配，待实机 | 依梦三易伤口径向上取整；作用于玩家发起的攻击，保留既有卡牌的额外易伤增幅。 | `paper_phrog.png`<br>81×69；5557 B |
| 72 | [自成型黏土](https://sts2.huijiwiki.com/wiki/%E8%87%AA%E6%88%90%E5%9E%8B%E9%BB%8F%E5%9C%9F)<br>`self_forming_clay` | 铁甲战士 | 罕见 | — | 每当你在战斗中失去生命，就在下回合获得3点格挡。 | 已接入，待实机 | hpLossNextBlock=3 | `self_forming_clay.png`<br>81×80；7786 B |
| 73 | [铜钹](https://sts2.huijiwiki.com/wiki/%E9%93%9C%E9%92%B9)<br>`tingsha` | 静默猎手 | 罕见 | — | 你每在你的回合丢弃一张牌，就对一名随机敌人造成3点伤害。 | 待补充，禁入奖励 | 尚缺效果接口：discardDamage | `tingsha.png`<br>77×72；6163 B |
| 74 | [扭曲漏斗](https://sts2.huijiwiki.com/wiki/%E6%89%AD%E6%9B%B2%E6%BC%8F%E6%96%97)<br>`twisted_funnel` | 静默猎手 | 罕见 | — | 在每场战斗开始时，给予所有敌人4层中毒。 | 待补充，禁入奖励 | 中毒系统 | `twisted_funnel.png`<br>80×71；6585 B |
| 75 | [星系尘埃](https://sts2.huijiwiki.com/wiki/%E6%98%9F%E7%B3%BB%E5%B0%98%E5%9F%83)<br>`galactic_dust` | 储君 | 罕见 | — | 每消耗10点[辉星]，就获得10格挡。 | 待补充，禁入奖励 | 辉星消费系统 | `galactic_dust.png`<br>80×82；7036 B |
| 76 | [君王矿石](https://sts2.huijiwiki.com/wiki/%E5%90%9B%E7%8E%8B%E7%9F%BF%E7%9F%B3)<br>`regalite` | 储君 | 罕见 | — | 每当你生成一张牌时，获得2点格挡。 | 待补充，禁入奖励 | 所有来源的生成牌事件（当前只有部分接口） | `regalite.png`<br>78×72；9031 B |
| 77 | [修书小刀](https://sts2.huijiwiki.com/wiki/%E4%BF%AE%E4%B9%A6%E5%B0%8F%E5%88%80)<br>`book_repair_knife` | 亡灵契约师 | 罕见 | — | 每当有一名不是“爪牙”的敌人死于灾厄时，回复3点生命。 | 待补充，禁入奖励 | 灾厄与爪牙系统 | `book_repair_knife.png`<br>79×76；5558 B |
| 78 | [葬礼面具](https://sts2.huijiwiki.com/wiki/%E8%91%AC%E7%A4%BC%E9%9D%A2%E5%85%B7)<br>`funerary_mask` | 亡灵契约师 | 罕见 | — | 在每场战斗开始时，将3张灵魂加入你的抽牌堆。 | 待补充，禁入奖励 | 灵魂牌与奥斯提系统 | `funerary_mask.png`<br>75×70；8372 B |
| 79 | [镀金缆线](https://sts2.huijiwiki.com/wiki/%E9%95%80%E9%87%91%E7%BC%86%E7%BA%BF)<br>`gold_plated_cables` | 故障机器人 | 罕见 | — | 你最右侧的充能球会额外触发一次被动效果。 | 待补充，禁入奖励 | 充能球系统 | `gold_plated_cables.png`<br>74×73；6804 B |
| 80 | [共生病毒](https://sts2.huijiwiki.com/wiki/%E5%85%B1%E7%94%9F%E7%97%85%E6%AF%92)<br>`symbiotic_virus` | 故障机器人 | 罕见 | — | 在每场战斗开始时，生成1个黑暗充能球。 | 待补充，禁入奖励 | 充能球系统 | `symbiotic_virus.png`<br>80×79；7675 B |
| 81 | [白兽雕像](https://sts2.huijiwiki.com/wiki/%E7%99%BD%E5%85%BD%E9%9B%95%E5%83%8F)<br>`white_beast_statue` | 通用 | 稀有 | — | 战斗结束后必定掉落药水。 | 待补充，禁入奖励 | 药水掉落系统 | `white_beast_statue.png`<br>81×76；7638 B |
| 82 | [白星](https://sts2.huijiwiki.com/wiki/%E7%99%BD%E6%98%9F)<br>`white_star` | 通用 | 稀有 | — | 精英敌人额外掉落一次稀有卡牌奖励。 | 待补充，禁入奖励 | 独立的额外稀有卡奖励组 | `white_star.png`<br>81×79；4939 B |
| 83 | [冰淇淋](https://sts2.huijiwiki.com/wiki/%E5%86%B0%E6%B7%87%E6%B7%8B)<br>`ice_cream` | 通用 | 稀有 | — | 多余的能量可以留到下一回合。 | 已接入，待实机 | keepEnergy=true | `ice_cream.png`<br>76×82；7197 B |
| 84 | [不安油灯](https://sts2.huijiwiki.com/wiki/%E4%B8%8D%E5%AE%89%E6%B2%B9%E7%81%AF)<br>`unsettling_lamp` | 通用 | 稀有 | — | 你在每场战斗中第一次打出能给予敌人负面状态的牌时，将其效果翻倍。 | 待补充，禁入奖励 | 所有负面状态牌效果的单次翻倍接口 | `unsettling_lamp.png`<br>80×80；7484 B |
| 85 | [不休陀螺](https://sts2.huijiwiki.com/wiki/%E4%B8%8D%E4%BC%91%E9%99%80%E8%9E%BA)<br>`unceasing_top` | 通用 | 稀有 | — | 在你的回合，当你没有手牌时，抽一张牌。 | 待补充，禁入奖励 | 尚缺效果接口：emptyHandDraw | `unceasing_top.png`<br>75×80；9092 B |
| 86 | [彩虹戒指](https://sts2.huijiwiki.com/wiki/%E5%BD%A9%E8%99%B9%E6%88%92%E6%8C%87)<br>`rainbow_ring` | 通用 | 稀有 | — | 每回合，你第一次打出攻击牌、技能牌和能力牌各一张时，获得1点力量和1点敏捷。 | 待补充，禁入奖励 | 尚缺效果接口：rainbow | `rainbow_ring.png`<br>78×82；9381 B |
| 87 | [铲子](https://sts2.huijiwiki.com/wiki/%E9%93%B2%E5%AD%90)<br>`shovel` | 通用 | 稀有 | — | 现在你可以在休息处挖掘遗物。 | 已接入，待实机 | restAction="dig" | `shovel.png`<br>80×81；4860 B |
| 88 | [带骨肉](https://sts2.huijiwiki.com/wiki/%E5%B8%A6%E9%AA%A8%E8%82%89)<br>`meat_on_the_bone` | 通用 | 稀有 | — | 如果你在战斗结束时生命值等于或低于50%，回复12点生命。 | 已接入，待实机 | lowHpBattleHeal=12 | `meat_on_the_bone.png`<br>81×78；6570 B |
| 89 | [吊灯](https://sts2.huijiwiki.com/wiki/%E5%90%8A%E7%81%AF)<br>`chandelier` | 通用 | 稀有 | — | 在你的第三回合开始时，获得[能量][能量][能量]。 | 已接入，待实机 | nthTurn=3；nthTurnEnergy=3 | `chandelier.png`<br>79×81；6424 B |
| 90 | [冻结之蛋](https://sts2.huijiwiki.com/wiki/%E5%86%BB%E7%BB%93%E4%B9%8B%E8%9B%8B)<br>`frozen_egg` | 通用 | 稀有 | — | 每当你获得能力牌时，将其升级。 | 已接入，待实机 | upgradeAddedType="power" | `frozen_egg.png`<br>65×80；6468 B |
| 91 | [斗篷扣](https://sts2.huijiwiki.com/wiki/%E6%96%97%E7%AF%B7%E6%89%A3)<br>`cloak_clasp` | 通用 | 稀有 | — | 在你的回合结束时，每有一张手牌，就获得1点格挡 | 已接入，待实机 | endHandBlock=1 | `cloak_clasp.png`<br>78×77；5876 B |
| 92 | [毒素之蛋](https://sts2.huijiwiki.com/wiki/%E6%AF%92%E7%B4%A0%E4%B9%8B%E8%9B%8B)<br>`toxic_egg` | 通用 | 稀有 | — | 每当你获得技能牌时，将其升级。 | 已接入，待实机 | upgradeAddedType="skill" | `toxic_egg.png`<br>66×81；8054 B |
| 93 | [赌博筹码](https://sts2.huijiwiki.com/wiki/%E8%B5%8C%E5%8D%9A%E7%AD%B9%E7%A0%81)<br>`gambling_chip` | 通用 | 稀有 | — | 在每场战斗开始时，丢弃任意张牌，然后抽相同数量张牌。 | 待补充，禁入奖励 | 尚缺效果接口：openingDiscardDraw | `gambling_chip.png`<br>81×76；8263 B |
| 94 | [舵盘](https://sts2.huijiwiki.com/wiki/%E8%88%B5%E7%9B%98)<br>`captains_wheel` | 通用 | 稀有 | — | 在你的第三回合开始时，获得18点格挡。 | 已接入，待实机 | nthTurn=3；nthTurnBlock=18 | `captains_wheel.png`<br>81×81；7933 B |
| 95 | [烦人机关盒](https://sts2.huijiwiki.com/wiki/%E7%83%A6%E4%BA%BA%E6%9C%BA%E5%85%B3%E7%9B%92)<br>`vexing_puzzlebox` | 通用 | 稀有 | — | 在每场战斗开始时，将一张随机卡牌加入你的手牌。这张牌在本回合可以免费打出。 | 已接入，待实机 | openingRandom=1；openingRandomFree=true | `vexing_puzzlebox.png`<br>79×83；10329 B |
| 96 | [风箱](https://sts2.huijiwiki.com/wiki/%E9%A3%8E%E7%AE%B1)<br>`bellows` | 通用 | 稀有 | — | 你在每场战斗开始时的手牌，将被升级。 | 已接入，待实机 | openingUpgradeHand=true | `bellows.png`<br>78×81；7584 B |
| 97 | [干瘪之手](https://sts2.huijiwiki.com/wiki/%E5%B9%B2%E7%98%AA%E4%B9%8B%E6%89%8B)<br>`mummified_hand` | 通用 | 稀有 | — | 你每打出一张能力牌，手牌中就有一张随机牌在这个回合可以免费打出。 | 已接入，待实机 | powerFreeRandom=true | `mummified_hand.png`<br>75×82；7919 B |
| 98 | [古钱币](https://sts2.huijiwiki.com/wiki/%E5%8F%A4%E9%92%B1%E5%B8%81)<br>`old_coin` | 通用 | 稀有 | — | 拾起时，获得300金币。 | 已接入，待实机 | gainGold=300 | `old_coin.png`<br>74×82；8264 B |
| 99 | [骇人头盔](https://sts2.huijiwiki.com/wiki/%E9%AA%87%E4%BA%BA%E5%A4%B4%E7%9B%94)<br>`intimidating_helmet` | 通用 | 稀有 | — | 每当你打出一张耗能大于等于[能量][能量]的牌，获得4点格挡。 | 待补充，禁入奖励 | 尚缺效果接口：costlyBlock、costlyThreshold | `intimidating_helmet.png`<br>78×81；8849 B |
| 100 | [壶铃](https://sts2.huijiwiki.com/wiki/%E5%A3%B6%E9%93%83)<br>`girya` | 通用 | 稀有 | — | 你现在能在休息处获得力量。（最多3次） | 已接入，待实机 | restAction="lift" | `girya.png`<br>66×80；7017 B |
| 101 | [怀表](https://sts2.huijiwiki.com/wiki/%E6%80%80%E8%A1%A8)<br>`pocketwatch` | 通用 | 稀有 | — | 当你在本回合打出的牌少于等于3张时，则在你的下个回合开始时额外抽3张牌。 | 已接入，待实机 | fewCardsDraw=3；fewCardsLimit=3 | `pocketwatch.png`<br>81×71；7534 B |
| 102 | [坚固钳子](https://sts2.huijiwiki.com/wiki/%E5%9D%9A%E5%9B%BA%E9%92%B3%E5%AD%90)<br>`sturdy_clamp` | 通用 | 稀有 | — | 可以跨回合保留最多10点格挡。 | 已接入，待实机 | keepBlock=10 | `sturdy_clamp.png`<br>77×79；7020 B |
| 103 | [苦无](https://sts2.huijiwiki.com/wiki/%E8%8B%A6%E6%97%A0)<br>`kunai` | 通用 | 稀有 | — | 你每在同一回合内打出3张攻击牌，就获得1点敏捷。 | 已接入，待实机 | tripleAttackDexterity=1 | `kunai.png`<br>81×81；4476 B |
| 104 | [历石](https://sts2.huijiwiki.com/wiki/%E5%8E%86%E7%9F%B3)<br>`stone_calendar` | 通用 | 稀有 | — | 在第7回合结束时，对所有敌人造成52点伤害。 | 已接入，待实机 | endTurn=7；endTurnDamage=52 | `stone_calendar.png`<br>81×74；7869 B |
| 105 | [律动残余](https://sts2.huijiwiki.com/wiki/%E5%BE%8B%E5%8A%A8%E6%AE%8B%E4%BD%99)<br>`beating_remnant` | 通用 | 稀有 | — | 你在一回合内失去的生命值不会超过20点。 | 已接入，待实机 | turnHpLossCap=20 | `beating_remnant.png`<br>78×81；8688 B |
| 106 | [芒果](https://sts2.huijiwiki.com/wiki/%E8%8A%92%E6%9E%9C)<br>`mango` | 通用 | 稀有 | — | 拾起时，将你的最大生命值提升14。 | 已接入，待实机 | maxHp=14 | `mango.png`<br>80×76；9461 B |
| 107 | [棋子](https://sts2.huijiwiki.com/wiki/%E6%A3%8B%E5%AD%90)<br>`game_piece` | 通用 | 稀有 | — | 每当你打出能力牌时，抽1张牌。 | 已接入，待实机 | powerDraw=1 | `game_piece.png`<br>60×81；6525 B |
| 108 | [熔火之蛋](https://sts2.huijiwiki.com/wiki/%E7%86%94%E7%81%AB%E4%B9%8B%E8%9B%8B)<br>`molten_egg` | 通用 | 稀有 | — | 每当你获得攻击牌时，将其升级。 | 已接入，待实机 | upgradeAddedType="attack" | `molten_egg.png`<br>65×79；8687 B |
| 109 | [手里剑](https://sts2.huijiwiki.com/wiki/%E6%89%8B%E9%87%8C%E5%89%91)<br>`shuriken` | 通用 | 稀有 | — | 你每在同一回合内打出3张攻击牌，获得1点力量。 | 已接入，待实机 | tripleAttackStrength=1 | `shuriken.png`<br>81×82；5605 B |
| 110 | [送货员](https://sts2.huijiwiki.com/wiki/%E9%80%81%E8%B4%A7%E5%91%98)<br>`the_courier` | 通用 | 稀有 | — | 商人的卡牌、遗物和药水不再会卖光，并且所有商品打折20%。 | 梦三适配，待实机 | 梦三商店出售【杀】、回复生命及三件随机遗物；购买后补货，折扣适用现有商品。药水尚无接口。遗物基价120金币，为梦三配置值。 | `the_courier.png`<br>80×81；8351 B |
| 111 | [孙子兵法](https://sts2.huijiwiki.com/wiki/%E5%AD%99%E5%AD%90%E5%85%B5%E6%B3%95)<br>`art_of_war` | 通用 | 稀有 | — | 如果你在本回合中没有打出过攻击牌，则在下一回合额外获得1点[能量]。 | 已接入，待实机 | noAttackNextEnergy=1 | `art_of_war.png`<br>81×57；8052 B |
| 112 | [剃刀牙](https://sts2.huijiwiki.com/wiki/%E5%89%83%E5%88%80%E7%89%99)<br>`razor_tooth` | 通用 | 稀有 | — | 你打出攻击牌和技能牌时，将其在本场战斗内升级。 | 待补充，禁入奖励 | 尚缺效果接口：upgradePlayed | `razor_tooth.png`<br>78×81；4581 B |
| 113 | [钨合金棍](https://sts2.huijiwiki.com/wiki/%E9%92%A8%E5%90%88%E9%87%91%E6%A3%8D)<br>`tungsten_rod` | 通用 | 稀有 | — | 你每次失去生命时，减少失去的生命值1点。 | 已接入，待实机 | reduceHpLoss=1 | `tungsten_rod.png`<br>80×75；5669 B |
| 114 | [蜥蜴尾巴](https://sts2.huijiwiki.com/wiki/%E8%9C%A5%E8%9C%B4%E5%B0%BE%E5%B7%B4)<br>`lizard_tail` | 通用 | 稀有 | — | 当你的生命值将要降低至0或以下时，回复到最大生命值的50%（仅能起效一次）。 | 已接入，待实机 | deathHealFraction=0.5 | `lizard_tail.png`<br>82×81；7566 B |
| 115 | [转经轮](https://sts2.huijiwiki.com/wiki/%E8%BD%AC%E7%BB%8F%E8%BD%AE)<br>`prayer_wheel` | 通用 | 稀有 | — | 普通敌人额外掉落一次卡牌奖励。 | 待补充，禁入奖励 | 独立的额外卡牌奖励组 | `prayer_wheel.png`<br>57×81；6409 B |
| 116 | [卡戎之灰](https://sts2.huijiwiki.com/wiki/%E5%8D%A1%E6%88%8E%E4%B9%8B%E7%81%B0)<br>`charons_ashes` | 铁甲战士 | 稀有 | — | 每当你消耗一张牌，对所有敌人造成3点伤害。 | 已接入，待实机 | exhaustDamage=3 | `charons_ashes.png`<br>80×79；7056 B |
| 117 | [恶魔之舌](https://sts2.huijiwiki.com/wiki/%E6%81%B6%E9%AD%94%E4%B9%8B%E8%88%8C)<br>`demon_tongue` | 铁甲战士 | 稀有 | — | 每回合第一次在回合内失去生命值时，回复等量的生命值。 | 待补充，禁入奖励 | 尚缺效果接口：firstTurnLossHeal | `demon_tongue.png`<br>79×79；5413 B |
| 118 | [损毁头盔](https://sts2.huijiwiki.com/wiki/%E6%8D%9F%E6%AF%81%E5%A4%B4%E7%9B%94)<br>`ruined_helmet` | 铁甲战士 | 稀有 | — | 你在每场战斗中第一次获得的力量值翻倍。 | 待补充，禁入奖励 | 尚缺效果接口：firstStrengthDouble | `ruined_helmet.png`<br>67×78；6839 B |
| 119 | [螺线飞镖](https://sts2.huijiwiki.com/wiki/%E8%9E%BA%E7%BA%BF%E9%A3%9E%E9%95%96)<br>`helical_dart` | 静默猎手 | 稀有 | — | 你每打出一张小刀，就在本回合获得1点敏捷。 | 待补充，禁入奖励 | 小刀牌与静默猎手牌组 | `helical_dart.png`<br>79×80；6241 B |
| 120 | [纸鹤](https://sts2.huijiwiki.com/wiki/%E7%BA%B8%E9%B9%A4)<br>`paper_krane` | 静默猎手 | 稀有 | — | 有虚弱状态的敌人造成的伤害降低40%而非25%。 | 梦三适配，待实机 | 依梦三虚弱口径向下取整，敌人攻击倍率0.6。 | `paper_krane.png`<br>76×78；5861 B |
| 121 | [结实绷带](https://sts2.huijiwiki.com/wiki/%E7%BB%93%E5%AE%9E%E7%BB%B7%E5%B8%A6)<br>`tough_bandages` | 静默猎手 | 稀有 | — | 你每在你的回合丢弃一张牌，就获得3点格挡。 | 待补充，禁入奖励 | 尚缺效果接口：discardBlock | `tough_bandages.png`<br>80×78；7351 B |
| 122 | [月亮糕点](https://sts2.huijiwiki.com/wiki/%E6%9C%88%E4%BA%AE%E7%B3%95%E7%82%B9)<br>`lunar_pastry` | 储君 | 稀有 | — | 在你的回合结束时，获得[辉星]。 | 待补充，禁入奖励 | 辉星系统 | `lunar_pastry.png`<br>75×81；8027 B |
| 123 | [迷你储君](https://sts2.huijiwiki.com/wiki/%E8%BF%B7%E4%BD%A0%E5%82%A8%E5%90%9B)<br>`mini_regent` | 储君 | 稀有 | — | 每回合你第一次花费[辉星]时，获得1点力量。 | 待补充，禁入奖励 | 辉星系统 | `mini_regent.png`<br>66×79；6062 B |
| 124 | [橙色团块](https://sts2.huijiwiki.com/wiki/%E6%A9%99%E8%89%B2%E5%9B%A2%E5%9D%97)<br>`orange_dough` | 储君 | 稀有 | — | 在每场战斗开始时，将2张随机无色牌加入你的手牌。 | 已接入，待实机 | openingRandom=2；openingRandomPack="colorless" | `orange_dough.png`<br>78×72；9276 B |
| 125 | [大帽子](https://sts2.huijiwiki.com/wiki/%E5%A4%A7%E5%B8%BD%E5%AD%90)<br>`big_hat` | 亡灵契约师 | 稀有 | — | 在每场战斗开始时，将2张随机虚无牌加入你的手牌。 | 已接入，待实机 | openingRandom=2；openingRandomEthereal=true | `big_hat.png`<br>80×72；6382 B |
| 126 | [书签](https://sts2.huijiwiki.com/wiki/%E4%B9%A6%E7%AD%BE)<br>`bookmark` | 亡灵契约师 | 稀有 | — | 每回合结束时，随机一张被保留的牌在被打出前的耗能减少1。 | 待补充，禁入奖励 | 跨回合保留牌的独立费用下降 | `bookmark.png`<br>75×79；8190 B |
| 127 | [象牙麻将牌](https://sts2.huijiwiki.com/wiki/%E8%B1%A1%E7%89%99%E9%BA%BB%E5%B0%86%E7%89%8C)<br>`ivory_tile` | 亡灵契约师 | 稀有 | — | 每当你打出一张耗能大于等于[能量][能量][能量]的牌时，获得[能量]。 | 待补充，禁入奖励 | 尚缺效果接口：costlyEnergy、costlyThreshold | `ivory_tile.png`<br>58×81；5196 B |
| 128 | [情感芯片](https://sts2.huijiwiki.com/wiki/%E6%83%85%E6%84%9F%E8%8A%AF%E7%89%87)<br>`emotion_chip` | 故障机器人 | 稀有 | — | 在每回合开始时，如果你在之前回合受到过伤害，则触发所有充能球的被动效果。 | 待补充，禁入奖励 | 充能球系统 | `emotion_chip.png`<br>78×65；5413 B |
| 129 | [节拍器](https://sts2.huijiwiki.com/wiki/%E8%8A%82%E6%8B%8D%E5%99%A8)<br>`metronome` | 故障机器人 | 稀有 | — | 每场战斗中你首次生成7个充能球时，对所有敌人造成30点伤害。 | 待补充，禁入奖励 | 充能球系统 | `metronome.png`<br>63×81；6549 B |
| 130 | [能量电池](https://sts2.huijiwiki.com/wiki/%E8%83%BD%E9%87%8F%E7%94%B5%E6%B1%A0)<br>`power_cell` | 故障机器人 | 稀有 | — | 在每场战斗开始时，将2张耗能为0的卡牌从你的抽牌堆放入你的手牌。 | 待补充，禁入奖励 | 尚缺效果接口：openingFetchZero | `power_cell.png`<br>66×81；8248 B |
| 131 | [肮脏地毯](https://sts2.huijiwiki.com/wiki/%E8%82%AE%E8%84%8F%E5%9C%B0%E6%AF%AF)<br>`dingy_rug` | 通用 | 商店 | — | 卡牌奖励现在会包括无色牌。 | 待补充，禁入奖励 | 尚缺效果接口：allowColorlessRewards | `dingy_rug.png`<br>80×81；8697 B |
| 132 | [大锅](https://sts2.huijiwiki.com/wiki/%E5%A4%A7%E9%94%85)<br>`cauldron` | 通用 | 商店 | — | 拾起时，制作5瓶随机药水。 | 待补充，禁入奖励 | 可使用的药水系统 | `cauldron.png`<br>80×72；7112 B |
| 133 | [多利之镜](https://sts2.huijiwiki.com/wiki/%E5%A4%9A%E5%88%A9%E4%B9%8B%E9%95%9C)<br>`dollys_mirror` | 通用 | 商店 | — | 拾起时，从你的牌组中选择一张牌进行复制。 | 已接入，待实机 | choice="duplicate"；choiceCount=1 | `dollys_mirror.png`<br>77×81；8280 B |
| 134 | [工具箱](https://sts2.huijiwiki.com/wiki/%E5%B7%A5%E5%85%B7%E7%AE%B1)<br>`toolbox` | 通用 | 商店 | — | 在每场战斗开始时，从3张随机无色牌中选择1张加入你的手牌。 | 待补充，禁入奖励 | 尚缺效果接口：openingChooseColorless | `toolbox.png`<br>81×70；6117 B |
| 135 | [化学物X](https://sts2.huijiwiki.com/wiki/%E5%8C%96%E5%AD%A6%E7%89%A9X)<br>`chemical_x` | 通用 | 商店 | — | 耗能为X的牌的效果数值增加2点。 | 已接入，待实机 | xBonus=2 | `chemical_x.png`<br>63×78；4646 B |
| 136 | [会员卡](https://sts2.huijiwiki.com/wiki/%E4%BC%9A%E5%91%98%E5%8D%A1)<br>`membership_card` | 通用 | 商店 | — | 所有商品打折50%！ | 已接入，待实机 | shopDiscount=0.5 | `membership_card.png`<br>81×69；7343 B |
| 137 | [火龙果](https://sts2.huijiwiki.com/wiki/%E7%81%AB%E9%BE%99%E6%9E%9C)<br>`dragon_fruit` | 通用 | 商店 | — | 每当你获得金币时，提升1点你的最大生命值。 | 已接入，待实机 | goldGainMaxHp=1 | `dragon_fruit.png`<br>74×75；9003 B |
| 138 | [尖叫酒壶](https://sts2.huijiwiki.com/wiki/%E5%B0%96%E5%8F%AB%E9%85%92%E5%A3%B6)<br>`screaming_flagon` | 通用 | 商店 | — | 如果你在回合结束时没有任何手牌，则对所有敌人造成20点伤害。 | 待补充，禁入奖励 | 尚缺效果接口：emptyHandDamage | `screaming_flagon.png`<br>64×79；7754 B |
| 139 | [李家华夫饼](https://sts2.huijiwiki.com/wiki/%E6%9D%8E%E5%AE%B6%E5%8D%8E%E5%A4%AB%E9%A5%BC)<br>`lees_waffle` | 通用 | 商店 | — | 拾起时，将你的最大生命值提升7点，并回复所有生命。 | 已接入，待实机 | maxHp=7；fullHeal=true | `lees_waffle.png`<br>81×79；8818 B |
| 140 | [面包](https://sts2.huijiwiki.com/wiki/%E9%9D%A2%E5%8C%85)<br>`bread` | 通用 | 商店 | — | 在你的第一个回合开始时，失去[能量][能量]。在其余的回合开始时，获得[能量]。 | 待补充，禁入奖励 | 尚缺效果接口：laterTurnEnergy | `bread.png`<br>80×60；7202 B |
| 141 | [木札](https://sts2.huijiwiki.com/wiki/%E6%9C%A8%E6%9C%AD)<br>`kifuda` | 通用 | 商店 | — | 拾起时，从你的牌组中选择至多3张牌，附魔：伶俐。 | 待补充，禁入奖励 | 伶俐附魔 | `kifuda.png`<br>73×77；7972 B |
| 142 | [扭曲锤子](https://sts2.huijiwiki.com/wiki/%E6%89%AD%E6%9B%B2%E9%94%A4%E5%AD%90)<br>`gnarled_hammer` | 通用 | 商店 | — | 拾起时，从你的牌组中选择至多3张攻击牌，附魔：锋利3。 | 待补充，禁入奖励 | 锋利附魔 | `gnarled_hammer.png`<br>78×58；5429 B |
| 143 | [拳刃](https://sts2.huijiwiki.com/wiki/%E6%8B%B3%E5%88%83)<br>`punch_dagger` | 通用 | 商店 | — | 拾起时，选择一张攻击牌为它附魔：动量5。 | 待补充，禁入奖励 | 动量附魔 | `punch_dagger.png`<br>79×80；5670 B |
| 144 | [燃烧木棍](https://sts2.huijiwiki.com/wiki/%E7%87%83%E7%83%A7%E6%9C%A8%E6%A3%8D)<br>`burning_sticks` | 通用 | 商店 | — | 每场战斗中你第一次消耗技能牌时，将那张牌的复制品加入你的手牌 | 待补充，禁入奖励 | 尚缺效果接口：firstSkillExhaustCopy | `burning_sticks.png`<br>80×80；7372 B |
| 145 | [熔岩灯](https://sts2.huijiwiki.com/wiki/%E7%86%94%E5%B2%A9%E7%81%AF)<br>`lava_lamp` | 通用 | 商店 | — | 在战斗结束时，如果你没有受到伤害，则升级你的所有卡牌奖励。 | 待补充，禁入奖励 | 奖励候选逐张升级与无伤结算记录 | `lava_lamp.png`<br>62×80；5447 B |
| 146 | [三角铃鼓](https://sts2.huijiwiki.com/wiki/%E4%B8%89%E8%A7%92%E9%93%83%E9%BC%93)<br>`ringing_triangle` | 通用 | 商店 | — | 在每场战斗的第一回合保留你的手牌。 | 已接入，待实机 | firstTurnRetain=true | `ringing_triangle.png`<br>80×81；6181 B |
| 147 | [神秘打火机](https://sts2.huijiwiki.com/wiki/%E7%A5%9E%E7%A7%98%E6%89%93%E7%81%AB%E6%9C%BA)<br>`mystic_lighter` | 通用 | 商店 | — | 有附魔的攻击牌额外造成9点伤害。 | 待补充，禁入奖励 | STS2 附魔系统（现有词缀不是网页附魔） | `mystic_lighter.png`<br>72×78；6646 B |
| 148 | [算盘](https://sts2.huijiwiki.com/wiki/%E7%AE%97%E7%9B%98)<br>`the_abacus` | 通用 | 商店 | — | 你每次将抽牌堆洗牌时，获得6点格挡。 | 已接入，待实机 | shuffleBlock=6 | `the_abacus.png`<br>80×65；7153 B |
| 149 | [王室印章](https://sts2.huijiwiki.com/wiki/%E7%8E%8B%E5%AE%A4%E5%8D%B0%E7%AB%A0)<br>`royal_stamp` | 通用 | 商店 | — | 拾起时，从牌组中选择一张攻击牌或技能牌，为它附魔：王室认证。 | 待补充，禁入奖励 | 王室认证附魔 | `royal_stamp.png`<br>59×80；5318 B |
| 150 | [微型帐篷](https://sts2.huijiwiki.com/wiki/%E5%BE%AE%E5%9E%8B%E5%B8%90%E7%AF%B7)<br>`miniature_tent` | 通用 | 商店 | — | 你可以在休息处选择任意数量的选项。 | 梦三适配，待实机 | 每个休息选项可各选择一次，直至选择离开；不允许无限重复同一选项。 | `miniature_tent.png`<br>81×76；6993 B |
| 151 | [星系仪](https://sts2.huijiwiki.com/wiki/%E6%98%9F%E7%B3%BB%E4%BB%AA)<br>`orrery` | 通用 | 商店 | — | 拾起时，获得5次卡牌奖励 | 已接入，待实机 | cardChoices=5 | `orrery.png`<br>81×80；8419 B |
| 152 | [腰带扣](https://sts2.huijiwiki.com/wiki/%E8%85%B0%E5%B8%A6%E6%89%A3)<br>`belt_buckle` | 通用 | 商店 | — | 当你没有药水时，你额外拥有2点敏捷。 | 待补充，禁入奖励 | 可使用的药水系统 | `belt_buckle.png`<br>77×63；7132 B |
| 153 | [勇气投石索](https://sts2.huijiwiki.com/wiki/%E5%8B%87%E6%B0%94%E6%8A%95%E7%9F%B3%E7%B4%A2)<br>`sling_of_courage` | 通用 | 商店 | — | 在与精英敌人战斗时，获得2点力量。 | 已接入，待实机 | eliteOpeningStrength=2 | `sling_of_courage.png`<br>81×77；6202 B |
| 154 | [幽灵种子](https://sts2.huijiwiki.com/wiki/%E5%B9%BD%E7%81%B5%E7%A7%8D%E5%AD%90)<br>`ghost_seed` | 通用 | 商店 | — | 打击和防御获得虚无。 | 待补充，禁入奖励 | 尚缺效果接口：starterVoid | `ghost_seed.png`<br>71×78；7167 B |
| 155 | [羽翼护符](https://sts2.huijiwiki.com/wiki/%E7%BE%BD%E7%BF%BC%E6%8A%A4%E7%AC%A6)<br>`wing_charm` | 通用 | 商店 | — | 每次卡牌奖励中，都会有随机一张牌被附魔：迅捷1。 | 待补充，禁入奖励 | 迅捷附魔 | `wing_charm.png`<br>76×76；7790 B |
| 156 | [硫磺](https://sts2.huijiwiki.com/wiki/%E7%A1%AB%E7%A3%BA)<br>`brimstone` | 铁甲战士 | 商店 | — | 在你的每个回合开始时，你获得2点力量，所有敌人获得1点力量。 | 待补充，禁入奖励 | 尚缺效果接口：turnStrength、enemyTurnStrength | `brimstone.png`<br>79×72；7533 B |
| 157 | [忍术卷轴](https://sts2.huijiwiki.com/wiki/%E5%BF%8D%E6%9C%AF%E5%8D%B7%E8%BD%B4)<br>`ninja_scroll` | 静默猎手 | 商店 | — | 每场战斗开始时，将3张小刀加入你的手牌。 | 待补充，禁入奖励 | 小刀牌与静默猎手牌组 | `ninja_scroll.png`<br>78×79；8733 B |
| 158 | [维特鲁威仆从](https://sts2.huijiwiki.com/wiki/%E7%BB%B4%E7%89%B9%E9%B2%81%E5%A8%81%E4%BB%86%E4%BB%8E)<br>`vitruvian_minion` | 储君 | 商店 | — | 名字中有“仆从”的卡牌造成双倍的伤害与格挡。 | 待补充，禁入奖励 | 仆从牌与储君牌组 | `vitruvian_minion.png`<br>81×81；9816 B |
| 159 | [不死符文](https://sts2.huijiwiki.com/wiki/%E4%B8%8D%E6%AD%BB%E7%AC%A6%E6%96%87)<br>`undying_sigil` | 亡灵契约师 | 商店 | — | 当敌人的灾厄层数大于等于其生命值时，它造成的伤害降低50%。 | 待补充，禁入奖励 | 灾厄系统 | `undying_sigil.png`<br>78×75；9913 B |
| 160 | [符文电容器](https://sts2.huijiwiki.com/wiki/%E7%AC%A6%E6%96%87%E7%94%B5%E5%AE%B9%E5%99%A8)<br>`runic_capacitor` | 故障机器人 | 商店 | — | 每场战斗开始时，获得3个额外充能球栏位。 | 待补充，禁入奖励 | 充能球系统 | `runic_capacitor.png`<br>79×80；6900 B |
| 161 | [奥术卷轴](https://sts2.huijiwiki.com/wiki/%E5%A5%A5%E6%9C%AF%E5%8D%B7%E8%BD%B4)<br>`arcane_scroll` | 通用 | 先古之民 | 涅奥 | 拾起时，将一张随机稀有牌加入你的牌组。 | 已接入，待实机 | gainRandomRarity="rare" | `arcane_scroll.png`<br>80×79；6664 B |
| 162 | [白银熔炉](https://sts2.huijiwiki.com/wiki/%E7%99%BD%E9%93%B6%E7%86%94%E7%82%89)<br>`silver_crucible` | 通用 | 先古之民 | 涅奥 | 你遇到的前3次卡牌奖励将是被升级过的。你打开的第一个宝箱将是空的 | 待补充，禁入奖励 | 前三次卡牌奖励升级和空宝箱流程 | `silver_crucible.png`<br>74×79；9964 B |
| 163 | [沉重石板](https://sts2.huijiwiki.com/wiki/%E6%B2%89%E9%87%8D%E7%9F%B3%E6%9D%BF)<br>`hefty_tablet` | 通用 | 先古之民 | 涅奥 | 拾起时，从3张稀有牌中选择1张加入你的牌组，同时将1张受伤加入你的牌组。 | 已接入，待实机 | cardChoices=1；cardChoiceRarity="rare"；addCards=["mengsan_wound_shuying"] | `hefty_tablet.png`<br>79×80；9092 B |
| 164 | [橙型香盒](https://sts2.huijiwiki.com/wiki/%E6%A9%99%E5%9E%8B%E9%A6%99%E7%9B%92)<br>`pomander` | 通用 | 先古之民 | 涅奥 | 拾起时，升级一张牌。 | 已接入，待实机 | choice="upgrade"；choiceCount=1 | `pomander.png`<br>72×80；5863 B |
| 165 | [钓鱼竿](https://sts2.huijiwiki.com/wiki/%E9%92%93%E9%B1%BC%E7%AB%BF)<br>`fishing_rod` | 通用 | 先古之民 | 涅奥 | 每3场普通战斗，随机升级你牌组中的一张牌。 | 已接入，待实机 | normalBattleUpgradeEvery=3 | `fishing_rod.png`<br>79×81；5623 B |
| 166 | [轰鸣海螺](https://sts2.huijiwiki.com/wiki/%E8%BD%B0%E9%B8%A3%E6%B5%B7%E8%9E%BA)<br>`booming_conch` | 通用 | 先古之民 | 涅奥 | 在精英战的战斗开始时，额外抽2张牌并获得[能量]。 | 已接入，待实机 | eliteOpeningDraw=2；eliteFirstTurnEnergy=1 | `booming_conch.png`<br>79×79；9466 B |
| 167 | [华美发束](https://sts2.huijiwiki.com/wiki/%E5%8D%8E%E7%BE%8E%E5%8F%91%E6%9D%9F)<br>`silken_tress` | 通用 | 先古之民 | 涅奥 | 拾起时，失去所有金币。为第一次卡牌奖励中的所有牌附魔：华彩。 | 待补充，禁入奖励 | 华彩附魔 | `silken_tress.png`<br>80×79；6040 B |
| 168 | [金色珍珠](https://sts2.huijiwiki.com/wiki/%E9%87%91%E8%89%B2%E7%8F%8D%E7%8F%A0)<br>`golden_pearl` | 通用 | 先古之民 | 涅奥 | 拾起时，获得150金币。 | 已接入，待实机 | gainGold=150 | `golden_pearl.png`<br>78×79；8246 B |
| 169 | [精准剪刀](https://sts2.huijiwiki.com/wiki/%E7%B2%BE%E5%87%86%E5%89%AA%E5%88%80)<br>`precise_scissors` | 通用 | 先古之民 | 涅奥 | 拾起时，从你的牌组中移除1张牌。 | 已接入，待实机 | choice="remove"；choiceCount=1 | `precise_scissors.png`<br>81×76；6160 B |
| 170 | [巨大卷轴](https://sts2.huijiwiki.com/wiki/%E5%B7%A8%E5%A4%A7%E5%8D%B7%E8%BD%B4)<br>`massive_scroll` | 通用 | 先古之民 | 涅奥 | 拾起时，从3张多人游戏牌中选择1张加入你的牌组。 | 待补充，禁入奖励 | 多人游戏牌池 | `massive_scroll.png`<br>81×78；7672 B |
| 171 | [巨大扭蛋](https://sts2.huijiwiki.com/wiki/%E5%B7%A8%E5%A4%A7%E6%89%AD%E8%9B%8B)<br>`large_capsule` | 通用 | 先古之民 | 涅奥 | 拾起时，获得2件随机遗物。额外将一对打击和防御，加入你的牌组。 | 已接入，待实机 | randomRelics=2；addStarters=true | `large_capsule.png`<br>79×79；8368 B |
| 172 | [卷轴箱](https://sts2.huijiwiki.com/wiki/%E5%8D%B7%E8%BD%B4%E7%AE%B1)<br>`scroll_boxes` | 通用 | 先古之民 | 涅奥 | 拾起时，从2个卡牌包中选择1包加入你的牌组。 | 待补充，禁入奖励 | 网页指定卡牌包 | `scroll_boxes.png`<br>80×80；8801 B |
| 173 | [涅奥的护符](https://sts2.huijiwiki.com/wiki/%E6%B6%85%E5%A5%A5%E7%9A%84%E6%8A%A4%E7%AC%A6)<br>`neows_talisman` | 通用 | 先古之民 | 涅奥 | 拾起时，升级你的1张打击和1张防御。 | 已接入，待实机 | upgradeStarters=true | `neows_talisman.png`<br>68×79；7091 B |
| 174 | [涅奥的苦痛](https://sts2.huijiwiki.com/wiki/%E6%B6%85%E5%A5%A5%E7%9A%84%E8%8B%A6%E7%97%9B)<br>`neows_torment` | 通用 | 先古之民 | 涅奥 | 拾起时，将1张涅奥之怒加入你的牌组。 | 已接入，待实机 | addCards=["mengsan_event_neows_fury"] | `neows_torment.png`<br>80×79；10310 B |
| 175 | [涅奥骨骰](https://sts2.huijiwiki.com/wiki/%E6%B6%85%E5%A5%A5%E9%AA%A8%E9%AA%B0)<br>`neows_bones` | 通用 | 先古之民 | 涅奥 | 拾起时，获得2件随机涅奥遗物。将1张随机诅咒加入你的牌组。 | 已接入，待实机 | randomRelics=2；randomRelicAncient="涅奥"；randomCurse=1 | `neows_bones.png`<br>80×80；7057 B |
| 176 | [铅制镇纸](https://sts2.huijiwiki.com/wiki/%E9%93%85%E5%88%B6%E9%95%87%E7%BA%B8)<br>`lead_paperweight` | 通用 | 先古之民 | 涅奥 | 拾起时，从2张无色牌中选择1张加入你的牌组。 | 已接入，待实机 | cardChoices=1；cardChoicePack="colorless"；choiceOfferCount=2 | `lead_paperweight.png`<br>79×64；8083 B |
| 177 | [熔岩石](https://sts2.huijiwiki.com/wiki/%E7%86%94%E5%B2%A9%E7%9F%B3)<br>`lava_rock` | 通用 | 先古之民 | 涅奥 | 第一阶段的Boss敌人额外掉落2件遗物。 | 已接入，待实机 | actOneBossRelics=2 | `lava_rock.png`<br>79×79；9918 B |
| 178 | [失物盒](https://sts2.huijiwiki.com/wiki/%E5%A4%B1%E7%89%A9%E7%9B%92)<br>`lost_coffer` | 通用 | 先古之民 | 涅奥 | 拾起时，获得1次卡牌奖励和1瓶随机药水。 | 待补充，禁入奖励 | 药水奖励系统 | `lost_coffer.png`<br>79×72；8032 B |
| 179 | [石炉加湿器](https://sts2.huijiwiki.com/wiki/%E7%9F%B3%E7%82%89%E5%8A%A0%E6%B9%BF%E5%99%A8)<br>`stone_humidifier` | 通用 | 先古之民 | 涅奥 | 每当你在休息处休息时，将你的最大生命值提升5点。 | 已接入，待实机 | restMaxHp=5 | `stone_humidifier.png`<br>79×77；9221 B |
| 180 | [树叶药膏](https://sts2.huijiwiki.com/wiki/%E6%A0%91%E5%8F%B6%E8%8D%AF%E8%86%8F)<br>`leafy_poultice` | 通用 | 先古之民 | 涅奥 | 拾起时，变化你的1张打击和1张防御，然后失去12点最大生命。 | 已接入，待实机 | transformStarters=true；maxHp=-12 | `leafy_poultice.png`<br>79×79；8769 B |
| 181 | [松动羊毛剪](https://sts2.huijiwiki.com/wiki/%E6%9D%BE%E5%8A%A8%E7%BE%8A%E6%AF%9B%E5%89%AA)<br>`precarious_shears` | 通用 | 先古之民 | 涅奥 | 拾起时，从你的牌组中移除2张牌并失去16点生命。 | 梦三适配，待实机 | 选牌后扣除16点生命；当前地图流程保留至少1点生命，待补充非战斗死亡结算。 | `precarious_shears.png`<br>81×81；5004 B |
| 182 | [万花筒](https://sts2.huijiwiki.com/wiki/%E4%B8%87%E8%8A%B1%E7%AD%92)<br>`kaleidoscope` | 通用 | 先古之民 | 涅奥 | 拾起时，获得2次来自其他角色的卡牌奖励。 | 待补充，禁入奖励 | 其他四角色牌组 | `kaleidoscope.png`<br>78×79；7365 B |
| 183 | [小型扭蛋](https://sts2.huijiwiki.com/wiki/%E5%B0%8F%E5%9E%8B%E6%89%AD%E8%9B%8B)<br>`small_capsule` | 通用 | 先古之民 | 涅奥 | 拾起时，获得一件随机遗物。 | 已接入，待实机 | randomRelics=1 | `small_capsule.png`<br>66×73；7306 B |
| 184 | [新叶](https://sts2.huijiwiki.com/wiki/%E6%96%B0%E5%8F%B6)<br>`new_leaf` | 通用 | 先古之民 | 涅奥 | 拾起时，变化1张牌。 | 已接入，待实机 | choice="transform"；choiceCount=1 | `new_leaf.png`<br>76×78；7802 B |
| 185 | [药瓶皮套](https://sts2.huijiwiki.com/wiki/%E8%8D%AF%E7%93%B6%E7%9A%AE%E5%A5%97)<br>`phial_holster` | 通用 | 先古之民 | 涅奥 | 拾起时，获得1个药水栏位并获得2瓶随机药水。 | 待补充，禁入奖励 | 药水系统 | `phial_holster.png`<br>77×80；7794 B |
| 186 | [营养牡蛎](https://sts2.huijiwiki.com/wiki/%E8%90%A5%E5%85%BB%E7%89%A1%E8%9B%8E)<br>`nutritious_oyster` | 通用 | 先古之民 | 涅奥 | 拾起时，将你的最大生命值提升11。 | 已接入，待实机 | maxHp=11 | `nutritious_oyster.png`<br>79×78；7897 B |
| 187 | [羽翼之靴](https://sts2.huijiwiki.com/wiki/%E7%BE%BD%E7%BF%BC%E4%B9%8B%E9%9D%B4)<br>`winged_boots` | 通用 | 先古之民 | 涅奥 | 你在选择下一层的房间时有3次机会可以无视当前的路线。 | 待补充，禁入奖励 | 路线越界选择和次数确认 | `winged_boots.png`<br>77×80；6578 B |
| 188 | [诅咒珍珠](https://sts2.huijiwiki.com/wiki/%E8%AF%85%E5%92%92%E7%8F%8D%E7%8F%A0)<br>`cursed_pearl` | 通用 | 先古之民 | 涅奥 | 拾起时，获得一张贪婪，获得333金币。 | 已接入，待实机 | addCards=["mengsan_curse_greed"]；gainGold=333 | `cursed_pearl.png`<br>80×77；7285 B |
| 189 | [玻璃眼珠](https://sts2.huijiwiki.com/wiki/%E7%8E%BB%E7%92%83%E7%9C%BC%E7%8F%A0)<br>`glass_eye` | 通用 | 先古之民 | 欧洛巴斯 | 拾起时，获得2组普通、2组罕见、和1组稀有卡牌奖励。 | 已接入，待实机 | cardChoiceRarities=["common","common","uncommon","uncommon","rare"] | `glass_eye.png`<br>71×71；6006 B |
| 190 | [发光珍珠](https://sts2.huijiwiki.com/wiki/%E5%8F%91%E5%85%89%E7%8F%8D%E7%8F%A0)<br>`radiant_pearl` | 通用 | 先古之民 | 欧洛巴斯 | 在每场战斗开始时，将1张冷光加入你的手牌。 | 待补充，禁入奖励 | 尚缺网页对应卡牌：mengsan_event_glow | `radiant_pearl.png`<br>74×77；7698 B |
| 191 | [放电异虾](https://sts2.huijiwiki.com/wiki/%E6%94%BE%E7%94%B5%E5%BC%82%E8%99%BE)<br>`electric_shrymp` | 通用 | 先古之民 | 欧洛巴斯 | 拾起时，选择一张技能牌为它附魔：注能。 | 待补充，禁入奖励 | 注能附魔 | `electric_shrymp.png`<br>77×77；8709 B |
| 192 | [浮木](https://sts2.huijiwiki.com/wiki/%E6%B5%AE%E6%9C%A8)<br>`driftwood` | 通用 | 先古之民 | 欧洛巴斯 | 你可以在每一个卡牌奖励中重掷一次。 | 待补充，禁入奖励 | 独立奖励重掷流程 | `driftwood.png`<br>76×79；6988 B |
| 193 | [古老牙齿](https://sts2.huijiwiki.com/wiki/%E5%8F%A4%E8%80%81%E7%89%99%E9%BD%BF)<br>`archaic_tooth` | 通用 | 先古之民 | 欧洛巴斯 | 拾起时，将一张初始卡牌变化为先古版本。 | 待补充，禁入奖励 | 先古版本初始牌对应表 | `archaic_tooth.png`<br>81×78；7478 B |
| 194 | [海玻璃](https://sts2.huijiwiki.com/wiki/%E6%B5%B7%E7%8E%BB%E7%92%83)<br>`sea_glass` | 通用 | 先古之民 | 欧洛巴斯 | 查看15张来自其他角色的牌。从中选择任意数量的卡牌加入你的牌组。 | 待补充，禁入奖励 | 其他四角色牌组 | `sea_glass.png`<br>79×67；6380 B |
| 195 | [棱彩宝石](https://sts2.huijiwiki.com/wiki/%E6%A3%B1%E5%BD%A9%E5%AE%9D%E7%9F%B3)<br>`prismatic_gem` | 通用 | 先古之民 | 欧洛巴斯 | 在每个回合开始时获得[能量]。卡牌奖励现在会包含其他颜色的卡牌。 | 待补充，禁入奖励 | 其他四角色牌组 | `prismatic_gem.png`<br>81×71；7194 B |
| 196 | [炼金箱](https://sts2.huijiwiki.com/wiki/%E7%82%BC%E9%87%91%E7%AE%B1)<br>`alchemical_coffer` | 通用 | 先古之民 | 欧洛巴斯 | 拾起时，获得4个放有随机药水的药水栏位。 | 待补充，禁入奖励 | 可使用的药水系统 | `alchemical_coffer.png`<br>80×80；9259 B |
| 197 | [欧洛巴斯之触](https://sts2.huijiwiki.com/wiki/%E6%AC%A7%E6%B4%9B%E5%B7%B4%E6%96%AF%E4%B9%8B%E8%A7%A6)<br>`touch_of_orobas` | 通用 | 先古之民 | 欧洛巴斯 | 拾起时，将你的初始遗物替换为先古版本。 | 待补充，禁入奖励 | 初始遗物配置与替换选择 | `touch_of_orobas.png`<br>69×74；6276 B |
| 198 | [沙堡](https://sts2.huijiwiki.com/wiki/%E6%B2%99%E5%A0%A1)<br>`sand_castle` | 通用 | 先古之民 | 欧洛巴斯 | 拾起时，随机升级6张牌。 | 已接入，待实机 | gainUpgrade=6 | `sand_castle.png`<br>79×79；7105 B |
| 199 | [佩尔的士兵](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E7%9A%84%E5%A3%AB%E5%85%B5)<br>`paels_legion` | 通用 | 先古之民 | 佩尔 | 将你从一张卡牌中获得的格挡翻倍，然后此遗物会休眠2回合。 | 待补充，禁入奖励 | 尚缺效果接口：cardBlockDoubleCooldown | `paels_legion.png`<br>81×71；7283 B |
| 200 | [佩尔的增生组织](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E7%9A%84%E5%A2%9E%E7%94%9F%E7%BB%84%E7%BB%87)<br>`paels_growth` | 通用 | 先古之民 | 佩尔 | 拾起时，从牌组中选择一张牌，为其附魔：克隆。 | 待补充，禁入奖励 | 克隆附魔 | `paels_growth.png`<br>76×81；6822 B |
| 201 | [佩尔之角](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E8%A7%92)<br>`paels_horn` | 通用 | 先古之民 | 佩尔 | 拾起时，将2张放松加入你的牌组。 | 已接入，待实机 | addCards=["mengsan_event_relax","mengsan_event_relax"] | `paels_horn.png`<br>81×70；5595 B |
| 202 | [佩尔之泪](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E6%B3%AA)<br>`paels_tears` | 通用 | 先古之民 | 佩尔 | 如果你在拥有未花费的[能量]情况下结束回合，则下个回合额外获得[能量][能量]。 | 已接入，待实机 | unspentNextEnergy=2 | `paels_tears.png`<br>76×79；7590 B |
| 203 | [佩尔之肉](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E8%82%89)<br>`paels_flesh` | 通用 | 先古之民 | 佩尔 | 从你的第3回合开始，在回合开始时额外获得[能量]。 | 已接入，待实机 | fromTurn=3；turnEnergy=1 | `paels_flesh.png`<br>83×82；7830 B |
| 204 | [佩尔之血](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E8%A1%80)<br>`paels_blood` | 通用 | 先古之民 | 佩尔 | 在你的回合开始时，额外抽1张牌 | 已接入，待实机 | turnDraw=1 | `paels_blood.png`<br>81×77；7744 B |
| 205 | [佩尔之牙](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E7%89%99)<br>`paels_tooth` | 通用 | 先古之民 | 佩尔 | 拾起时，从你的牌组中选择5张牌移除。在每场战斗结束时，将其中随机1张牌升级然后返还。 | 已接入，待实机 | choice="store"；choiceCount=5；returnStored=true | `paels_tooth.png`<br>69×79；5939 B |
| 206 | [佩尔之眼](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E7%9C%BC)<br>`paels_eye` | 通用 | 先古之民 | 佩尔 | 你在每场战斗中第一次没有打出任何牌就结束回合时，消耗所有手牌然后进行一个额外回合。 | 待补充，禁入奖励 | 尚缺效果接口：noCardsExtraTurn | `paels_eye.png`<br>73×73；5024 B |
| 207 | [佩尔之翼](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E7%BF%BC)<br>`paels_wing` | 通用 | 先古之民 | 佩尔 | 你可以将你的卡牌奖励献祭给佩尔。每献祭2次，就能获得一件遗物。 | 待补充，禁入奖励 | 奖励献祭流程 | `paels_wing.png`<br>83×78；7217 B |
| 208 | [佩尔之爪](https://sts2.huijiwiki.com/wiki/%E4%BD%A9%E5%B0%94%E4%B9%8B%E7%88%AA)<br>`paels_claw` | 通用 | 先古之民 | 佩尔 | 拾起时，为所有的“防御”附魔：黏糊。 | 待补充，禁入奖励 | 黏糊附魔 | `paels_claw.png`<br>75×81；4364 B |
| 209 | [大～抱抱](https://sts2.huijiwiki.com/wiki/%E5%A4%A7%EF%BD%9E%E6%8A%B1%E6%8A%B1)<br>`biiig_hug` | 通用 | 先古之民 | 特兹卡塔拉 | 拾起时，从你的牌组中移除4张牌。每当你的抽牌堆打乱洗牌时，将一张煤灰加入你的抽牌堆。 | 待补充，禁入奖励 | 尚缺效果接口：shuffleCard | `biiig_hug.png`<br>79×79；8590 B |
| 210 | [故事书](https://sts2.huijiwiki.com/wiki/%E6%95%85%E4%BA%8B%E4%B9%A6)<br>`storybook` | 通用 | 先古之民 | 特兹卡塔拉 | 拾起时，将1张至亮之焰添加到你的牌组中。 | 已接入，待实机 | addCards=["mengsan_event_brightest_flame"] | `storybook.png`<br>73×77；6422 B |
| 211 | [烘焙手套](https://sts2.huijiwiki.com/wiki/%E7%83%98%E7%84%99%E6%89%8B%E5%A5%97)<br>`toasty_mittens` | 通用 | 先古之民 | 特兹卡塔拉 | 在你的回合开始时，消耗你抽牌堆顶部的牌并获得1点力量。 | 待补充，禁入奖励 | 尚缺效果接口：exhaustTopStrength | `toasty_mittens.png`<br>81×77；7792 B |
| 212 | [黄金罗盘](https://sts2.huijiwiki.com/wiki/%E9%BB%84%E9%87%91%E7%BD%97%E7%9B%98)<br>`golden_compass` | 通用 | 先古之民 | 特兹卡塔拉 | 拾起时，将第2阶段的地图替换为一条特殊的直道。 | 待补充，禁入奖励 | 第二章特殊直道地图数据 | `golden_compass.png`<br>78×73；8894 B |
| 213 | [黄金印](https://sts2.huijiwiki.com/wiki/%E9%BB%84%E9%87%91%E5%8D%B0)<br>`seal_of_gold` | 通用 | 先古之民 | 特兹卡塔拉 | 在你的回合开始时，花费5金币来获得[能量]。 | 已接入，待实机 | paidTurnEnergy=1；paidTurnGold=5 | `seal_of_gold.png`<br>77×78；7204 B |
| 214 | [美味饼干](https://sts2.huijiwiki.com/wiki/%E7%BE%8E%E5%91%B3%E9%A5%BC%E5%B9%B2)<br>`yummy_cookie` | 通用 | 先古之民 | 特兹卡塔拉 | 拾起时，升级4张牌。 | 已接入，待实机 | gainUpgrade=4 | `yummy_cookie_ironclad.png`<br>79×74；8499 B |
| 215 | [南瓜蜡烛](https://sts2.huijiwiki.com/wiki/%E5%8D%97%E7%93%9C%E8%9C%A1%E7%83%9B)<br>`pumpkin_candle` | 通用 | 先古之民 | 特兹卡塔拉 | 在每个回合开始时获得[能量]。这件遗物会在5场战斗后熄灭。可以在休息处为其添火。 | 已接入，待实机 | candleEnergy=1；candleBattles=5；restAction="rekindle" | `pumpkin_candle.png`<br>81×76；7532 B |
| 216 | [烫嘴可可](https://sts2.huijiwiki.com/wiki/%E7%83%AB%E5%98%B4%E5%8F%AF%E5%8F%AF)<br>`very_hot_cocoa` | 通用 | 先古之民 | 特兹卡塔拉 | 在每场战斗的第一回合额外获得[能量][能量][能量][能量]。 | 已接入，待实机 | firstTurnEnergy=4 | `very_hot_cocoa.png`<br>81×80；7690 B |
| 217 | [玩具盒](https://sts2.huijiwiki.com/wiki/%E7%8E%A9%E5%85%B7%E7%9B%92)<br>`toy_box` | 通用 | 先古之民 | 特兹卡塔拉 | 拾起时，获得4件蜡制遗物。每经过3场战斗，你最左侧的蜡制遗物将会融化。 | 待补充，禁入奖励 | 蜡制遗物名单与融化规则 | `toy_box.png`<br>82×78；8576 B |
| 218 | [营养汤](https://sts2.huijiwiki.com/wiki/%E8%90%A5%E5%85%BB%E6%B1%A4)<br>`nutritious_soup` | 通用 | 先古之民 | 特兹卡塔拉 | 拾起时，为你牌组中的所有“打击”附魔：特兹卡塔拉的余烬 | 待补充，禁入奖励 | 特兹卡塔拉的余烬附魔 | `nutritious_soup.png`<br>80×73；8375 B |
| 219 | [布质果实](https://sts2.huijiwiki.com/wiki/%E5%B8%83%E8%B4%A8%E6%9E%9C%E5%AE%9E)<br>`looming_fruit` | 通用 | 先古之民 | 诺奴佩普 | 拾起时，将你的最大生命值提升31。 | 已接入，待实机 | maxHp=31 | `looming_fruit_2.png`<br>80×78；8357 B |
| 220 | [赐福鹿角](https://sts2.huijiwiki.com/wiki/%E8%B5%90%E7%A6%8F%E9%B9%BF%E8%A7%92)<br>`blessed_antler` | 通用 | 先古之民 | 诺奴佩普 | 在每回合开始时获得[能量]。在战斗开始时，将3张晕眩放入你的抽牌堆。 | 已接入，待实机 | turnEnergy=1；openingDrawCards=["mengsan_dazed_shuying","mengsan_dazed_shuying","mengsan_dazed_shuying"] | `blessed_antler.png`<br>77×80；8151 B |
| 221 | [华美手镯](https://sts2.huijiwiki.com/wiki/%E5%8D%8E%E7%BE%8E%E6%89%8B%E9%95%AF)<br>`beautiful_bracelet` | 通用 | 先古之民 | 诺奴佩普 | 拾起时，从你的牌组中选择3张牌，附魔：迅捷3。 | 待补充，禁入奖励 | 迅捷附魔 | `beautiful_bracelet.png`<br>79×78；7662 B |
| 222 | [娇嫩蕨草](https://sts2.huijiwiki.com/wiki/%E5%A8%87%E5%AB%A9%E8%95%A8%E8%8D%89)<br>`delicate_frond` | 通用 | 先古之民 | 诺奴佩普 | 在每场战斗开始时，用随机药水将你的空药水栏位填满。 | 待补充，禁入奖励 | 药水系统 | `delicate_frond.png`<br>79×77；6737 B |
| 223 | [亮片](https://sts2.huijiwiki.com/wiki/%E4%BA%AE%E7%89%87)<br>`glitter` | 通用 | 先古之民 | 诺奴佩普 | 为之后的所有卡牌奖励附魔：华彩。 | 待补充，禁入奖励 | 华彩附魔 | `glitter.png`<br>81×80；8304 B |
| 224 | [皮草大衣](https://sts2.huijiwiki.com/wiki/%E7%9A%AE%E8%8D%89%E5%A4%A7%E8%A1%A3)<br>`fur_coat` | 通用 | 先古之民 | 诺奴佩普 | 拾起时，随机标记7处战斗。这些战斗中的敌人将只有1点生命。 | 待补充，禁入奖励 | 尚缺效果接口：markBattles | `fur_coat.png`<br>81×80；10183 B |
| 225 | [图章戒指](https://sts2.huijiwiki.com/wiki/%E5%9B%BE%E7%AB%A0%E6%88%92%E6%8C%87)<br>`signet_ring` | 通用 | 先古之民 | 诺奴佩普 | 拾起时，获得999金币。 | 已接入，待实机 | gainGold=999 | `signet_ring.png`<br>63×80；6190 B |
| 226 | [艳丽围巾](https://sts2.huijiwiki.com/wiki/%E8%89%B3%E4%B8%BD%E5%9B%B4%E5%B7%BE)<br>`brilliant_scarf` | 通用 | 先古之民 | 诺奴佩普 | 你每回合从你的手牌打出的第5张牌可以被免费打出。 | 已接入，待实机 | fifthCardFree=true | `brilliant_scarf.png`<br>79×79；7458 B |
| 227 | [珠宝盒](https://sts2.huijiwiki.com/wiki/%E7%8F%A0%E5%AE%9D%E7%9B%92)<br>`jewelry_box` | 通用 | 先古之民 | 诺奴佩普 | 拾起时，将1张神化加入你的牌组。 | 已接入，待实机 | addCards=["mengsan_event_apotheosis"] | `jewelry_box.png`<br>79×68；7348 B |
| 228 | [钻石头冠](https://sts2.huijiwiki.com/wiki/%E9%92%BB%E7%9F%B3%E5%A4%B4%E5%86%A0)<br>`diamond_diadem` | 通用 | 先古之民 | 诺奴佩普 | 如果你在本回合打出的牌少于等于2张，则受到敌人的伤害减半。 | 待补充，禁入奖励 | 尚缺效果接口：fewCardsHalfDamage | `diamond_diadem.png`<br>77×63；6007 B |
| 229 | [钗](https://sts2.huijiwiki.com/wiki/%E9%92%97)<br>`sai` | 通用 | 先古之民 | 坦克斯 | 在你的回合开始时，获得7点格挡。 | 已接入，待实机 | turnBlock=7 | `sai.png`<br>78×81；5600 B |
| 230 | [带刺手甲](https://sts2.huijiwiki.com/wiki/%E5%B8%A6%E5%88%BA%E6%89%8B%E7%94%B2)<br>`spiked_gauntlets` | 通用 | 先古之民 | 坦克斯 | 在每回合开始时获得[能量]。能力牌的耗能增加1[能量]。 | 已接入，待实机 | turnEnergy=1；powerTax=1 | `spiked_gauntlets.png`<br>75×80；8148 B |
| 231 | [利爪](https://sts2.huijiwiki.com/wiki/%E5%88%A9%E7%88%AA)<br>`claws` | 通用 | 先古之民 | 坦克斯 | 拾起时，将至多6张牌变化为撕咬。 | 已接入，待实机 | choice="bite"；choiceCount=6；optionalChoices=true | `claws.png`<br>75×80；5630 B |
| 232 | [切肉刀](https://sts2.huijiwiki.com/wiki/%E5%88%87%E8%82%89%E5%88%80)<br>`meat_cleaver` | 通用 | 先古之民 | 坦克斯 | 你可以在休息处进行烹饪。 | 梦三适配，待实机 | 网页没有烹饪细则；暂定每次烹饪最大生命+5，待用户确认。 | `meat_cleaver.png`<br>82×80；4243 B |
| 233 | [三刃回旋镖](https://sts2.huijiwiki.com/wiki/%E4%B8%89%E5%88%83%E5%9B%9E%E6%97%8B%E9%95%96)<br>`tri_boomerang` | 通用 | 先古之民 | 坦克斯 | 从你的牌组中选择3张攻击牌。为这些牌附魔：本能。 | 待补充，禁入奖励 | 本能附魔（不可替换成现有固有词缀） | `tri_boomerang.png`<br>78×81；5666 B |
| 234 | [十字弓](https://sts2.huijiwiki.com/wiki/%E5%8D%81%E5%AD%97%E5%BC%93)<br>`crossbow` | 通用 | 先古之民 | 坦克斯 | 在你的回合开始时，将一张随机攻击牌加入你的手牌。这张牌在本回合可以免费打出。 | 待补充，禁入奖励 | 尚缺效果接口：turnRandomAttack | `crossbow.png`<br>81×62；7310 B |
| 235 | [坦克斯的哨子](https://sts2.huijiwiki.com/wiki/%E5%9D%A6%E5%85%8B%E6%96%AF%E7%9A%84%E5%93%A8%E5%AD%90)<br>`tanxs_whistle` | 通用 | 先古之民 | 坦克斯 | 拾起时，将1张吹哨加入你的牌组。 | 已接入，待实机 | addCards=["mengsan_event_whistle"] | `tanxs_whistle.png`<br>80×81；6009 B |
| 236 | [铁棒](https://sts2.huijiwiki.com/wiki/%E9%93%81%E6%A3%92)<br>`iron_club` | 通用 | 先古之民 | 坦克斯 | 你每打出4张牌，就抽1张牌。 | 已接入，待实机 | cardDrawEvery=4 | `iron_club.png`<br>76×82；5576 B |
| 237 | [投斧](https://sts2.huijiwiki.com/wiki/%E6%8A%95%E6%96%A7)<br>`throwing_axe` | 通用 | 先古之民 | 坦克斯 | 你在每场战斗中打出的第一张牌会多打出一次。 | 待补充，禁入奖励 | 尚缺效果接口：firstCardEcho | `throwing_axe.png`<br>80×79；5003 B |
| 238 | [战锤](https://sts2.huijiwiki.com/wiki/%E6%88%98%E9%94%A4)<br>`war_hammer` | 通用 | 先古之民 | 坦克斯 | 每当你击败一名精英敌人的时候，随机升级4张牌。 | 已接入，待实机 | eliteUpgrade=4 | `war_hammer.png`<br>80×78；5349 B |
| 239 | [宝石面具](https://sts2.huijiwiki.com/wiki/%E5%AE%9D%E7%9F%B3%E9%9D%A2%E5%85%B7)<br>`jeweled_mask` | 通用 | 先古之民 | 瓦库 | 在每场战斗开始时，将一张随机能力牌从你的抽牌堆放入你的手牌，这张牌在本场战斗可以免费打出。 | 待补充，禁入奖励 | 尚缺效果接口：openingFetchPower | `jeweled_mask.png`<br>80×73；7835 B |
| 240 | [低语耳环](https://sts2.huijiwiki.com/wiki/%E4%BD%8E%E8%AF%AD%E8%80%B3%E7%8E%AF)<br>`whispering_earring` | 通用 | 先古之民 | 瓦库 | 在每个回合开始时，获得[能量]。瓦库将接管你的第一回合。 | 待补充，禁入奖励 | 瓦库接管第一回合的行动规则 | `whispering_earring.png`<br>81×81；7993 B |
| 241 | [领主阳伞](https://sts2.huijiwiki.com/wiki/%E9%A2%86%E4%B8%BB%E9%98%B3%E4%BC%9E)<br>`lords_parasol` | 通用 | 先古之民 | 瓦库 | 当你遇见商人时，立刻获得他所出售的所有物品。 | 待补充，禁入奖励 | 尚未接入此效果 | `lords_parasol.png`<br>81×81；7980 B |
| 242 | [小提琴](https://sts2.huijiwiki.com/wiki/%E5%B0%8F%E6%8F%90%E7%90%B4)<br>`fiddle` | 通用 | 先古之民 | 瓦库 | 在每个回合开始时，额外抽2张牌。你在回合进行中不再能抽任何牌。 | 待补充，禁入奖励 | 尚缺效果接口：noMidturnDraw | `fiddle.png`<br>80×81；5494 B |
| 243 | [选择悖论](https://sts2.huijiwiki.com/wiki/%E9%80%89%E6%8B%A9%E6%82%96%E8%AE%BA)<br>`choices_paradox` | 通用 | 先古之民 | 瓦库 | 在每场战斗开始时，从5张随机牌中选择1张放入你的手牌。被选中的牌获得保留。 | 待补充，禁入奖励 | 尚缺效果接口：openingChooseRandom、chosenRetain | `choices_paradox.png`<br>84×81；9191 B |
| 244 | [血染玫瑰](https://sts2.huijiwiki.com/wiki/%E8%A1%80%E6%9F%93%E7%8E%AB%E7%91%B0)<br>`blood_soaked_rose` | 通用 | 先古之民 | 瓦库 | 拾起时，将1张执迷加入你的牌组。在回合开始时获得[能量]。 | 已接入，待实机 | turnEnergy=1；addCards=["mengsan_curse_enthralled"] | `blood_soaked_rose.png`<br>73×80；5546 B |
| 245 | [腌制活雾](https://sts2.huijiwiki.com/wiki/%E8%85%8C%E5%88%B6%E6%B4%BB%E9%9B%BE)<br>`preserved_fog` | 通用 | 先古之民 | 瓦库 | 拾起时，从你的牌组中移除3张牌。将一张愚行加入你的牌组。 | 已接入，待实机 | choice="remove"；choiceCount=3；addCards=["mengsan_curse_folly"] | `preserved_fog.png`<br>69×81；8061 B |
| 246 | [音乐盒](https://sts2.huijiwiki.com/wiki/%E9%9F%B3%E4%B9%90%E7%9B%92)<br>`music_box` | 通用 | 先古之民 | 瓦库 | 将你每回合打出的第一张攻击牌的一张虚无复制品加入你的手牌。 | 待补充，禁入奖励 | 尚缺效果接口：firstAttackVoidCopy | `music_box.png`<br>81×81；7966 B |
| 247 | [原初之爪](https://sts2.huijiwiki.com/wiki/%E5%8E%9F%E5%88%9D%E4%B9%8B%E7%88%AA)<br>`sere_talon` | 通用 | 先古之民 | 瓦库 | 拾起时，将2张随机诅咒牌和3张许愿加入你的牌组。 | 已接入，待实机 | randomCurse=2；addCards=["mengsan_event_wish","mengsan_event_wish","mengsan_event_wish"] | `sere_talon.png`<br>81×79；7978 B |
| 248 | [卓越斗篷](https://sts2.huijiwiki.com/wiki/%E5%8D%93%E8%B6%8A%E6%96%97%E7%AF%B7)<br>`distinguished_cape` | 通用 | 先古之民 | 瓦库 | 拾起时，失去9点最大生命值。将3张灵体加入你的牌组。 | 已接入，待实机 | maxHp=-9；addCards=["mengsan_event_apparition","mengsan_event_apparition","mengsan_event_apparition"] | `distinguished_cape.png`<br>80×80；5828 B |
| 249 | [尘封魔典](https://sts2.huijiwiki.com/wiki/%E5%B0%98%E5%B0%81%E9%AD%94%E5%85%B8)<br>`dusty_tome` | 通用 | 先古之民 | 达弗 | 拾起时，获得一张先古牌。 | 梦三适配，待实机 | 从已登记的先古事件牌池随机获得一张；网页未列出完整候选排除规则。 | `dusty_tome.png`<br>80×76；7793 B |
| 250 | [符文金字塔](https://sts2.huijiwiki.com/wiki/%E7%AC%A6%E6%96%87%E9%87%91%E5%AD%97%E5%A1%94)<br>`runic_pyramid` | 通用 | 先古之民 | 达弗 | 你在回合结束时不再自动丢弃所有手牌。 | 梦三适配，待实机 | 梦三原本按手牌上限弃牌；这里让全部手牌不计入弃牌上限。虚无牌照常消耗。 | `runic_pyramid.png`<br>81×72；6485 B |
| 251 | [黑星](https://sts2.huijiwiki.com/wiki/%E9%BB%91%E6%98%9F)<br>`black_star` | 通用 | 先古之民 | 达弗 | 精英敌人在被打败时多掉落一件遗物。 | 已接入，待实机 | eliteRelics=1 | `black_star.png`<br>81×82；5619 B |
| 252 | [空鸟笼](https://sts2.huijiwiki.com/wiki/%E7%A9%BA%E9%B8%9F%E7%AC%BC)<br>`empty_cage` | 通用 | 先古之民 | 达弗 | 拾起时，选择移除牌组中的2张牌。 | 已接入，待实机 | choice="remove"；choiceCount=2 | `empty_cage.png`<br>62×79；6599 B |
| 253 | [灵体外质](https://sts2.huijiwiki.com/wiki/%E7%81%B5%E4%BD%93%E5%A4%96%E8%B4%A8)<br>`ectoplasm` | 通用 | 先古之民 | 达弗 | 你不能再获得任何金币。在回合开始时获得[能量] | 已接入，待实机 | blockGold=true；turnEnergy=1 | `ectoplasm.png`<br>77×63；6117 B |
| 254 | [潘多拉魔盒](https://sts2.huijiwiki.com/wiki/%E6%BD%98%E5%A4%9A%E6%8B%89%E9%AD%94%E7%9B%92)<br>`pandoras_box` | 通用 | 先古之民 | 达弗 | 变化所有“打击”和“防御”。 | 已接入，待实机 | transformAllStarters=true | `pandoras_box.png`<br>79×79；8118 B |
| 255 | [天鹅绒颈圈](https://sts2.huijiwiki.com/wiki/%E5%A4%A9%E9%B9%85%E7%BB%92%E9%A2%88%E5%9C%88)<br>`velvet_choker` | 通用 | 先古之民 | 达弗 | 在每回合开始时获得[能量]。你每回合不能打出超过6张牌。 | 已接入，待实机 | turnEnergy=1；turnCardLimit=6 | `velvet_choker.png`<br>75×74；5199 B |
| 256 | [添水](https://sts2.huijiwiki.com/wiki/%E6%B7%BB%E6%B0%B4)<br>`sozu` | 通用 | 先古之民 | 达弗 | 你无法再获得药水。在每回合开始时获得[能量]。 | 待补充，禁入奖励 | 可使用的药水系统 | `sozu.png`<br>76×79；5601 B |
| 257 | [贤者之石](https://sts2.huijiwiki.com/wiki/%E8%B4%A4%E8%80%85%E4%B9%8B%E7%9F%B3)<br>`philosophers_stone` | 通用 | 先古之民 | 达弗 | 在每回合开始时获得[能量]。所有敌人初始获得1点力量。 | 已接入，待实机 | turnEnergy=1；openingEnemyStrength=1 | `philosophers_stone.png`<br>78×74；6650 B |
| 258 | [星盘](https://sts2.huijiwiki.com/wiki/%E6%98%9F%E7%9B%98)<br>`astrolabe` | 通用 | 先古之民 | 达弗 | 拾起时，选择3张牌进行变化，然后将这些牌升级。 | 已接入，待实机 | choice="transformUpgrade"；choiceCount=3 | `astrolabe.png`<br>78×78；6548 B |
| 259 | [异蛇之眼](https://sts2.huijiwiki.com/wiki/%E5%BC%82%E8%9B%87%E4%B9%8B%E7%9C%BC)<br>`snecko_eye` | 通用 | 先古之民 | 达弗 | 每回合多抽2张牌。每场战斗开始时获得混乱效果。 | 待补充，禁入奖励 | 尚缺效果接口：confusion | `snecko_eye.png`<br>81×80；5651 B |
| 260 | [召唤铃铛](https://sts2.huijiwiki.com/wiki/%E5%8F%AC%E5%94%A4%E9%93%83%E9%93%9B)<br>`calling_bell` | 通用 | 先古之民 | 达弗 | 拾起时，获得一个独特的诅咒和3件遗物。 | 已接入，待实机 | randomRelics=3；addCards=["mengsan_curse_curse_of_the_bell"] | `calling_bell.png`<br>78×80；8215 B |
| 261 | [奥利哈钢？？？](https://sts2.huijiwiki.com/wiki/%E5%A5%A5%E5%88%A9%E5%93%88%E9%92%A2%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_orichalcum` | 通用 | 事件 | — | 如果你在回合结束时没有任何格挡，获得3点格挡。 | 已接入，待实机 | emptyBlock=3 | `fake_orichalcum.png`<br>82×65；6671 B |
| 262 | [抱抱先生](https://sts2.huijiwiki.com/wiki/%E6%8A%B1%E6%8A%B1%E5%85%88%E7%94%9F)<br>`mr_struggles` | 通用 | 事件 | — | 在你的回合开始时，对所有敌人造成等量于当前回合数的伤害。 | 已接入，待实机 | turnNumberDamage=true | `mr_struggles.png`<br>78×81；7422 B |
| 263 | [宾邦](https://sts2.huijiwiki.com/wiki/%E5%AE%BE%E9%82%A6)<br>`bing_bong` | 通用 | 事件 | — | 每当你往牌组中增添卡牌时，都将额外添加一张相同的牌。 | 已接入，待实机 | duplicateAdded=true | `bing_bong.png`<br>77×78；8671 B |
| 264 | [捕梦网](https://sts2.huijiwiki.com/wiki/%E6%8D%95%E6%A2%A6%E7%BD%91)<br>`dream_catcher` | 通用 | 事件 | — | 每当你休息时，可以添加一张牌到你的牌组。 | 已接入，待实机 | restCardChoice=true | `dream_catcher.png`<br>79×82；8486 B |
| 265 | [打击木偶？？？](https://sts2.huijiwiki.com/wiki/%E6%89%93%E5%87%BB%E6%9C%A8%E5%81%B6%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_strike_dummy` | 通用 | 事件 | — | 名字中有“打击”的卡牌造成1点额外伤害。 | 已接入，待实机 | strikeDamage=1 | `fake_strike_dummy.png`<br>81×80；10755 B |
| 266 | [大蘑菇](https://sts2.huijiwiki.com/wiki/%E5%A4%A7%E8%98%91%E8%8F%87)<br>`big_mushroom` | 通用 | 事件 | — | 拾起时，将你的最大生命值提升20。在每场战斗开始时，少抽2张牌。 | 梦三适配，待实机 | 沿用梦三初始手牌4张，扣减2张；未改成STS2的基础手牌数量。 | `big_mushroom.png`<br>82×78；7337 B |
| 267 | [发条靴](https://sts2.huijiwiki.com/wiki/%E5%8F%91%E6%9D%A1%E9%9D%B4)<br>`the_boot` | 通用 | 事件 | — | 每当你造成小于等于4点未被格挡的攻击伤害时，将伤害提升为5。 | 已接入，待实机 | minimumAttackDamage=5 | `the_boot.png`<br>81×67；7400 B |
| 268 | [芳香蘑菇](https://sts2.huijiwiki.com/wiki/%E8%8A%B3%E9%A6%99%E8%98%91%E8%8F%87)<br>`fragrant_mushroom` | 通用 | 事件 | — | 拾起时，失去15点生命，然后随机升级2张牌。 | 梦三适配，待实机 | 随机强化2张并扣除15点生命；当前地图流程保留至少1点生命，待补充非战斗死亡结算。 | `fragrant_mushroom.png`<br>74×83；6051 B |
| 269 | [菲涅耳透镜](https://sts2.huijiwiki.com/wiki/%E8%8F%B2%E6%B6%85%E8%80%B3%E9%80%8F%E9%95%9C)<br>`fresnel_lens` | 通用 | 事件 | — | 每当你将一张带有格挡的牌加入你的牌组时，为那张牌附魔：灵巧2 | 待补充，禁入奖励 | 灵巧附魔 | `fresnel_lens.png`<br>63×82；10589 B |
| 270 | [风的女儿](https://sts2.huijiwiki.com/wiki/%E9%A3%8E%E7%9A%84%E5%A5%B3%E5%84%BF)<br>`daughter_of_the_wind` | 通用 | 事件 | — | 每当你打出一张攻击牌时，获得1点格挡。 | 已接入，待实机 | attackBlock=1 | `daughter_of_the_wind.png`<br>75×81；9006 B |
| 271 | [古茶具套装？？？](https://sts2.huijiwiki.com/wiki/%E5%8F%A4%E8%8C%B6%E5%85%B7%E5%A5%97%E8%A3%85%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_venerable_tea_set` | 通用 | 事件 | — | 到达休息处后的下一场战斗开始时额外获得[能量]。 | 已接入，待实机 | afterRestEnergy=1 | `fake_venerable_tea_set.png`<br>81×79；10067 B |
| 272 | [骨茶](https://sts2.huijiwiki.com/wiki/%E9%AA%A8%E8%8C%B6)<br>`bone_tea` | 通用 | 事件 | — | 在你接下来的1场战斗开始时，升级你的初始手牌。 | 待补充，禁入奖励 | 尚缺效果接口：oneBattleUpgradeHand | `bone_tea.png`<br>77×56；6791 B |
| 273 | [黑石护符](https://sts2.huijiwiki.com/wiki/%E9%BB%91%E7%9F%B3%E6%8A%A4%E7%AC%A6)<br>`darkstone_periapt` | 通用 | 事件 | — | 每当你获得一张诅咒，就将你的最大生命值提升6。 | 已接入，待实机 | addedCurseMaxHp=6 | `darkstone_periapt.png`<br>78×81；8875 B |
| 274 | [花粉核心](https://sts2.huijiwiki.com/wiki/%E8%8A%B1%E7%B2%89%E6%A0%B8%E5%BF%83)<br>`pollinous_core` | 通用 | 事件 | — | 每4个回合，额外抽2张牌。 | 已接入，待实机 | turnDraw=2；turnEvery=4 | `pollinous_core.png`<br>78×78；8880 B |
| 275 | [巨口储蓄罐](https://sts2.huijiwiki.com/wiki/%E5%B7%A8%E5%8F%A3%E5%82%A8%E8%93%84%E7%BD%90)<br>`maw_bank` | 通用 | 事件 | — | 每攀爬一层楼层，就获得12金币。一旦在商店中花费金币就会使其失效。 | 梦三适配，待实机 | 将进入一个新的梦三节点视为攀爬一层，先发12金币，再进行商店购买或战斗；原作楼层与额外剧情节点未单独区分。 | `maw_bank.png`<br>83×64；5490 B |
| 276 | [开心小花？？？](https://sts2.huijiwiki.com/wiki/%E5%BC%80%E5%BF%83%E5%B0%8F%E8%8A%B1%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_happy_flower` | 通用 | 事件 | — | 每5个回合，获得[能量]。 | 待补充，禁入奖励 | 尚未接入此效果 | `fake_happy_flower.png`<br>54×81；7346 B |
| 277 | [李家华夫饼？？？](https://sts2.huijiwiki.com/wiki/%E6%9D%8E%E5%AE%B6%E5%8D%8E%E5%A4%AB%E9%A5%BC%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_lees_waffle` | 通用 | 事件 | — | 拾起时，回复你10%的生命值。 | 已接入，待实机 | gainHealFraction=0.1 | `fake_lees_waffle.png`<br>75×82；10442 B |
| 278 | [历史课](https://sts2.huijiwiki.com/wiki/%E5%8E%86%E5%8F%B2%E8%AF%BE)<br>`history_course` | 通用 | 事件 | — | 在你的回合开始时，打出一张你上一回合最后打出的攻击牌或技能牌的复制品。 | 待补充，禁入奖励 | 尚缺效果接口：replayLastAttackSkill | `history_course.png`<br>81×66；6997 B |
| 279 | [芒果？？？](https://sts2.huijiwiki.com/wiki/%E8%8A%92%E6%9E%9C%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_mango` | 通用 | 事件 | — | 拾起时，将你的最大生命值提升3。 | 已接入，待实机 | maxHp=3 | `fake_mango.png`<br>81×77；10329 B |
| 280 | [锚？？？](https://sts2.huijiwiki.com/wiki/%E9%94%9A%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_anchor` | 通用 | 事件 | — | 在每场战斗开始时，获得4点格挡。 | 已接入，待实机 | openingBlock=4 | `fake_anchor.png`<br>74×81；8325 B |
| 281 | [迷失鬼火](https://sts2.huijiwiki.com/wiki/%E8%BF%B7%E5%A4%B1%E9%AC%BC%E7%81%AB(%E9%81%97%E7%89%A9))<br>`lost_wisp` | 通用 | 事件 | — | 你每打出一张能力牌，就对所有敌人造成8点伤害。 | 已接入，待实机 | powerDamage=8 | `lost_wisp.png`<br>55×79；7568 B |
| 282 | [商人的地毯？？？](https://sts2.huijiwiki.com/wiki/%E5%95%86%E4%BA%BA%E7%9A%84%E5%9C%B0%E6%AF%AF%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_merchants_rug` | 通用 | 事件 | — | 低劣的仿制品。没有任何作用。 | 已接入，待实机 | noEffect=true | `fake_merchants_rug.png`<br>81×78；7462 B |
| 283 | [石之剑](https://sts2.huijiwiki.com/wiki/%E7%9F%B3%E4%B9%8B%E5%89%91)<br>`sword_of_stone` | 通用 | 事件 | — | 在击败5名精英敌人之后将变化为一件强力遗物。 | 梦三适配，待实机 | 按5次精英战胜利计数，变化为玉之剑；尚无精英单位的独立击杀标签。 | `sword_of_stone.png`<br>72×80；6107 B |
| 284 | [手钻](https://sts2.huijiwiki.com/wiki/%E6%89%8B%E9%92%BB)<br>`hand_drill` | 通用 | 事件 | — | 每当你突破敌人的格挡时，给予其2层易伤。 | 待补充，禁入奖励 | 尚缺效果接口：breakBlockVulnerable | `hand_drill.png`<br>81×80；6727 B |
| 285 | [天选芝士](https://sts2.huijiwiki.com/wiki/%E5%A4%A9%E9%80%89%E8%8A%9D%E5%A3%AB)<br>`chosen_cheese` | 通用 | 事件 | — | 在战斗结束时，获得1点最大生命值。 | 已接入，待实机 | battleMaxHp=1 | `chosen_cheese.png`<br>81×73；6214 B |
| 286 | [王室猛毒](https://sts2.huijiwiki.com/wiki/%E7%8E%8B%E5%AE%A4%E7%8C%9B%E6%AF%92)<br>`royal_poison` | 通用 | 事件 | — | 在每场战斗开始时，失去4点生命。 | 已接入，待实机 | openingLoseHp=4 | `royal_poison.png`<br>81×74；9043 B |
| 287 | [旺购客户感恩徽章](https://sts2.huijiwiki.com/wiki/%E6%97%BA%E8%B4%AD%E5%AE%A2%E6%88%B7%E6%84%9F%E6%81%A9%E5%BE%BD%E7%AB%A0)<br>`wongo_customer_appreciation_badge` | 通用 | 事件 | — | 没有任何作用。 | 已接入，待实机 | noEffect=true | `wongo_customer_appreciation_badge.png`<br>81×72；6031 B |
| 288 | [旺购神秘券](https://sts2.huijiwiki.com/wiki/%E6%97%BA%E8%B4%AD%E7%A5%9E%E7%A7%98%E5%88%B8)<br>`wongos_mystery_ticket` | 通用 | 事件 | — | 在5场战斗后，获得随机3件遗物。 | 已接入，待实机 | afterBattles=5；randomRelicsAfter=3 | `wongos_mystery_ticket.png`<br>81×80；5807 B |
| 289 | [无礼之茶](https://sts2.huijiwiki.com/wiki/%E6%97%A0%E7%A4%BC%E4%B9%8B%E8%8C%B6)<br>`tea_of_discourtesy` | 通用 | 事件 | — | 在下一场战斗开始时，将2张晕眩放入你的抽牌堆。 | 已接入，待实机 | oneBattleDrawCards=["mengsan_dazed_shuying","mengsan_dazed_shuying"] | `tea_of_discourtesy.png`<br>77×56；6749 B |
| 290 | [小血瓶？？？](https://sts2.huijiwiki.com/wiki/%E5%B0%8F%E8%A1%80%E7%93%B6%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_blood_vial` | 通用 | 事件 | — | 在每场战斗开始时，回复1点生命。 | 已接入，待实机 | openingHeal=1 | `fake_blood_vial.png`<br>80×81；7906 B |
| 291 | [遗忘之魂](https://sts2.huijiwiki.com/wiki/%E9%81%97%E5%BF%98%E4%B9%8B%E9%AD%82)<br>`forgotten_soul` | 通用 | 事件 | — | 每当你消耗一张牌，随机对一名敌人造成1点伤害。 | 待补充，禁入奖励 | 尚缺效果接口：exhaustRandomDamage | `lost_soul.png`<br>75×80；7405 B |
| 292 | [异鸟宝宝](https://sts2.huijiwiki.com/wiki/%E5%BC%82%E9%B8%9F%E5%AE%9D%E5%AE%9D)<br>`byrdpip` | 通用 | 事件 | — | 拾起时，获得一张异鸟扑击。一只幼年异鸟会在战斗中陪伴你。 | 待补充，禁入奖励 | 幼年异鸟陪伴单位与行为 | `byrdpip.png`<br>81×72；7173 B |
| 293 | [异蛇之眼？？？](https://sts2.huijiwiki.com/wiki/%E5%BC%82%E8%9B%87%E4%B9%8B%E7%9C%BC%EF%BC%9F%EF%BC%9F%EF%BC%9F)<br>`fake_snecko_eye` | 通用 | 事件 | — | 每场战斗开始时获得混乱效果。 | 待补充，禁入奖励 | 尚缺效果接口：confusion | `fake_snecko_eye.png`<br>80×81；10878 B |
| 294 | [余烬茶](https://sts2.huijiwiki.com/wiki/%E4%BD%99%E7%83%AC%E8%8C%B6)<br>`ember_tea` | 通用 | 事件 | — | 在接下来的5场战斗开始时，获得2点力量。 | 已接入，待实机 | limitedOpeningStrength=2；limitedBattles=5 | `ember_tea.png`<br>77×71；6484 B |
| 295 | [玉之剑](https://sts2.huijiwiki.com/wiki/%E7%8E%89%E4%B9%8B%E5%89%91)<br>`sword_of_jade` | 通用 | 事件 | — | 在每场战斗开始时，获得3点力量。 | 已接入，待实机 | openingStrength=3 | `sword_of_jade.png`<br>72×80；6455 B |
| 296 | [头环](https://sts2.huijiwiki.com/wiki/%E5%A4%B4%E7%8E%AF)<br>`circlet` | 通用 | 遗物 | — | 这是一个头环。 | 已接入，待实机 | noEffect=true | `circlet.png`<br>82×53；4357 B |
| 297 | [寻龙尺](https://sts2.huijiwiki.com/wiki/%E5%AF%BB%E9%BE%99%E5%B0%BA)<br>`dowsing_rod` | 通用 | 先古之民 | 涅奥 | 拾起时，将1张探寻加入你的牌组。 | 待补充，禁入奖励 | 尚缺网页对应卡牌：mengsan_event_seek | `dowsing_rod.png`<br>79×79；5041 B |
| 298 | [涅奥的牺牲](https://sts2.huijiwiki.com/wiki/%E6%B6%85%E5%A5%A5%E7%9A%84%E7%89%BA%E7%89%B2)<br>`neows_sacrifice` | 通用 | 先古之民 | 涅奥 | 拾起时，获得1瓶龙涎香，并将1张愧疚加入你的牌组。 | 待补充，禁入奖励 | 可使用的龙涎香药水 | `neows_sacrifice.png`<br>81×80；11221 B |
