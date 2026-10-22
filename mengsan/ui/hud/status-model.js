import { readCombatStatusSources } from '../../battle/status-sources.js';
import { slowPercent } from '../../monsters/effigy-slow.js';

// The descriptions describe Mengsan's current rules, not an imported Wiki engine.
const storageStatuses = [
    ['vulnerable', '易伤', 'mengsanVulnerable_shuying', '回合', '受到攻击伤害增加；剩余自身回合数，倍率按攻击来源及当前效果结算。', 'mengsan_vulnerable_shuying'],
    ['weak', '虚弱', 'mengsanWeak_shuying', '回合', '攻击伤害减少25%；纸鹤对敌人采用40%减伤。自身回合结束减少。', 'mengsan_weak_shuying'],
    ['frail', '脆弱', 'mengsanFrail_shuying', '回合', '获得格挡减少25%，向下取整；自身回合结束减少。', 'mengsan_frail_shuying'],
    ['artifact', '人工制品', 'mengsanArtifact_shuying', '次', '每次抵消一次符合规则的负面状态施加，不抵消伤害。', 'mengsan_artifact_shuying'],
    ['constrict', '紧缠', 'mengsanConstrict_shuying', '伤害', '自身回合结束受到等量非攻击伤害；来源死亡解除。', 'mengsan_constrict_shuying'],
    ['tangled', '缠结', 'mengsanTangled_shuying', '回合', '攻击牌费用增加1，持续时间可叠加，加费不叠加。', 'mengsan_tangled_shuying'],
    ['shrink', '缩小', 'mengsanShrink_shuying', '', '攻击伤害减少30%，不重复叠加；来源死亡解除。', 'mengsan_shrink_shuying'],
    ['plow', '横冲直撞', 'mengsanPlow_shuying', '生命阈值', '受到伤害后生命不高于该阈值时击晕，清零力量并进入第二阶段。', 'mengsan_plow_shuying'],
    ['slippery', '滑溜', 'mengsanSlippery_shuying', '次', '下一次实际生命损失限制为1，完全格挡不消耗。', 'mengsan_slippery_shuying'],
    ['territorial', '领地意识', 'mengsanTerritorial_shuying', '力量', '自身回合结束获得等量力量。', 'mengsan_territorial_shuying'],
    ['infested', '寄生物', 'mengsanInfested_shuying', '召唤数', '死亡后立即召唤扭动虫，必须消灭召唤单位才能获胜。', 'mengsan_infested_shuying'],
];
// [display name, icon, value meaning, description]; only actual effect fields are read.
const effects = {
    turnStrength: ['恶魔形态', 'demon_form', '力量', '自身回合开始获得力量。'],
    turnEnergy: ['每回合费用', 'demesne', '费用', '自身回合开始额外获得费用。'],
    turnBlock: ['绯红披风', 'crimson_mantle', '格挡', '自身回合开始获得格挡；失血部分另列。'],
    turnLoseHp: ['披风失血', 'crimson_mantle', '生命', '自身回合开始失去生命。'],
    infernoLoseHp: ['狱火失血', 'inferno', '生命', '自身回合开始失去生命。'],
    lossDamage: ['狱火', 'inferno', '伤害', '自身回合失去生命时，对所有敌人造成伤害。'],
    lossStrength: ['撕裂', 'rupture', '力量', '自身回合失去生命时获得力量。'],
    vulnerableBonus: ['易伤增幅', 'vicious', '倍率加成', '对易伤敌人的伤害倍率额外加成。'],
    attackBlock: ['狂怒', 'rage', '格挡', '本回合每打出一张攻击牌获得格挡。'],
    retaliation: ['火焰屏障', 'flame_barrier', '伤害', '本回合受到攻击后反击。'],
    colossus: ['巨像', 'colossus', '', '本回合受到易伤敌人的攻击伤害减少50%。'],
    freeAttack: ['免费攻击', 'free_attack', '', '下一张符合规则的攻击牌免费。'],
    noDraw: ['不可抽牌', 'no_draw', '', '本回合不能继续抽牌。'],
    noEnergy: ['无法获得费用', 'no_energy_gain', '', '本回合不能再获得费用。'],
    doubleTap: ['连环拳', 'one_two_punch', '张', '本回合接下来的攻击牌额外打出一次。'],
    plating: ['覆甲', 'plating', '格挡', '回合末获得等量格挡；自身回合开始减少1层。'],
    exhaustBlock: ['无惧疼痛', 'feel_no_pain', '格挡', '卡牌消耗后获得格挡。'],
    exhaustDraw: ['黑暗之拥', 'dark_embrace', '张', '卡牌消耗后抽牌。'],
    vulnerableDraw: ['凶恶', 'vicious', '张', '每次成功施加易伤后抽牌。'],
    juggle: ['杂耍', 'juggling', '', '自身回合第三张攻击牌复制至手牌。'],
    endAttack: ['惊逃', 'stampede', '张', '回合结束随机免费打出攻击手牌。'],
    retrieveAttack: ['好勇斗狠', 'aggression', '张', '自身回合开始从弃牌堆获得攻击牌并强化。'],
    bodyguard: ['肉盾', 'tank', '', '自身承受敌人双倍伤害，其他友方受到敌人的伤害减半。'],
    autoStrike: ['地狱狂徒', 'hellraiser', '', '抽到杀或名称含打击的攻击牌时自动打出。'],
    firstBlock: ['不动', 'unmovable', '张', '每个自身回合首批获得格挡的卡牌，格挡翻倍。'],
    blockDamage: ['势不可当', 'juggernaut', '伤害', '获得格挡时对随机敌人造成伤害。'],
    barricade: ['壁垒', 'barricade', '', '自身回合开始保留格挡。'],
    corruption: ['腐化', 'corruption', '', '技能牌费用变为0，打出后消耗。'],
    dexterity: ['敏捷', 'dexterity', '格挡', '影响从卡牌中获得的格挡。'],
    noCardBlock: ['不可格挡', 'no_block', '回合', '无法从卡牌中获得格挡。'],
    intangible: ['无实体', 'intangible', '回合', '按当前规则限制伤害和生命损失。'],
    gambit: ['孤注一掷', 'the_gambit', '', '受到未被格挡的攻击伤害时死亡。'],
    retain: ['保留手牌', 'retain_hand', '', '本回合保留手牌。'],
    panache: ['神气制胜', 'panache', '伤害', '自身回合每打出5张牌，对所有敌人造成伤害。'],
    defendBonus: ['勒紧', 'fasten', '格挡', '防御牌额外获得格挡。'],
    turnVigor: ['准备时间', 'prep_time', '活力', '自身回合开始获得活力。'],
    automation: ['自动化', 'automation', '费用', '抽牌达到计数要求后获得费用。'],
    powerDiscount: ['好奇', 'curious', '费用', '能力牌费用降低。'],
    boulder: ['滚石', 'rolling_boulder', '伤害', '回合开始对所有敌人造成伤害，随后伤害增加5。'],
    nostalgia: ['怀旧', 'nostalgia', '', '每回合首张攻击或技能牌放回抽牌堆顶。'],
    entropy: ['熵', 'entropy', '', '自身回合开始变化手牌。'],
    beacon_of_hope: ['希望灯塔', 'beacon_of_hope', '', '获得格挡时向其他友方提供格挡。'],
    mayhem: ['乱战', 'mayhem', '', '自身回合开始自动打出抽牌堆顶的牌。'],
    calamity: ['劫难', 'calamity', '', '打出攻击牌时生成随机攻击牌。'],
};
const activeValue = value => value === true || typeof value === 'number' && Number.isFinite(value) && value !== 0;
const number = value => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const make = (id, name, icon, value, unit, detail, markSkills = []) => ({ id, name,
    icon: icon ? `${icon}_power.png` : null, value: value === true ? null : value, unit, detail, markSkills });

export const statusIconNames = [...new Set(['strength', 'ringing', 'slow', 'the_bomb', 'vigor', 'draw_cards_next_turn', 'energy_next_turn', 'block_next_turn',
    ...storageStatuses.map(row => row[0]), ...Object.values(effects).map(row => row[1])])].map(id => `${id}_power.png`);

export function collectCombatStatuses(player, battle) {
    if (!battle?.session?.active) return [];
    const storage = player.storage || {}, result = [], sources = readCombatStatusSources(player, battle.session);
    const penalty = sources.reduce((n, entry) => n + number(entry.state.negativeStrength), 0);
    const permanent = number(storage.mengsanStrength_shuying), temporary = number(storage.mengsanSetupStrength_shuying);
    if (permanent || temporary || penalty) result.push(make('strength', '力量', 'strength', permanent + temporary - penalty, '伤害',
        `常驻力量 ${permanent}；临时力量 ${temporary}；本回合减益 ${penalty}。不同临时来源按各自原规则到期。`,
        ['mengsan_raider_strength_shuying', 'mengsan_setup_strength_shuying']));
    for (const [id, name, key, unit, detail, skill] of storageStatuses) {
        if (activeValue(storage[key])) result.push(make(id, name, id, storage[key], unit, detail, [skill]));
    }
    if (storage.mengsanRinging_shuying || player.hasSkill?.('mengsan_ringing_shuying')) result.push(make('ringing', '昏眩', 'ringing',
        `${Math.min(1, number(storage.mengsanRingingUsed_shuying))}/1`, '主动出牌', '本次自身回合至多主动使用1张牌，不限制响应；回合结束解除。', ['mengsan_ringing_shuying']));
    if (player.hasSkill?.('mengsan_slow_shuying')) result.push(make('slow', '缓慢', 'slow', slowPercent(player), '%',
        `缓慢 ${number(storage.mengsanSlow_shuying)} 层；友方回合每打出一张牌，受到的攻击牌伤害增加层数×10%；换回合计数重置。`, ['mengsan_slow_shuying']));
    for (const { id, state } of sources) {
        for (const zone of ['powers', 'turn', 'defense']) {
            for (const [key, value] of Object.entries(state[zone] || {})) {
                const definition = effects[key];
                if (!definition || !activeValue(value)) continue;
                const [name, icon, unit, detail] = definition;
                result.push(make(`${id}:${zone}:${key}`, name, icon, key === 'vulnerableBonus' ? `${Math.round(value * 100)}%` : value, unit, detail,
                    id === 'ironclad' ? ['mengsan_ic_powers_shuying'] : []));
            }
        }
        if (activeValue(state.vigor)) result.push(make(`${id}:vigor`, '活力', 'vigor', state.vigor, '伤害', '下一张攻击牌获得额外伤害。'));
        (state.bombs || []).forEach((bomb, index) => result.push(make(`${id}:bomb:${index}`, '炸弹', 'the_bomb', bomb.turns, '回合',
            `此实例倒计时结束后对所有敌人造成${bomb.damage}点伤害；各炸弹独立结算。`)));
        (state.nextTurn || []).forEach((next, index) => {
            for (const [key, name, icon, unit] of [['draw', '下回合抽牌', 'draw_cards_next_turn', '张'], ['energy', '下回合费用', 'energy_next_turn', '费用'], ['block', '下回合格挡', 'block_next_turn', '格挡']]) {
                if (activeValue(next[key])) result.push(make(`${id}:next:${index}:${key}`, name, icon, next[key], unit,
                    `自身回合开始获得；${next.remaining ? `剩余${next.remaining}次。` : '此实例结算一次。'}`));
            }
        });
    }
    if (battle.relics?.displayState && battle.owner === player) {
        const relic = battle.relics.displayState();
        for (const [key, name, icon, unit, detail] of [
            ['dexterity', '遗物敏捷', 'dexterity', '格挡', '遗物提供的卡牌格挡修正。'],
            ['plating', '遗物覆甲', 'plating', '格挡', '遗物提供的回合末格挡。'],
            ['nextEnergy', '下回合费用', 'energy_next_turn', '费用', '遗物将在下个自身回合提供费用。'],
            ['nextBlock', '下回合格挡', 'block_next_turn', '格挡', '遗物将在下个自身回合提供格挡。']]) {
            if (activeValue(relic[key])) result.push(make(`relic:${key}`, name, icon, relic[key], unit, detail));
        }
    }
    return result;
}
