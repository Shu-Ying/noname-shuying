// Candidate only: attach to fresh, session-owned roots BEFORE scheduling them.
const attached = new WeakSet();
export function observeFreshEvent(session, event) {
    if (!event || typeof event.start !== "function" || !event.manager?.eventStack ||
        event.finished || event.manager.eventStack.includes(event) ||
        event.parent?.childEvents?.includes(event) || attached.has(event)) {
        throw new Error("Fresh, unobserved engine event required");
    }
    const descriptor = Object.getOwnPropertyDescriptor(event, "start");
    if (descriptor && !descriptor.configurable) throw new Error("Event start is not configurable");
    const original = event.start;
    let resolve, reject;
    const completion = new Promise((yes, no) => { resolve = yes; reject = no; });
    session.ownEvent(event, completion);
    let observed = false;
    function start(...args) {
        let result;
        try { result = Reflect.apply(original, this, args); }
        catch (error) { reject(error); throw error; }
        if (!observed) {
            observed = true;
            if (!(result instanceof Promise)) {
                reject(new TypeError("Native engine start promise required"));
            } else {
                result.then(() => {
                    if (event.manager.eventStack.includes(event) || event.manager.tempEvent === event) {
                        reject(new Error("Event still active after start completion"));
                    } else resolve();
                }, reject);
            }
        }
        return result; // Never assimilate event.then(), never proactively start a queue.
    }
    Object.defineProperty(event, "start", { configurable: true, writable: true, value: start });
    attached.add(event);
    session.ownResource({}, () => {
        if (event.start === start) {
            if (descriptor) Object.defineProperty(event, "start", descriptor);
            else delete event.start;
        }
        attached.delete(event);
    });
    return completion;
}

// Independent delay entry: releasing it never calls global resume/pause2/over.resolve.
export function acquirePauseLease(session, pauseManager) {
    if (!session.active || typeof pauseManager?.setDelay !== "function") throw new Error("Active session and pause manager required");
    let unlock;
    const gate = new Promise(resolve => { unlock = resolve; });
    const settled = pauseManager.setDelay(gate);
    let released = false;
    const lease = Object.freeze({
        release() { if (!released) { released = true; unlock(); } return settled; },
        get released() { return released; },
    });
    session.ownResource(lease, () => lease.release());
    return lease;
}

// Call outside tracked event/task bodies. Own pauses must be lifted before drain.
export async function stopAndDrain(session, leases = []) {
    session.requestStop();
    await Promise.all(leases.map(lease => lease.release()));
    await session.drain();
}

// Only remove this exact node from the parent recorded at acquisition.
export function ownNode(session, node) {
    const parent = node.parentNode;
    if (!parent) throw new Error("Attached node required");
    return session.ownResource(node, () => {
        if (node.parentNode === parent) parent.removeChild(node);
    });
}
export function ownListener(session, target, type, listener, options) {
    const guarded = session.guard(listener);
    const capture = typeof options === "boolean" ? options : !!options?.capture;
    const token = {};
    session.ownResource(token, () => target.removeEventListener(type, guarded, capture));
    target.addEventListener(type, guarded, options);
    return guarded;
}
