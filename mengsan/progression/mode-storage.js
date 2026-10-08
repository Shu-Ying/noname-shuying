// Candidate factory. Storage writer body reused from batch2 MODIFIED_STORAGE.js.
import { migrateRetiredCards } from "../cards/retired-cards.js";
import { stripBattleProgress } from "./map-checkpoint.js";
import { getDiagnostics } from "../../diagnostics/index.js";
export function createModeStorage({lib, game, config, localStorage, alert = () => {}, console = globalThis.console}) {
const MODE_ID = config.modeId;
const diagnostics = getDiagnostics().scope("mengsan.storage");
let writeSequence = 0, lastWrite = null;


const copy = value => JSON.parse(JSON.stringify(value));
const copyStorage = () => {
    const storage = copy(lib.storage);
    stripBattleProgress(storage[config.saveKey]);
    migrateRetiredCards(storage[config.saveKey]);
    return storage;
};

// Keep one mode-level writer; a failed write must not poison later retries.
let modeStorageQueue = Promise.resolve();

const writeModeStorage = (storage, receipt) => {
    receipt.phase = "storage.write";
    receipt.storageStatus = "pending";
    if (!lib.db) {
        // Do not switch backends after an IndexedDB error: that creates two saves.
        localStorage.setItem(`${lib.configprefix}${MODE_ID}`, JSON.stringify(storage));
        receipt.storageStatus = "committed";
        diagnostics.info("storage.committed", receipt);
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        let transaction;
        let requestError;
        try {
            // game.putDB resolves at request success, which is before commit.
            transaction = lib.db.transaction(["data"], "readwrite");
            transaction.oncomplete = () => {
                receipt.storageStatus = "committed";
                diagnostics.info("transaction.committed", receipt);
                resolve();
            };
            transaction.onerror = event => {
                requestError = event.target?.error;
            };
            transaction.onabort = () => {
                receipt.storageStatus = "aborted";
                reject(transaction.error || requestError || new Error("梦三存档事务已中止"));
            };
            transaction.objectStore("data").put(storage, MODE_ID);
        }
        catch (error) {
            if (transaction) {
                try { transaction.abort(); }
                catch {} // Already inactive; keep the original failure.
            }
            reject(error);
        }
    });
};

const persistModeStorage = (update = () => {}, context = {}) => {
    const receipt = { ...context, writeId: ++writeSequence, phase: "queued",
        backend: lib.db ? "indexeddb" : "localStorage",
        storageStatus: "notStarted", memoryPublished: false };
    diagnostics.info("save.queued", receipt);
    // Hold the engine reload guard from enqueue through commit and publication.
    // reload2 also drains the engine's queued database operations on release.
    lib.status.reload++;
    const operation = modeStorageQueue.then(async () => {
        lastWrite = receipt;
        receipt.phase = "snapshot";
        const storage = copyStorage();
        receipt.phase = "mutator";
        update(storage);
        stripBattleProgress(storage[config.saveKey]);
        storage.version = lib.version;
        await writeModeStorage(storage, receipt);
        receipt.phase = "memory.publish";
        lib.storage = storage;
        receipt.memoryPublished = true;
        diagnostics.info("memory.published", receipt);
    }).catch(error => {
        diagnostics.error("save.failed", error, receipt);
        throw error;
    }).finally(() => {
        receipt.phase = "reloadGuard.release";
        try { game.reload2(); }
        catch (error) {
            diagnostics.error("reloadGuard.failed", error, receipt);
            throw error;
        }
        diagnostics.info("save.finished", receipt);
    });
    modeStorageQueue = operation.catch(() => {});
    return operation;
};

const saveRun = async run => {
    try {
        // Capture before enqueue: subsequent gameplay mutations cannot alter this save.
        const snapshot = migrateRetiredCards(stripBattleProgress(copy(run)));
        await persistModeStorage(storage => {
            storage[config.saveKey] = snapshot;
        }, { runId: snapshot.runId, revision: snapshot.revision });
    }
    catch (error) {
        diagnostics.error("saveRun.failed", error,
            { runId: run?.runId, revision: run?.revision, lastWrite });
        // Neither delete the previous save nor attempt a second destructive write.
        alert("梦三存档失败，未覆盖上一次成功保存的进度。当前进度尚未保存，请勿刷新，并查看控制台错误。");
        console.error("梦三存档失败：", error);
        throw error;
    }
};

const clearRun = async () => {
    await persistModeStorage(storage => {
        delete storage[config.saveKey];
    });
};



    return Object.freeze({
        read: copyStorage,
        get lastWrite() { return lastWrite ? { ...lastWrite } : null; },
        saveRun, clearRun,
        async update(mutator, context = {}) {
            let value;
            await persistModeStorage(storage => {
                value = mutator(storage);
                if (value && typeof value.then === "function") throw new TypeError("Storage mutator must be synchronous");
            }, context);
            return value === undefined ? undefined : copy(value);
        },
    });
}
