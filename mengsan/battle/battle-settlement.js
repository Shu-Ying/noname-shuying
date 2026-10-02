// Candidate settlement adapter. Dependencies are the current mode/state reward functions.
import { applyBattleEndRelics } from "../relics/battle.js";
import { settleBondBattle } from "../bonds/state.js";
import { prepareRewardPackage, applyRewardPackage }
    from "../progression/reward-package.js";

const copy = value => JSON.parse(JSON.stringify(value));
const idFor = (run, node) => JSON.stringify([run.runId, run.actIndex, node.id]);
export function createBattleSettlement({
    store, config, getRandomRewardChoices, applyReward, completeNode,
    enterNextAct, createRun, now = Date.now, logRewardPackage = () => {},
}) {
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
        async prepare({run: snapshot, retryRun, node, encounter, hp, outcome = "victory"}) {
            if (!["victory", "defeat"].includes(outcome)) throw new Error("Unknown battle outcome");
            if (outcome === "victory" && (!Number.isFinite(hp) || (!encounter.rewardPackage && (!Number.isSafeInteger(encounter.gold) || encounter.gold < 0)))) throw new Error("Invalid battle result");
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
                const bondGrowth = settleBondBattle(base, node);
                if (outcome === "victory") {
                    base.player.hp = Math.max(1, Math.min(hp, base.player.maxHp ?? hp));
                    base.statistics.defeatedEnemies += encounter.defeatedEnemies ?? 1;
                }
                const relicRecovery = hp > 0
                    ? applyBattleEndRelics(base, outcome) : 0;
                const rewards = outcome === "victory" && !encounter.skipRandomReward ? getRandomRewardChoices(base, encounter.rewardPool).filter(c => c.name) : [];
                // Persist guaranteed gold alongside loot; award it once in the chosen result.
                const choices = outcome === "victory" && !encounter.rewardPackage
                    ? [{id:"mengsan.reward.gold.shuying", kind:"gold", name:"金币", amount:encounter.gold}, ...rewards] : [];
                const rewardPackage = outcome === "victory" && encounter.rewardPackage
                    ? prepareRewardPackage(base, encounter.rewardPackage,
                        getRandomRewardChoices) : null;
                run.battleFlow.pending = {id, state:"awaitingChoice", nodeId:node.id, base, choices:copy(choices), fixedRewards:copy(encounter.fixedRewards || []), victoryDialogue:copy(encounter.victoryDialogue || []), boss:!!encounter.boss, outcome, relicRecovery, bondGrowth};
                run.battleFlow.pending.rewardPackage = copy(rewardPackage);
                if (outcome === "victory" && !rewardPackage) {
                    run.battleFlow.pending.rewardMode = "one-or-skip";
                }
                if (outcome === "defeat") {
                    const beforeBattle = retryRun || run;
                    if (beforeBattle.runId !== run.runId ||
                        beforeBattle.actIndex !== run.actIndex ||
                        beforeBattle.revision !== run.revision) throw new Error("Stale retry checkpoint");
                    run.battleFlow.pending.retryRun = copy(beforeBattle);
                    run.battleFlow.pending.retryRun.battleFlow = {
                        receipts:copy(run.battleFlow.receipts), pending:null,
                    };
                    run.battleFlow.pending.retryNode = copy(node);
                    run.battleFlow.pending.retryEncounter = copy(encounter);
                }
                return run.battleFlow.pending;
            });
        },
        async choose(runId, id, choiceId) {
            return store.update(storage => {
                const {run, item} = pending(storage, runId, id);
                if (item.outcome === "defeat") {
                    const action = typeof choiceId === "string" ? choiceId : choiceId?.action;
                    if (!["retry", "new"].includes(action)) throw new Error("Invalid defeat action");
                    if (item.failureAction) {
                        if (item.failureAction !== action ||
                            (action === "new" && item.choiceId.character !== choiceId.character)) {
                            throw new Error("Defeat choice already locked");
                        }
                        return item;
                    }
                    if (action === "new") {
                        if (!config.characters.includes(choiceId.character) || typeof createRun !== "function") {
                            throw new Error("Invalid new journey character");
                        }
                        // Generate once in the chosen checkpoint; a commit retry must not reroll it.
                        item.nextRun = createRun(choiceId.character);
                        if (!item.nextRun || item.nextRun.status !== "running" || item.nextRun.runId === runId) {
                            throw new Error("Invalid new journey");
                        }
                        item.result = copy(item.base);
                        item.result.status = "failed";
                    } else {
                        // Old pending saves have no retryRun: retain their last successful save.
                        item.result = copy(item.retryRun || run);
                        item.result.status = "running";
                        item.result.battleFlow = {receipts:copy(run.battleFlow.receipts), pending:null};
                        item.retryNode ||= copy(run.map?.nodes.find(node => node.id === item.nodeId));
                        if (!item.retryNode || item.retryNode.completed) throw new Error("Missing retry battle node");
                    }
                    item.state = "chosen"; item.choiceId = copy(choiceId);
                    item.failureAction = action; item.route = action; item.completedAt = now();
                    return item;
                }
                if (item.state === "chosen") {
                    const sameChoice = item.rewardPackage
                        ? item.choiceId?.cardId === choiceId?.cardId &&
                            item.choiceId?.relicId === choiceId?.relicId
                        : item.choiceId === choiceId;
                    if (!sameChoice) throw new Error("Choice already locked");
                    return item;
                }
                const result = copy(item.base);
                let route = "defeat";
                if (item.outcome === "victory") {
                    if (item.rewardPackage) {
                        applyRewardPackage(result, item.rewardPackage, choiceId,
                            applyReward);
                    }
                    if (!item.rewardPackage) {
                        const reward = item.choices.find(c => c.id === choiceId && c.kind !== "gold");
                        if (choiceId !== null && !reward) {
                            throw new Error("Choose one pending reward or skip");
                        }
                        // This result is persisted before commit; retries never credit gold twice.
                        for (const gold of item.choices.filter(c => c.kind === "gold")) {
                            if (!Number.isSafeInteger(gold.amount) || gold.amount < 0) throw new Error("Invalid pending gold reward");
                            result.player.gold += gold.amount;
                            result.statistics.goldEarned += gold.amount;
                        }
                        if (reward) {
                            applyReward(result, reward.effectId || reward.id);
                        }
                        for (const rewardId of item.fixedRewards || []) applyReward(result, rewardId);
                    } else {
                        for (const rewardId of item.fixedRewards || []) applyReward(result, rewardId);
                    }
                    if (!completeNode(result, item.nodeId)) throw new Error("Node completion failed");
                    route = item.boss && !enterNextAct(result) ? "victory" : "map";
                } else result.status = "failed";
                // Save the exact result (including random card ID/target) before final commit.
                item.state = "chosen"; item.choiceId = choiceId; item.result = result;
                item.route = route; item.completedAt = now();
                if (item.rewardPackage && item.outcome === "victory") {
                    logRewardPackage(item.rewardPackage, choiceId);
                }
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
                if (item.route === "retry") {
                    // A failed attempt does not complete this node or add its victory receipt.
                    result.battleFlow = {receipts:copy(run.battleFlow.receipts), pending:null,
                        retry:{node:copy(item.retryNode), encounter:copy(item.retryEncounter || null)}};
                    storage[config.saveKey] = result;
                    return {route:"retry", run:result, retryNode:copy(item.retryNode),
                        retryEncounter:copy(item.retryEncounter || null), duplicate:false};
                }
                result.battleFlow = {receipts:[...run.battleFlow.receipts, id], pending:null};
                if (item.route === "map") storage[config.saveKey] = result;
                else {
                    const profile = storage[config.profileKey] ||= {wins:0, completedRuns:[]};
                    profile.completedRuns ||= [];
                    if (!profile.completedRuns.some(r => r.runId === runId)) {
                        if (item.route === "victory") profile.wins = (profile.wins || 0) + 1;
                        profile.completedRuns.push({runId, settlementId:id, outcome:item.route === "new" ? "defeat" : item.route, character:result.player.character,
                            completedNodes:result.statistics.completedNodes, goldEarned:result.statistics.goldEarned, completedAt:item.completedAt});
                    }
                    if (item.route === "new") storage[config.saveKey] = copy(item.nextRun);
                    else delete storage[config.saveKey]; // Same transaction as profile; never a second clear write.
                }
                return {route:item.route, run:item.route === "new" ? copy(item.nextRun) : result, duplicate:false};
            });
        },
    });
}
