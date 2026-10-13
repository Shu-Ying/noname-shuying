import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlayerTeardown, removeBattleSkill } from "../mengsan/battle/skill-teardown.js";
import { createBattleFlow } from "../mengsan/battle/battle-flow.js";

function fixture(definitions, names) {
  const calls = [];
  const status = { eventManager: { eventStack: [], tempEvent: null, rootEvent: null } };
  class GameEvent {
    constructor() { this.name = "teardown"; }
    setContent(fn) { this.content = fn; }
    async waitNext() {}
    clearStepCache() {}
    async start() {
      status.event = this;
      status.eventManager.rootEvent = this;
      status.eventManager.eventStack.push(this);
      try { await this.content(); }
      finally { status.eventManager.eventStack.pop(); delete status.event; }
    }
  }
  const player = { name: "test", playerid: "p1", skills: names.slice(),
    hiddenSkills: [], invisibleSkills: [], tempSkills: {}, additionalSkills: {}, storage: {},
    unmarkSkill(name) { calls.push(["unmark", name]); }, checkConflict() {},
    removeSkillTrigger(name) { calls.push(["trigger", name]); },
    enableSkill() {}, removeAdditionalSkills() {} };
  const env = { lib: { skill: definitions, element: { GameEvent } }, _status: status,
    game: { broadcastAll(fn, p, name) {
      for (const list of [p.skills, p.hiddenSkills, p.invisibleSkills,
        ...Object.values(p.additionalSkills)]) {
        if (!list.remove) Object.defineProperty(list, "remove", { value(value) {
          const index = this.indexOf(value); if (index >= 0) this.splice(index, 1);
        } });
      }
      fn(p, name);
    }, callHook() {} }, get: { itemtype: () => "unknown" } };
  return { player, env, calls };
}

test("metadata-only protected skills do not block whole-player teardown", async () => {
  const marker = { superCharlotte: true, charlotte: true, forced: true,
    unique: true, popup: false, silent: true, ai: { threaten: 1 } };
  const fixed = { fixed: true };
  let removed = 0;
  const f = fixture({ chaofeng_common: marker, fixedMarker: fixed,
    normal: { async onremove() { removed++; } } },
  ["chaofeng_common", "fixedMarker", "normal"]);
  const release = createPlayerTeardown([f.player], f.env);
  await release(); await release();
  assert.deepEqual(f.player.skills, ["chaofeng_common", "fixedMarker"]);
  assert.equal(removed, 1);
  assert.equal(f.env.lib.skill.chaofeng_common, marker);
  assert.equal(f.env.lib.skill.fixedMarker, fixed);
});

test("protected callbacks and trigger registrations release once at player disposal", async () => {
  let finished = false;
  const info = { fixed: true, superCharlotte: true, trigger: { player: "damage" },
    async onremove(player) { await Promise.resolve(); delete player.storage.state; finished = true; } };
  const f = fixture({ active: info }, ["active"]);
  f.player.storage.state = 1;
  const release = createPlayerTeardown([f.player], f.env);
  await release(); await release();
  assert.equal(finished, true);
  assert.deepEqual(f.player.skills, []);
  assert.deepEqual(f.calls.filter(c => c[0] === "trigger"), [["trigger", "active"]]);
  assert.equal(info.fixed, true); assert.equal(info.superCharlotte, true);
});

test("callback failure remains visible and cannot replay partial teardown", async () => {
  let calls = 0;
  const f = fixture({ active: { superCharlotte: true,
    onremove() { calls++; throw new Error("callback failure"); } } }, ["active"]);
  const release = createPlayerTeardown([f.player], f.env);
  const first = release();
  await assert.rejects(first, /callback failure/);
  assert.equal(release(), first);
  await assert.rejects(release(), /callback failure/);
  assert.equal(calls, 1);
});

test("single skill removal keeps protected-skill safeguards", async () => {
  const f = fixture({ active: { fixed: true, onremove() {} } }, ["active"]);
  await assert.rejects(removeBattleSkill(f.player, "active", f.env), /protected skill/);
  assert.deepEqual(f.player.skills, ["active"]);
});

test("protected mod skills are active and all player-owned sources are removed", async () => {
  const f = fixture({ active: { superCharlotte: true, mod: { cardEnabled() {} } } }, ["active"]);
  f.player.hiddenSkills.push("active"); f.player.invisibleSkills.push("active");
  f.player.tempSkills.active = "phaseAfter"; f.player.additionalSkills.source = ["active"];
  await createPlayerTeardown([f.player], f.env)();
  assert.deepEqual(f.player.skills, []); assert.deepEqual(f.player.hiddenSkills, []);
  assert.deepEqual(f.player.invisibleSkills, []); assert.deepEqual(f.player.tempSkills, {});
  assert.deepEqual(f.player.additionalSkills, {});
});

test("string onremove drains discard before deleting card storage", async () => {
  const f = fixture({ active: { fixed: true, onremove: "discard" } }, ["active"]);
  const cards = [{}]; let discarded = false, thrown = false;
  f.player.storage.active = cards; f.player.$throw = () => { thrown = true; };
  f.env.get.itemtype = value => value === cards ? "cards" : "unknown";
  f.env.game.cardsDiscard = async value => {
    assert.equal(value, cards); assert.equal(f.player.storage.active, cards);
    await Promise.resolve(); discarded = true;
  };
  await createPlayerTeardown([f.player], f.env)();
  assert.equal(discarded, true); assert.equal(thrown, true);
  assert.equal(f.player.storage.active, undefined);
});

test("protected mark cleanup is not mistaken for passive metadata", async () => {
  let unmarked = false;
  const f = fixture({ active: { superCharlotte: true,
    intro: { onunmark() { unmarked = true; } } } }, ["active"]);
  f.player.unmarkSkill = name => f.env.lib.skill[name].intro.onunmark();
  await createPlayerTeardown([f.player], f.env)();
  assert.equal(unmarked, true); assert.deepEqual(f.player.skills, []);
});

test("settlement reaches map once with a protected marker on the old player", async () => {
  const f = fixture({ chaofeng_common: { superCharlotte: true, ai: { threaten: 1 } } },
    ["chaofeng_common"]);
  let commits = 0, disposals = 0, maps = 0;
  const run = { runId: "r", revision: 1 };
  const session = { id: "s", requestStop() {}, async drain() {},
    async dispose() { disposals++; } };
  const flow = createBattleFlow({ settlement: { readRun: () => run,
    async prepare() { return { id: "p", outcome: "victory", state: "chosen" }; },
    async commit() { commits++; return { route: "map", run }; } },
    quiesce: async () => {}, releaseSkills: createPlayerTeardown([f.player], f.env),
    showMap() { maps++; return null; } });
  await flow.enterBattle({ session, run, node: { id: "n" }, encounter: {}, start() {} });
  flow.requestFinish({ session, hp: 10 });
  await flow.wait();
  assert.equal(flow.state, "map");
  assert.equal(flow.settlementStatus.committed, true);
  assert.deepEqual([commits, disposals, maps], [1, 1, 1]);
});

test("a real cleanup failure preserves the commit receipt and never reissues rewards", async () => {
  const f = fixture({ active: { fixed: true, onremove() { throw new Error("release failed"); } } },
    ["active"]);
  let commits = 0, maps = 0;
  const run = { runId: "r", revision: 1 };
  const session = { id: "s", requestStop() {}, async drain() {}, async dispose() {} };
  const flow = createBattleFlow({ settlement: { readRun: () => run,
    async prepare() { return { id: "p", outcome: "victory", state: "chosen" }; },
    async commit() { commits++; return { route: "map", run }; } },
    quiesce: async () => {}, releaseSkills: createPlayerTeardown([f.player], f.env),
    showMap() { maps++; } });
  await flow.enterBattle({ session, run, node: { id: "n" }, encounter: {}, start() {} });
  flow.requestFinish({ session, hp: 10 });
  await assert.rejects(flow.wait(), /release failed/);
  assert.deepEqual(flow.settlementStatus, { committed: true, phase: "releaseSkills" });
  await assert.rejects(flow.retry(), /release failed/);
  assert.equal(commits, 1); assert.equal(maps, 0);
});
