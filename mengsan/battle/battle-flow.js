// Candidate external coordinator. Finish callbacks return a boolean, NEVER a drain promise.
import { getDiagnostics } from "../../diagnostics/index.js";
const copy = value => JSON.parse(JSON.stringify(value));
export function createBattleFlow({settlement, chooseReward, chooseDefeat, showMap, showEnding, quiesce, releaseSkills = async () => {}, releaseBattle = () => {}, presentVictory = async () => {}}) {
    let state = "map", active = null, work = null, job = null, error = null;
    let phase = "map", attempt = 0;
    const diagnostics = getDiagnostics().scope("mengsan.flow", () => ({
        state, phase, attempt, sessionId: active?.session.id,
        sessionState: active?.session.state,
        pendingTasks: active?.session.pendingCount,
        runId: active?.run.runId, revision: active?.run.revision,
        nodeId: active?.node.id, settlementId: job?.pending?.id,
        outcome: job?.input?.outcome, commitReceipt: !!job?.committed,
        skillsReleased: !!job?.skillsReleased, delivered: !!job?.delivered,
    }));
    const step = (name, action, wait = true) => {
        phase = name;
        return diagnostics.step(name, action, {}, { observeWait: wait });
    };
    async function drive() {
        try {
            state = "draining";
            await step("drain", () => active.session.drain());
            // Allow mode-start/parent frames and foreign pauses to unwind; never resume them.
            await step("quiesce.beforePrepare", quiesce);
            if (!job.pending) job.pending = await step("prepare", () => settlement.prepare(job.input));
            if (job.pending.outcome === "victory" && !job.victoryPresented) {
                await step("victoryDialogue", () => presentVictory(copy(job.pending)), false);
                job.victoryPresented = true;
            }
            if (job.pending.state !== "chosen") {
                state = "choosing";
                if (!job.hasChoice) {
                    job.choiceId = await step("rewardSelection", () => job.pending.outcome === "defeat" ? chooseDefeat(copy(job.pending.base))
                        : chooseReward(copy(job.pending.choices), {
                            boss: job.pending.boss,
                            elite: job.pending.elite,
                            fixedRewards: copy(job.pending.fixedRewards || []),
                            rewardPackage: copy(job.pending.rewardPackage || null),
                        }), false);
                    if (job.pending.outcome !== "defeat" && !job.pending.rewardPackage &&
                        job.choiceId !== null &&
                        !job.pending.choices.some(c => c.id === job.choiceId && c.kind !== "gold")) throw new Error("Invalid reward selection");
                    job.hasChoice = true;
                }
                job.pending = await step("applyChoice", () => settlement.choose(job.input.run.runId, job.pending.id, job.choiceId));
            }
            if (!job.committed) {
                state = "committing";
                job.committed = await step("commit", () => settlement.commit(job.input.run.runId, job.pending.id));
            }
            if (!job.skillsReleased) {
                state = "releasingSkills";
                await step("releaseSkills", releaseSkills);
                job.skillsReleased = true;
                await step("quiesce.afterSkills", quiesce);
            }
            state = "cleaning";
            await step("dispose", () => active.session.dispose()); // Failed cleanup retry does NOT replay a committed reward.
            await step("quiesce.afterDispose", quiesce);
            if (!job.battleReleased) {
                await step("releaseBattle", releaseBattle);
                job.battleReleased = true;
            }
            if (!job.delivered) {
                state = "presenting";
                if (job.committed.route === "map") {
                    const mapRun = copy(job.committed.run);
                    job.nextNode = await step("showMap", () => showMap(mapRun), false);
                    job.committed.run = mapRun;
                }
                else if (job.committed.route !== "new") {
                    await step("showEnding", () => showEnding(job.committed.route, copy(job.committed.run)), false);
                }
                job.delivered = true;
            }
            state = job.committed.route === "map" ? "map" : "ended";
            diagnostics.info("settlement.complete", { route: job.committed.route });
            return {...copy(job.committed), nextNode:copy(job.nextNode ?? null)};
        } catch (cause) {
            diagnostics.error("settlement.failed", cause, { failedPhase: phase });
            error = cause; state = "retryable"; throw cause;
        }
    }
    function launch() {
        attempt++;
        error = null; state = "draining";
        work = Promise.resolve().then(drive);
        // The engine callback is fire-and-forget; keep failure observable without unhandled rejection.
        work.catch(() => {});
    }
    return Object.freeze({
        get state() { return state; },
        get error() { return error; },
        async enterBattle({session, run, node, encounter, start}) {
            if (state !== "map") throw new Error("Map handoff not ready");
            const saved = settlement.readRun();
            if (!saved || saved.runId !== run.runId || saved.revision !== run.revision) throw new Error("Stale battle input");
            state = "starting";
            try {
                await step("quiesce.beforeBattle", quiesce);
                active = {session, run, node:copy(node), encounter:copy(encounter)};job = null;work = null;
                // start MUST schedule only; it must not await the battle root's completion.
                state = "battle"; attempt = 0; start();
                diagnostics.info("battle.started");
            } catch (cause) {
                diagnostics.error("battle.start.failed", cause, { runId: run.runId, nodeId: node.id });
                state = "blocked"; error = cause; throw cause;
            }
        },
        requestFinish({session, hp, outcome = "victory", defeatedEnemies = 1}) {
            if (state !== "battle" || session !== active.session) {
                diagnostics.info("finish.ignored", { requestedSessionId: session?.id, outcome });
                return false;
            }
            if (!["victory", "defeat"].includes(outcome)) throw new Error("Unknown outcome");
            if (!Number.isInteger(defeatedEnemies) || defeatedEnemies < 0) throw new Error("Invalid defeated enemy count");
            job = {input:{run:copy(active.run),node:copy(active.node),encounter:{...copy(active.encounter),defeatedEnemies},hp,outcome}};
            state = "stopping";
            diagnostics.info("finish.accepted", { hp, defeatedEnemies });
            active.session.requestStop();
            launch();
            return true; // No game.pause/resume: stop loop, let current body unwind, then open rewards.
        },
        retry() {
            if (state !== "retryable") throw new Error("No failed settlement to retry");
            diagnostics.info("settlement.retry");
            launch(); return work;
        },
        wait() { if (!work) throw new Error("No settlement requested"); return work; },
    });
}

// Run outside engine events. No busy poll, no global queue clearing, no pause ownership guessing.
export async function quiesceEngine({eventManager, pauseManager}, nextTask = () => new Promise(resolve => setTimeout(resolve, 0))) {
    await nextTask();
    await pauseManager.waitPause();
    if (eventManager.eventStack.length || eventManager.tempEvent) throw new Error("Engine event stack is not idle");
}
