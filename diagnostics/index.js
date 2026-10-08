import {
  byteLength, cleanText, extensionError, extensionSource, serializeError, snapshot,
} from "./serialize.js";
import { createDiagnosticStorage, isDiagnosticFile, LOG_DIRECTORY } from "./storage.js";

const noop = () => null;
const inactive = Object.freeze({
  info: noop, warn: noop, error: noop, scope: () => inactive,
  registerContext: () => noop, flush: async () => {},
  step: async (_event, action) => action(),
  status: () => ({ enabled: false }), dispose: noop,
});
let current = inactive;

export function getDiagnostics() { return current; }

export function createDiagnostics(options = {}) {
  const env = options.env || {};
  const now = options.now || Date.now;
  const monotonic = () => {
    try { return env.performance?.now?.() ?? now(); } catch { return now(); }
  };
  const launchId = `${now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const maxMemoryBytes = options.maxMemoryBytes ?? 512 * 1024;
  const maxJournalBytes = options.maxJournalBytes ?? 256 * 1024;
  const maxReportBytes = options.maxReportBytes ?? 512 * 1024;
  const maxDiskBytes = options.maxDiskBytes ?? 5 * 1024 * 1024;
  const maxFiles = options.maxFiles ?? 64;
  const maxPending = options.maxPending ?? 12;
  const flushMs = options.flushMs ?? 1000;
  const recent = [], contexts = new Map(), pending = new Map();
  const errors = new WeakMap(), fingerprints = new Map(), listeners = [];
  let sequence = 0, reportSequence = 0, segment = 0, memoryBytes = 0;
  let journal = [], journalBytes = 0, revision = 0, queuedRevision = -1;
  let flushTimer = null, worker = null, stopped = false, unavailable = false;
  let latestReport = null, droppedRecords = 0, droppedWrites = 0;
  let inventory = null, inventoryKind = null;
  const metadata = snapshot({
    extension: "术樱包", extensionVersion: options.version || "unknown",
    engineVersion: env.lib?.version || "unknown", launchId,
    platform: env.lib?.node ? "pc" : env.lib?.device ? "android" : "browser",
    userAgent: env.window?.navigator?.userAgent || "unknown",
    modules: { mengsan: env.lib?.config?.shuYing_mengsan_installed_version || null },
  });
  const roots = [];
  try {
    const root = new URL("../", import.meta.url);
    if (["file:", "http:", "https:"].includes(root.protocol)) roots.push(root.href);
  } catch {}
  if (options.extensionRoot) {
    try {
      roots.push(new URL(options.extensionRoot.replace(/\/?$/, "/"),
        env.document?.baseURI || env.window?.location?.href).href);
    } catch {}
  }
  const storage = options.storage || createDiagnosticStorage(env, {
    timeoutMs: options.storageTimeoutMs,
    onFailure(error, phase) {
      record("WARN", "diagnostics.storage.failure", { phase }, error, "diagnostics");
    },
  });
  const storageStatus = () => storage.status?.() || { kind: "file", location: LOG_DIRECTORY };
  const runtimeName = () => `runtime-${launchId}-${segment}.jsonl`;

  function contextFor(extra) {
    const values = {};
    for (const [name, provider] of contexts) {
      try { values[name] = snapshot(provider()); }
      catch { values[name] = { diagnosticContextUnavailable: true }; }
    }
    return { ...values, ...snapshot(extra || {}) };
  }

  function schedule() {
    if (flushTimer || stopped || unavailable) return;
    flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, flushMs);
    flushTimer?.unref?.();
  }

  function record(level, event, extra, error, module = "extension") {
    if (stopped) return null;
    try {
      const entry = {
        schemaVersion: 1, sequence: ++sequence, time: new Date(now()).toISOString(),
        launchId, level, module: cleanText(module, 128), event: cleanText(event, 256),
        context: contextFor(extra),
      };
      if (error !== undefined) entry.error = serializeError(error);
      const item = { entry, bytes: 0 };
      recent.push(item);
      if (level === "ERROR") createReport(entry, error);
      const text = JSON.stringify(entry) + "\n";
      const bytes = byteLength(text);
      item.bytes = bytes; memoryBytes += bytes;
      if (journalBytes + bytes > maxJournalBytes && journal.length) {
        enqueue(runtimeName(), journal.join(""));
        segment++; journal = []; journalBytes = 0; queuedRevision = -1;
      }
      journal.push(text); journalBytes += bytes; revision++;
      while (recent.length > 400 || memoryBytes > maxMemoryBytes) {
        memoryBytes -= recent.shift().bytes; droppedRecords++;
      }
      schedule();
      if (level === "ERROR") void flush();
      return entry;
    } catch {
      return null;
    }
  }

  function createReport(entry, rawError) {
    let known;
    if (rawError && typeof rawError === "object") known = errors.get(rawError);
    const fingerprint = `${entry.module}:${entry.event}:${entry.error?.name}:${entry.error?.message}`;
    if (!known) {
      const prior = fingerprints.get(fingerprint);
      if (prior && now() - prior.time < 5000) known = prior;
    }
    if (!known) known = { id: `${launchId}-${++reportSequence}`, count: 0,
      first: entry.time, time: now(), firstFailure: entry };
    known.count++; known.time = now();
    if (rawError && typeof rawError === "object") errors.set(rawError, known);
    fingerprints.set(fingerprint, known);
    while (fingerprints.size > 64) fingerprints.delete(fingerprints.keys().next().value);
    entry.reportId = known.id;
    const file = `report-${known.id}.json`;
    const report = {
      schemaVersion: 1, reportId: known.id, firstSeen: known.first,
      lastSeen: entry.time, occurrences: known.count, environment: metadata,
      storageAtCapture: snapshot(storageStatus()), firstFailure: known.firstFailure,
      failure: entry, records: recent.map(item => item.entry),
      droppedRecords, droppedWrites,
    };
    let text = JSON.stringify(report, null, 2);
    while (byteLength(text) > maxReportBytes && report.records.length > 1) {
      report.records.shift(); report.droppedRecords++;
      text = JSON.stringify(report, null, 2);
    }
    latestReport = { id: known.id, file, revision: known.count,
      persisted: false, event: entry.event };
    enqueue(file, text, true, known.count);
  }

  function enqueue(name, text, priority = false, reportRevision = null) {
    if (unavailable || stopped) return;
    if (!pending.has(name) && pending.size >= maxPending) {
      const victim = [...pending].find(([, item]) => !item.priority)?.[0];
      if (!victim) { droppedWrites++; return; }
      pending.delete(victim); droppedWrites++;
    }
    pending.set(name, { text, priority, reportRevision });
    startWorker();
  }

  async function prune(protect, text) {
    const kind = storageStatus().kind;
    if (!inventory || inventoryKind !== kind) {
      inventory = new Map((await storage.list()).filter(file =>
        isDiagnosticFile(file.name)).map(file => [file.name, file]));
      inventoryKind = kind;
    }
    inventory.set(protect, { name: protect, bytes: byteLength(text), time: now() });
    const files = [...inventory.values()];
    files.sort((a, b) => (a.time || 0) - (b.time || 0));
    let bytes = files.reduce((sum, file) => sum + (file.bytes || 0), 0);
    let count = files.length;
    for (const file of files) {
      if (bytes <= maxDiskBytes && count <= maxFiles) break;
      if (file.name === protect || file.name === runtimeName()
          || file.name === latestReport?.file) continue;
      await storage.remove(file.name);
      inventory.delete(file.name);
      bytes -= file.bytes || 0; count--;
    }
  }

  function startWorker() {
    if (worker || !pending.size) return;
    worker = Promise.resolve().then(async () => {
      while (pending.size && !unavailable) {
        const name = [...pending].find(([, item]) => item.priority)?.[0]
          || pending.keys().next().value;
        const item = pending.get(name);
        pending.delete(name);
        try {
          await storage.write(name, item.text);
          if (latestReport?.file === name && latestReport.revision === item.reportRevision) {
            latestReport.persisted = true;
            latestReport.savedStorage = snapshot(storageStatus());
          }
          try { await prune(name, item.text); } catch { inventory = null; }
        } catch {
          unavailable = true; pending.clear();
        }
      }
    }).catch(() => { unavailable = true; pending.clear(); }).finally(() => {
      worker = null;
      if (pending.size && !unavailable) startWorker();
    });
  }

  async function flush() {
    try {
      clearTimeout(flushTimer); flushTimer = null;
      if (journal.length && queuedRevision !== revision) {
        queuedRevision = revision;
        enqueue(runtimeName(), journal.join(""));
      }
      while (worker) await worker;
    } catch {}
  }

  function scope(module, provider = () => ({})) {
    const details = extra => {
      try {
        const context = typeof provider === "function" ? provider() : provider;
        return { ...snapshot(context), ...snapshot(extra || {}) };
      } catch { return { diagnosticContextUnavailable: true }; }
    };
    return Object.freeze({
      info: (event, extra) => record("INFO", event, details(extra), undefined, module),
      warn: (event, extra, error) => record("WARN", event, details(extra), error, module),
      error: (event, error, extra) => record("ERROR", event, details(extra), error, module),
      async step(event, action, extra = {}, options = {}) {
        const started = monotonic();
        record("INFO", `${event}.start`, details(extra), undefined, module);
        let timer;
        if (options.observeWait !== false) {
          timer = setTimeout(() => {
            if (env.document?.hidden) return;
            record("WARN", `${event}.waiting`, details({ ...extra,
              elapsedMs: monotonic() - started }), undefined, module);
          }, options.waitMs ?? 15000);
          timer?.unref?.();
        }
        try {
          const result = await action();
          record("INFO", `${event}.complete`, details({ ...extra,
            elapsedMs: monotonic() - started }), undefined, module);
          return result;
        } catch (error) {
          record("ERROR", `${event}.failed`, details({ ...extra,
            elapsedMs: monotonic() - started }), error, module);
          throw error;
        } finally { clearTimeout(timer); }
      },
    });
  }

  function listen(target, event, handler, capture = false) {
    if (typeof target?.addEventListener !== "function") return;
    target.addEventListener(event, handler, capture);
    listeners.push(() => target.removeEventListener(event, handler, capture));
  }
  const globalLogger = scope("extension.global");
  const globalSeen = new WeakMap();
  function captureGlobal(error, source, extra = {}) {
    if (!extensionSource(source, roots) && !extensionError(error, roots)) return;
    if (error && typeof error === "object") {
      const last = globalSeen.get(error);
      if (last !== undefined && now() - last < 20) return;
      globalSeen.set(error, now());
    }
    globalLogger.error("uncaught", error, { source, ...extra });
  }
  listen(env.window, "error", event => {
    try {
      if (extensionSource(event.filename, roots) || extensionError(event.error, roots)) {
        captureGlobal(event.error || event.message, event.filename,
          { line: event.lineno, column: event.colno });
      } else {
        const source = event.target?.src || event.target?.href;
        if (extensionSource(source, roots)) globalLogger.error("resource.load",
          new Error("术樱包资源加载失败"), { source });
      }
    } catch {}
  }, true);
  listen(env.window, "unhandledrejection", event => {
    try {
      if (extensionError(event.reason, roots)) captureGlobal(event.reason, "",
        { origin: "unhandledrejection" });
    } catch {}
  });
  if (env.window) {
    const previous = env.window.onerror;
    const chained = function(message, source, line, column, error) {
      try { captureGlobal(error || message, source, { line, column }); } catch {}
      return typeof previous === "function" ? previous.apply(this, arguments) : undefined;
    };
    env.window.onerror = chained;
    listeners.push(() => {
      if (env.window.onerror === chained) env.window.onerror = previous;
    });
  }
  listen(env.document, "visibilitychange", () => {
    if (env.document.hidden) void flush();
  });
  listen(env.window, "pagehide", () => { void flush(); });
  const api = Object.freeze({
    ...scope("extension"), scope,
    registerContext(name, provider) {
      contexts.set(name, provider);
      return () => contexts.delete(name);
    },
    flush,
    status: () => snapshot({ enabled: true, ...storageStatus(),
      unavailable, latestReport, droppedRecords, droppedWrites,
      runtimeFile: runtimeName(), launchId }),
    dispose() {
      void flush(); stopped = true; clearTimeout(flushTimer);
      for (const remove of listeners) remove();
      if (current === api) current = inactive;
    },
  });
  api.info("diagnostics.started", { environment: metadata });
  return api;
}

export function configureDiagnostics({ lib, game, window, document, version, extensionRoot }) {
  if (current !== inactive) return current;
  try {
    current = createDiagnostics({ version, extensionRoot,
      env: { lib, game, window, document, performance: window?.performance,
        localStorage: window?.localStorage, indexedDB: window?.indexedDB } });
  } catch {}
  return current;
}
