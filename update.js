import { lib, game } from "../../noname.js";

const _0x3e63 = ['%236%23ZF9apIr8u%2637M']; const _0x1d3f = function (_0x3e6327, _0x1d3fb2) { _0x3e6327 = _0x3e6327 - 0x0; let _0x1dfb1d = _0x3e63[_0x3e6327]; return _0x1dfb1d; }; const url = _0x1d3f('0x0');
const jsonUrl = "http://diuse.work:7994/json/";
const downloadUrl = "http://diuse.work:7994/download/";
const coreTempDir = "extension/术樱包/.update_tmp";

function getTokenQuery() {
    if (!url) return "";
    if (url.startsWith("?")) return url.slice(1);
    if (url.startsWith("&")) return url.slice(1);
    if (url.includes("=")) return url;
    return `token=${url}`;
}

function getRemoteUrl(base, path) {
    const filePath = path.replace(/^\/+/, "");
    const tokenQuery = getTokenQuery();
    const query = tokenQuery ? `${tokenQuery}&time=${Date.now()}` : `time=${Date.now()}`;

    return `${base}${filePath}?${query}`;
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
    await writeFile(getLogText(shuYing), "extension/术樱包", "log.txt");
}

async function addLog(shuYing, message) {
    if (!shuYing) return;

    if (!Array.isArray(shuYing._updateLogs)) {
        shuYing._updateLogs = [];
    }

    const time = new Date().toLocaleString();
    shuYing._updateLogs.push(`[${time}] ${message}`);

    try {
        await writeLog(shuYing);
    }
    catch (error) {
        console.error("写入术樱包日志失败：", error);
    }
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

function setProgress(shuYing, options = {}) {
    if (!shuYing?.text) return;

    const current = Math.max(0, Number(options.current) || 0);
    const total = Math.max(0, Number(options.total) || 0);
    const percent = total > 0 ? Math.min(100, Math.round(current / total * 100)) : 0;
    const title = options.title || "资源更新";
    const status = options.status || "准备中";
    const file = options.file || "";

    shuYing.text.innerHTML = `
        <div style="position:static;box-sizing:border-box;writing-mode:horizontal-tb;text-orientation:mixed;display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;width:100%;">
            <div style="position:static;box-sizing:border-box;font-size:16px;font-weight:700;color:#fff;white-space:nowrap;word-break:keep-all;overflow:hidden;text-overflow:ellipsis;min-width:0;">${escapeHTML(title)}</div>
            <div style="position:static;box-sizing:border-box;font-size:12px;color:rgba(245,241,232,0.72);white-space:nowrap;word-break:keep-all;flex:0 0 auto;">${current}/${total}</div>
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

async function fetchFile(path) {
    const response = await fetch(getRemoteUrl(downloadUrl, path));
    if (!response.ok) throw new Error(`${path} 下载失败：${response.status}`);

    return await response.arrayBuffer();
}

async function writeTargetFile(data, target) {
    if (typeof game.writeFile != "function") {
        throw new Error("当前环境不支持写入文件");
    }

    const targetInfo = splitPath(target);
    await writeFile(data, targetInfo.dir, targetInfo.name);
}

async function downloadFile(path, target, manifest) {
    const data = await fetchFile(path);
    if (manifest?.files?.[path]) {
        await verifyFile(path, data, manifest);
    }
    await writeTargetFile(data, target);
    return data;
}

async function getManifest() {
    const response = await fetch(getRemoteUrl(jsonUrl, "manifest.json"));
    if (!response.ok) throw new Error(`校验清单请求失败：${response.status}`);
    const manifest = await response.json();

    if (!manifest || manifest.algorithm != "sha256" || !manifest.files) {
        throw new Error("校验清单格式错误");
    }

    return manifest;
}

function normalizeManifestPath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function uniqueManifestList(files) {
    const result = [];
    const seen = new Set();

    for (const file of files || []) {
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
    return uniqueManifestList(manifest?.remove || []);
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
    return new Promise((resolve, reject) => {
        game.checkFile(path, resolve, reject);
    });
}

async function safeCheckFile(path) {
    try {
        return await checkFile(path);
    }
    catch (error) {
        console.error("检查文件失败，按缺失处理：", path, error);
        return -1;
    }
}

function readFile(path) {
    return new Promise((resolve, reject) => {
        game.readFile(path, resolve, reject);
    });
}

function writeFile(data, path, name) {
    return new Promise((resolve, reject) => {
        game.writeFile(data, path, name, result => {
            if (result instanceof Error) {
                reject(result);
            }
            else {
                resolve(result);
            }
        });
    });
}

function removeFile(path) {
    return new Promise(resolve => {
        if (typeof game.removeFile != "function") {
            resolve();
            return;
        }
        game.removeFile(path, () => resolve());
    });
}

function createDir(path) {
    return new Promise((resolve, reject) => {
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
        await removeFile(`extension/术樱包/${file}`);
    }
}

async function downloadCoreFiles(shuYing, manifest) {
    if (typeof game.readFile != "function" || typeof game.writeFile != "function") {
        throw new Error("当前环境不支持安全替换核心文件");
    }

    let coreFiles = [];

    try {
        ensureProgressNode(shuYing);
        setProgress(shuYing, { title: "核心文件修复", status: "获取校验清单", current: 0, total: 1 });

        manifest = manifest || await getManifest();
        coreFiles = getManifestCoreFiles(manifest);
        if (!coreFiles.length) throw new Error("校验清单缺少 core 核心文件列表");

        await createDir(`${coreTempDir}/`);
        await createFolders(`${coreTempDir}/`, coreFiles);
        await createFolders("extension/术樱包/", coreFiles);

        let progress = 0;
        const fileData = {};
        for (const file of coreFiles) {
            setProgress(shuYing, { title: "核心文件修复", status: "下载并校验", file, current: progress, total: coreFiles.length * 2 });
            fileData[file] = await downloadFile(file, `${coreTempDir}/${file}`, manifest);
            progress++;
        }

        const backupData = {};
        for (const file of coreFiles) {
            try {
                backupData[file] = await readFile(`extension/术樱包/${file}`);
            }
            catch (error) {
                backupData[file] = null;
            }
        }

        try {
            for (const file of coreFiles) {
                setProgress(shuYing, { title: "核心文件修复", status: "写入中", file, current: progress, total: coreFiles.length * 2 });
                await writeTargetFile(fileData[file], `extension/术樱包/${file}`);
                progress++;
            }
            await removeManifestFiles(shuYing, manifest);
            setProgress(shuYing, { title: "核心文件修复", status: "完成", current: coreFiles.length * 2, total: coreFiles.length * 2 });
        }
        catch (error) {
            for (const file of coreFiles) {
                try {
                    if (backupData[file]) {
                        await writeTargetFile(backupData[file], `extension/术樱包/${file}`);
                    }
                    else {
                        await removeFile(`extension/术樱包/${file}`);
                    }
                }
                catch (rollbackError) {
                    console.error("核心文件回滚失败：", file, rollbackError);
                }
            }

            throw error;
        }
    }
    finally {
        for (const file of coreFiles) {
            try {
                await removeFile(`${coreTempDir}/${file}`);
            }
            catch (error) {
                console.error("临时文件清理失败：", file, error);
            }
        }
    }
}

async function downloadList(shuYing, files, manifest) {
    let finished = 0;
    const total = files.length;

    for (const file of files) {
        const target = `extension/术樱包/${file}`;
        try {
            await addLog(shuYing, `检查：${file}`);
            setProgress(shuYing, { title: "查漏补缺", status: "检查本地文件", file: target, current: finished, total });
            const exists = typeof game.checkFile == "function" ? await safeCheckFile(target) : 0;

            if (exists == 1) {
                finished++;
                await addLog(shuYing, `跳过：${file}`);
                setProgress(shuYing, { title: "查漏补缺", status: "已存在，跳过", file: target, current: finished, total });
                continue;
            }

            await addLog(shuYing, `下载：${file}`);
            setProgress(shuYing, { title: "查漏补缺", status: "下载中", file: target, current: finished, total });
            await downloadFile(file, target, manifest);
            if (manifest?.files?.[file]) {
                await addLog(shuYing, `校验通过：${file}`);
            }
            finished++;
            await addLog(shuYing, `完成：${file}`);
            setProgress(shuYing, { title: "查漏补缺", status: "已完成", file: target, current: finished, total });
        }
        catch (error) {
            await addLog(shuYing, `失败：${file}；${getErrorMessage(error)}`);
            throw new Error(`${file} 处理失败：${getErrorMessage(error)}`);
        }
    }
}

async function getOnlineVersion() {
    const response = await fetch(getRemoteUrl(jsonUrl, "online_version.json"));
    if (!response.ok) throw new Error(`版本请求失败：${response.status}`);
    const result = await response.json();
    console.log("术樱包在线版本：", result.online_version);
    return result;
}

async function checkVersion(shuYing) {
    try {
        const onlineVersion = await getOnlineVersion();
        const localVersion = lib.config.shuYing_local_version || "0.0.0.0";

        game.saveConfig("shuYing_online_version", onlineVersion.online_version);

        if (localVersion == onlineVersion.online_version) {
            alert("本地版本为最新版");
            return;
        }

        if (!confirm(`检测到最新版本为:${onlineVersion.online_version}, 本地版本为:${localVersion}，是否更新`)) {
            return;
        }

        await downloadCoreFiles(shuYing);
        game.saveConfig("shuYing_local_version", onlineVersion.online_version);
        alert("下载完成，重启生效");
    }
    catch (error) {
        console.error(error);
        alert("版本检测或下载失败，请检查网络或服务器配置。");
    }
    finally {
        removeProgressNode(shuYing);
        setBusy(shuYing, false);
    }
}

async function repairMissingFiles(shuYing) {
    if (typeof game.checkFile != "function") {
        alert("此端暂不支持查缺补漏！");
        setBusy(shuYing, false);
        return;
    }

    try {
        shuYing._updateLogs = [];
        await addLog(shuYing, "查漏补缺开始");
        ensureProgressNode(shuYing);
        setProgress(shuYing, { title: "查漏补缺", status: "获取校验清单", current: 0, total: 1 });
        const manifest = await getManifest();
        const files = getManifestDownloadFiles(manifest);
        await addLog(shuYing, `待检查文件数：${files.length}`);
        await addLog(shuYing, `校验清单版本：${manifest.version || "未知"}；清单文件数：${Object.keys(manifest.files || {}).length}`);

        setProgress(shuYing, { title: "查漏补缺", status: "正在创建资源目录", current: 0, total: files.length });

        await createFolders("extension/术樱包/", files, shuYing);

        await downloadList(shuYing, files, manifest);
        await removeManifestFiles(shuYing, manifest);

        setProgress(shuYing, { title: "查漏补缺", status: "完成", current: files.length, total: files.length });
        await addLog(shuYing, "查漏补缺完成");
        alert("查漏补缺完毕!");
    }
    catch (error) {
        console.error(error);
        await addLog(shuYing, `查漏补缺失败：${getErrorMessage(error)}`);
        alert("查漏补缺失败，请查看 extension/术樱包/log.txt");
    }
    finally {
        removeProgressNode(shuYing);
        setBusy(shuYing, false);
    }
}

async function repairCoreFiles(shuYing) {
    let shouldDownload = false;
    let manifest;
    let coreFiles;

    try {
        manifest = await getManifest();
        coreFiles = getManifestCoreFiles(manifest);
    }
    catch (error) {
        console.error(error);
        alert("获取服务器校验清单失败，请检查网络或 manifest.json。");
        setBusy(shuYing, false);
        return;
    }

    if (typeof game.readFile != "function") {
        shouldDownload = confirm("此端暂不支持本地资源检查。如有问题，点击确定重新下载核心文件。");
    }
    else {
        try {
            for (const file of coreFiles) {
                await readFile(`extension/术樱包/${file}`);
            }
            shouldDownload = confirm("本地资源文件检测无误，若有问题点击确定重新下载主要js文件(包含关键js文件, 请勿关机、断网等操作，注意备份！)");
        }
        catch (error) {
            console.error(error);
            shouldDownload = confirm("本地资源不完整！点击确认重新获取！");
        }
    }

    if (!shouldDownload) {
        setBusy(shuYing, false);
        return;
    }

    try {
        await downloadCoreFiles(shuYing, manifest);
        alert("下载完成，重启生效");
    }
    catch (error) {
        console.error(error);
        alert("核心文件下载或校验失败，请检查服务器文件与 manifest.json 是否一致。");
    }
    finally {
        removeProgressNode(shuYing);
        setBusy(shuYing, false);
    }
}

export default {
    getOnlineVersion,
    checkVersion,
    repairMissingFiles,
    repairCoreFiles,
};
