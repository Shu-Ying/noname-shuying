import { bondDefinitions, getBondCombat } from "./definitions.js";

export const bondProbability = level => (level - 1) / 9;

export function ensureBonds(run) {
    return run.player.bonds ||= { selected: null, npcs: {} };
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
    }
}

export function selectBond(run, id) {
    const bonds = ensureBonds(run);
    if (id !== null && !Object.hasOwn(bonds.npcs, id)) {
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
    if (isCharacterOpeningBattle(run, node)) {
        run.bondBattle = null;
        return null;
    }
    const bonds = ensureBonds(run);
    const id = bonds.selected;
    const npc = bonds.npcs[id];
    run.bondBattle = npc ? { id, arrived: false } : null;
    if (!npc || npc.down) return null;
    const combat = getBondCombat(id, npc.level);
    if (!combat || random() >= bondProbability(npc.level)) return null;
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
