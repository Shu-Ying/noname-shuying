// Candidate settlement adapter. Dependencies are the current mode/state reward functions.
import { applyBattleEndRelics } from "../relics/battle.js";
import { settleBondBattle } from "../bonds/state.js";

const copy = value => JSON.parse(JSON.stringify(value));
const idFor = (run, node) => JSON.stringify([run.runId, run.actIndex, node.id]);
export function createBattleSettlement({store, config, getRandomRewardChoices, applyReward, completeNode, enterNextAct, now = Date.now}) {
    const readRun = () => store.read()[config.saveKey];
    function current(storage, runId) {
        const run = storage[config.saveKey];
        if (!run || run.runId !== runId) throw new Error("Stale run: settlement refused");
        run.battleFlow ||= { receipts: [], pending: null };
        return run;
    }
    function pending(storage, runId, id) {
        const run = current(storage, runId), item = run.battleFlow.pending;
        if (!item || item.id !== id) throw new Error("Settlement checkpoint mismatch");
        return {run, item};
    }
    return Object.freeze({
        readRun,
        // Persist fixed candidates before opening choice UI. No mutation of the live run.
        async prepare({run: snapshot, node, encounter, hp, outcome = "victory"}) {
            if (!["victory", "defeat"].includes(outcome)) throw new Error("Unknown battle outcome");
            if (outcome === "victory" && (!Number.isFinite(hp) || (!encounter.skipRandomReward && (!Number.isSafeInteger(encounter.gold) || encounter.gold < 0)))) throw new Error("Invalid battle result");
            const id = idFor(snapshot, node);
            return store.update(storage => {
                const run = current(storage, snapshot.runId);
                if (run.battleFlow.receipts.includes(id)) throw new Error("Battle already settled");
                if (run.battleFlow.pending) {
                    if (run.battleFlow.pending.id !== id) throw new Error("Another settlement is pending");
                    return run.battleFlow.pending;
                }
                if (run.actIndex !== snapshot.actIndex || run.revision !== snapshot.revision ||
                    run.map?.nodes.find(n => n.id === node.id)?.completed !== false) {
                    throw new Error("Stale node or revision");
                }
                // Battle may have changed RNG/card state since the last checkpoint.
                const base = copy(snapshot); delete base.battleFlow;
                const bondGrowth = settleBondBattle(base);
                if (outcome === "victory") {
                    base.player.hp = Math.max(1, Math.min(hp, base.player.maxHp ?? hp));
                    base.statistics.defeatedEnemies += encounter.defeatedEnemies ?? 1;
                }
                const relicRecovery = hp > 0
                    ? applyBattleEndRelics(base, outcome) : 0;
                const rewards = outcome === "victory" && !encounter.skipRandomReward ? getRandomRewardChoices(base, encounter.rewardPool).filter(c => c.name) : [];
                if (outcome === "victory" && !encounter.skipRandomReward && !rewards.length) throw new Error("Empty battle reward pool");
                // Persist the configured amount as a candidate, never as automatic victory income.
                const choices = outcome === "victory" && !encounter.skipRandomReward
                    ? [{id:"mengsan.reward.gold.shuying", kind:"gold", name:"金币", amount:encounter.gold}, ...rewards] : [];
                run.battleFlow.pending = {id, state:"awaitingChoice", nodeId:node.id, base, choices:copy(choices), fixedRewards:copy(encounter.fixedRewards || []), victoryDialogue:copy(encounter.victoryDialogue || []), boss:!!encounter.boss, outcome, relicRecovery, bondGrowth};
                return run.battleFlow.pending;
            });
        },
        async choose(runId, id, choiceId) {
            return store.update(storage => {
                const {item} = pending(storage, runId, id);
                if (item.state === "chosen") {
                    if (item.choiceId !== choiceId) throw new Error("Choice already locked");
                    return item;
                }
                const result = copy(item.base);
                let route = "defeat";
                if (item.outcome === "victory") {
                    const choice = item.choices.find(c => c.id === choiceId);
                    if (item.choices.length && choiceId !== null) {
                        if (!choice) throw new Error("Reward is not a fixed candidate");
                        if (choice.kind === "gold") {
                            if (!Number.isSafeInteger(choice.amount) || choice.amount < 0) throw new Error("Invalid pending gold reward");
                            result.player.gold += choice.amount;
                            result.statistics.goldEarned += choice.amount;
                        } else applyReward(result, choice.effectId || choice.id);
                    } else if (choiceId !== null) throw new Error("Unexpected reward selection");
                    for (const rewardId of item.fixedRewards || []) applyReward(result, rewardId);
                    if (!completeNode(result, item.nodeId)) throw new Error("Node completion failed");
                    route = item.boss && !enterNextAct(result) ? "victory" : "map";
                } else result.status = "failed";
                // Save the exact result (including random card ID/target) before final commit.
                item.state = "chosen"; item.choiceId = choiceId; item.result = result;
                item.route = route; item.completedAt = now();
                return item;
            });
        },
        async commit(runId, id) {
            return store.update(storage => {
                const saved = storage[config.saveKey];
                const prior = storage[config.profileKey]?.completedRuns?.find(r => r.runId === runId && r.settlementId === id);
                if (!saved && prior) return {route:prior.outcome, run:null, duplicate:true};
                if (saved?.runId === runId && saved.battleFlow?.receipts?.includes(id)) return {route:"map", run:saved, duplicate:true};
                const {run, item} = pending(storage, runId, id);
                if (item.state !== "chosen") throw new Error("Durable chosen result required");
                const result = copy(item.result);
                result.battleFlow = {receipts:[...run.battleFlow.receipts, id], pending:null};
                if (item.route === "map") storage[config.saveKey] = result;
                else {
                    const profile = storage[config.profileKey] ||= {wins:0, completedRuns:[]};
                    profile.completedRuns ||= [];
                    if (!profile.completedRuns.some(r => r.runId === runId)) {
                        if (item.route === "victory") profile.wins = (profile.wins || 0) + 1;
                        profile.completedRuns.push({runId, settlementId:id, outcome:item.route, character:result.player.character,
                            completedNodes:result.statistics.completedNodes, goldEarned:result.statistics.goldEarned, completedAt:item.completedAt});
                    }
                    delete storage[config.saveKey]; // Same transaction as profile; never a second clear write.
                }
                return {route:item.route, run:result, duplicate:false};
            });
        },
    });
}
