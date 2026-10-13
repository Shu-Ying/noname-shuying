import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  mkdtemp, readdir, readFile, writeFile, unlink, rmdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createPlayerTeardown } from "../mengsan/battle/skill-teardown.js";
import { createBattleSession } from "../mengsan/battle/battle-session.js";
import { observeFreshEvent } from "../mengsan/battle/engine-session.js";
import {
  createBattleFlow, quiesceEngine,
} from "../mengsan/battle/battle-flow.js";
import { createDiagnostics } from "../diagnostics/index.js";

const engineRoot = process.env.NONAME_ROOT;
assert.ok(engineRoot, "Set NONAME_ROOT to the noname application directory");
const readEngine = file => readFileSync(path.join(engineRoot, file), "utf8");
const classBody = source => source.slice(
  source.indexOf("class "), source.lastIndexOf("export {"));
for (const [name, value] of Object.entries({
  add(value) { if (!this.includes(value)) this.push(value); return this; },
  addArray(values) {
    for (const value of values) this.add(value);
    return this;
  },
  remove(value) {
    const index = this.indexOf(value);
    if (index >= 0) this.splice(index, 1);
    return this;
  },
})) Object.defineProperty(Array.prototype, name, { value, configurable: true });

function engine(ignore_error = true) {
  const manager = { eventStack: [], tempEvent: null, rootEvent: null,
    setStatusEvent(event) { this.eventStack.push(event); },
    popStatusEvent() { this.eventStack.pop(); } };
  const _status = {
    eventManager: manager, pauseManager: { async waitPause() {} },
  };
  Object.defineProperty(_status, "event", {
    get: () => manager.eventStack.at(-1) || manager.rootEvent,
  });
  const lib = { config: { ignore_error }, skill: { global: [], globalmap: {} },
    hook: { globalskill: {} }, hookmap: {}, relatedTrigger: {}, element: {} };
  const history = [];
  const game = { online: false, globalEventHandlers: { addHandlerToEvent() {} },
    getGlobalHistory: () => history,
    print() {}, expandSkills() {}, callHook() {},
    broadcastAll(fn, ...args) { fn(...args); } };
  const get = {
    info: card => card.info,
    skillsFromEquips: cards => cards.flatMap(card => card.info.skills || []),
  };
  const prefix = "noname/library/element/GameEvent/compilers/";
  const Base = new Function("game", "_status",
    classBody(readEngine(prefix + "ContentCompilerBase.js")) +
    ";return ContentCompilerBase;")(game, _status);
  const ArrayCompiler = new Function("ContentCompilerBase",
    classBody(readEngine(prefix + "ArrayCompiler.js")) +
    ";return ArrayCompiler;")(Base);
  const arrayCompiler = new ArrayCompiler();
  const compiler = { compile(content) {
    return arrayCompiler.compile(Array.isArray(content) ? content : [content]);
  } };
  const GameEvent = new Function(
    "compiler", "_status", "game", "lib", "get", "ui",
    classBody(readEngine("noname/library/element/gameEvent.js")) +
    ";return GameEvent;")(compiler, _status, game, lib, get, {});
  lib.element.GameEvent = GameEvent;
  game.createEvent = name => {
    const event = new GameEvent(name, false, manager);
    _status.event.next.push(event);
    return event;
  };
  const source = readEngine("noname/library/element/player.js");
  const method = (start, end, text = source) => {
    const from = text.indexOf(start);
    assert.ok(from >= 0);
    const to = text.indexOf(end, from);
    assert.ok(to > from);
    return text.slice(from, to);
  };
  const gameSource = readEngine("noname/game/index.js");
  Object.assign(game, new Function("lib", "return {" +
    method("  addGlobalSkill(", "  removeGlobalSkill(", gameSource) + "," +
    method("  removeGlobalSkill(", "  resetSkills(", gameSource) + "}")(lib));
  const native = new Function("lib", "game", "get", "_status", "return {" +
    method("  addSkillTrigger(", "  addSkillLog(") + "," +
    method("  removeEquipTrigger(", "  removeSkillTrigger(") + "," +
    method("  removeSkillTrigger(", "  removeSkill(") + "}")(
      lib, game, get, _status);
  manager.rootEvent = new GameEvent("initial", false, manager);
  function player(id, cards = []) {
    return { ...native, name: "liubei", playerid: id,
      initedSkills: [], skills: [], hiddenSkills: [],
      invisibleSkills: [], tempSkills: {}, additionalSkills: {}, storage: {},
      vcardsMap: { equips: cards },
      getVCards() { return this.vcardsMap.equips.slice(); },
      getSkills() { return this.skills.slice(); },
      unmarkSkill() {}, checkConflict() {}, enableSkill() {},
      isDead: () => false, isOut: () => false, skipList: [] };
  }
  return { lib, game, get, _status, player, history };
}

test("native equipment hooks do not accumulate", async () => {
  const env = engine();
  env.lib.skill.bagua_skill = { equipSkill: true,
    trigger: { player: ["chooseToRespondBegin", "chooseToUseBegin"] } };
  const oldHooks = () => Object.keys(env.lib.hook)
    .filter(key => key.startsWith("old")).length;
  for (let i = 0; i < 3; i++) {
    const player = env.player("old" + i, [
      { name: "bagua", info: { skills: ["bagua_skill"] } },
    ]);
    player.addSkillTrigger("bagua_skill");
    assert.equal(oldHooks(), 2);
    await createPlayerTeardown([player], env)();
    assert.deepEqual(player.initedSkills, []);
    assert.equal(oldHooks(), 0);
    assert.equal(player.getVCards("e").length, 0);
  }
});

test("native registration release preserves another owner", async () => {
  const env = engine();
  env.lib.skill.source = { trigger: { player: "damage" }, global: "shared" };
  env.lib.skill.shared = { trigger: { global: "phaseBegin" } };
  const old = env.player("old"), other = env.player("other");
  old.addSkillTrigger("source"); other.addSkillTrigger("source");
  await createPlayerTeardown([old], env)();
  assert.deepEqual(old.initedSkills, []);
  assert.deepEqual(other.initedSkills, ["source"]);
  assert.equal(env.lib.hook.old_player_damage, undefined);
  assert.deepEqual(env.lib.hook.other_player_damage, ["source"]);
  assert.deepEqual(env.lib.skill.globalmap.shared, [other]);
  assert.ok(env.lib.skill.global.includes("shared"));
  assert.deepEqual(env.lib.hook.globalskill.global_phaseBegin, ["shared"]);
});

test("native onLose children finish before disposal", async () => {
  const env = engine(); const order = [];
  const card = { name: "equipment", info: { skills: [], clearLose: true,
    async onLose() {
      order.push("onLose");
      env.game.createEvent("child").setContent(async () => {
        await Promise.resolve(); order.push("child");
      });
    } } };
  await createPlayerTeardown([env.player("old", [card])], env)();
  order.push("dispose");
  assert.deepEqual(order, ["onLose", "child", "dispose"]);
  assert.equal(env._status.eventManager.eventStack.length, 0);
});

for (const ignore_error of [true, false]) test(
  `onLose failure propagates once: ignore_error=${ignore_error}`, async () => {
  const env = engine(ignore_error); let count = 0;
  const original = new Error("equipment cleanup failed");
  const card = { name: "equipment", info: { skills: [], clearLose: true,
    async onLose() { count++; throw original; } } };
  const release = createPlayerTeardown([env.player("old", [card])], env);
  const first = release();
  await assert.rejects(first, error => error === original);
  assert.equal(release(), first);
  await assert.rejects(release(), error => error === original);
  assert.equal(count, 1);
  assert.equal(env._status.eventManager.eventStack.length, 0);
});

function battleHarness(env, prepareBattle, logger) {
  const source = readFileSync(
    new URL("../mengsan/mode.js", import.meta.url), "utf8");
  const from = source.indexOf("const playBattle = ");
  const to = source.indexOf("const setupBattle = ", from);
  assert.ok(from >= 0 && to > from);
  const saved = { runId: "r", revision: 1 }, log = [], prompts = [];
  let commits = 0;
  const makeFlow = (releaseSkills, releaseBattle) => createBattleFlow({
    releaseSkills, releaseBattle,
    quiesce: () => quiesceEngine(env._status), settlement: {
      readRun: () => saved,
      prepare: () => ({ id: "p", outcome: "victory", state: "chosen" }),
      commit: () => { commits++; return { route: "map", run: saved }; },
    }, showMap: () => null });
  const diagnostics = logger || { error: (...args) => log.push(args) };
  const parameters = { ...env, ui: {}, quiesceEngine,
    createBattleSession, observeFreshEvent, makeFlow, diagnostics, prepareBattle,
    createBattleResources: () => ({}),
    reportFlowError: error => log.push(["reported", error]),
    chooseButtons: async (...args) => {
      assert.equal(env._status.eventManager.eventStack.length, 0);
      prompts.push(args);
    },
    openModeSelection: async () => { log.push(["exit"]); },
    document: { body: { classList: { remove() {} } } },
    awaitSettlement: flow => flow.wait() };
  const play = new Function(...Object.keys(parameters), `
    let battleSequence = 0, activeBattle;
    ${source.slice(from, to)}
    return {playBattle, getCurrent: () => activeBattle};`
  )(...Object.values(parameters));
  return { ...play, saved, log, prompts, get commits() { return commits; } };
}

for (const ignore_error of [true, false]) test(
  `preparation failure exits: ignore_error=${ignore_error}`,
  { timeout: 2000 }, async () => {
  const env = engine(ignore_error);
  const original = new Error("missing battle character");
  const harness = battleHarness(env, async () => { throw original; });
  assert.equal(await harness.playBattle(
    harness.saved, { id: "n" }, {}), undefined);
  assert.equal(harness.getCurrent().engineError, original);
  assert.equal(harness.getCurrent().session.active, false);
  assert.equal(harness.prompts.length, 1);
  assert.match(harness.prompts[0][2], /missing battle character/);
  const record = harness.log.find(
    entry => entry[0] === "battle.prepare.failed");
  assert.equal(record?.[1], original);
  assert.equal(record?.[2].sessionId, "r:1");
  assert.deepEqual(harness.saved, { runId: "r", revision: 1 });
  assert.equal(harness.commits, 0);
  assert.equal(env._status.eventManager.eventStack.length, 0);
});

test("successful settlement commits once", { timeout: 2000 }, async () => {
  const env = engine(); let harness;
  harness = battleHarness(env, async () => { setImmediate(() => {
    const current = harness.getCurrent();
    current.flow.requestFinish({ session: current.session, hp: 10 });
    current.finished();
  }); });
  const result = await harness.playBattle(harness.saved, { id: "n" }, {});
  assert.equal(result.route, "map"); assert.equal(harness.commits, 1);
  assert.deepEqual(harness.prompts, []); assert.deepEqual(harness.log, []);
});

for (const ignore_error of [true, false]) test(
  `nested equipment error propagates: ignore_error=${ignore_error}`,
  async () => {
  const env = engine(ignore_error);
  const original = new Error("child cleanup failed");
  const card = { name: "equipment", info: { skills: [], clearLose: true,
    async onLose() {
      env.game.createEvent("child").setContent(async () => { throw original; });
    } } };
  await assert.rejects(
    createPlayerTeardown([env.player("old", [card])], env)(),
    error => error === original);
  assert.equal(env._status.eventManager.eventStack.length, 0);
});

test("preparation failure writes a report with original stack", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "mengsan-diagnostics-"));
  const storage = {
    write: (name, text) => writeFile(path.join(directory, name), text),
    list: async () => (await readdir(directory)).map(name => ({ name })),
    remove: name => unlink(path.join(directory, name)),
    status: () => ({ kind: "file", location: directory }),
  };
  const logger = createDiagnostics({ storage });
  try {
    const original = new Error("missing support role");
    const harness = battleHarness(engine(), async () => { throw original; },
      logger.scope("mengsan.mode"));
    await harness.playBattle(harness.saved, { id: "node-1" }, {});
    await logger.flush();
    const reports = (await readdir(directory))
      .filter(name => name.startsWith("report-"));
    assert.equal(reports.length, 1);
    const report = JSON.parse(
      await readFile(path.join(directory, reports[0]), "utf8"));
    assert.equal(report.failure.event, "battle.prepare.failed");
    assert.equal(report.failure.module, "mengsan.mode");
    assert.equal(report.failure.error.message, original.message);
    assert.match(report.failure.error.stack, /test_battle_lifecycle/);
    assert.equal(report.failure.context.nodeId, "node-1");
  } finally {
    logger.dispose();
    for (const name of await readdir(directory)) {
      await unlink(path.join(directory, name));
    }
    await rmdir(directory);
  }
});
