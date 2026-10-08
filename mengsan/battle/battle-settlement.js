// 结算选择留在内存；玩家确认后只提交最终地图进度或结束征程。
import { applyBattleEndRelics } from "../relics/battle.js";
import { applySharedBattleEndCards } from "../cards/shared-battle-end.js";
import { settleBondBattle } from "../bonds/state.js";
import { recordNormalBattleVictory } from "../progression/encounter-progress.js";
import { stripBattleProgress } from "../progression/map-checkpoint.js";
import { grantGold } from "../relics/progression.js";
import { heldRelics } from "../relics/definitions.js";
import { getDiagnostics } from "../../diagnostics/index.js";
import { prepareRewardPackage, applyRewardPackage }
    from "../progression/reward-package.js";

const copy = value => JSON.parse(JSON.stringify(value));
const idFor = (run, node) => JSON.stringify([run.runId, run.actIndex, node.id]);
export function createBattleSettlement({
    store, config, getRandomRewardChoices, applyReward, completeNode,
    enterNextAct, createRun, now = Date.now, logRewardPackage = () => {}, resolveRelicChoices = async () => {},
}) {
    let item = null, committed = null, commitPromise = null, choicePromise = null, choiceSignature = null;
    const diagnostics = getDiagnostics().scope("mengsan.settlement", () => ({
        settlementId: item?.id, runId: item?.base.runId,
        nodeId: item?.nodeId, pendingState: item?.state,
        route: item?.route, commitReceipt: !!committed,
    }));
    const readRun = () => store.read()[config.saveKey];
    function current(storage, runId) {
        const run = storage[config.saveKey];
        if (!run || run.runId !== runId || run.status !== "running") throw new Error("Stale run: settlement refused");
        return run;
    }
    function pending(runId, id) {
        if (!item || item.id !== id || item.base.runId !== runId) throw new Error("Settlement checkpoint mismatch");
        return item;
    }
    function validateCheckpoint(run, snapshot, nodeId) {
        if (run.actIndex !== snapshot.actIndex || run.revision !== snapshot.revision ||
            run.map?.nodes.find(node => node.id === nodeId)?.completed !== false) {
            diagnostics.warn("checkpoint.mismatch", {
                expectedRevision: snapshot.revision, actualRevision: run.revision,
                expectedAct: snapshot.actIndex, actualAct: run.actIndex,
                nodeId, completed: run.map?.nodes.find(node => node.id === nodeId)?.completed,
            });
            throw new Error("Stale node or revision");
        }
    }
    const api = {
        readRun,
        // 创建内存候选不调用存档写入；阵亡弹窗等待多久都不改上次地图存档。
        async prepare({run: snapshot, node, encounter, hp, outcome = "victory"}) {
            if (!["victory", "defeat"].includes(outcome)) throw new Error("Unknown battle outcome");
            if (outcome === "victory" && (!Number.isFinite(hp) || (!encounter.rewardPackage && (!Number.isSafeInteger(encounter.gold) || encounter.gold < 0)))) throw new Error("Invalid battle result");
            const id = idFor(snapshot, node);
            const run = current(store.read(), snapshot.runId);
            if (item) {
                if (item.id !== id || item.outcome !== outcome) throw new Error("Another settlement is pending");
                return copy(item);
            }
            validateCheckpoint(run, snapshot, node.id);
            // Battle may have changed RNG/card state since the last checkpoint.
            const base = copy(snapshot); delete base.battleFlow;
            applySharedBattleEndCards(base,outcome);
            const bondGrowth = settleBondBattle(base, node);
            if (outcome === "victory") {
                recordNormalBattleVictory(base, node, encounter);
                base.player.hp = Math.max(1, Math.min(hp, base.player.maxHp ?? hp));
                base.statistics.defeatedEnemies += encounter.defeatedEnemies ?? 1;
            }
            const relicRecovery = hp > 0
                ? applyBattleEndRelics(base, outcome, {node,encounter}) : 0;
            const elite = !encounter.boss && encounter.tier === "elite";
            const rewardPool = encounter.boss ? "shared.pool.boss.premium"
                : elite ? "shared.pool.battle.elite" : encounter.rewardPool;
            const rewards = outcome === "victory" && !encounter.skipRandomReward ? getRandomRewardChoices(base, rewardPool, 3, {
                allowSharedCards: !encounter.boss && encounter.allowSharedCardRewards === true,
            }).filter(c => c.name) : [];
            const fixedRewards = [...(encounter.fixedRewards || [])];
            // 同一内存候选固定这件遗物；选择或跳过卡牌均领取，不在 UI 抽取。
            if (outcome === "victory") {
                const extra=heldRelics(base).reduce((n,r)=>n+(elite ? r.rule.eliteRelics || 0 : 0)+(encounter.boss && base.actIndex===0 ? r.rule.actOneBossRelics || 0 : 0),0);
                const count=(elite ? 1 : 0)+extra;
                const relics=count>0 ? getRandomRewardChoices(base,encounter.guaranteedRelicPool || "shared.pool.elite.relics",count) : [];
                for(const relic of relics)fixedRewards.push(relic.id);
            }
            // 金币随最终结果一次性提交。
            const choices = outcome === "victory" && !encounter.rewardPackage
                ? [{id:"mengsan.reward.gold.shuying", kind:"gold", name:"金币", amount:encounter.gold}, ...rewards] : [];
            const rewardPackage = outcome === "victory" && encounter.rewardPackage
                ? prepareRewardPackage(base, encounter.rewardPackage,
                    getRandomRewardChoices) : null;
            item = {id, state:"awaitingChoice", nodeId:node.id, base, choices:copy(choices), fixedRewards:copy(fixedRewards), victoryDialogue:copy(encounter.victoryDialogue || []), boss:!!encounter.boss, elite, outcome, relicRecovery, bondGrowth};
            item.rewardPackage = copy(rewardPackage);
            diagnostics.info("prepared", {
                outcome, choices: choices.map(choice => choice.id), fixedRewards,
                expectedRevision: snapshot.revision, actualRevision: run.revision,
            });
            if (outcome === "victory" && !rewardPackage) {
                item.rewardMode = "one-or-skip";
            }
            return copy(item);
        },
        async choose(runId, id, choiceId) {
            const item = pending(runId, id);
            const run = current(store.read(), runId);
            validateCheckpoint(run, item.base, item.nodeId);
            if (item.outcome === "defeat") {
                const action = choiceId;
                if (!["restart", "menu"].includes(action)) throw new Error("Invalid defeat action");
                if (item.failureAction) {
                    if (item.failureAction !== action) throw new Error("Defeat choice already locked");
                    return copy(item);
                }
                if (action === "restart") {
                    const character = item.base.player.character;
                    if (typeof createRun !== "function") {
                        throw new Error("Invalid new journey character");
                    }
                    // 当前角色从头开始；保存失败后重试沿用同一新征程，不重新生成。
                    const nextRun = createRun(character);
                    if (!nextRun || nextRun.player?.character !== character ||
                        nextRun.status !== "running" || nextRun.runId === runId) {
                        throw new Error("Invalid new journey");
                    }
                    item.nextRun = stripBattleProgress(nextRun);
                }
                item.result = stripBattleProgress(copy(item.base));
                item.result.status = "failed";
                item.state = "chosen"; item.choiceId = copy(choiceId);
                item.failureAction = action; item.route = action === "restart" ? "new" : "menu"; item.completedAt = now();
                return copy(item);
            }
            if (item.state === "chosen") {
                const sameChoice = item.rewardPackage
                    ? item.choiceId?.cardId === choiceId?.cardId &&
                        item.choiceId?.relicId === choiceId?.relicId
                    : item.choiceId === choiceId;
                if (!sameChoice) throw new Error("Choice already locked");
                return copy(item);
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
                    // 结果只计算一次；保存失败后的重试不再次发放金币。
                    for (const gold of item.choices.filter(c => c.kind === "gold")) {
                        if (!Number.isSafeInteger(gold.amount) || gold.amount < 0) throw new Error("Invalid pending gold reward");
                        grantGold(result,gold.amount);
                    }
                    if (reward) {
                        applyReward(result, reward.effectId || reward.id);
                    }
                    for (const rewardId of item.fixedRewards || []) applyReward(result, rewardId);
                } else {
                    for (const rewardId of item.fixedRewards || []) applyReward(result, rewardId);
                }
                await resolveRelicChoices(result);
                if (!completeNode(result, item.nodeId)) throw new Error("Node completion failed");
                route = item.boss && !enterNextAct(result) ? "victory" : "map";
            } else result.status = "failed";
            // 在内存锁定最终结果（包括随机牌实例），只在 commit 写入地图进度。
            item.state = "chosen"; item.choiceId = copy(choiceId); item.result = stripBattleProgress(result);
            item.route = route; item.completedAt = now();
            diagnostics.info("choice.applied", { choiceId, route });
            if (item.rewardPackage && item.outcome === "victory") {
                logRewardPackage(item.rewardPackage, choiceId);
            }
            return copy(item);
        },
        async commit(runId, id) {
            const item = pending(runId, id);
            if (item.state !== "chosen") throw new Error("Player choice required before saving");
            if (committed) {
                diagnostics.info("commit.duplicate");
                return {...copy(committed), duplicate:true};
            }
            if (commitPromise) { diagnostics.info("commit.inflight"); return commitPromise; }
            commitPromise = store.update(storage => {
                const saved = storage[config.saveKey];
                const prior = storage[config.profileKey]?.completedRuns?.find(r => r.runId === runId && r.settlementId === id);
                if (prior && item.route !== "map") {
                    if (item.route === "new" && saved?.runId !== item.nextRun.runId) {
                        throw new Error("Restart checkpoint changed");
                    }
                    return {route:item.route, run:copy(item.route === "new" ? saved : item.result), duplicate:true};
                }
                if (item.route === "map" && saved?.runId === runId &&
                    saved.map?.nodes.some(node => node.id === item.nodeId && node.completed)) {
                    return {route:"map", run:saved, duplicate:true};
                }
                const run = current(storage, runId);
                validateCheckpoint(run, item.base, item.nodeId);
                const result = stripBattleProgress(copy(item.result));
                if (item.route === "map") storage[config.saveKey] = result;
                else {
                    const profile = storage[config.profileKey] ||= {wins:0, completedRuns:[]};
                    profile.completedRuns ||= [];
                    if (!profile.completedRuns.some(r => r.runId === runId)) {
                        if (item.route === "victory") profile.wins = (profile.wins || 0) + 1;
                        profile.completedRuns.push({runId, settlementId:id, outcome:item.outcome, character:result.player.character,
                            completedNodes:result.statistics.completedNodes, goldEarned:result.statistics.goldEarned, completedAt:item.completedAt});
                    }
                    if (item.route === "new") storage[config.saveKey] = stripBattleProgress(copy(item.nextRun));
                    else delete storage[config.saveKey]; // Same transaction as profile; never a second clear write.
                }
                return {route:item.route, run:item.route === "new" ? copy(item.nextRun) : result, duplicate:false};
            }, { runId, settlementId: id, nodeId: item.nodeId }).then(result => {
                committed = copy(result);
                diagnostics.info("commit.receipt", { duplicate: result.duplicate, route: result.route });
                return copy(committed);
            }).finally(() => { commitPromise = null; });
            return commitPromise;
        },
    };
    const chooseOnce=api.choose;
    api.choose=(runId,id,choiceId)=>{
        const signature=JSON.stringify([runId,id,choiceId]);
        if(choicePromise){
            if(signature!==choiceSignature)return Promise.reject(new Error("Another reward choice is pending"));
            return choicePromise;
        }
        choiceSignature=signature;
        choicePromise=chooseOnce(runId,id,choiceId).finally(()=>{choicePromise=null;choiceSignature=null;});
        return choicePromise;
    };
    return Object.freeze(api);
}
