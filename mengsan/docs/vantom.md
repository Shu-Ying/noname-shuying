# 墨影幻灵 VANTOM

2026-10-03 来源：https://sts2.huijiwiki.com/wiki/墨影幻灵；https://sts2.huijiwiki.com/wiki/滑溜；https://sts2.huijiwiki.com/wiki/伤口
角色 mengsan_vantom_shuying，Vantom / HEALTH / MONSTER_TYPES。普通HP173，第一层act1Map.boss由re_lvbu改为此首领，普通池与精英池不变，专属开局及其他层不变。A8生命183、A9墨迹8/长枪7×2/肢解30只记录，不混入当前普通数值。
网页正文及滑溜说明写开场9层，更新历史0.104.0写9→8(9)，来源矛盾，本次正文优先采用9。滑溜仅初始获得，不每回合刷新；每次实际生命损失最多1，实际掉血才消耗1层，完全格挡和取消事件不消耗；多段逐段消耗。沿用墨宝同一原生changeHp限幅，保留正常护甲消耗、loseHp与非攻击伤害规则。
SVG：开始→墨迹(7)→墨水长枪(6×2)→肢解(26+个人弃牌堆3伤口)→准备(+2永久力量)→墨迹。固定循环不抽随机数。力量叠加每段脚本攻击及原生攻击牌，准备不附加格挡。没有阶段转换、召唤墨宝、额外被动；轶事不当作战斗机制。
沿用梦三Boss抽3/手牌上限7/费用4，意图消耗1费用，随后保留原生出牌阶段；脚本攻击作用所有存活敌对角色，逐目标状态计算，护甲原生抵扣。费用不足推进循环但不攻击、不塞牌、不加力量；击晕advance/retry保持原生流程。
伤口是不能被打出的状态牌，只有unplayable；没有虚无、消耗、掉血、抽牌或升级机制。肢解全部伤害结算完后只给仍存活的敌对角色个人弃牌堆加入3张，角色死亡、源死亡、结束或换场不继续；不污染公共牌堆和永久牌组。本人及支援各自牌堆、唯一ID；无个人牌堆则跳过。
独立密林Boss3:4不透明立绘；伤口独立5:7宣纸水墨卡面，fullimage和本地选择器，无文字牌框。原画：https://huiji-public.huijistatic.com/sts2/uploads/f/f0/Vantom.png；https://huiji-public.huijistatic.com/sts2/uploads/a/a4/Wound.png
生成提示词：D:\noname\resources\app\.codex-artifacts\mengsan-hand-fan-20261001\vantom-prompts.json
原画版权归原权利方，网页文本CC BY-NC-SA4.0。隔离验证不是实机验收。
