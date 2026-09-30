import assert from "node:assert/strict";
import { test } from "node:test";
import { grantRelic, canAcquireRelic, getRelic, heldRelics,
    relicRewardIds, initializeRelicMaxHp } from "../mengsan/relics/definitions.js";
import { applyRoomRelics, restRecovery } from "../mengsan/relics/rooms.js";
import { createOpeningEffects, createRelicCombatSkills }
    from "../mengsan/relics/combat.js";
import { createRelicBattle, createRelicSkills,
    applyBattleEndRelics } from "../mengsan/relics/battle.js";
import { canAcquireReward, getRandomRewardChoices }
    from "../mengsan/progression/reward.js";
import { createBattleSettlement }
    from "../mengsan/battle/battle-settlement.js";
import config from "../mengsan/config.js";

const id = name => `mengsan_${name}_shuying`;
const newRun = () => ({ runId: "relic_run", actIndex: 0, revision: 1,
    randomState: 123,
    player: { character: "mengsan_liubei_shuying", hp: 20,
        maxHp: 50, items: [], gold: 0, deck: [] },
    statistics: { defeatedEnemies: 0, goldEarned: 0 },
    map: { nodes: [{ id: "battle", completed: false }] },
});
const grant = (run, ...names) => {
    for (const name of names) grantRelic(run, id(name));
};
const runtime = run => {
    const draws = [], logs = [];
    let running = true;
    const battle = createRelicBattle(run, {
        active: () => running,
        draw: async amount => { draws.push(amount); },
        log: (relic, effect) => logs.push([relic.name, effect]),
    });
    return { battle, draws, logs, stop: () => { running = false; } };
};

test("strawberry raises max HP once without healing, including early grants", () => {
    const run = newRun();
    grant(run, "strawberry", "strawberry");
    assert.equal(run.player.maxHp, 57);
    assert.equal(run.player.hp, 20);
    run.player.maxHp = null;
    run.player.items = [];
    grant(run, "strawberry");
    run.player.maxHp = 50;
    initializeRelicMaxHp(run);
    initializeRelicMaxHp(run);
    assert.equal(run.player.maxHp, 57);
});

test("shop entrance and rest healing cap HP and survive reload without repeats", () => {
    const run = newRun();
    grant(run, "meal_ticket", "regal_pillow");
    const shop = { id: "shop1", type: "shop" };
    assert.equal(applyRoomRelics(run, shop, "enter").recovered, 15);
    const restored = structuredClone(run);
    assert.equal(applyRoomRelics(restored, shop, "enter"), null);
    const rest = { id: "rest1", type: "rest" };
    assert.equal(restRecovery(run), 23);
    assert.equal(applyRoomRelics(run, rest, "upgrade"), null);
    assert.equal(applyRoomRelics(run, rest, "heal").recovered, 15);
    assert.equal(run.player.hp, 50);
    assert.equal(applyRoomRelics(run, rest, "heal"), null);
    assert.equal(restRecovery(newRun()), 8);
});

test("opening effects target enemies, apply buffs before damage, and lantern is temporary", async () => {
    const run = newRun();
    grant(run, "festive_poppers", "bag_of_marbles", "red_mask", "vajra", "lantern");
    const hits = [];
    const actor = camp => ({ storage: { mengsanCamp_shuying: camp },
        isAlive: () => true, addSkill() {}, markSkill() {},
        damage(amount, source, nature) {
            hits.push({ amount, source, nature,
                vulnerable: this.storage.mengsanVulnerable_shuying,
                weak: this.storage.mengsanWeak_shuying });
            return Promise.resolve();
        } });
    const owner = actor("player"), enemy = actor("enemy"), ally = actor("ally");
    owner.storage.mengsanEnergy_shuying = 3;
    owner.storage.mengsanMaxEnergy_shuying = 3;
    let refreshes = 0;
    const battle = createRelicBattle(run, { active: () => true,
        draw: async () => {}, log: () => {},
        effect: createOpeningEffects({ players: [owner, enemy, ally] },
            owner, () => { refreshes++; }) });
    await battle.start();
    await battle.start();
    assert.equal(hits.length, 1);
    assert.equal(hits[0].amount, 9);
    assert.equal(hits[0].vulnerable, 1);
    assert.equal(hits[0].weak, 1);
    assert.equal(hits[0].nature, "nocard");
    assert.equal(owner.storage.mengsanStrength_shuying, 1);
    assert.equal(ally.storage.mengsanWeak_shuying, undefined);
    const first = {};
    await battle.turnStart(first);
    await battle.turnStart(first);
    assert.equal(owner.storage.mengsanEnergy_shuying, 4);
    assert.equal(owner.storage.mengsanMaxEnergy_shuying, 3);
    owner.storage.mengsanEnergy_shuying = owner.storage.mengsanMaxEnergy_shuying;
    await battle.turnStart({});
    assert.equal(owner.storage.mengsanEnergy_shuying, 3);
    assert.equal(refreshes, 1);
});

test("card attacks add owner strength before weakness and skip scripted damage", async () => {
    const owner = { storage: { mengsanStrength_shuying: 1,
        mengsanWeak_shuying: 1 } };
    const skills = createRelicCombatSkills(() => ({ session: { active: true } }),
        () => owner);
    const attack = skills.mengsan_relic_attack_shuying;
    const event = { source: owner, card: {}, num: 6 };
    assert.equal(attack.filter(event), true);
    await attack.content({}, event);
    assert.equal(event.num, 5);
    assert.equal(attack.filter({ ...event, card: null }), false);
    assert.equal(attack.filter({ ...event, mengsanScriptedSkill_shuying: true }), false);
    const enemy = { storage: { mengsanWeak_shuying: 1 },
        removeSkill(skill) { assert.equal(skill, "mengsan_weak_shuying"); } };
    const hit = { source: enemy, card: {}, num: 9 };
    await attack.content({}, hit);
    assert.equal(hit.num, 6);
    await skills.mengsan_weak_shuying.content({}, {}, enemy);
    assert.equal(enemy.storage.mengsanWeak_shuying, 0);
});

test("relics use existing items, reject duplicates and preserve belt saves", () => {
    const run = newRun();
    assert.equal(grantRelic(run, id("burning_blood")), true);
    assert.equal(grantRelic(run, id("burning_blood")), false);
    assert.equal(canAcquireRelic(run, id("burning_blood")), false);
    assert.throws(() => grantRelic(run, "unknown"));
    assert.equal(getRelic("unknown"), null);
    run.player.items.push(id("hand_charm"));
    run.player.handLimitBonus = 1;
    assert.equal(grantRelic(run, id("hand_charm")), false);
    assert.equal(run.player.handLimitBonus, 1);
    const fresh = newRun();
    assert.equal(grantRelic(fresh, id("hand_charm")), true);
    assert.equal(fresh.player.handLimitBonus, 1);
    const restored = JSON.parse(JSON.stringify(run));
    assert.equal(heldRelics(restored).length, 2);
    run.player.items.push(id("burning_blood"));
    assert.equal(heldRelics(run).length, 2);
});

test("boss and chest relic rewards are available and owned ones disappear", () => {
    const run = newRun();
    for (const pool of ["shared.pool.boss.premium", "act1.pool.chest"]) {
        const choices = getRandomRewardChoices(run, pool, 100);
        for (const rewardId of relicRewardIds) {
            assert.ok(choices.some(choice => choice.id === rewardId));
        }
    }
    grant(run, "burning_blood");
    const rewardId = relicRewardIds.find(value => value.endsWith(
        id("burning_blood")));
    assert.equal(canAcquireReward(run, config.rewards[rewardId]), false);
    assert.equal(getRandomRewardChoices(run,
        "shared.pool.boss.premium", 100).some(choice =>
        choice.id === rewardId), false);
});

test("opening and own-turn draws stack at exact turns and reset per battle", async () => {
    const run = newRun();
    grant(run, "snake_ring", "long_snake_ring", "pendulum");
    const { battle, draws } = runtime(run);
    assert.equal(battle.openingDraw, 2);
    await battle.start();
    await battle.start();
    assert.deepEqual(draws, [2]);
    assert.equal(battle.openingHandBonus, 2);
    for (let turn = 1; turn <= 6; turn++) {
        const event = {};
        await battle.turnStart(event);
        await battle.turnStart(event);
    }
    assert.deepEqual(draws, [2, 2, 2, 2, 1, 1]);
    const next = runtime(run);
    await next.battle.start();
    await next.battle.turnStart({});
    assert.deepEqual(next.draws, [2, 2]);
});

test("puzzle ignores zero and healing, triggers once, and resets next battle", async () => {
    const run = newRun();
    grant(run, "millennium_puzzle");
    const current = runtime(run);
    await current.battle.start();
    await current.battle.loseHp({ num: 0 });
    await current.battle.loseHp({ num: 6 });
    assert.deepEqual(current.draws, []);
    const damage = { num: -1 };
    await current.battle.loseHp(damage);
    await current.battle.loseHp(damage);
    await current.battle.loseHp({ num: -3 });
    assert.deepEqual(current.draws, [3]);
    assert.equal(current.battle.status(getRelic(id("millennium_puzzle"))),
        "本场已触发");
    const next = runtime(run);
    await next.battle.start();
    await next.battle.loseHp({ num: -2 });
    assert.deepEqual(next.draws, [3]);
});

test("early HP loss waits for pile setup and preserves opening bonus draws", async () => {
    const run = newRun();
    grant(run, "snake_ring", "millennium_puzzle");
    const current = runtime(run);
    await current.battle.loseHp({ num: -1 });
    assert.deepEqual(current.draws, []);
    await current.battle.start();
    assert.deepEqual(current.draws, [2, 3]);
    assert.equal(current.battle.openingHandBonus, 5);
    await current.battle.loseHp({ num: -1 });
    assert.deepEqual(current.draws, [2, 3]);
    await current.battle.turnStart({});
    assert.equal(current.battle.openingHandBonus, 5);
});

test("engine adapter ignores other actors, armor-only loss and dead owner", async () => {
    const run = newRun();
    grant(run, "millennium_puzzle", "long_snake_ring");
    const current = runtime(run);
    const owner = { hp: 20 }, session = { active: true };
    const adapter = createRelicSkills(() => ({
        session, relics: current.battle }), () => owner).mengsan_relics_shuying;
    await current.battle.start();
    assert.equal(adapter.filter({ player: {}, name: "phase" }), false);
    assert.equal(adapter.filter({ player: owner, num: 0 }), false);
    assert.equal(adapter.filter({ player: owner, num: -1 }), true);
    await adapter.content({ triggername: "phaseBegin" },
        { player: owner, name: "phase" });
    await adapter.content({ triggername: "changeHp" },
        { player: owner, num: -1 });
    assert.deepEqual(current.draws, [2, 3]);
    owner.hp = 0;
    assert.equal(adapter.filter({ player: owner, num: -1 }), false);
    owner.hp = 20;
    session.active = false;
    assert.equal(adapter.filter({ player: owner, name: "phase" }), false);
    current.stop();
    await current.battle.turnStart({});
    assert.deepEqual(current.draws, [2, 3]);
});

test("blood healing caps at max HP and never revives a failed run", () => {
    const run = newRun();
    grant(run, "burning_blood");
    assert.equal(applyBattleEndRelics(run, "victory"), 6);
    assert.equal(run.player.hp, 26);
    run.player.hp = 49;
    assert.equal(applyBattleEndRelics(run, "victory"), 1);
    assert.equal(run.player.hp, 50);
    run.player.hp = 0;
    assert.equal(applyBattleEndRelics(run, "defeat"), 0);
    assert.equal(run.player.hp, 0);
});

test("settlement prepare, reload and repeated commit heal only once", async () => {
    const run = newRun();
    grant(run, "burning_blood");
    const storage = { run: structuredClone(run) };
    const make = () => createBattleSettlement({
        store: { read: () => storage,
            update: async change => change(storage) },
        config: { saveKey: "run", profileKey: "profile" },
        getRandomRewardChoices: () => [], applyReward: () => {},
        completeNode: result => {
            result.map.nodes[0].completed = true;
            return true;
        },
        enterNextAct: () => false,
    });
    const input = { run, node: run.map.nodes[0], hp: 20,
        encounter: { skipRandomReward: true } };
    const pending = await make().prepare(input);
    assert.equal(pending.base.player.hp, 26);
    assert.equal(pending.relicRecovery, 6);
    assert.equal((await make().prepare(input)).base.player.hp, 26);
    const restored = make();
    const selected = await restored.choose(run.runId, pending.id, null);
    assert.equal(selected.result.player.hp, 26);
    await restored.choose(run.runId, pending.id, null);
    await restored.commit(run.runId, pending.id);
    assert.equal(storage.run.player.hp, 26);
    await restored.commit(run.runId, pending.id);
    assert.equal(storage.run.player.hp, 26);
});
