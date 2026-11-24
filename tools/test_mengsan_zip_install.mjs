import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, webcrypto } from "node:crypto";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const engineRoot = process.env.NONAME_ROOT || fileURLToPath(new URL("../../../", import.meta.url));
const { default: JSZip } = await import(pathToFileURL(resolve(engineRoot, "_virtual/index2.js")));
const updaterSource = await readFile(new URL("../update.js", import.meta.url), "utf8");
const version = "2.0.2.3";
const tag = `v${version}`;
const moduleEntry = "mengsan/register.js";
const asset = "mengsan/assets/card.png";
const assets = { [moduleEntry]: "export default 1;", [asset]: "card data" };
const extensionRoot = "extension/术樱包/";
const recordKey = "shuYing_mengsan_installation";

function info(text) {
    return { size: Buffer.byteLength(text), sha256: createHash("sha256").update(text).digest("hex") };
}

function zip(files) {
    const archive = new JSZip();
    for (const [name, data] of Object.entries(files)) archive.file(name, data);
    return archive.generate({ type: "uint8array", compression: "DEFLATE" });
}

async function setup({ source = "github", parts = [zip(assets)], releaseTag = tag,
    draft = false, failWrite = false, record, trial = true, transport = "browser",
    blocksBrowserAssets = false, canInflate = true, localVersion = version } = {}) {
    const github = source == "github";
    const api = github ? "https://api.github.com/repos/Shu-Ying/noname-shuying"
        : "https://gitea.diuse.work/api/v1/repos/Diuse/noname-shuying";
    const repository = github ? "https://github.com/Shu-Ying/noname-shuying"
        : "https://gitea.diuse.work/Diuse/noname-shuying";
    const raw = path => github
        ? `https://raw.githubusercontent.com/Shu-Ying/noname-shuying/${tag}/${path}`
        : `${api}/raw/${path}?ref=${tag}`;
    const releaseUrl = `${api}/releases/tags/${tag}`;
    const requests = [];
    const writes = [];
    const alerts = [];
    const errors = [];
    const files = new Map();
    const config = { shuYing_update_source: source, shuYing_local_version: localVersion,
        shuYing_mengsan_zip_trial: trial, [recordKey]: record };
    const lib = { config, configprefix: "test_", node: {}, status: { reload: 0 } };
    const game = {
        checkFile(path, done) { done(files.has(path) ? 1 : -1); },
        createDir(path, done) { done(); },
        readFile(path, done, fail) {
            if (files.has(path)) done(files.get(path));
            else fail({ code: "ENOENT" });
        },
        writeFile(bytes, dir, name, done) {
            const path = `${dir}/${name}`;
            if (failWrite && path.includes("/new/mengsan/")) { done("disk is unwritable"); return; }
            writes.push({ path, afterRequests: requests.length });
            files.set(path, typeof bytes == "string" ? new TextEncoder().encode(bytes) : new Uint8Array(bytes));
            done();
        },
        removeFile(path, done) { files.delete(path); done(); },
        saveConfig(key, value) { config[key] = value; },
        reload2() {},
    };
    const modulePath = "dist/modules/mengsan.json";
    const rootManifest = { algorithm: "sha256", update_channels: true, version,
        files: { "extension.js": info("main") },
        modules: { mengsan: { entry: moduleEntry, manifest: modulePath } } };
    const moduleManifest = { algorithm: "sha256", module_id: "mengsan", version,
        files: Object.fromEntries(Object.entries(assets).map(([file, content]) => [file, info(content)])) };
    const attachments = parts?.map((part, index) => {
        const name = `mengsan-${tag}-part-${String(index + 1).padStart(3, "0")}.zip`;
        const url = `${repository}/releases/download/${tag}/${name}`;
        return { name, browser_download_url: url, size: part.size ?? (part.bytes?.length || part.length) };
    });
    const archiveAt = url => {
        const index = attachments?.findIndex(part => part.browser_download_url == url) ?? -1;
        return index < 0 ? null : parts[index].bytes || parts[index];
    };
    const window = {};
    const storage = new Map();
    const nativeRequests = [];
    if (transport == "node") {
        const redirect = "https://release-assets.githubusercontent.com/part.zip";
        window.require = name => {
            assert.equal(name, "https");
            return { get(url, callback) {
                const request = new EventEmitter();
                request.destroy = error => { if (error) request.emit("error", error); };
                queueMicrotask(() => {
                    nativeRequests.push(String(url));
                    const redirected = String(url) == redirect;
                    const stream = Readable.from(redirected ? [archiveAt(attachments[0].browser_download_url)] : []);
                    stream.statusCode = redirected ? 200 : 302;
                    stream.headers = redirected ? {} : { location: redirect };
                    callback(stream);
                    stream.on("close", () => request.emit("close"));
                });
                return request;
            } };
        };
    }
    class TestFileReader {
        readAsArrayBuffer(file) { file.arrayBuffer().then(result => { this.result = result; this.onload(); }); }
    }
    if (transport == "cordova") {
        lib.device = "android";
        delete lib.node;
        storage.set("noname_inited", "file:///sandbox/");
        window.resolveLocalFileSystemURL = (root, done) => done({
            getFile(path, options, found, missing) {
                if (options.create && !files.has(path)) files.set(path, new Uint8Array());
                if (!files.has(path)) { missing({ code: 1 }); return; }
                found({ isFile: true, toURL: () => encodeURI(root + path),
                    file: done => done(Object.assign(new Blob([files.get(path)]), { lastModified: 1 })),
                    remove: done => { files.delete(path); done(); },
                    createWriter(done) {
                        done({ truncate() { this.onwriteend(); }, write(blob) {
                            blob.arrayBuffer().then(bytes => {
                                files.set(path, new Uint8Array(bytes));
                                this.onwriteend();
                            });
                        } });
                    },
                });
            },
        });
        window.FileTransfer = class {
            download(url, target, done) {
                nativeRequests.push(url);
                const bytes = archiveAt(url);
                files.set(decodeURI(target).slice("file:///sandbox/".length), bytes);
                this.onprogress({ loaded: bytes.length });
                done();
            }
            abort() { throw new Error("Unexpected abort"); }
        };
    }
    const fetch = async url => {
        requests.push(url);
        if (url.startsWith(`${api}/tags?`)) return Response.json([{ name: tag }]);
        if (url == raw("dist/manifest.json")) return Response.json(rootManifest);
        if (url == raw(modulePath)) return Response.json(moduleManifest);
        if (url == releaseUrl) return parts ? Response.json({ tag_name: releaseTag, draft, assets: attachments })
            : new Response(null, { status: 404 });
        const partIndex = attachments?.findIndex(part => part.browser_download_url == url) ?? -1;
        if (partIndex >= 0) {
            if (blocksBrowserAssets) throw new TypeError("Failed to fetch");
            const part = parts[partIndex];
            if (part.retry && requests.filter(request => request == url).length == 1) {
                return new Response(null, { status: 503 });
            }
            return new Response(part.bytes || part);
        }
        for (const [file, content] of Object.entries({ ...assets, "extension.js": "main" })) {
            if (url == raw(file)) return new Response(content);
        }
        return new Response(null, { status: 404 });
    };
    const body = {
        appendChild(node) { node.parentNode = this; },
        removeChild(node) { node.parentNode = null; },
    };
    const context = createContext({
        AbortController, DecompressionStream: canInflate ? DecompressionStream : undefined,
        URL, TextDecoder, TextEncoder, Uint8Array, ArrayBuffer, setTimeout, clearTimeout,
        fetch, crypto: webcrypto, window, document: { body }, Blob, FileReader: TestFileReader,
        TypeError,
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
        console: { error: error => errors.push(error), warn() {} },
        confirm: () => true, alert: message => alerts.push(message),
    });
    const engine = new SyntheticModule(["lib", "game", "get"], function () {
        this.setExport("lib", lib);
        this.setExport("game", game);
        this.setExport("get", { zip: callback => callback(new JSZip()) });
    }, { context });
    const module = new SourceTextModule(updaterSource, { context });
    await module.link(() => engine);
    await module.evaluate();
    const shuYing = { text: { style: {}, showPopover() {}, setAttribute() {}, matches: () => false } };
    return { updater: module.namespace.default, shuYing, requests, releaseUrl, raw, attachments, nativeRequests,
        writes, config, files, alerts, errors };
}

async function install(options) {
    const result = await setup(options);
    await result.updater.manageMengsanModule(result.shuYing);
    return result;
}

function assertInstalled(result) {
    assert.deepEqual(result.errors, []);
    assert.equal(result.config[recordKey]?.status, "installed", result.alerts.join("\n"));
    for (const [file, content] of Object.entries(assets)) {
        assert.equal(new TextDecoder().decode(result.files.get(extensionRoot + file)), content);
    }
}

for (const source of ["github", "gitea"]) {
    test(`fresh install stages both parts from the selected ${source} release`, async () => {
        const result = await install({ source, parts: [zip({ [moduleEntry]: assets[moduleEntry] }), zip({ [asset]: assets[asset] })] });
        assertInstalled(result);
        const first = result.requests.indexOf(result.attachments[0].browser_download_url);
        const second = result.requests.indexOf(result.attachments[1].browser_download_url);
        assert.ok(first > result.requests.indexOf(result.releaseUrl));
        assert.ok(second > first);
        assert.ok(result.writes.find(write => write.path.endsWith(`/new/${moduleEntry}`)).afterRequests <= second);
        assert.ok(result.writes.find(write => write.path == extensionRoot + moduleEntry).afterRequests > second);
        assert.ok(!result.requests.includes(result.raw(moduleEntry)));
        assert.ok(!result.requests.includes(result.raw(asset)));
    });
}

test("carries staged files through a hash mismatch and falls back within the same tag", async () => {
    const result = await install({ parts: [zip({ [moduleEntry]: assets[moduleEntry], [asset]: "bad! data" })] });
    assertInstalled(result);
    assert.equal(result.requests.filter(url => url == result.attachments[0].browser_download_url).length, 2);
    assert.ok(result.requests.includes(result.raw(asset)));
    assert.ok(!result.requests.includes(result.raw(moduleEntry)));
});

test("retries a transient ZIP download error before using its contents", async () => {
    const result = await install({ parts: [{ bytes: zip(assets), retry: true }] });
    assertInstalled(result);
    assert.equal(result.requests.filter(url => url == result.attachments[0].browser_download_url).length, 2);
    assert.ok(!result.requests.includes(result.raw(asset)));
});

for (const [description, options] of Object.entries({
    "missing release": { parts: null },
    "wrong release tag": { releaseTag: "v1.0.0.0" },
    "draft release": { draft: true },
    "invalid ZIP": { parts: [new Uint8Array([1, 2, 3])] },
    "ZIP contains unlisted entries": { parts: [zip({ ...assets, "../unexpected.js": "x" })] },
    "ZIP above the download budget": { parts: [new Uint8Array(6 * 1024**2 + 1)] },
    "response larger than its attachment metadata": { parts: [{ size: 1, bytes: zip(assets) }] },
})) {
    test(`uses same-tag raw after ${description}`, async () => {
        const result = await install(options);
        assertInstalled(result);
        assert.ok(result.requests.includes(result.releaseUrl));
        assert.ok(result.requests.includes(result.raw(moduleEntry)));
        assert.ok(result.requests.includes(result.raw(asset)));
        assert.ok(!result.writes.some(write => write.path.includes("unexpected.js")));
    });
}

test("a staging storage failure stops the ZIP install without raw retries", async () => {
    const result = await install({ failWrite: true });
    assert.equal(result.config[recordKey]?.status, "disabled");
    assert.match(result.alerts[0], /disk is unwritable/);
    assert.ok(result.requests.includes(result.attachments[0].browser_download_url));
    assert.ok(!result.requests.includes(result.raw(moduleEntry)));
    assert.ok(!result.files.has(extensionRoot + moduleEntry));
});

test("restoring a legacy pending installation stays on raw", async () => {
    const result = await install({ record: { status: "repair", version, files: [moduleEntry, asset] } });
    assertInstalled(result);
    assert.ok(!result.requests.includes(result.releaseUrl));
    assert.ok(result.requests.includes(result.raw(asset)));
});

test("restarts a known first installation using a fresh ZIP download", async () => {
    const result = await install({ record: { status: "installing", version, files: [moduleEntry, asset], freshInstall: true } });
    assertInstalled(result);
    assert.ok(result.requests.includes(result.attachments[0].browser_download_url));
    assert.ok(!result.requests.includes(result.raw(asset)));
});

test("fresh install uses raw with the trial disabled", async () => {
    const result = await install({ trial: false });
    assertInstalled(result);
    assert.ok(!result.requests.includes(result.releaseUrl));
    assert.ok(result.requests.includes(result.raw(asset)));
});

for (const transport of ["node", "cordova"]) {
    test(`uses ${transport} transfer for GitHub assets when browser Fetch cannot read them`, async () => {
        const result = await install({ transport, blocksBrowserAssets: true });
        assertInstalled(result);
        assert.equal(result.nativeRequests[0], result.attachments[0].browser_download_url);
        if (transport == "node") assert.equal(result.nativeRequests[1], "https://release-assets.githubusercontent.com/part.zip");
        assert.ok(!result.requests.includes(result.raw(asset)));
        assert.ok(!Array.from(result.files.keys()).some(path => path.endsWith(".zip")));
    });
}

test("an unavailable browser attachment origin skips the remaining ZIP requests", async () => {
    const result = await install({ blocksBrowserAssets: true, parts: [zip(assets), zip(assets)] });
    assertInstalled(result);
    assert.ok(result.requests.includes(result.attachments[0].browser_download_url));
    assert.ok(!result.requests.includes(result.attachments[1].browser_download_url));
    assert.ok(result.requests.includes(result.raw(asset)));
});

test("a WebView without streaming inflate uses raw before requesting ZIPs", async () => {
    const result = await install({ canInflate: false });
    assertInstalled(result);
    assert.ok(!result.requests.includes(result.releaseUrl));
    assert.ok(result.requests.includes(result.raw(asset)));
});

test("downloads and extracts a ZIP generated by the release script", async () => {
    const temp = await mkdtemp(resolve(tmpdir(), "shuying-archive-test-"));
    try {
        const root = resolve(temp, "snapshot");
        const output = resolve(temp, "parts");
        const manifest = resolve(root, "dist/modules/mengsan.json");
        await mkdir(resolve(root, "dist/modules"), { recursive: true });
        await mkdir(resolve(root, "mengsan/assets"), { recursive: true });
        const fileInfo = {};
        for (const [file, content] of Object.entries(assets)) {
            await writeFile(resolve(root, file), content);
            fileInfo[file] = info(content);
        }
        await writeFile(manifest, JSON.stringify({ version, module_id: "mengsan", files: fileInfo }));
        const script = fileURLToPath(new URL("build_mengsan_archives.py", import.meta.url));
        execFileSync("python", ["-B", script, "--root", root, "--out-dir", output, "--tag", tag]);
        const bytes = await readFile(resolve(output, `mengsan-${tag}-part-001.zip`));
        const result = await install({ parts: [bytes] });
        assertInstalled(result);
        assert.ok(!result.requests.includes(result.raw(asset)));
    }
    finally { await rm(temp, { recursive: true, force: true }); }
});

test("查漏补缺 of an installed module stays on raw with the trial enabled", async () => {
    const result = await setup({ record: { status: "installed", version, source: "github", files: [moduleEntry, asset] } });
    await result.updater.repairMissingFiles(result.shuYing);
    assertInstalled(result);
    assert.ok(result.requests.includes(result.raw(asset)));
    assert.ok(!result.requests.includes(result.releaseUrl));
});

test("an installed module version update stays on raw with the trial enabled", async () => {
    const localVersion = "2.0.2.2";
    const result = await setup({ localVersion,
        record: { status: "installed", version: localVersion, source: "github", files: [moduleEntry, asset] } });
    await result.updater.checkVersion(result.shuYing);
    assertInstalled(result);
    assert.ok(result.requests.includes(result.raw(asset)));
    assert.ok(!result.requests.includes(result.releaseUrl));
});
