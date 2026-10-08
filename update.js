import { lib, game } from "../../noname.js";

const giteaRepositoryApi = "https://gitea.diuse.work/api/v1/repos/Diuse/noname-shuying";
const githubRepositoryApi = "https://api.github.com/repos/Shu-Ying/noname-shuying";
const githubRawBase = "https://raw.githubusercontent.com/Shu-Ying/noname-shuying";
const coreTempDir = "extension/术樱包/.update_tmp";
let fileMutationUncertain = false;
const verifiedCacheKey = "shuYing_update_verified_files";
let verifiedFiles = new Map();
let sessionVerified = new Set();
let verificationContext = null;
let verificationDirty = false;
let fullVerification = false;

function cacheContext() {
    if (lib.node?.fs && typeof window.__dirname == "string") return `node:${window.__dirname}`;
    if (hasCordovaFiles()) return `cordova:${localStorage.getItem("noname_inited")}`;
    return null; // The browser file service exposes no reliable modification timestamp.
}

function beginUpdate(shuYing, full = false) {
    fullVerification = full;
    verificationContext = cacheContext();
    verifiedFiles = new Map();
    sessionVerified = new Set();
    verificationDirty = false;
    const saved = lib.config[verifiedCacheKey];
    if (verificationContext && saved?.schema == 1 && saved.context == verificationContext
        && saved.files && typeof saved.files == "object" && !Array.isArray(saved.files)) {
        for (const [file, entry] of Object.entries(saved.files)) {
            if (isSafeManifestPath(file) && entry && typeof entry.sha256 == "string" && /^[a-f0-9]{64}$/.test(entry.sha256)
                && Number.isSafeInteger(entry.size) && entry.size >= 0 && typeof entry.fingerprint == "string") {
                verifiedFiles.set(file, { ...entry });
            }
        }
    }
    shuYing._updateLogs = [];
    shuYing._updateLogDirty = false;
    shuYing._updateLogDisabled = false;
    shuYing._progressRendered = 0;
    shuYing._updateStarted = Date.now();
    shuYing._updateStats = { cached: 0, hashed: 0 };
    void shuYing.updateMengsanModuleMenu?.();
}

function relativeTarget(target) {
    const prefix = "extension/术樱包/";
    if (!target.startsWith(prefix)) return null;
    const file = target.slice(prefix.length);
    return isSafeManifestPath(file) && !file.startsWith(".update_tmp/") && file != "log.txt" ? file : null;
}

function invalidateVerifiedFile(target) {
    const file = relativeTarget(target);
    if (!file) return;
    if (verifiedFiles.delete(file)) verificationDirty = true;
    sessionVerified.delete(file);
}

async function persistVerificationCache() {
    if (!verificationContext || !verificationDirty) return;
    await saveUpdaterConfig({ [verifiedCacheKey]: {
        schema: 1, context: verificationContext, files: Object.fromEntries(verifiedFiles),
    } });
    verificationDirty = false;
}

async function invalidateBeforeChanges(files) {
    for (const file of files) invalidateVerifiedFile(`extension/术樱包/${file}`);
    // Commit invalidation before mutation, including same-size writes on coarse timestamps.
    await persistVerificationCache();
}

function sameMetadata(left, right) {
    return !!left && !!right && left.size == right.size && left.fingerprint == right.fingerprint;
}

function rememberVerified(target, info, metadata) {
    const file = relativeTarget(target);
    if (!verificationContext || !file || !metadata || metadata.size != info.size) return;
    verifiedFiles.set(file, { sha256: info.sha256, size: info.size, fingerprint: metadata.fingerprint });
    sessionVerified.add(file);
    verificationDirty = true;
}

async function verifyLocalFile(file, manifest, shuYing, full = fullVerification) {
    const target = `extension/术樱包/${file}`;
    const info = manifest.files[file];
    try {
        const before = await fileMetadata(target);
        const cached = verifiedFiles.get(file);
        if ((!full || sessionVerified.has(file)) && before && cached
            && cached.sha256 == info.sha256 && cached.size == info.size && sameMetadata(cached, before)) {
            if (shuYing?._updateStats) shuYing._updateStats.cached++;
            return;
        }
        invalidateVerifiedFile(target);
        await verifyFile(file, await readFile(target), manifest);
        const after = await fileMetadata(target);
        if (before && !sameMetadata(before, after)) throw new Error(`校验期间文件发生变化：${file}`);
        rememberVerified(target, info, sameMetadata(before, after) ? after : null);
        if (shuYing?._updateStats) shuYing._updateStats.hashed++;
    }
    catch (error) {
        invalidateVerifiedFile(target);
        throw error;
    }
}

async function runFilePool(items, handler, options = {}) {
    const concurrency = options.concurrency || (lib.device ? 4 : 8);
    const budget = lib.device ? 24 * 1024 * 1024 : 64 * 1024 * 1024;
    const controller = new AbortController();
    const results = new Array(items.length);
    let next = 0, active = 0, reserved = 0, failure = null;
    return await new Promise((resolve, reject) => {
        const fail = error => {
            const cause = operationError(error) || new Error("资源任务失败");
            if (!failure) { failure = cause; controller.abort(cause); }
            if (cause.operationUncertain) failure.operationUncertain = true;
        };
        const pump = () => {
            while (!failure && active < concurrency && next < items.length) {
                // Bound estimated working memory; a file exceeding the budget runs alone.
                let weight;
                try { weight = Math.min(budget, Math.max(1, options.weight?.(items[next]) || 1)); }
                catch (error) { fail(error); break; }
                if (active && reserved + weight > budget) break;
                const index = next++;
                active++;
                reserved += weight;
                Promise.resolve().then(() => handler(items[index], index, controller.signal))
                    .then(value => { results[index] = value; })
                    .catch(fail).finally(() => { active--; reserved -= weight; pump(); });
            }
            if (!active && (failure || next == items.length)) {
                if (failure) {
                    if (fileMutationUncertain) failure.operationUncertain = true;
                    reject(failure);
                }
                else resolve(results);
            }
        };
        pump();
    });
}

async function finishUpdate(shuYing) {
    try {
        await persistVerificationCache();
    }
    catch (error) { addLog(shuYing, `校验缓存保存失败，下次重新检查：${getErrorMessage(error)}`); }
    if (shuYing._updateStarted) {
        const stats = shuYing._updateStats;
        addLog(shuYing, `本次耗时 ${((Date.now() - shuYing._updateStarted) / 1000).toFixed(1)} 秒；缓存通过 ${stats?.cached || 0} 次，完整校验通过 ${stats?.hashed || 0} 次`);
    }
    await flushLog(shuYing);
    await shuYing.updateMengsanModuleMenu?.();
}

function parseVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/.exec(version);
    if (!match) return null;
    return {
        parts: match.slice(1, 5).map(Number),
        rc: match[5] == null ? null : Number(match[5]),
    };
}

function compareVersions(left, right) {
    const a = parseVersion(left);
    const b = parseVersion(right);
    if (!a || !b) throw new Error("版本号格式错误");
    for (let i = 0; i < 4; i++) {
        if (a.parts[i] != b.parts[i]) return a.parts[i] - b.parts[i];
    }
    if (a.rc == null) return b.rc == null ? 0 : 1;
    if (b.rc == null) return -1;
    return a.rc - b.rc;
}

function getUpdateChannel() {
    return lib.config.shuYing_update_channel
        || (/-rc\.\d+$/.test(lib.config.shuYing_local_version || "")
            ? "preview" : "stable");
}

function getUpdateSource() {
    return lib.config.shuYing_update_source == "github" ? "github" : "gitea";
}

function getRemoteUrl(tag, path, source = getUpdateSource()) {
    const filePath = path.split("/").map(encodeURIComponent).join("/");
    if (source == "github") {
        return `${githubRawBase}/${encodeURIComponent(tag)}/${filePath}`;
    }
    return `${giteaRepositoryApi}/raw/${filePath}?ref=${encodeURIComponent(tag)}`;
}

async function getLatestTag(channel = getUpdateChannel(), source = getUpdateSource()) {
    let latest = null;
    for (let page = 1; ; page++) {
        const tagsUrl = source == "github"
            ? `${githubRepositoryApi}/tags?page=${page}&per_page=50`
            : `${giteaRepositoryApi}/tags?page=${page}&limit=50`;
        const response = await fetch(tagsUrl);
        if (!response.ok) throw new Error(`标签请求失败：${response.status}`);
        const tags = await response.json();
        if (!Array.isArray(tags)) throw new Error("标签列表格式错误");

        for (const tag of tags) {
            const name = tag?.name || "";
            const isPreview = /^v\d+\.\d+\.\d+\.\d+-rc\.\d+$/.test(name);
            const isStable = /^v\d+\.\d+\.\d+\.\d+$/.test(name);
            if (channel == "preview" ? !isPreview : !isStable) continue;
            const version = name.slice(1);
            if (!latest || compareVersions(version, latest.version) > 0) {
                latest = { name, version };
            }
        }
        if (tags.length < 50) break;
    }
    if (!latest) throw new Error(`更新源尚无${channel == "preview" ? "测试版" : "正式版"}标签`);
    return latest;
}

function getByteLength(data) {
    if (typeof data == "string") return new TextEncoder().encode(data).byteLength;
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (ArrayBuffer.isView(data)) return data.byteLength;
    return data?.length || 0;
}

function toUint8Array(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (typeof data == "string") return new TextEncoder().encode(data);
    throw new Error("无法识别的文件数据格式");
}

function bytesToHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(data) {
    const bytes = toUint8Array(data);

    if (globalThis.crypto?.subtle) {
        const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
        return bytesToHex(new Uint8Array(hash));
    }

    if (lib.node) {
        const crypto = window.require("crypto");
        return crypto.createHash("sha256").update(bytes).digest("hex");
    }

    throw new Error("当前环境不支持 SHA-256 校验");
}

function setBusy(shuYing, busy) {
    shuYing.m_bIsDownload = !busy;
}

function ensureProgressNode(shuYing) {
    if (!shuYing.text.parentNode) {
        document.body.appendChild(shuYing.text);
    }
}

function removeProgressNode(shuYing) {
    if (shuYing.text.parentNode) {
        shuYing.text.parentNode.removeChild(shuYing.text);
    }
}

function getErrorMessage(error) {
    if (!error) return "未知错误";
    if (typeof error == "string") return error;
    return error.message || error.stack || String(error);
}

function getLogText(shuYing) {
    return (shuYing?._updateLogs || []).join("\n");
}

async function writeLog(shuYing) {
    if (!shuYing || typeof game.writeFile != "function") return;
    await writeFile(getLogText(shuYing), "extension/术樱包", "log.txt", { diagnostic: true });
}

function addLog(shuYing, message) {
    if (!shuYing) return;
    try { shuYing.diagnostics?.scope("updater").info("update.message", { message }); }
    catch {}

    if (!Array.isArray(shuYing._updateLogs)) {
        shuYing._updateLogs = [];
    }

    const time = new Date().toLocaleString();
    shuYing._updateLogs.push(`[${time}] ${message}`);
    shuYing._updateLogDirty = true;
    if (!shuYing._updateLogTimer && !shuYing._updateLogDisabled) {
        shuYing._updateLogTimer = setTimeout(() => { void flushLog(shuYing); }, 1000);
    }
}

function recordUpdateError(shuYing, event, error, context = {}) {
    try {
        shuYing?.diagnostics?.scope("updater").error(event, error, {
            channel: getUpdateChannel(), source: getUpdateSource(), ...context,
        });
    } catch {}
}

async function flushLog(shuYing) {
    clearTimeout(shuYing._updateLogTimer);
    shuYing._updateLogTimer = null;
    if (shuYing._updateLogWrite) await shuYing._updateLogWrite;
    if (!shuYing._updateLogDirty || shuYing._updateLogDisabled) return;
    shuYing._updateLogDirty = false;
    const operation = writeLog(shuYing).catch(error => {
        shuYing._updateLogDisabled = true;
        clearTimeout(shuYing._updateLogTimer);
        shuYing._updateLogTimer = null;
        console.error("写入术樱包日志失败：", error);
        recordUpdateError(shuYing, "legacyLog.write.failed", error);
    });
    shuYing._updateLogWrite = operation;
    await operation;
    if (shuYing._updateLogWrite == operation) shuYing._updateLogWrite = null;
}

function escapeHTML(text) {
    return String(text ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[char]));
}

function formatBytes(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function setProgress(shuYing, options = {}) {
    if (!shuYing?.text) return;

    const now = Date.now();
    if (!options.force && now - (shuYing._progressRendered || 0) < 120) return;
    shuYing._progressRendered = now;

    const current = Math.max(0, Number(options.current) || 0);
    const total = Math.max(0, Number(options.total) || 0);
    const percent = options.totalBytes > 0
        ? Math.min(100, Math.round((options.bytes || 0) / options.totalBytes * 100))
        : total > 0 ? Math.min(100, Math.round(current / total * 100)) : 0;
    const title = options.title || "资源更新";
    const status = options.status || "准备中";
    const file = options.file || "";
    const transfer = options.totalBytes > 0
        ? `${formatBytes(options.bytes || 0)} / ${formatBytes(options.totalBytes)} · ${formatBytes(options.speed || 0)}/秒`
        : `${current}/${total}`;

    shuYing.text.innerHTML = `
        <div style="position:static;box-sizing:border-box;writing-mode:horizontal-tb;text-orientation:mixed;display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;width:100%;">
            <div style="position:static;box-sizing:border-box;font-size:16px;font-weight:700;color:#fff;white-space:nowrap;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;min-width:0;">${escapeHTML(title)}</div>
            <div style="position:static;box-sizing:border-box;font-size:12px;color:rgba(245,241,232,0.72);white-space:nowrap;word-break:keep-all;flex:0 0 auto;">${escapeHTML(transfer)}</div>
        </div>
        <div style="position:static;box-sizing:border-box;display:block;width:100%;height:8px;min-height:8px;border-radius:999px;background:linear-gradient(90deg,#6ee7b7 0%,#60a5fa ${percent}%,rgba(255,255,255,0.14) ${percent}%,rgba(255,255,255,0.14) 100%);overflow:hidden;"></div>
        <div style="position:static;box-sizing:border-box;writing-mode:horizontal-tb;text-orientation:mixed;display:flex;justify-content:space-between;gap:10px;font-size:12px;color:rgba(245,241,232,0.82);min-width:0;width:100%;">
            <span style="position:static;box-sizing:border-box;white-space:nowrap;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;min-width:0;">${escapeHTML(status)}</span>
            <span style="position:static;box-sizing:border-box;white-space:nowrap;word-break:keep-all;flex:0 0 auto;">${percent}%</span>
        </div>
        <div style="position:static;box-sizing:border-box;width:100%;writing-mode:horizontal-tb;text-orientation:mixed;font-size:12px;color:rgba(245,241,232,0.58);white-space:nowrap;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(file)}</div>
    `;
}

function splitPath(path) {
    const index = path.lastIndexOf("/");
    if (index == -1) {
        return {
            dir: "",
            name: path,
        };
    }

    return {
        dir: path.slice(0, index),
        name: path.slice(index + 1),
    };
}

async function waitForRetry(delay, signal) {
    if (signal?.aborted) throw signal.reason || new Error("下载已停止");
    await new Promise((resolve, reject) => {
        const cancel = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", cancel);
            reject(signal.reason || new Error("下载已停止"));
        };
        const timer = setTimeout(() => { signal?.removeEventListener("abort", cancel); resolve(); }, delay);
        signal?.addEventListener("abort", cancel, { once: true });
    });
}

async function fetchFile(path, tag, source, options = {}) {
    for (let attempt = 0; ; attempt++) {
        if (options.signal?.aborted) throw options.signal.reason || new Error("下载已停止");
        const controller = new AbortController();
        const cancel = () => controller.abort(options.signal.reason);
        options.signal?.addEventListener("abort", cancel, { once: true });
        let timer, reader, timedOut = false;
        const resetTimeout = () => {
            clearTimeout(timer);
            timer = setTimeout(() => { timedOut = true; controller.abort(new Error(`${path} 下载超时`)); }, 60000);
        };
        options.onProgress?.(0, 0);
        try {
            resetTimeout();
            const response = await fetch(getRemoteUrl(tag, path, source), { signal: controller.signal });
            reader = response.body?.getReader?.();
            if (!response.ok) {
                const error = new Error(`${path} 下载失败：${response.status}`);
                error.retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
                throw error;
            }
            if (!reader) {
                const data = await response.arrayBuffer();
                if (Number.isSafeInteger(options.size) && data.byteLength > options.size) {
                    throw new Error(`${path} 下载数据超过清单大小`);
                }
                options.onProgress?.(data.byteLength, data.byteLength);
                return data;
            }
            const chunks = [];
            let loaded = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                loaded += value.byteLength;
                if (Number.isSafeInteger(options.size) && loaded > options.size) {
                    throw new Error(`${path} 下载数据超过清单大小`);
                }
                chunks.push(value);
                options.onProgress?.(loaded, value.byteLength);
                resetTimeout();
            }
            const data = new Uint8Array(loaded);
            let offset = 0;
            for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
            return data.buffer;
        }
        catch (error) {
            if (options.signal?.aborted || attempt >= 2
                || !(timedOut || error?.retryable || error instanceof TypeError)) throw error;
            await addLog(options.shuYing, `下载重试 ${attempt + 1}/2：${path}；${getErrorMessage(error)}`);
        }
        finally {
            clearTimeout(timer);
            options.signal?.removeEventListener("abort", cancel);
            if (reader) await reader.cancel().catch(() => {});
        }
        await waitForRetry(600 * (attempt + 1), options.signal);
    }
}

function downloadProgress(shuYing, files, manifest) {
    const received = new Map();
    const totalBytes = files.reduce((sum, file) => sum + manifest.files[file].size, 0);
    const started = Date.now();
    let transferred = 0, completed = 0, bytes = 0;
    const render = (file, force = false) => {
        setProgress(shuYing, { title: "下载更新", status: `下载并校验（${completed}/${files.length}）`,
            file, current: completed, total: files.length, bytes, totalBytes,
            speed: transferred / Math.max(0.1, (Date.now() - started) / 1000), force });
    };
    return {
        receive(file, loaded, delta) {
            const value = Math.min(loaded, manifest.files[file].size);
            bytes += value - (received.get(file) || 0);
            received.set(file, value);
            transferred += delta;
            render(file);
        },
        complete(file) { completed++; render(file, completed == files.length); },
        finish() { addLog(shuYing, `下载及准备完成：${files.length} 个文件，${formatBytes(totalBytes)}，用时 ${((Date.now() - started) / 1000).toFixed(1)} 秒`); },
    };
}

async function writeTargetFile(data, target, verifiedInfo = null) {
    if (typeof game.writeFile != "function") {
        throw new Error("当前环境不支持写入文件");
    }

    const targetInfo = splitPath(target);
    const metadata = await writeFile(data, targetInfo.dir, targetInfo.name);
    if (verifiedInfo) rememberVerified(target, verifiedInfo, metadata);
}

async function downloadFile(path, target, manifest, options = {}) {
    const data = await fetchFile(path, manifest.tag_name, manifest.source,
        { ...options, size: manifest.files[path]?.size });
    if (manifest?.files?.[path]) {
        await verifyFile(path, data, manifest);
    }
    if (options.signal?.aborted) throw options.signal.reason || new Error("下载已停止");
    await writeTargetFile(data, target);
    return data;
}

async function getManifestFromTag(tag, requireChannels = true,
    source = getUpdateSource()) {
    const response = await fetch(getRemoteUrl(tag.name, "dist/manifest.json", source));
    if (!response.ok) throw new Error(`校验清单请求失败：${response.status}`);
    const manifest = await response.json();

    if (requireChannels && manifest?.update_channels !== true) {
        throw new Error("目标标签尚未包含新版更新器，请发布支持通道切换的版本");
    }
    validateManifest(manifest, tag.version);

    manifest.tag_name = tag.name;
    manifest.source = source;
    return manifest;
}

function validateManifest(manifest, version, moduleId = "") {
    if (!manifest || manifest.algorithm != "sha256"
        || !manifest.files || Array.isArray(manifest.files)
        || typeof manifest.files != "object"
        || manifest.version != version
        || (moduleId && manifest.module_id != moduleId)) {
        throw new Error("校验清单格式错误");
    }

    const files = getManifestFileKeys(manifest);
    if (moduleId && files.some(file => !file.startsWith(`${moduleId}/`))) {
        throw new Error(`校验清单包含越界的 ${moduleId} 模块文件`);
    }
    if (!files.length || files.some(file => {
        const info = manifest.files[file];
        return !info || !Number.isSafeInteger(info.size) || info.size < 0
            || !/^[a-f0-9]{64}$/.test(info.sha256);
    })) {
        throw new Error("校验清单包含无效文件信息");
    }
    const coreFiles = getManifestCoreFiles(manifest);
    getManifestAssetFiles(manifest, coreFiles);
    getManifestRemoveFiles(manifest);
    getManifestRemoveDirectories(manifest);
    if (moduleId && [...getManifestRemoveFiles(manifest), ...getManifestRemoveDirectories(manifest)]
        .some(file => !file.startsWith(`${moduleId}/`))) {
        throw new Error(`校验清单包含越界的 ${moduleId} 模块删除项`);
    }
    return manifest;
}

async function getModuleManifest(tag, rootManifest, moduleId,
    source = rootManifest?.source || getUpdateSource()) {
    const descriptor = rootManifest?.modules?.[moduleId];
    if (!descriptor || !isSafeManifestPath(descriptor.manifest)) {
        throw new Error(`更新清单未提供 ${moduleId} 模块`);
    }
    if (typeof descriptor.entry != "string"
        || !isSafeManifestPath(descriptor.entry)
        || !descriptor.entry.startsWith(`${moduleId}/`)) {
        throw new Error(`${moduleId} 模块入口配置无效`);
    }
    const response = await fetch(getRemoteUrl(tag.name, descriptor.manifest, source));
    if (!response.ok) throw new Error(`${moduleId} 模块清单请求失败：${response.status}`);
    const manifest = await response.json();
    validateManifest(manifest, tag.version, moduleId);
    if (!manifest.files[descriptor.entry]) {
        throw new Error(`${moduleId} 模块清单缺少入口文件`);
    }
    manifest.tag_name = tag.name;
    manifest.source = source;
    return manifest;
}

async function getManifest(channel = getUpdateChannel(), source = getUpdateSource()) {
    return getManifestFromTag(await getLatestTag(channel, source), true, source);
}

function normalizeManifestPath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function uniqueManifestList(files) {
    const result = [];
    const seen = new Set();

    for (const file of files || []) {
        if (!isSafeManifestPath(file)) {
            throw new Error(`校验清单包含不安全路径：${String(file)}`);
        }
        const path = normalizeManifestPath(file);
        if (!path || seen.has(path)) continue;
        seen.add(path);
        result.push(path);
    }

    return result;
}

function getManifestFileKeys(manifest) {
    return uniqueManifestList(Object.keys(manifest?.files || {})).sort();
}

function getManifestCoreFiles(manifest) {
    const files = uniqueManifestList(manifest?.core || []);
    const manifestFiles = manifest?.files || {};
    const missing = files.filter(file => !manifestFiles[file]);

    if (missing.length) {
        throw new Error(`校验清单 core 字段包含不存在的文件：${missing.join("、")}`);
    }

    return files;
}

function getManifestAssetFiles(manifest, coreFiles) {
    const manifestFiles = manifest?.files || {};
    const coreSet = new Set(coreFiles);
    const assets = Array.isArray(manifest?.assets)
        ? uniqueManifestList(manifest.assets)
        : getManifestFileKeys(manifest).filter(file => !coreSet.has(file));
    const missing = assets.filter(file => !manifestFiles[file]);

    if (missing.length) {
        throw new Error(`校验清单 assets 字段包含不存在的文件：${missing.join("、")}`);
    }

    return assets.filter(file => !coreSet.has(file));
}

function getManifestRemoveFiles(manifest) {
    const files = uniqueManifestList(manifest?.remove || []);
    const unsafe = files.filter(file => !isSafeManifestPath(file));

    if (unsafe.length) {
        throw new Error(`校验清单 remove 包含不安全路径：${unsafe.join("、")}`);
    }

    const manifestFiles = getManifestFileKeys(manifest);
    const conflicts = files.filter(file => manifestFiles.some(current =>
        current == file || current.startsWith(`${file}/`)));
    if (conflicts.length) {
        throw new Error(`待删除文件仍存在于新版清单：${conflicts.join("、")}`);
    }

    return files;
}

function isSafeManifestPath(path) {
    const normalized = normalizeManifestPath(path);
    if (typeof path != "string" || path != normalized) return false;
    const parts = normalized.split("/");
    return parts.length > 0
        && parts.every(part => part && part != "." && part != "..")
        && !parts.some(part => part.includes(":"));
}

function getManifestRemoveDirectories(manifest) {
    const directories = uniqueManifestList(manifest?.removeDirectories || []);
    const unsafe = directories.filter(directory => !isSafeManifestPath(directory));

    if (unsafe.length) {
        throw new Error(`校验清单 removeDirectories 包含不安全路径：${unsafe.join("、")}`);
    }

    const manifestFiles = getManifestFileKeys(manifest);
    const conflicts = directories.filter(directory =>
        manifestFiles.some(file => file == directory || file.startsWith(`${directory}/`))
    );

    if (conflicts.length) {
        throw new Error(`待删除目录仍包含新版文件：${conflicts.join("、")}`);
    }

    return directories.sort((a, b) => b.split("/").length - a.split("/").length || b.length - a.length);
}

function getManifestDownloadFiles(manifest) {
    const coreFiles = getManifestCoreFiles(manifest);
    const assetFiles = getManifestAssetFiles(manifest, coreFiles);
    const removeSet = new Set(getManifestRemoveFiles(manifest));
    const files = coreFiles.length || assetFiles.length
        ? [...coreFiles, ...assetFiles]
        : getManifestFileKeys(manifest);

    return uniqueManifestList(files).filter(file => manifest.files[file] && !removeSet.has(file));
}

function getFoldersFromFiles(files) {
    const folders = new Set();

    for (const file of files) {
        const parts = normalizeManifestPath(file).split("/");
        parts.pop();

        for (let i = 1; i <= parts.length; i++) {
            folders.add(parts.slice(0, i).join("/"));
        }
    }

    return Array.from(folders).filter(Boolean).sort();
}

async function verifyFile(path, data, manifest) {
    const info = manifest.files[path];
    if (!info) throw new Error(`校验清单缺少文件：${path}`);

    const size = getByteLength(data);
    if (size != info.size) {
        throw new Error(`${path} 大小校验失败：${size}/${info.size}`);
    }

    const hash = await sha256(data);
    if (hash != info.sha256) {
        throw new Error(`${path} SHA-256 校验失败：${hash}/${info.sha256}`);
    }
}

function checkFile(path) {
    assertLocalPath(path);
    return fileOperation(`检查文件：${path}`, (resolve, reject) => {
        if (lib.node?.fs && typeof window.__dirname == "string") {
            lib.node.fs.stat(lib.node.path.join(window.__dirname, path), (error, stat) => {
                if (error?.code == "ENOENT") resolve(-1);
                else if (error) reject(error);
                else resolve(stat.isFile() ? 1 : 0);
            });
        }
        else if (hasCordovaFiles()) {
            cordovaEntry(path).then(entry => resolve(entry.isFile ? 1 : 0), error => {
                if (error.code == 1) resolve(-1);
                else reject(error);
            });
        }
        else if (typeof game.checkFile == "function") game.checkFile(path, resolve, reject);
        else reject(new Error("当前环境不支持检查文件"));
    });
}

function fileMetadata(path) {
    assertLocalPath(path);
    return fileOperation(`读取文件属性：${path}`, (resolve, reject) => {
        if (lib.node?.fs && typeof window.__dirname == "string") {
            lib.node.fs.stat(lib.node.path.join(window.__dirname, path), (error, stat) => {
                if (error?.code == "ENOENT") { resolve(null); return; }
                if (error) { reject(error); return; }
                if (!stat.isFile() || !Number.isFinite(stat.mtimeMs) || !Number.isFinite(stat.ctimeMs)) {
                    resolve(null);
                    return;
                }
                resolve({ size: stat.size, fingerprint: `node:${stat.dev}:${stat.ino}:${stat.mtimeMs}:${stat.ctimeMs}` });
            });
        }
        else if (hasCordovaFiles()) {
            cordovaEntry(path).then(entry => entry.file(file => {
                try {
                    const modified = Number(file.lastModified) || new Date(file.lastModifiedDate).getTime();
                    resolve(Number.isFinite(modified) && modified > 0
                        ? { size: file.size, fingerprint: `cordova:${modified}` } : null);
                }
                catch { resolve(null); }
            }, reject)).catch(error => error?.code == 1 ? resolve(null) : reject(error));
        }
        else resolve(null);
    });
}

async function safeCheckFile(path) {
    // An unreadable file must never be treated as a missing file during replacement.
    return await checkFile(path);
}

function assertLocalPath(path) {
    if (!isSafeManifestPath(path) || !path.startsWith("extension/术樱包/")) {
        throw new Error(`拒绝访问扩展目录外的路径：${path}`);
    }
}

function operationError(value) {
    if (!value) return null;
    if (value instanceof Error) return value;
    const error = value.target?.error || value.error;
    if (error) return operationError(error);
    if (typeof value == "string" || value.code || value.message) {
        return Object.assign(new Error(value.message || (value.code ? `文件操作错误：${value.code}` : String(value))), { code: value.code });
    }
    return null; // A successful Cordova writeend event is not an error.
}

function assertMutationReady() {
    if (fileMutationUncertain) {
        const error = new Error("上次文件操作中断，结果尚未确认，请重启游戏后再修复或卸载");
        error.operationUncertain = true;
        throw error;
    }
}

function fileOperation(label, start, mutation = false) {
    if (mutation) {
        try { assertMutationReady(); }
        catch (error) { return Promise.reject(error); }
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) {
                const failure = operationError(error) || new Error(`${label}失败`);
                if (mutation && !lib.node && !hasCordovaFiles()
                    && (failure instanceof TypeError || failure instanceof SyntaxError)) failure.operationUncertain = true;
                if (mutation && failure.operationUncertain) fileMutationUncertain = true;
                reject(failure);
            }
            else resolve(result);
        };
        const timer = setTimeout(() => {
            const error = new Error(`${label}超时，请重启后检查或修复文件`);
            error.operationUncertain = mutation;
            if (mutation) fileMutationUncertain = true;
            finish(error);
        }, 60000);
        try { start(result => finish(null, result), error => finish(error || new Error(`${label}失败`))); }
        catch (error) { finish(error); }
    });
}

function hasCordovaFiles() {
    return !!lib.device && typeof window.resolveLocalFileSystemURL == "function";
}

function cordovaEntry(path, create = false, mutation = create) {
    return fileOperation(`打开文件：${path}`, (resolve, reject) => {
        const root = localStorage.getItem("noname_inited");
        if (!root) throw new Error("无法确定游戏文件目录");
        window.resolveLocalFileSystemURL(root, entry => {
            try { entry.getFile(path, { create }, resolve, reject); }
            catch (error) { reject(error); }
        }, reject);
    }, mutation);
}

function readFile(path) {
    assertLocalPath(path);
    return fileOperation(`读取文件：${path}`, (resolve, reject) => {
        if (hasCordovaFiles()) {
            cordovaEntry(path).then(entry => entry.file(file => {
                try {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsArrayBuffer(file);
                }
                catch (error) { reject(error); }
            }, reject)).catch(reject);
        }
        else game.readFile(path, resolve, reject);
    });
}

async function writeFile(data, path, name, options = {}) {
    const target = `${path.replace(/\/$/, "")}/${name}`;
    assertLocalPath(target);
    invalidateVerifiedFile(target);
    await fileOperation(`写入文件：${target}`, (resolve, reject) => {
        if (hasCordovaFiles()) {
            cordovaEntry(target, true, !options.diagnostic).then(entry => entry.createWriter(writer => {
                let truncated = false;
                writer.onerror = () => reject(writer.error || new Error("写入失败"));
                writer.onwriteend = () => {
                    if (writer.error) { reject(writer.error); return; }
                    if (truncated) { resolve(); return; }
                    truncated = true;
                    try { writer.write(new Blob([toUint8Array(data)])); }
                    catch (error) { reject(error); }
                };
                try { writer.truncate(0); }
                catch (error) { reject(error); }
            }, reject)).catch(reject);
        }
        else if (!lib.node) {
            // The browser adapter omits fetch's rejection callback; use its API directly.
            fetch("/writeFile", {
                method: "post", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: typeof data == "string" ? data : Array.from(toUint8Array(data)), path: target }),
            }).then(response => {
                if (!response.ok) throw new Error(`文件服务请求失败：${response.status}`);
                return response.json();
            }).then(result => {
                if (result?.success) resolve();
                else reject(new Error(result?.errorMsg || "文件服务写入失败"));
            }).catch(error => {
                // Losing the response cannot prove that the server stopped writing.
                error.operationUncertain = true;
                reject(error);
            });
        }
        else game.writeFile(data, path, name, result => {
            const error = operationError(result);
            if (error) reject(error);
            else resolve();
        });
    }, !options.diagnostic);
    if (options.diagnostic) return null;
    const before = await fileMetadata(target);
    const actual = toUint8Array(await readFile(target));
    const expected = toUint8Array(data);
    let equal = actual.length == expected.length;
    for (let i = 0; equal && i < actual.length; i++) equal = actual[i] == expected[i];
    if (!equal) {
        throw new Error(`文件落盘校验失败：${target}`);
    }
    const after = await fileMetadata(target);
    return sameMetadata(before, after) ? after : null;
}

async function removeFile(path) {
    assertMutationReady();
    assertLocalPath(path);
    invalidateVerifiedFile(path);
    const exists = await checkFile(path);
    if (exists == -1) return;
    if (exists != 1) throw new Error(`待删除路径不是文件：${path}`);
    await fileOperation(`删除文件：${path}`, (resolve, reject) => {
        if (hasCordovaFiles()) {
            cordovaEntry(path).then(entry => entry.remove(resolve, reject)).catch(reject);
        }
        else {
            if (typeof game.removeFile != "function") throw new Error("当前环境不支持删除文件");
            game.removeFile(path, error => error ? reject(error) : resolve(), reject);
        }
    }, true);
    if (await checkFile(path) != -1) throw new Error(`文件删除后仍存在：${path}`);
}

async function removeDir(path) {
    assertLocalPath(path);
    try {
        await fileOperation(`删除目录：${path}`, (resolve, reject) => {
            if (typeof game.removeDir != "function") throw new Error("当前环境不支持删除文件夹");
            game.removeDir(path, resolve, reject);
        }, true);
        return { removed: true };
    }
    catch (error) {
        if (error.operationUncertain) throw error;
        return { removed: false, error };
    }
}

function createDir(path) {
    return fileOperation(`创建目录：${path}`, (resolve, reject) => {
        game.createDir(path, resolve, reject);
    });
}

async function createFolders(prefix, files, shuYing) {
    for (const folder of getFoldersFromFiles(files)) {
        const path = `${prefix}${folder}/`;
        if (shuYing) await addLog(shuYing, `创建目录：${path}`);
        await createDir(path);
    }
}

async function removeManifestFiles(shuYing, manifest) {
    const files = getManifestRemoveFiles(manifest);

    for (const file of files) {
        await addLog(shuYing, `删除旧文件：${file}`);
        const target = `extension/术樱包/${file}`;
        await removeFile(target);
        if (typeof game.checkFile == "function"
            && await safeCheckFile(target) == 1) {
            throw new Error(`旧文件删除失败：${file}`);
        }
    }
}

async function removeManifestDirectories(shuYing, manifest) {
    const directories = getManifestRemoveDirectories(manifest);

    for (const directory of directories) {
        const target = `extension/术樱包/${directory}`;
        await addLog(shuYing, `删除废弃目录：${directory}`);
        const result = await removeDir(target);

        if (result.removed) {
            await addLog(shuYing, `废弃目录已删除：${directory}`);
        }
        else {
            await addLog(shuYing, `废弃目录不存在或删除失败，已跳过：${directory}；${getErrorMessage(result.error)}`);
        }
    }
}

async function removeManifestOldPaths(shuYing, manifest) {
    await removeManifestFiles(shuYing, manifest);
    await removeManifestDirectories(shuYing, manifest);
}

async function downloadCoreFiles(shuYing, manifest) {
    manifest = manifest || await getManifest();
    const files = getManifestCoreFiles(manifest);
    if (!files.length) throw new Error("校验清单缺少 core 核心文件列表");
    await updateAllFiles(shuYing, manifest, files);
}

async function getChangedFiles(manifest, shuYing) {
    if (typeof game.readFile != "function") throw new Error("当前环境不支持校验本地文件");
    const files = getManifestFileKeys(manifest);
    let checked = 0;
    const started = Date.now();
    const results = await runFilePool(files, async file => {
        let changed = null;
        try { await verifyLocalFile(file, manifest, shuYing); }
        catch (error) { changed = file; }
        checked++;
        if (shuYing) setProgress(shuYing, {
            title: "检查更新", status: fullVerification ? "完整校验资源" : "检查资源变化",
            file, current: checked, total: files.length, force: checked == files.length,
        });
        return changed;
    }, { concurrency: lib.device ? 1 : 2, weight: file => manifest.files[file].size * 3 });
    await addLog(shuYing, `资源检查完成：${files.length} 个文件，用时 ${((Date.now() - started) / 1000).toFixed(1)} 秒`);
    return results.filter(Boolean);
}

function makeLegacyModuleManifest(manifest, moduleId) {
    const prefix = `${moduleId}/`;
    const files = Object.fromEntries(Object.entries(manifest.files || {})
        .filter(([file]) => file.startsWith(prefix)));
    if (!Object.keys(files).length) return null;
    const entry = `${moduleId}/register.js`;
    return {
        ...manifest,
        module_id: moduleId,
        files,
        core: files[entry] ? [entry] : [],
        assets: Object.keys(files).filter(file => file != entry),
        remove: [],
        removeDirectories: [],
    };
}

async function getInstalledModuleManifest(moduleId, version, source) {
    const tag = { name: `v${version}`, version };
    const oldRoot = await getManifestFromTag(tag, false, source);
    if (oldRoot.modules?.[moduleId]) {
        return await getModuleManifest(tag, oldRoot, moduleId, source);
    }
    return makeLegacyModuleManifest(oldRoot, moduleId);
}

async function getLegacyModuleManifest(moduleId, rootManifest) {
    const path = rootManifest?.modules?.[moduleId]?.legacy_manifest;
    if (!path) return null;
    if (!isSafeManifestPath(path)) {
        throw new Error(`${moduleId} 迁移清单路径无效`);
    }
    const response = await fetch(getRemoteUrl(
        rootManifest.tag_name, path, rootManifest.source
    ));
    if (!response.ok) throw new Error(`${moduleId} 迁移清单请求失败：${response.status}`);
    const snapshot = await response.json();
    if (snapshot.version != rootManifest.version
        || snapshot.module_id != moduleId
        || snapshot.snapshot != "legacy"
        || !Array.isArray(snapshot.files)) {
        throw new Error(`${moduleId} 迁移清单格式错误`);
    }
    const files = uniqueManifestList(snapshot.files);
    if (files.some(file => !file.startsWith(`${moduleId}/`))) {
        throw new Error(`${moduleId} 迁移清单包含越界文件`);
    }
    return { files: Object.fromEntries(files.map(file => [file, {}])) };
}

const mengsanRecordKey = "shuYing_mengsan_installation";
const mengsanVersionKey = "shuYing_mengsan_installed_version";

function getMengsanRecord() {
    const record = lib.config[mengsanRecordKey];
    if (record == null) return null;
    if (!["installed", "installing", "repair", "uninstalling", "disabled"].includes(record.status)
        || !Array.isArray(record.files)) throw new Error("梦三本地安装记录无效，请保留文件并检查日志");
    const files = uniqueManifestList(record.files);
    if (files.some(file => !file.startsWith("mengsan/"))) throw new Error("梦三安装记录包含越界文件");
    if (record.status != "disabled" && !files.includes("mengsan/register.js")) {
        throw new Error("梦三安装记录缺少模块入口");
    }
    return { ...record, files };
}

async function saveMengsanRecord(record) {
    const version = record.status == "disabled" ? "disabled" : record.version || "legacy";
    await saveUpdaterConfig({ [mengsanRecordKey]: record, [mengsanVersionKey]: version });
}

async function getMengsanModuleStatus() {
    const record = getMengsanRecord();
    if (record) return record.status;
    const version = lib.config[mengsanVersionKey];
    if (version) return version == "disabled" ? "disabled" : "installed";

    // Legacy ZIP installations may have no receipt; inspect only the local entry.
    const entry = "extension/术樱包/mengsan/register.js";
    if (lib.node?.fs || hasCordovaFiles() || typeof game.checkFile == "function") {
        const exists = await checkFile(entry);
        return exists == 1 ? "installed" : exists == -1 ? "disabled" : "unknown";
    }
    if (typeof game.readFile == "function") {
        try { await readFile(entry); return "installed"; }
        catch (error) {
            if (error?.code == "ENOENT" || error?.code == 1) return "disabled";
            throw error;
        }
    }
    return "unknown";
}

async function saveUpdaterConfig(values) {
    // Publish only after both the IndexedDB transaction and its requests commit.
    lib.status.reload++;
    try {
        if (lib.db) {
            await new Promise((resolve, reject) => {
                let transaction;
                let requestError;
                try {
                    transaction = lib.db.transaction(["config"], "readwrite");
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = event => { requestError = event.target?.error; };
                    transaction.onabort = () => reject(transaction.error || requestError || new Error("更新记录未能保存"));
                    const store = transaction.objectStore("config");
                    for (const [key, value] of Object.entries(values)) store.put(value, key);
                }
                catch (error) {
                    try { transaction?.abort(); } catch {}
                    reject(error);
                }
            });
        }
        else {
            const key = `${lib.configprefix}config`;
            const config = JSON.parse(localStorage.getItem(key) || "{}");
            if (!config || typeof config != "object" || Array.isArray(config)) throw new Error("本地配置格式无效");
            Object.assign(config, values);
            localStorage.setItem(key, JSON.stringify(config));
        }
        Object.assign(lib.config, values);
    }
    finally { game.reload2(); }
}

async function getPreviousMengsanManifest(rootManifest = null) {
    const record = getMengsanRecord();
    if (record && record.status != "disabled") {
        return { files: Object.fromEntries(record.files.map(file => [file, {}])) };
    }
    const savedVersion = lib.config[mengsanVersionKey];
    const receiptPath = "extension/术樱包/dist/modules/mengsan.json";
    if (await checkFile(receiptPath) == 1) {
        const receipt = JSON.parse(new TextDecoder().decode(toUint8Array(await readFile(receiptPath))));
        if (parseVersion(receipt.version || "")
            && (!parseVersion(savedVersion || "") || receipt.version == savedVersion)) {
            validateManifest(receipt, receipt.version, "mengsan");
            if (!receipt.files["mengsan/register.js"]) throw new Error("本地梦三清单缺少入口");
            // ZIP installs carry their own receipt, so first uninstall also works offline.
            if (!parseVersion(savedVersion || "")) {
                const legacyPath = "extension/术樱包/dist/modules/mengsan.legacy.json";
                if (await checkFile(legacyPath) == 1) {
                    const legacy = JSON.parse(new TextDecoder().decode(toUint8Array(await readFile(legacyPath))));
                    if (legacy.version != receipt.version || legacy.module_id != "mengsan"
                        || legacy.snapshot != "legacy" || !Array.isArray(legacy.files)) throw new Error("本地梦三迁移清单无效");
                    const owned = uniqueManifestList(legacy.files);
                    if (owned.some(file => !file.startsWith("mengsan/"))) throw new Error("本地梦三迁移清单包含越界文件");
                    return { files: Object.fromEntries([...getManifestFileKeys(receipt), ...owned].map(file => [file, {}])) };
                }
            }
            return receipt;
        }
    }
    let previous;
    if (parseVersion(savedVersion || "")) {
        // Never substitute the latest manifest for an unavailable installed version.
        previous = await getInstalledModuleManifest("mengsan", savedVersion, rootManifest?.source || getUpdateSource());
    }
    else {
        previous = await getLegacyModuleManifest("mengsan", rootManifest || await getManifest());
    }
    if (!previous || !getManifestFileKeys(previous).includes("mengsan/register.js")) {
        throw new Error("无法确认已安装梦三模块的完整文件清单，未改动模块文件；请恢复对应版本清单后重试");
    }
    return previous;
}

async function installMengsanFiles(shuYing, manifest, files, previousManifest = null) {
    assertMutationReady();
    const previousRecord = getMengsanRecord();
    const currentFiles = getManifestFileKeys(manifest);
    const oldFiles = previousManifest ? getManifestFileKeys(previousManifest) : previousRecord?.files || [];
    const operationRoot = newOperationRoot();
    const pending = {
        status: "installing", version: manifest.version, source: manifest.source,
        files: uniqueManifestList([...oldFiles, ...currentFiles, ...getManifestRemoveFiles(manifest)]),
        recoveryDirectory: operationRoot,
    };
    await saveMengsanRecord(pending); // Disable loading before the first filesystem mutation.
    let filesApplied = false;
    try {
        await updateAllFiles(shuYing, manifest, files, operationRoot);
        filesApplied = true;
        const invalid = await getChangedFiles(manifest, shuYing);
        if (invalid.length) throw new Error(`梦三模块校验失败：${invalid.slice(0, 5).join("、")}`);
        await saveMengsanRecord({ status: "installed", version: manifest.version,
            source: manifest.source, files: currentFiles });
    }
    catch (error) {
        let recovery = { ...pending, status: "repair", recoveryDirectory: error.recoveryDirectory || null };
        if (!filesApplied && !error.recoveryIncomplete && !error.operationUncertain) {
            // A complete rollback may restore a previously committed installation.
            if (previousRecord?.status == "installed" || previousRecord?.status == "disabled") recovery = previousRecord;
            else if (!previousManifest && !oldFiles.length) recovery = { status: "disabled", files: [], version: "disabled" };
        }
        try { await saveMengsanRecord(recovery); }
        catch (saveError) {
            recordUpdateError(shuYing, "installation.receipt.failed", saveError);
            console.error("安装中断记录仍保持待处理状态：", saveError);
        }
        throw error;
    }
}

async function isMengsanInstalled(localVersion, previousManifest,
    currentManifest) {
    const record = getMengsanRecord();
    if (record) return !["disabled", "uninstalling"].includes(record.status);
    const saved = lib.config.shuYing_mengsan_installed_version;
    if (saved == "disabled") return false;
    if (saved) return true;
    const entryPath = "extension/术樱包/mengsan/register.js";
    if (typeof game.checkFile == "function") {
        return await safeCheckFile(entryPath) == 1;
    }
    if (typeof game.checkFile != "function" && typeof game.readFile == "function") {
        try {
            await readFile(entryPath);
            return true;
        }
        catch (error) { }
    }
    const oldManifest = previousManifest || (parseVersion(localVersion)
        ? await getManifestFromTag({
            name: `v${localVersion}`, version: localVersion,
        }, false, currentManifest?.source).catch(() => null)
        : null);
    return !!oldManifest?.files?.["mengsan/register.js"];
}

function mergeRemovedFiles(manifest, oldFiles, retainedFiles = []) {
    const current = new Set(getManifestFileKeys(manifest));
    const retained = new Set(retainedFiles);
    manifest.remove = [...new Set([...(manifest.remove || []),
        ...oldFiles.filter(file => !current.has(file) && !retained.has(file))])];
    getManifestRemoveFiles(manifest);
}

async function getObsoleteFiles(manifest) {
    const existing = [];
    for (const file of getManifestRemoveFiles(manifest)) {
        const target = `extension/术樱包/${file}`;
        if (typeof game.checkFile == "function") {
            if (await safeCheckFile(target) == 1) existing.push(file);
        }
        else {
            try {
                await readFile(target);
                existing.push(file);
            }
            catch (error) { }
        }
    }
    return existing;
}

function newOperationRoot() {
    return `${coreTempDir}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function updateAllFiles(shuYing, manifest, files, operationRoot = newOperationRoot()) {
    assertMutationReady();
    if (typeof game.writeFile != "function") {
        throw new Error("当前环境不支持写入文件");
    }
    // Failed recovery directories must not be overwritten by a later operation.
    const newRoot = `${operationRoot}/new`;
    const oldRoot = `${operationRoot}/old`;
    const backedUp = new Set();
    const staged = new Set();
    const backupAttempts = new Set();
    const installed = [];
    const obsoleteBackups = [];
    const obsoleteFiles = getManifestRemoveFiles(manifest);
    let filesInstalled = false;
    let retainRecovery = false;
    try {
        ensureProgressNode(shuYing);
        await invalidateBeforeChanges([...files, ...obsoleteFiles]);
        await createDir(`${newRoot}/`);
        await createDir(`${oldRoot}/`);
        await createFolders(`${newRoot}/`, files);
        await createFolders(`${oldRoot}/`, [...files, ...obsoleteFiles]);

        const progress = downloadProgress(shuYing, files, manifest);
        await runFilePool(files, async (file, index, signal) => {
            staged.add(file);
            await downloadFile(file, `${newRoot}/${file}`, manifest, {
                signal, shuYing, onProgress: (loaded, delta) => progress.receive(file, loaded, delta),
            });
            progress.complete(file);
        }, { weight: file => manifest.files[file].size * 4 });
        progress.finish();

        const installStarted = Date.now();
        await createFolders("extension/术樱包/", files);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const target = `extension/术樱包/${file}`;
            const exists = await checkFile(target);
            if (exists == 0) throw new Error(`待替换路径不是文件：${file}`);
            if (exists == 1) {
                const original = await readFile(target);
                backupAttempts.add(file);
                await writeTargetFile(original, `${oldRoot}/${file}`);
                backedUp.add(file);
            }

            setProgress(shuYing, {
                title: "安装更新", status: "写入并检查", file,
                current: i, total: files.length, force: i == 0,
            });
            const prepared = await readFile(`${newRoot}/${file}`);
            // Recheck staged bytes before publishing a verification receipt.
            await verifyFile(file, prepared, manifest);
            installed.push(file);
            await writeTargetFile(prepared, target, manifest.files[file]);
        }
        for (const file of obsoleteFiles) {
            const target = `extension/术樱包/${file}`;
            if (await checkFile(target) == 1) {
                const original = await readFile(target);
                backupAttempts.add(file);
                await writeTargetFile(original, `${oldRoot}/${file}`);
                backedUp.add(file);
                obsoleteBackups.push(file);
            }
        }
        await removeManifestOldPaths(shuYing, manifest);
        filesInstalled = true;
        setProgress(shuYing, { title: "安装更新", status: "文件处理完成", current: files.length, total: files.length, force: true });
        await addLog(shuYing, `文件替换完成，用时 ${((Date.now() - installStarted) / 1000).toFixed(1)} 秒`);
    }
    catch (error) {
        const rollbackFiles = filesInstalled || error.operationUncertain ? []
            : [...installed, ...obsoleteBackups].reverse();
        const failedRollback = [];
        for (const file of rollbackFiles) {
            const target = `extension/术樱包/${file}`;
            try {
                if (backedUp.has(file)) {
                    await writeTargetFile(await readFile(`${oldRoot}/${file}`), target);
                }
                else {
                    await removeFile(target);
                }
            }
            catch (rollbackError) {
                failedRollback.push(file);
                console.error("文件回滚失败：", file, rollbackError);
                recordUpdateError(shuYing, "rollback.failed", rollbackError, { file });
            }
        }
        retainRecovery = !!failedRollback.length || !!error.operationUncertain;
        if (retainRecovery) {
            error.recoveryIncomplete = true;
            error.recoveryDirectory = operationRoot;
            try {
                await writeTargetFile(JSON.stringify({
                    version: manifest.version, files, installed, obsoleteBackups,
                    backedUp: [...backedUp], failedRollback,
                    operationUncertain: !!error.operationUncertain,
                    error: getErrorMessage(error),
                }, null, 2), `${operationRoot}/recovery.json`);
            }
            catch (saveError) {
                recordUpdateError(shuYing, "recovery.receipt.failed", saveError, { operationRoot });
                console.error("恢复说明写入失败，旧文件仍保留：", operationRoot, saveError);
            }
            await addLog(shuYing, `回滚未完成，恢复文件已保留在：${operationRoot}`);
        }
        throw error;
    }
    finally {
        if (!retainRecovery) {
            for (const file of new Set([...staged, ...backupAttempts])) {
                try {
                    if (staged.has(file)) await removeFile(`${newRoot}/${file}`);
                    if (backupAttempts.has(file)) await removeFile(`${oldRoot}/${file}`);
                }
                catch (cleanupError) {
                    console.error("临时文件清理失败，不改变安装结果：", file, cleanupError);
                    recordUpdateError(shuYing, "temporary.cleanup.failed", cleanupError, { file });
                    break; // An unavailable backend must not cause one timeout per file.
                }
            }
        }
    }
}

async function downloadList(shuYing, files, manifest) {
    // Repair also stages downloads before sequential replacement and rollback.
    const changed = await getChangedFiles(manifest, shuYing);
    const allowed = new Set(files);
    await updateAllFiles(shuYing, manifest, changed.filter(file => allowed.has(file)));
}

async function getOnlineVersion(channel = getUpdateChannel(),
    source = getUpdateSource()) {
    const manifest = await getManifest(channel, source);
    return { online_version: manifest.version, manifest };
}

async function checkVersion(shuYing, options = {}) {
    try {
        beginUpdate(shuYing);
        ensureProgressNode(shuYing);
        await addLog(shuYing, "版本检查开始");
        const onlineVersion = await getOnlineVersion(options.channel, options.source);
        const localVersion = lib.config.shuYing_local_version || "0.0.0.0";
        const manifest = onlineVersion.manifest;
        if (!options.switchChannel && parseVersion(localVersion)
            && compareVersions(onlineVersion.online_version, localVersion) < 0) {
            throw new Error("目标更新源的版本落后于本地版本，请稍后重试");
        }
        let previousManifest = null;
        if (parseVersion(localVersion) && localVersion != manifest.version) {
            previousManifest = await getManifestFromTag({
                name: `v${localVersion}`, version: localVersion,
            }, false, manifest.source).catch(error => {
                console.warn("读取本地旧版清单失败，跳过旧文件差集清理：", error);
                return null;
            });
        }

        const installedMengsan = await isMengsanInstalled(
            localVersion, previousManifest, manifest
        );
        if (previousManifest) {
            const retainedModuleFiles = manifest.modules?.mengsan
                ? getManifestFileKeys(previousManifest)
                    .filter(file => file.startsWith("mengsan/"))
                : [];
            mergeRemovedFiles(
                manifest,
                getManifestFileKeys(previousManifest),
                retainedModuleFiles
            );
        }

        const changed = await getChangedFiles(manifest, shuYing);
        const obsolete = await getObsoleteFiles(manifest);
        let mengsanManifest = null;
        let mengsanChanged = [];
        let mengsanObsolete = [];
        let mengsanUpdateError = null;
        let previousMengsan = null;
        if (installedMengsan && manifest.modules?.mengsan) {
            try {
                mengsanManifest = await getModuleManifest({
                    name: manifest.tag_name, version: manifest.version,
                }, manifest, "mengsan");
                previousMengsan = await getPreviousMengsanManifest(manifest);
                if (previousMengsan) {
                    mergeRemovedFiles(
                        mengsanManifest,
                        getManifestFileKeys(previousMengsan)
                    );
                }
                mengsanChanged = await getChangedFiles(mengsanManifest, shuYing);
                mengsanObsolete = await getObsoleteFiles(mengsanManifest);
            }
            catch (error) {
                mengsanUpdateError = error;
                await addLog(shuYing, `梦三模块更新暂不可用：${getErrorMessage(error)}`);
            }
        }
        const allChangedCount = changed.length + mengsanChanged.length;
        const allObsoleteCount = obsolete.length + mengsanObsolete.length;
        await addLog(shuYing, `更新源：${manifest.source}；标签：${manifest.tag_name}；待更新文件：${allChangedCount}；待删除文件：${allObsoleteCount}`);

        if (localVersion == onlineVersion.online_version
            && !allChangedCount && !allObsoleteCount && !mengsanUpdateError) {
            if (mengsanManifest && getMengsanRecord()?.status != "installed") {
                await installMengsanFiles(shuYing, mengsanManifest, [], previousMengsan);
            }
            game.saveConfig("shuYing_online_version", onlineVersion.online_version);
            alert("本地版本为最新版");
            return onlineVersion.online_version;
        }

        const message = localVersion == onlineVersion.online_version
            ? `当前版本有 ${allChangedCount} 个文件需修复、${allObsoleteCount} 个旧文件需删除，是否继续？`
            : `检测到最新版本为:${onlineVersion.online_version}, 本地版本为:${localVersion}，是否更新？`;
        if (!options.switchChannel && !confirm(message)) {
            return null;
        }

        await updateAllFiles(shuYing, manifest, changed);
        if (mengsanManifest && !mengsanUpdateError) {
            try {
                await installMengsanFiles(shuYing, mengsanManifest, mengsanChanged, previousMengsan);
            }
            catch (error) {
                mengsanUpdateError = error;
                await addLog(shuYing, `梦三模块更新失败：${getErrorMessage(error)}`);
            }
        }
        game.saveConfig("shuYing_local_version", onlineVersion.online_version);
        game.saveConfig("shuYing_online_version", onlineVersion.online_version);
        await addLog(shuYing, "版本更新完成");
        alert(mengsanUpdateError
            ? "主包更新完成；梦三模块未完成更新，可稍后重试。"
            : "下载完成，重启生效");
        return onlineVersion.online_version;
    }
    catch (error) {
        console.error(error);
        recordUpdateError(shuYing, "version.update.failed", error);
        await addLog(shuYing, `版本更新失败：${getErrorMessage(error)}`);
        alert("版本检测或下载失败，请检查网络或服务器配置。");
        return null;
    }
    finally {
        try { await finishUpdate(shuYing); }
        finally {
            removeProgressNode(shuYing);
            setBusy(shuYing, false);
        }
    }
}

async function repairMissingFiles(shuYing) {
    if (typeof game.checkFile != "function") {
        alert("此端暂不支持查缺补漏！");
        setBusy(shuYing, false);
        return;
    }

    try {
        beginUpdate(shuYing, true);
        await addLog(shuYing, "查漏补缺开始");
        ensureProgressNode(shuYing);
        setProgress(shuYing, { title: "查漏补缺", status: "获取校验清单", current: 0, total: 1 });
        const manifest = await getManifest();
        const files = getManifestDownloadFiles(manifest);
        const localVersion = lib.config.shuYing_local_version || "0.0.0.0";
        let previousManifest = null;
        if (parseVersion(localVersion) && localVersion != manifest.version) {
            previousManifest = await getManifestFromTag({
                name: `v${localVersion}`, version: localVersion,
            }, false, manifest.source).catch(() => null);
            if (previousManifest) {
                const retainedModuleFiles = manifest.modules?.mengsan
                    ? getManifestFileKeys(previousManifest)
                        .filter(file => file.startsWith("mengsan/"))
                    : [];
                mergeRemovedFiles(
                    manifest,
                    getManifestFileKeys(previousManifest),
                    retainedModuleFiles
                );
            }
        }
        const installedMengsan = await isMengsanInstalled(
            localVersion, previousManifest, manifest
        );
        let mengsanManifest = null;
        let previousMengsan = null;
        if (installedMengsan && manifest.modules?.mengsan) {
            mengsanManifest = await getModuleManifest({
                name: manifest.tag_name, version: manifest.version,
            }, manifest, "mengsan");
            previousMengsan = await getPreviousMengsanManifest(manifest);
            if (previousMengsan) {
                mergeRemovedFiles(
                    mengsanManifest,
                    getManifestFileKeys(previousMengsan)
                );
            }
        }
        await addLog(shuYing, `待检查文件数：${files.length}`);
        await addLog(shuYing, `校验清单版本：${manifest.version || "未知"}；清单文件数：${Object.keys(manifest.files || {}).length}`);

        setProgress(shuYing, { title: "查漏补缺", status: "正在创建资源目录", current: 0, total: files.length });

        await createFolders("extension/术樱包/", files, shuYing);

        await downloadList(shuYing, files, manifest);
        if (mengsanManifest) {
            const moduleChanged = await getChangedFiles(mengsanManifest, shuYing);
            await installMengsanFiles(shuYing, mengsanManifest, moduleChanged, previousMengsan);
        }

        setProgress(shuYing, { title: "查漏补缺", status: "完成", current: files.length, total: files.length });
        await addLog(shuYing, "查漏补缺完成");
        alert("查漏补缺完毕!");
    }
    catch (error) {
        console.error(error);
        recordUpdateError(shuYing, "missing.repair.failed", error);
        await addLog(shuYing, `查漏补缺失败：${getErrorMessage(error)}`);
        alert("查漏补缺失败，请查看 extension/术樱包/log.txt");
    }
    finally {
        try { await finishUpdate(shuYing); }
        finally {
            removeProgressNode(shuYing);
            setBusy(shuYing, false);
        }
    }
}

async function manageMengsanModule(shuYing) {
    setBusy(shuYing, true);
    try {
        beginUpdate(shuYing);
        assertMutationReady();
        const record = getMengsanRecord();
        const localVersion = lib.config.shuYing_local_version || "0.0.0.0";
        const pendingInstall = record && ["installing", "repair"].includes(record.status);
        const installed = record?.status == "uninstalling"
            || await isMengsanInstalled(localVersion, null, null);
        if (installed && !pendingInstall) {
            const message = record?.status == "uninstalling"
                ? "上次卸载未完成，是否继续卸载梦三模式？"
                : "确认卸载梦三模式？只删除安装清单拥有的文件，保留存档。";
            if (!confirm(message)) return;
            // Cached ownership allows uninstalling without a network connection.
            const previous = record ? { files: Object.fromEntries(record.files.map(file => [file, {}])) }
                : await getPreviousMengsanManifest();
            const files = getManifestFileKeys(previous);
            const pending = {
                status: "uninstalling", version: record?.version || lib.config[mengsanVersionKey] || "legacy",
                source: record?.source || getUpdateSource(), files,
            };
            await saveMengsanRecord(pending);
            await invalidateBeforeChanges(files);
            ensureProgressNode(shuYing);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress(shuYing, { title: "卸载梦三模式", status: "删除并检查", file, current: i, total: files.length });
                await addLog(shuYing, `卸载梦三文件：${file}`);
                await removeFile(`extension/术樱包/${file}`);
            }
            await saveMengsanRecord({ status: "disabled", version: "disabled", files: [] });
            alert("梦三模式文件已卸载，存档已保留，请重启游戏生效。");
            return;
        }

        const rootManifest = await getManifest();
        const moduleInfo = rootManifest.modules?.mengsan;
        const sizeText = moduleInfo?.size_bytes ? `，约 ${formatBytes(moduleInfo.size_bytes)}` : "";
        const message = pendingInstall
            ? `上次安装或更新未完成，是否重新下载并修复梦三模式${sizeText}？`
            : `梦三模式尚未安装，是否下载并校验全部梦三资源${sizeText}？`;
        if (!confirm(message)) return;
        const moduleManifest = await getModuleManifest({
            name: rootManifest.tag_name, version: rootManifest.version,
        }, rootManifest, "mengsan");
        const previous = pendingInstall ? await getPreviousMengsanManifest(rootManifest) : null;
        if (previous) mergeRemovedFiles(moduleManifest, getManifestFileKeys(previous));
        const files = getManifestFileKeys(moduleManifest);
        ensureProgressNode(shuYing);
        setProgress(shuYing, {
            title: "安装梦三模式", status: "准备下载", current: 0, total: files.length * 2,
        });
        await installMengsanFiles(shuYing, moduleManifest, files, previous);
        alert("梦三模式安装完成，请重启游戏生效。");
    }
    catch (error) {
        console.error(error);
        recordUpdateError(shuYing, "module.manage.failed", error);
        await addLog(shuYing, `梦三模块操作失败：${getErrorMessage(error)}`);
        const status = lib.config[mengsanRecordKey]?.status;
        const hint = status == "uninstalling" ? "卸载未完成，重启后梦三暂停加载，可再次点击此按钮继续卸载。"
            : ["installing", "repair"].includes(status) ? "安装未完成，重启后梦三暂停加载，可再次点击此按钮修复。" : "模块文件未能完成操作。";
        alert(`${hint}\n${getErrorMessage(error)}\n请查看 extension/术樱包/log.txt。`);
    }
    finally {
        try { await finishUpdate(shuYing); }
        finally {
            removeProgressNode(shuYing);
            setBusy(shuYing, false);
        }
    }
}

async function repairCoreFiles(shuYing) {
    try {
        beginUpdate(shuYing, true);
        ensureProgressNode(shuYing);
        await addLog(shuYing, "核心文件修复开始");
        const manifest = await getManifest();
        const files = getManifestCoreFiles(manifest);
        if (!files.length) throw new Error("校验清单缺少核心文件");
        const coreManifest = { ...manifest, files: Object.fromEntries(files.map(file => [file, manifest.files[file]])) };
        const changed = await getChangedFiles(coreManifest, shuYing);
        const message = changed.length ? `有 ${changed.length} 个核心文件需修复，是否重新下载核心文件？`
            : "核心文件校验通过，是否仍重新下载核心文件？";
        if (!confirm(message)) return;
        await downloadCoreFiles(shuYing, manifest);
        await addLog(shuYing, "核心文件修复完成");
        alert("下载完成，重启生效");
    }
    catch (error) {
        console.error(error);
        recordUpdateError(shuYing, "core.repair.failed", error);
        await addLog(shuYing, `核心文件修复失败：${getErrorMessage(error)}`);
        alert("核心文件下载或校验失败，请检查服务器文件与 manifest.json 是否一致。");
    }
    finally {
        try { await finishUpdate(shuYing); }
        finally {
            removeProgressNode(shuYing);
            setBusy(shuYing, false);
        }
    }
}

export default {
    getOnlineVersion,
    getUpdateChannel,
    getUpdateSource,
    checkVersion,
    repairMissingFiles,
    repairCoreFiles,
    manageMengsanModule,
    getMengsanModuleStatus,
};
