// Candidate only. No engine globals, event prototype patches, or save writes.
const owners = new WeakMap();

export function createBattleSession(id) {
    if (typeof id !== "string" || !id.trim()) throw new TypeError("Session ID required");
    const token = Object.freeze({ id });
    let state = "running", disposePromise = null;
    const pending = new Set(), events = new Set(), resources = new Map(), errors = [];
    const waiters = new Set();
    const notify = () => { for (const wake of waiters) wake(); waiters.clear(); };
    const ensureRunning = () => { if (state !== "running") throw new Error("Session is stopping"); };
    const claim = object => {
        if (!object || (typeof object !== "object" && typeof object !== "function")) throw new TypeError("Object required");
        const owner = owners.get(object);
        if (owner && owner !== token) throw new Error("Foreign session resource");
        owners.set(object, token);
    };
    // Observe a native completion promise; never assimilate GameEvent.then(), which can start queues.
    const observe = promise => {
        if (!(promise instanceof Promise)) throw new TypeError("Native completion Promise required");
        pending.add(promise);
        promise.then(() => { pending.delete(promise); notify(); }, error => {
            errors.push(error); pending.delete(promise); notify();
        });
        return promise;
    };
    const api = {
        id,
        get state() { return state; },
        get active() { return state === "running"; },
        get pendingCount() { return pending.size; },
        guard(callback) {
            if (typeof callback !== "function") throw new TypeError("Callback required");
            return (...args) => state === "running" ? callback(...args) : undefined;
        },
        runTask(factory) {
            ensureRunning();
            if (typeof factory !== "function") throw new TypeError("Task factory required");
            // Reserve before invoking user code so a stop request inside it cannot race drain().
            return observe(Promise.resolve().then(() => state === "running" ? factory(api) : undefined));
        },
        ownEvent(event, completion) {
            ensureRunning();
            if (typeof event?.finish !== "function" || !(completion instanceof Promise)) throw new TypeError("Event and native completion required");
            claim(event);
            if (events.has(event)) throw new Error("Event already registered");
            events.add(event); observe(completion);
            return event;
        },
        ownResource(resource, release) {
            ensureRunning();
            if (typeof release !== "function") throw new TypeError("Release function required");
            claim(resource);
            if (resources.has(resource)) throw new Error("Resource already registered");
            resources.set(resource, release);
            return resource;
        },
        requestStop() {
            if (state !== "running") return false;
            state = "stopping";
            // Only explicitly registered events. Do not erase global next/after or guess ownership.
            for (const event of events) {
                try { event.finish(); } catch (error) { errors.push(error); }
            }
            notify();
            return true;
        },
        async drain() {
            if (state === "running") throw new Error("requestStop required before drain");
            // Must be awaited by an external coordinator, not from a task tracked by this session.
            while (pending.size) await new Promise(resolve => waiters.add(resolve));
            if (errors.length) throw new AggregateError(errors, "Battle tasks failed; cleanup blocked");
            if (state === "stopping") state = "drained";
        },
        dispose() {
            if (state === "disposed") return Promise.resolve();
            if (disposePromise) return disposePromise;
            if (state !== "drained") return Promise.reject(new Error("Drain must complete before disposal"));
            state = "disposing";
            disposePromise = (async () => {
                // Reverse acquisition order; stop at first failure to preserve dependent resources.
                for (const [resource, release] of [...resources].reverse()) {
                    await release(resource);
                    resources.delete(resource); owners.delete(resource);
                }
                for (const event of events) owners.delete(event);
                events.clear(); state = "disposed";
            })().catch(error => { state = "drained"; throw error; }).finally(() => { disposePromise = null; });
            return disposePromise;
        },
    };
    return Object.freeze(api);
}

// A reused ID must never cause old-session cleanup to delete the new player's entry.
export function ownPlayerIndex(session, player, playerMap) {
    const id = player.playerid;
    if (!id || playerMap[id] !== player) throw new Error("Player must be registered first");
    return session.ownResource(player, () => { if (playerMap[id] === player) delete playerMap[id]; });
}

// Engine pause booleans are not ownership tokens. Accept a lease from a coordinator instead.
export function ownPauseLease(session, lease) {
    if (typeof lease?.release !== "function") throw new TypeError("Pause lease required");
    return session.ownResource(lease, () => lease.release());
}
