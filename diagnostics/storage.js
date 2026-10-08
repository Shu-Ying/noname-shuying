import { byteLength } from "./serialize.js";

export const LOG_DIRECTORY = "extension/术樱包/logs";
const ownedName = /^(?:runtime|report)-[a-zA-Z0-9-]+\.(?:jsonl|json)$/;

export function isDiagnosticFile(name) {
  return typeof name === "string" && ownedName.test(name);
}

function checkedName(name) {
  if (!isDiagnosticFile(name)) throw new Error("Invalid diagnostic filename");
  return name;
}

function callback(start) {
  return new Promise((resolve, reject) => {
    try { start(resolve, reject); } catch (error) { reject(error); }
  });
}

function nodeStorage(env) {
  const fs = env.lib?.node?.fs;
  const root = env.window?.__dirname;
  if (!fs || typeof root !== "string" || !root) return null;
  const directory = `${root.replace(/[\\/]$/, "")}/${LOG_DIRECTORY}`;
  const invoke = (method, ...args) => callback((resolve, reject) => {
    fs[method](...args, (error, value) => error ? reject(error) : resolve(value));
  });
  const ready = () => invoke("mkdir", directory, { recursive: true });
  return {
    kind: "file", location: directory,
    async write(name, text) {
      await ready();
      await invoke("writeFile", `${directory}/${checkedName(name)}`, text, "utf8");
    },
    async list() {
      await ready();
      const names = (await invoke("readdir", directory)).filter(isDiagnosticFile);
      const entries = [];
      for (const name of names) {
        const stat = await invoke("lstat", `${directory}/${name}`);
        if (stat.isFile()) entries.push({ name, bytes: stat.size, time: stat.mtimeMs });
      }
      return entries;
    },
    remove: name => invoke("unlink", `${directory}/${checkedName(name)}`),
  };
}

function cordovaStorage(env) {
  const host = env.window;
  if (typeof host?.resolveLocalFileSystemURL !== "function") return null;
  const root = env.localStorage?.getItem("noname_inited");
  if (!root) return null;
  let directoryPromise;
  const directory = () => {
    if (!directoryPromise) directoryPromise = callback((resolve, reject) => {
      host.resolveLocalFileSystemURL(root, resolve, reject);
    }).then(async entry => {
      for (const part of LOG_DIRECTORY.split("/")) {
        entry = await callback((resolve, reject) =>
          entry.getDirectory(part, { create: true }, resolve, reject));
      }
      return entry;
    });
    return directoryPromise;
  };
  const file = async name => {
    const entry = await directory();
    return callback((resolve, reject) =>
      entry.getFile(checkedName(name), { create: true }, resolve, reject));
  };
  return {
    kind: "file", location: `${root.replace(/\/$/, "")}/${LOG_DIRECTORY}`,
    async write(name, text) {
      const entry = await file(name);
      await callback((resolve, reject) => entry.createWriter(writer => {
        let truncated = false;
        writer.onerror = () => reject(writer.error || new Error("Diagnostic write failed"));
        writer.onwriteend = () => {
          if (writer.error) { reject(writer.error); return; }
          if (truncated) { resolve(); return; }
          truncated = true;
          try { writer.write(new Blob([text], { type: "text/plain;charset=utf-8" })); }
          catch (error) { reject(error); }
        };
        try { writer.truncate(0); } catch (error) { reject(error); }
      }, reject));
    },
    async list() {
      const entry = await directory();
      const reader = entry.createReader();
      const entries = [];
      while (true) {
        const batch = await callback((resolve, reject) =>
          reader.readEntries(resolve, reject));
        if (!batch.length) break;
        for (const item of batch) {
          if (!item.isFile || !isDiagnosticFile(item.name)) continue;
          const metadata = await callback((resolve, reject) =>
            item.getMetadata(resolve, reject));
          entries.push({ name: item.name, bytes: metadata.size,
            time: new Date(metadata.modificationTime).getTime() });
        }
      }
      return entries;
    },
    async remove(name) {
      const entry = await file(name);
      return callback((resolve, reject) => entry.remove(resolve, reject));
    },
  };
}

function databaseStorage(env) {
  const indexedDB = env.indexedDB;
  if (!indexedDB) return null;
  let database;
  const open = () => database ||= callback((resolve, reject) => {
    const request = indexedDB.open("shuying-diagnostics", 1);
    let failed = false;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "name" });
    };
    request.onsuccess = () => {
      if (failed) { request.result.close(); return; }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => { failed = true; reject(request.error); };
    request.onblocked = () => { failed = true; reject(new Error("Diagnostic database blocked")); };
  });
  const transaction = async action => {
    const db = await open();
    return callback((resolve, reject) => {
      const tx = db.transaction(["files"], "readwrite");
      let value, failure;
      tx.oncomplete = () => resolve(value);
      tx.onerror = event => { failure = event.target?.error; };
      tx.onabort = () => reject(tx.error || failure || new Error("Diagnostic transaction aborted"));
      try { action(tx.objectStore("files"), result => { value = result; }); }
      catch (error) { try { tx.abort(); } catch {} reject(error); }
    });
  };
  return {
    kind: "indexeddb", location: "本机独立诊断数据库",
    write(name, text) {
      return transaction(store => store.put({ name: checkedName(name), text,
        bytes: byteLength(text), time: Date.now() }));
    },
    list() {
      return transaction((store, done) => {
        const entries = [];
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          const item = cursor.result;
          if (!item) { done(entries); return; }
          if (isDiagnosticFile(item.value.name)) entries.push({
            name: item.value.name, bytes: item.value.bytes, time: item.value.time,
          });
          item.continue();
        };
      });
    },
    remove: name => transaction(store => store.delete(checkedName(name))),
  };
}

export function createDiagnosticStorage(env, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;
  const onFailure = options.onFailure || (() => {});
  const candidates = [];
  try {
    const native = nodeStorage(env) || cordovaStorage(env);
    if (native) candidates.push(native);
  } catch (error) { onFailure(error, "file.init"); }
  try {
    const database = databaseStorage(env);
    if (database) candidates.push(database);
  } catch (error) { onFailure(error, "database.init"); }
  let index = 0;
  const timed = action => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Diagnostic storage timed out")), timeoutMs);
    Promise.resolve().then(action).then(resolve, reject).finally(() => clearTimeout(timer));
  });
  const execute = async (method, ...args) => {
    while (index < candidates.length) {
      const backend = candidates[index];
      try { return await timed(() => backend[method](...args)); }
      catch (error) {
        try { onFailure(error, `${backend.kind}.${method}`); } catch {}
        if (method !== "write") throw error;
        index++;
      }
    }
    throw new Error("Diagnostic persistence unavailable; records kept in memory");
  };
  return {
    write: (name, text) => execute("write", name, text),
    list: () => execute("list"),
    remove: name => execute("remove", name),
    status: () => ({ kind: candidates[index]?.kind || "memory",
      location: candidates[index]?.location || "仅当前运行内存，未能持久化" }),
  };
}
