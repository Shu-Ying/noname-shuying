// Candidate factory. Storage writer body reused from batch2 MODIFIED_STORAGE.js.
export function createModeStorage({lib, game, config, localStorage, alert = () => {}, console = globalThis.console}) {
const MODE_ID = config.modeId;


const copy = value => JSON.parse(JSON.stringify(value));

// Keep one mode-level writer; a failed write must not poison later retries.
let modeStorageQueue = Promise.resolve();

const writeModeStorage = storage => {
    if (!lib.db) {
        // Do not switch backends after an IndexedDB error: that creates two saves.
        localStorage.setItem(`${lib.configprefix}${MODE_ID}`, JSON.stringify(storage));
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        let transaction;
        let requestError;
        try {
            // game.putDB resolves at request success, which is before commit.
            transaction = lib.db.transaction(["data"], "readwrite");
            transaction.oncomplete = () => resolve();
            transaction.onerror = event => {
                requestError = event.target?.error;
            };
            transaction.onabort = () => reject(transaction.error || requestError || new Error("梦三存档事务已中止"));
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

const persistModeStorage = (update = () => {}) => {
    // Hold the engine reload guard from enqueue through commit and publication.
    // reload2 also drains the engine's queued database operations on release.
    lib.status.reload++;
    const operation = modeStorageQueue.then(async () => {
        const storage = copy(lib.storage);
        update(storage);
        storage.version = lib.version;
        await writeModeStorage(storage);
        lib.storage = storage;
    }).finally(() => game.reload2());
    modeStorageQueue = operation.catch(() => {});
    return operation;
};

const saveRun = async run => {
    try {
        // Capture before enqueue: subsequent gameplay mutations cannot alter this save.
        const snapshot = copy(run);
        await persistModeStorage(storage => {
            storage[config.saveKey] = snapshot;
        });
    }
    catch (error) {
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
        read: () => copy(lib.storage),
        saveRun, clearRun,
        async update(mutator) {
            let value;
            await persistModeStorage(storage => {
                value = mutator(storage);
                if (value && typeof value.then === "function") throw new TypeError("Storage mutator must be synchronous");
            });
            return value === undefined ? undefined : copy(value);
        },
    });
}
