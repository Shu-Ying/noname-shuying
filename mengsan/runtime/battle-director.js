const copy = value => JSON.parse(JSON.stringify(value));
const camps = new Set(["ally", "enemy", "neutral"]);
export const campPresets = Object.freeze({ ally: { enabled: true }, enemy: { enabled: true }, neutral: { enabled: false } });
const events = new Set(["battleStart", "roundStart", "turnStart", "turnEnd", "state"]);
const checks = new Set(["hp", "hand", "alive", "linked", "turnedOver", "camp"]);
const numeric = value => Number.isInteger(value) && value >= 0 && value <= 99;
const assert = (condition, message) => { if (!condition) throw new Error("梦三关卡配置：" + message); };

export function validateBattlePlan(plan) {
    assert(plan && Array.isArray(plan.units) && Array.isArray(plan.rules), "units/rules 必须为数组");
    assert(plan.units.length > 0 && plan.units.length <= 7 && plan.rules.length <= 32, "初始单位或规则数量越界");
    const ids = new Set(["player"]), ruleIds = new Set();
    const unit = spec => {
        assert(spec && typeof spec.id === "string" && /^[\w.-]+$/.test(spec.id) && !ids.has(spec.id), "单位 ID 无效或重复");
        ids.add(spec.id);
        assert(ids.size <= 8, "单场累计最多 8 个席位（含主角及后续援军）");
        assert(typeof spec.character === "string" && spec.character.length > 0 && camps.has(spec.camp), "武将或阵营无效");
        assert(spec.camp !== "neutral", "中立预设尚未启用");
        assert(spec.tier == null || ["normal", "elite", "boss"].includes(spec.tier), "怪物阶级无效");
        assert(spec.deck == null || (Array.isArray(spec.deck) && spec.deck.length > 0 && spec.deck.every(entry =>
            typeof entry === "string" && Boolean(entry) || entry && typeof entry.name === "string" && Boolean(entry.name) &&
            (entry.suit == null || ["spade", "heart", "club", "diamond"].includes(entry.suit)) &&
            (entry.number == null || Number.isInteger(entry.number) && entry.number >= 1 && entry.number <= 13))), "怪物专属牌堆无效");
        for (const key of ["hand", "hp", "maxHp"]) if (spec[key] != null) assert(numeric(spec[key]), key + " 越界");
        if (spec.hp != null) assert(spec.hp > 0, "初始体力必须大于 0");
        if (spec.maxHp != null) assert(spec.maxHp > 0 && (spec.hp == null || spec.hp <= spec.maxHp), "初始体力上限无效");
        assert(spec.inheritSkills == null || typeof spec.inheritSkills === "boolean", "inheritSkills 必须为布尔值");
        assert(spec.after == null || typeof spec.after === "string", "after 必须是单位 ID");
        assert(spec.equipment == null || (Array.isArray(spec.equipment) && spec.equipment.length <= 5), "equipment 无效");
        for (const card of spec.equipment || []) {
            assert(card && typeof card.name === "string" && card.name.length > 0, "初始装备名称无效");
            assert(["spade", "heart", "club", "diamond"].includes(card.suit), "初始装备花色无效");
            assert(Number.isInteger(card.number) && card.number >= 1 && card.number <= 13, "初始装备点数无效");
        }
        assert(spec.skills == null || (Array.isArray(spec.skills) && spec.skills.every(s => typeof s === "string")), "skills 无效");
    };
    plan.units.forEach(unit);
    for (const rule of plan.rules) {
        assert(rule && typeof rule.id === "string" && !ruleIds.has(rule.id), "规则 ID 重复或无效"); ruleIds.add(rule.id);
        assert(rule.when && events.has(rule.when.event || "state"), "触发时机无效");
        assert(rule.blocksVictory == null || typeof rule.blocksVictory === "boolean", "blocksVictory 必须为布尔值");
        assert(rule.when.round == null || (numeric(rule.when.round) && rule.when.round > 0), "轮数无效");
        assert(rule.when.actorTurns == null || (rule.when.event === "turnEnd" && rule.when.actor && numeric(rule.when.actorTurns) && rule.when.actorTurns > 0), "actorTurns 仅用于指定角色的回合结束");
        assert(rule.when.turn == null || (numeric(rule.when.turn) && rule.when.turn > 0), "回合数无效");
        assert(Array.isArray(rule.effects) && rule.effects.length > 0 && rule.effects.length <= 16, "效果列表无效");
        for (const effect of rule.effects) {
            assert(["spawn", "draw", "recover", "maxHp", "skill", "camp", "dialogue", "discardEquipment"].includes(effect.type), "未知效果");
            if (effect.type === "spawn") unit(effect.unit);
            else if (effect.type === "dialogue") {
                assert(Array.isArray(effect.lines) && effect.lines.every(line => line && ["character", "narrator", "sound", "choice"].includes(line.type) && typeof line.text === "string" && line.text.trim() && (line.type !== "character" || typeof line.character === "string") && (line.type !== "choice" || (/^story\.[\w.]+$/.test(line.flag || "") && Array.isArray(line.choices) && line.choices.length >= 1 && (line.defaultChoice == null || line.choices.some(choice => choice.id === line.defaultChoice))))), "dialogue 台词无效");
            }
            else {
                assert(typeof effect.target === "string", "效果缺少目标 ID");
                if (["draw", "recover", "maxHp"].includes(effect.type)) assert(numeric(effect.amount) && effect.amount > 0, "效果数值无效");
                if (effect.type === "discardEquipment") assert(typeof effect.name === "string" && effect.name.length > 0, "弃置装备名称无效");
                if (effect.type === "skill") assert(typeof effect.skill === "string" && effect.skill.length > 0, "技能 ID 无效");
                if (effect.type === "camp") assert(["ally", "enemy"].includes(effect.camp) && effect.target !== "player", "阵营无效或试图改变主角阵营");
            }
        }
    }
    for (const rule of plan.rules) {
        assert(rule.when.actor == null || ids.has(rule.when.actor), "行动角色 ID 无效");
        assert(rule.when.all == null || (Array.isArray(rule.when.all) && rule.when.all.length <= 16), "条件列表无效");
        for (const condition of rule.when.all || []) {
            assert(ids.has(condition.unit) && checks.has(condition.field), "条件单位或字段无效");
            if (["hp", "hand"].includes(condition.field)) assert(["eq", "gte", "lte"].includes(condition.op) && numeric(condition.value), "数值比较无效");
            else if (condition.field === "camp") assert(camps.has(condition.value), "阵营条件无效");
            else assert(typeof condition.value === "boolean", "状态条件必须为布尔值");
        }
        for (const effect of rule.effects) if (!["spawn", "dialogue"].includes(effect.type)) assert(ids.has(effect.target), "效果目标不存在");
    }
    for (const spec of [...plan.units, ...plan.rules.flatMap(r => r.effects.filter(e => e.type === "spawn").map(e => e.unit))]) {
        assert(spec.after == null || (ids.has(spec.after) && spec.after !== spec.id), "after 席位目标无效");
    }
    return plan;
}

export function grantSupport(run, rewardId, spec) {
    const supports = run.player.supports ||= [];
    const battles = spec.battles ?? -1;
    assert(battles === -1 || (Number.isInteger(battles) && battles > 0 && battles <= 99), "支援持续场数无效");
    // One support per source; repeated permanent items do not clone the same helper.
    const existing = supports.find(s => s.rewardId === rewardId);
    if (existing) { existing.battles = existing.battles === -1 || battles === -1 ? -1 : Math.min(99, existing.battles + battles); return; }
    const number = (run.supportSequence || 0) + 1;
    run.supportSequence = number;
    supports.push({ id: `support_${number}`, rewardId, category: spec.category || "item", unit: copy(spec.unit), battles });
}

export function buildBattlePlan(encounter, run) {
    const plan = copy(encounter.battlePlan || {
        units: [{ id: "enemy_1", character: encounter.enemy, camp: "enemy", tier: encounter.tier || "normal", hand: 4 }], rules: [],
    });
    plan.rules ||= [];
    // Consumed only in the battle's run snapshot; the existing settlement commits it atomically.
    for (const support of run.player.supports || []) {
        if (support.battles === 0) continue;
        assert(support.battles === -1 || (Number.isInteger(support.battles) && support.battles > 0), "支援持续场数无效");
        plan.units.push({ ...copy(support.unit), id: support.id });
    }
    validateBattlePlan(plan);
    return plan;
}

export function consumeSupports(run) {
    run.player.supports = (run.player.supports || []).map(s => ({ ...s, battles: s.battles > 0 ? s.battles - 1 : s.battles })).filter(s => s.battles !== 0);
}

export function createBattleDirector(plan, adapters) {
    validateBattlePlan(plan);
    const units = new Map(), fired = new Set(), completedTurns = new Map(), seenPhases = new WeakSet();
    let round = 0, turn = 0, actor = null, ready = false, running = false, disposed = false;
    const compare = (actual, op, value) => op === "gte" ? actual >= value : op === "lte" ? actual <= value : actual === value;
    function matches(when, event) {
        if ((when.event || "state") !== event) return false;
        if (when.round != null && round < when.round) return false;
        if (when.turn != null && turn < when.turn) return false;
        if (when.actorTurns != null && (completedTurns.get(actor) || 0) < when.actorTurns) return false;
        if (when.actor != null && units.get(when.actor) !== actor) return false;
        return (when.all || []).every(condition => {
            const player = units.get(condition.unit);
            if (!player) return false;
            const state = adapters.state(player);
            return compare(state[condition.field], condition.op || "eq", condition.value);
        });
    }
    async function evaluate(event = "state") {
        if (!ready || disposed || running) return;
        running = true;
        try {
            // Every rule runs once per battle; marking before effects prevents recursive triggers.
            for (let pass = 0; pass <= plan.rules.length; pass++) {
                let changed = false;
                for (const rule of plan.rules) {
                    if (disposed || !adapters.active()) return;
                    if (fired.has(rule.id) || !matches(rule.when, event)) continue;
                    fired.add(rule.id); changed = true;
                    for (const effect of rule.effects) {
                        if (disposed || !adapters.active()) return;
                        if (effect.type === "dialogue") await adapters.dialogue(effect.lines);
                        else if (effect.type === "spawn") {
                            const anchor = effect.unit.after == null ? null : units.get(effect.unit.after);
                            if (effect.unit.after != null && !anchor) throw new Error("支援席位目标尚未登场：" + effect.unit.after);
                            units.set(effect.unit.id, await adapters.spawn(effect.unit, anchor));
                        }
                        else {
                            const target = units.get(effect.target);
                            if (target && adapters.state(target).alive) await adapters.effect(target, effect);
                        }
                    }
                    adapters.log(rule.name || rule.id);
                }
                if (!changed) break;
            }
        } finally { running = false; }
    }
    return {
        bind(id, player) { if (units.has(id)) throw new Error("Duplicate battle unit: " + id); units.set(id, player); },
        async start() { ready = true; await evaluate("battleStart"); await evaluate("state"); },
        async beforeTurn(player) {
            turn++; actor = player;
            if (player === units.get("player")) { round++; await evaluate("roundStart"); }
            await evaluate("turnStart"); await evaluate("state");
        },
        async afterTurn(player, phase) {
            if (!ready || disposed || !adapters.active()) return;
            if (phase && seenPhases.has(phase)) return;
            if (phase) seenPhases.add(phase);
            actor = player;
            completedTurns.set(player, (completedTurns.get(player) || 0) + 1);
            await evaluate("turnEnd"); await evaluate("state");
        },
        evaluate,
        get ready() { return ready; },
        get busy() { return running; },
        get pendingEnemies() { return plan.rules.some(rule => rule.blocksVictory && !fired.has(rule.id) && rule.effects.some(e => (e.type === "spawn" && e.unit.camp === "enemy") || (e.type === "camp" && e.camp === "enemy"))); },
        get defeatedEnemies() { return [...units.values()].filter(p => { const s = adapters.state(p); return s.camp === "enemy" && !s.alive; }).length; },
        dispose() { disposed = true; units.clear(); },
    };
}
