import { bondDefinitions, getBondCombat } from "./definitions.js";

export const bondProbability = level => {
    if (!Number.isInteger(level) || level < 1 || level > 10) throw new RangeError("羁绊等级必须为1至10");
    return (level - 1) / 9;
};

export function bondBattleStatus(battle) {
    if (battle?.arrived) return "已到场";
    return ({opening: "角色专属首战不触发助战", down: "濒死，尚未救助",
        unconfigured: "本等级战斗配置未补齐", chance: "本场未通过助战概率判定",
        ready: "本场助战就绪"})[battle?.reason] || "本场未到场";
}

export function ensureBonds(run) {
    const bonds = run.player.bonds ||= { selected: null, npcs: {} };
    // 只设置一次默认值；以后主动取消助战或改选张飞均不会被覆盖。
    if (run.player.character === "mengsan_liubei_shuying" && bonds.npcs.guanyu &&
        !bonds.innateSelectionInitialized) {
        if (bonds.selected == null) bonds.selected = "guanyu";
        bonds.innateSelectionInitialized = true;
    }
    return bonds;
}

export function meetBond(run, id, level = 1) {
    if (!Object.hasOwn(bondDefinitions, id) || !Number.isInteger(level)
        || level < 1 || level > 10) throw new Error("羁绊 NPC 或等级无效");
    const bonds = ensureBonds(run);
    if (bonds.npcs[id]) return false;
    bonds.npcs[id] = { level, progress: 0, down: false };
    return true;
}

export function initializeInnateBonds(run) {
    ensureBonds(run);
    if (run.player.character === "mengsan_liubei_shuying") {
        meetBond(run, "guanyu", 8);
        meetBond(run, "zhangfei", 8);
        ensureBonds(run);
    }
}

export function selectBond(run, id) {
    const bonds = ensureBonds(run);
    if (id !== null && (!Object.hasOwn(bondDefinitions, id) || !Object.hasOwn(bonds.npcs, id))) {
        throw new Error("尚未结识该 NPC");
    }
    bonds.selected = id;
}

export function rescueBond(run, id) {
    const npc = ensureBonds(run).npcs[id];
    if (!npc?.down) return false;
    npc.down = false;
    return true;
}

export function markBondDown(run, id) {
    const npc = ensureBonds(run).npcs[id];
    if (npc) npc.down = true;
}

// 第一章第一层的角色专属开场：不判定助战，也不累计本场羁绊成长。
const isCharacterOpeningBattle = (run, node) =>
    run.actIndex === 0 && node?.floor === 0;

export function prepareBondBattle(run, random, node = null) {
    const bonds = ensureBonds(run);
    const id = bonds.selected;
    const npc = Object.hasOwn(bondDefinitions, id) && Object.hasOwn(bonds.npcs, id) ? bonds.npcs[id] : null;
    run.bondBattle = npc ? { id, arrived: false, reason: "ready" } : null;
    if (isCharacterOpeningBattle(run, node)) {
        if (run.bondBattle) run.bondBattle.reason = "opening";
        return null;
    }
    if (!npc) return null;
    if (npc.down) { run.bondBattle.reason = "down"; return null; }
    const combat = getBondCombat(id, npc.level);
    if (!combat) { run.bondBattle.reason = "unconfigured"; return null; }
    if (typeof random !== "function") throw new TypeError("羁绊助战缺少随机数接口");
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("羁绊助战随机数必须在[0,1)内");
    if (roll >= bondProbability(npc.level)) { run.bondBattle.reason = "chance"; return null; }
    return combat;
}

export function settleBondBattle(run, node = null) {
    if (isCharacterOpeningBattle(run, node)) {
        run.bondBattle = null;
        return null;
    }
    const battle = run.bondBattle;
    if (!battle) return null;
    const npc = ensureBonds(run).npcs[battle.id];
    if (!npc) throw new Error("助战羁绊记录丢失");
    if (!Number.isInteger(npc.level) || npc.level < 1 || npc.level > 10 ||
        !Number.isInteger(npc.progress) || npc.progress < 0 || npc.progress >= 100) {
        throw new Error("羁绊等级或成长进度无效，拒绝结算");
    }
    const gain = battle.arrived ? 50 : 25;
    if (npc.level < 10) {
        npc.progress += gain;
        while (npc.progress >= 100 && npc.level < 10) {
            npc.progress -= 100;
            npc.level++;
        }
    }
    if (npc.level === 10) npc.progress = 0;
    run.bondBattle = null;
    return { id: battle.id, gain, level: npc.level, progress: npc.progress };
}
