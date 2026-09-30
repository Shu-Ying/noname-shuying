import assert from "node:assert/strict";
import { test } from "node:test";
import { bondDefinitions, getBondCombat, getBondDeck, DEFAULT_BOND_DECK }
    from "../mengsan/bonds/definitions.js";
import { DEFAULT_BOND_INTENTS, getBondIntents, createBondIntentActions }
    from "../mengsan/bonds/intents.js";
import { applyStun, finishStunnedTurn, skipStunnedAction }
    from "../mengsan/battle/stun-intent.js";
import { bondProbability, ensureBonds, meetBond, selectBond,
    prepareBondBattle, settleBondBattle, markBondDown, rescueBond }
    from "../mengsan/bonds/state.js";
import { initializeBondUnit, recordBondDeath }
    from "../mengsan/bonds/battle.js";
import { createRun } from "../mengsan/progression/state.js";
import { applyStoryOutcome } from "../mengsan/progression/story.js";
import { buildBattlePlan } from "../mengsan/battle/battle-director.js";
import { createBattleSettlement }
    from "../mengsan/battle/battle-settlement.js";
import { createBattleFlow } from "../mengsan/battle/battle-flow.js";
import { createMonsterIntentActions }
    from "../mengsan/monsters/actions.js";
import { finishDeathBlow } from "../mengsan/battle/death-blow.js";
import config from "../mengsan/config.js";

const blank = () => ({ player: { character: "other" } });
const withCombat = callback => {
    const definition = bondDefinitions.guanyu;
    const original = { deck: definition.deck, growth: definition.growth };
    definition.deck = ["sha", "shan", "tao"];
    definition.growth = Array.from({ length: 10 }, (_, index) => ({
        maxHp: 20 + index, hand: 2, draw: 1, handLimit: 4, energy: 3,
        skills: index === 0 ? ["test_skill"] : [],
    }));
    try { return callback(); }
    finally { Object.assign(definition, original); }
};

test("Liu Bei starts with two independent level-eight bonds; new runs reset", () => {
    const run = createRun("mengsan_liubei_shuying");
    assert.equal(run.player.bonds.selected, null);
    assert.deepEqual(run.player.bonds.npcs.guanyu,
        { level: 8, progress: 0, down: false });
    assert.deepEqual(run.player.bonds.npcs.zhangfei,
        { level: 8, progress: 0, down: false });
    run.player.bonds.npcs.guanyu.down = true;
    assert.equal(createRun("mengsan_liubei_shuying")
        .player.bonds.npcs.guanyu.down, false);
    assert.equal(bondProbability(1), 0);
    assert.equal(bondProbability(8), 7 / 9);
    assert.equal(bondProbability(10), 1);
});

test("event meetings are idempotent and only one companion can be selected", () => {
    const run = blank();
    applyStoryOutcome(run, { bonds: ["guanyu", { id: "zhangfei", level: 3 }] });
    assert.equal(meetBond(run, "guanyu", 8), false);
    assert.equal(run.player.bonds.npcs.guanyu.level, 1);
    selectBond(run, "guanyu");
    selectBond(run, "zhangfei");
    assert.equal(run.player.bonds.selected, "zhangfei");
    assert.throws(() => selectBond(run, "unknown"));
    selectBond(run, null);
    assert.equal(prepareBondBattle(run, () => 0), null);
    assert.equal(settleBondBattle(run), null);
});

test("unconfigured or down NPCs still gain 25%; overflow and cap are exact", () => {
    const run = blank();
    meetBond(run, "guanyu");
    selectBond(run, "guanyu");
    assert.equal(getBondCombat("guanyu", 1), null);
    const npc = run.player.bonds.npcs.guanyu;
    for (let index = 0; index < 4; index++) {
        assert.equal(prepareBondBattle(run, () => 0), null);
        assert.equal(settleBondBattle(run).gain, 25);
    }
    assert.equal(npc.level, 2);
    assert.equal(npc.progress, 0);
    npc.progress = 75;
    run.bondBattle = { id: "guanyu", arrived: true };
    assert.equal(settleBondBattle(run).gain, 50);
    assert.equal(npc.level, 3);
    assert.equal(npc.progress, 25);
    markBondDown(run, "guanyu");
    prepareBondBattle(run, () => { throw new Error("No draw when down"); });
    settleBondBattle(run);
    assert.equal(npc.progress, 50);
    assert.equal(rescueBond(run, "guanyu"), true);
    assert.equal(rescueBond(run, "guanyu"), false);
    npc.level = 9;
    npc.progress = 75;
    run.bondBattle = { id: "guanyu", arrived: true };
    settleBondBattle(run);
    assert.deepEqual(npc, { level: 10, progress: 0, down: false });
    assert.equal(settleBondBattle(run), null);
});

test("one start draw, exclusive lower seat, own deck and native-death state", () => {
    withCombat(() => {
        const run = blank();
        meetBond(run, "guanyu", 8);
        selectBond(run, "guanyu");
        let draws = 0;
        const spec = prepareBondBattle(run, () => { draws++; return 0.1; });
        assert.equal(draws, 1);
        assert.equal(run.bondBattle.arrived, false);
        assert.deepEqual(spec.skills, ["test_skill"]);
        assert.equal(spec.inheritSkills, false);
        run.player.supports = [{ id: "item_helper", battles: -1,
            unit: { character: "zhangfei", camp: "ally" } }];
        const plan = buildBattlePlan({ enemy: "enemy" }, run, spec);
        assert.equal(plan.units[0].bondId, "guanyu");
        assert.equal(plan.units[0].after, "player");
        assert.equal(plan.units.length, 3);
        const player = { storage: {}, node: { avatar: { style: {} } } };
        const combat = initializeBondUnit(player, spec, run);
        assert.equal(run.bondBattle.arrived, true);
        assert.equal(player.storage.mengsanMonster_shuying, undefined);
        const firstDeck = combat.createDeck("battle_1");
        const nextDeck = combat.createDeck("battle_2");
        firstDeck.pop();
        assert.equal(nextDeck.length, 3);
        assert.equal(nextDeck[0].id, "battle_2_0");
        const logs = [];
        recordBondDeath(player, run, message => logs.push(message));
        assert.equal(run.player.bonds.npcs.guanyu.down, true);
        assert.equal(logs.length, 1);
        assert.equal(settleBondBattle(run).gain, 50);
        assert.equal(prepareBondBattle(run, () => 0), null);
        assert.equal(settleBondBattle(run).gain, 25);
        rescueBond(run, "guanyu");
        assert.equal(prepareBondBattle(run, () => 0).hp, 27);
        assert.equal(prepareBondBattle(run, () => 0.99), null);
    });
});

test("configured level one never arrives and level ten always arrives", () => {
    withCombat(() => {
        const run = blank();
        meetBond(run, "guanyu", 1);
        selectBond(run, "guanyu");
        assert.equal(prepareBondBattle(run, () => 0), null);
        assert.equal(settleBondBattle(run).gain, 25);
        run.player.bonds.npcs.guanyu.level = 10;
        assert.ok(prepareBondBattle(run, () => 0.999999));
        assert.throws(() => meetBond(run, "toString"));
        assert.throws(() => selectBond(run, "toString"));
    });
});

test("omitted or empty decks and intent groups use independent defaults", () => {
    withCombat(() => {
        const definition = bondDefinitions.guanyu;
        const original = { deck: definition.deck, intents: definition.intents };
        try {
            for (const missing of [undefined, null, []]) {
                definition.deck = missing;
                definition.intents = missing;
                const spec = getBondCombat("guanyu", 8);
                assert.deepEqual(spec.deck, [...DEFAULT_BOND_DECK]);
                assert.deepEqual(spec.intents, [...DEFAULT_BOND_INTENTS]);
                const next = getBondCombat("guanyu", 8);
                spec.deck.pop();
                spec.intents[0].damage = 99;
                assert.equal(next.deck.length, 7);
                assert.equal(next.intents[0].damage, 6);
                const player = { storage: {} };
                const combat = initializeBondUnit(player, next, blank());
                assert.equal(combat.createDeck("default").length, 7);
            }
            assert.equal(getBondCombat("zhangfei", 8), null);
            assert.deepEqual(getBondDeck({}), [...DEFAULT_BOND_DECK]);
            assert.throws(() => getBondIntents({ intents: [{ damage: -1 }] }));
            assert.throws(() => getBondIntents({ intents: [{
                id: "unknown", name: "错误效果", debuff: "unknown", stacks: 1,
            }] }));
        } finally { Object.assign(definition, original); }
    });
});

test("completed battle grows once across settlement reload and commit retries", async () => {
    let storage = {};
    const run = createRun("mengsan_liubei_shuying");
    selectBond(run, "guanyu");
    run.bondBattle = { id: "guanyu", arrived: true };
    markBondDown(run, "guanyu");
    storage[config.saveKey] = structuredClone(run);
    const store = {
        read: () => structuredClone(storage),
        update: async mutate => {
            const draft = structuredClone(storage);
            const result = mutate(draft);
            storage = draft;
            return structuredClone(result);
        },
    };
    const make = () => createBattleSettlement({ store, config,
        getRandomRewardChoices: () => [], applyReward() {},
        completeNode: () => true, enterNextAct: () => true });
    const input = { run, node: run.map.nodes[0], hp: 20,
        encounter: { skipRandomReward: true } };
    const pending = await make().prepare(input);
    assert.equal(pending.base.player.bonds.npcs.guanyu.progress, 50);
    const restored = make();
    assert.equal((await restored.prepare(input))
        .base.player.bonds.npcs.guanyu.progress, 50);
    await restored.choose(run.runId, pending.id, null);
    await restored.commit(run.runId, pending.id);
    await restored.commit(run.runId, pending.id);
    const saved = storage[config.saveKey];
    assert.equal(saved.player.bonds.npcs.guanyu.progress, 50);
    assert.equal(saved.player.bonds.npcs.guanyu.down, true);
    assert.equal(saved.bondBattle, null);
});

test("companion changes on the post-battle map reach the next battle input", async () => {
    const run = createRun("mengsan_liubei_shuying");
    const node = run.map.nodes[0];
    let saved = structuredClone(run);
    const pending = { id: "battle", state: "chosen", outcome: "victory" };
    const flow = createBattleFlow({
        settlement: {
            readRun: () => structuredClone(saved),
            prepare: async () => pending,
            commit: async () => ({ route: "map", run: structuredClone(saved) }),
        },
        chooseReward: async () => null, quiesce: async () => {},
        showMap: async mapRun => {
            selectBond(mapRun, "zhangfei");
            saved = structuredClone(mapRun);
            return node;
        },
        showEnding: async () => {},
    });
    const session = { requestStop() {}, drain: async () => {},
        dispose: async () => {} };
    await flow.enterBattle({ session, run, node,
        encounter: {}, start() {} });
    assert.equal(flow.requestFinish({ session, hp: 20 }), true);
    const next = await flow.wait();
    assert.equal(next.run.player.bonds.selected, "zhangfei");
    assert.equal(saved.player.bonds.selected, "zhangfei");
});

const actor = (camp, armor = 0, vulnerable = 0) => {
    const result = { alive: true, hp: 50, armor, hits: [], skills: [],
        storage: { mengsanCamp_shuying: camp,
            mengsanEnergy_shuying: 3, mengsanVulnerable_shuying: vulnerable },
        isAlive() { return this.alive; },
        damage(value) {
            if (this.storage.mengsanVulnerable_shuying) value = Math.ceil(value * 1.5);
            this.hits.push(value);
            const blocked = Math.min(value, this.armor);
            this.armor -= blocked;
            this.hp -= value - blocked;
            return Promise.resolve();
        },
        addSkill(skill) { this.skills.push(skill); }, markSkill() {},
        changeHujia(value) { this.armor += value; },
        die() { this.alive = false; },
    };
    return result;
};

test("NPC previews, pays once and cycles its intent only on its own actions", async () => {
    const hero = actor("ally");
    const npc = actor("ally");
    const enemy = actor("enemy");
    const secondEnemy = actor("enemy", 3, 1);
    const dead = actor("enemy");
    dead.alive = false;
    npc.storage.mengsanBond_shuying = {
        intents: DEFAULT_BOND_INTENTS, turnsTaken: 0, intent: null,
    };
    const previews = [], logs = [];
    let active = true;
    const game = { players: [hero, npc, enemy, secondEnemy, dead],
        mengsanSetEnemyIntent_shuying: (who, move) => previews.push(move),
        log: (...values) => logs.push(values),
    };
    const actions = createBondIntentActions(game, () => ({
        session: { active }, energyUI: new Map(),
    }));
    actions.planBondIntent(npc);
    actions.planBondIntent(npc);
    assert.equal(previews.length, 1);
    assert.equal(previews[0].name, "援击");
    await actions.executeBondIntent(npc);
    assert.deepEqual(enemy.hits, [6]);
    assert.deepEqual(secondEnemy.hits, [9]);
    assert.equal(hero.hits.length, 0);
    assert.equal(dead.hits.length, 0);
    assert.equal(npc.storage.mengsanEnergy_shuying, 2);
    assert.equal(npc.storage.mengsanBond_shuying.turnsTaken, 1);
    await actions.executeBondIntent(npc);
    assert.equal(enemy.hits.length, 1);
    actions.planBondIntent(npc);
    assert.equal(npc.storage.mengsanBond_shuying.intent.name, "连击");
    await actions.executeBondIntent(npc);
    assert.deepEqual(enemy.hits, [6, 3, 3]);
    actions.planBondIntent(npc);
    await actions.executeBondIntent(npc);
    assert.equal(npc.armor, 5);
    assert.equal(enemy.hits.length, 3);
    actions.planBondIntent(npc);
    assert.equal(npc.storage.mengsanBond_shuying.intent.name, "援击");
    await actions.executeBondIntent(npc);
    assert.equal(enemy.hits.length, 3);
    assert.match(logs.at(-1).join(""), /费用不足/);
    actions.planBondIntent(npc);
    npc.storage.mengsanEnergy_shuying = 3;
    active = false;
    await actions.executeBondIntent(npc);
    assert.equal(npc.storage.mengsanEnergy_shuying, 3);
});

test("custom NPC intent supports multi-hit debuff and one self buff", async () => {
    const npc = actor("ally");
    const enemy = actor("enemy");
    const otherEnemy = actor("enemy");
    const custom = [{ id: "custom", name: "定制意图", damage: 2, hits: 2,
        debuff: "易伤", stacks: 2, block: 4, strength: 3 }];
    assert.equal(getBondIntents({ intents: custom }), custom);
    npc.storage.mengsanBond_shuying = {
        intents: custom, turnsTaken: 0, intent: null,
    };
    const game = { players: [npc, enemy, otherEnemy], log() {},
        mengsanSetEnemyIntent_shuying() {} };
    const actions = createBondIntentActions(game, () => ({
        session: { active: true }, energyUI: new Map(),
    }));
    actions.planBondIntent(npc);
    await actions.executeBondIntent(npc);
    assert.deepEqual(enemy.hits, [2, 2]);
    assert.deepEqual(otherEnemy.hits, [2, 2]);
    assert.equal(enemy.storage.mengsanVulnerable_shuying, 2);
    assert.equal(otherEnemy.storage.mengsanVulnerable_shuying, 2);
    assert.equal(npc.armor, 4);
    assert.equal(npc.storage.mengsanStrength_shuying, 3);
});

test("a stunned NPC cannot execute its preview or spend energy", async () => {
    const npc = actor("ally");
    const enemy = actor("enemy");
    npc.storage.mengsanBond_shuying = {
        intents: DEFAULT_BOND_INTENTS, turnsTaken: 0, intent: null,
    };
    const game = { players: [npc, enemy], log() {},
        mengsanSetEnemyIntent_shuying() {} };
    const actions = createBondIntentActions(game, () => ({
        session: { active: true }, energyUI: new Map(),
    }));
    actions.planBondIntent(npc);
    applyStun(npc, npc.storage.mengsanBond_shuying.intent,
        { recover() {} });
    await actions.executeBondIntent(npc);
    assert.equal(enemy.hits.length, 0);
    assert.equal(npc.storage.mengsanEnergy_shuying, 3);
    skipStunnedAction(npc, { cancel() {} });
    await finishStunnedTurn(npc);
    await actions.executeBondIntent(npc);
    assert.deepEqual(enemy.hits, [6]);
});

test("intent attacks hit all hostiles in full; armor and debuffs stay individual", async () => {
    const enemy = actor("enemy");
    const hero = actor("ally", 3);
    const helper = actor("ally", 0, 1);
    const otherHelper = actor("ally");
    const dead = actor("ally");
    dead.alive = false;
    const friendly = actor("enemy");
    enemy.storage.mengsanRaiderIntent_shuying = {
        id: "test", damage: 4, hits: 2, debuff: "脆弱", stacks: 2,
        block: 5, strength: 2,
    };
    const game = { me: hero,
        players: [hero, enemy, helper, otherHelper, friendly, dead],
        log() {}, mengsanSetEnemyIntent_shuying() {},
    };
    const actions = createMonsterIntentActions(game, () => ({
        session: { active: true }, energyUI: new Map(),
    }));
    await actions.executeRaiderIntent(enemy);
    assert.deepEqual(hero.hits, [4, 4]);
    assert.equal(hero.hp, 45);
    assert.deepEqual(helper.hits, [6, 6]);
    assert.equal(helper.hp, 38);
    assert.deepEqual(otherHelper.hits, [4, 4]);
    assert.equal(hero.storage.mengsanFrail_shuying, 2);
    assert.equal(helper.storage.mengsanFrail_shuying, 2);
    assert.equal(friendly.hits.length, 0);
    assert.equal(dead.hits.length, 0);
    assert.equal(enemy.armor, 5);
    assert.equal(enemy.storage.mengsanStrength_shuying, 2);
    assert.equal(enemy.storage.mengsanEnergy_shuying, 2);
});

test("death blow hits every hostile then its source dies once", async () => {
    const enemy = actor("enemy");
    const hero = actor("ally");
    const helper = actor("ally");
    enemy.storage.mengsanFlyconidIntent_shuying = {
        id: "test", intentType: "death_blow", damage: 4,
    };
    const game = { me: hero, players: [enemy, hero, helper], log() {},
        mengsanSetEnemyIntent_shuying() {} };
    const actions = createMonsterIntentActions(game, () => ({
        session: { active: true }, energyUI: new Map(),
    }));
    await actions.executeFlyconidIntent(enemy);
    assert.deepEqual(hero.hits, [4]);
    assert.deepEqual(helper.hits, [4]);
    assert.equal(await finishDeathBlow(enemy), true);
    assert.equal(await finishDeathBlow(enemy), false);
});
