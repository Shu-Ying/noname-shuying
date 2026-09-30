// Candidate external coordinator. Finish callbacks return a boolean, NEVER a drain promise.
const copy = value => JSON.parse(JSON.stringify(value));
export function createBattleFlow({settlement, chooseReward, showMap, showEnding, quiesce, releaseSkills = async () => {}, presentVictory = async () => {}}) {
    let state = "map", active = null, work = null, job = null, error = null;
    async function drive() {
        try {
            state = "draining";
            await active.session.drain();
            // Allow mode-start/parent frames and foreign pauses to unwind; never resume them.
            await quiesce();
            if (!job.pending) job.pending = await settlement.prepare(job.input);
            if (job.pending.outcome === "victory" && !job.victoryPresented) {
                await presentVictory(copy(job.pending));
                job.victoryPresented = true;
            }
            if (job.pending.state !== "chosen") {
                state = "choosing";
                if (!job.hasChoice) {
                    job.choiceId = job.pending.outcome === "defeat" ? null
                        : await chooseReward(copy(job.pending.choices), {
                            boss: job.pending.boss,
                            fixedRewards: copy(job.pending.fixedRewards || []),
                        });
                    if (job.pending.outcome !== "defeat" && job.pending.choices.length && job.choiceId !== null && !job.pending.choices.some(c => c.id === job.choiceId)) throw new Error("Invalid reward selection");
                    job.hasChoice = true;
                }
                job.pending = await settlement.choose(job.input.run.runId, job.pending.id, job.choiceId);
            }
            if (!job.committed) {
                state = "committing";
                job.committed = await settlement.commit(job.input.run.runId, job.pending.id);
            }
            if (!job.skillsReleased) {
                state = "releasingSkills";
                await releaseSkills();
                job.skillsReleased = true;
                await quiesce();
            }
            state = "cleaning";
            await active.session.dispose(); // Failed cleanup retry does NOT replay a committed reward.
            await quiesce();
            if (!job.delivered) {
                state = "presenting";
                if (job.committed.route === "map") {
                    const mapRun = copy(job.committed.run);
                    job.nextNode = await showMap(mapRun);
                    job.committed.run = mapRun;
                }
                else await showEnding(job.committed.route, copy(job.committed.run));
                job.delivered = true;
            }
            state = job.committed.route === "map" ? "map" : "ended";
            return {...copy(job.committed), nextNode:copy(job.nextNode ?? null)};
        } catch (cause) {
            error = cause; state = "retryable"; throw cause;
        }
    }
    function launch() {
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
            if (run.battleFlow?.pending) throw new Error("Resume pending settlement before battle");
            const saved = settlement.readRun();
            if (!saved || saved.runId !== run.runId || saved.revision !== run.revision) throw new Error("Stale battle input");
            state = "starting";
            try {
                await quiesce();
                active = {session, run, node:copy(node), encounter:copy(encounter)};job = null;work = null;
                // start MUST schedule only; it must not await the battle root's completion.
                state = "battle"; start();
            } catch (cause) { state = "blocked"; error = cause; throw cause; }
        },
        requestFinish({session, hp, outcome = "victory", defeatedEnemies = 1}) {
            if (state !== "battle" || session !== active.session) return false;
            if (!["victory", "defeat"].includes(outcome)) throw new Error("Unknown outcome");
            if (!Number.isInteger(defeatedEnemies) || defeatedEnemies < 0) throw new Error("Invalid defeated enemy count");
            job = {input:{run:copy(active.run),node:copy(active.node),encounter:{...copy(active.encounter),defeatedEnemies},hp,outcome}};
            state = "stopping";
            active.session.requestStop();
            launch();
            return true; // No game.pause/resume: stop loop, let current body unwind, then open rewards.
        },
        resumePending({session}) {
            if (state !== "map") throw new Error("Cannot resume during another operation");
            const run = settlement.readRun(), item = run?.battleFlow?.pending;
            if (!item) throw new Error("No durable pending settlement");
            active = {session};
            job = {input:{run}, pending:copy(item)};
            state = "stopping"; session.requestStop(); launch(); return work;
        },
        retry() {
            if (state !== "retryable") throw new Error("No failed settlement to retry");
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
