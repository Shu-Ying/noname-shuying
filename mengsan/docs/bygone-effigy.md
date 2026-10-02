# 旧日雕像 BYGONE_EFFIGY

2026-10-03：https://sts2.huijiwiki.com/wiki/旧日雕像；https://sts2.huijiwiki.com/wiki/缓慢
注册mengsan_bygone_effigy_shuying；第一层精英池，普通生命127，无随机生命抽取。A8生命132、A9斩击15只记录，不混入当前普通数值。
SVG开始→沉睡→唤醒→斩击（自循环）。第1回合沉睡，取消原生出牌阶段，不耗费用；第2回合苏醒10力量，仅一次；第3回合起斩击13基础伤害，叠加力量后23。
其余意图消耗1费用，之后保留梦三精英原生出牌，抽2、上限5、费用3；原生攻击牌也受力量修正。首回合不是单纯隐藏意图后仍可以出杀。
缓慢初始能力1层，图标数值显示本回合额外伤害百分比，不是能力层数。友方共用每只雕像上的计数，每次完成使用一张牌后(useCardAfter)增加10%；攻击本身结算时用之前已完成牌数，虚拟牌/多目标牌只算一次；防御、治疗也计数。纯响应respond不计数；敌方出牌、取消使用、战斗外事件不计数。
回合边界phaseBefore/phaseAfter清零，状态仍在，不仅雕像自己回合结束才清零。友方主动回合的支援使用牌也计入相同敌方状态。
伤害倍率只作用于攻击类别卡牌或明确标记mengsanAttack_shuying的脚本攻击。非攻击遗物伤害不放大，护甲不影响计数。梦三整数伤害适配：力量/虚弱/易伤后乘(1+10%×牌数)，向下取整，再由引擎抵扣护甲；意图预测使用同一计算。
费用不足与击晕沿用现有advance/retry，不重新沉睡；死亡、会话结束中止后续攻击/增益。缓慢、循环、力量会话清理，旧会话不误删新会话状态。永久牌堆不变。
原画：https://huiji-public.huijistatic.com/sts2/uploads/b/b5/Bygone_effigy.png
内置image_gen基于原画和密林风格重绘独立3:4不透明立绘；完整雕像、镰刀、盾牌、石台，无UI文字。
提示词：D:\noname\resources\app\.codex-artifacts\mengsan-hand-fan-20261001\effigy-prompts.json
原画版权归原权利方，网页文本CC BY-NC-SA 4.0。隔离测试不是实机验收。
