import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createBattleFlow } from "../mengsan/battle/battle-flow.js";
import { createBattleSettlement } from "../mengsan/battle/battle-settlement.js";

const source = (await readFile(new URL(
    "../mengsan/ui/reward-ui.js", import.meta.url), "utf8"))
    .replace(/^import .*;\r?\n/gm, "");
const rewardUI = await import(`data:text/javascript;base64,${Buffer.from(
    `const lib = {}, get = {}, cardCost = () => 0;\n${source}`
).toString("base64")}`);

class Element {
    constructor(tag) {
        this.tag = tag;
        this.children = [];
        this.listeners = {};
        this.textContent = "";
        this.isConnected = true;
    }
    appendChild(child) { this.children.push(child); }
    setAttribute() {}
    addEventListener(event, handler) { this.listeners[event] = handler; }
    querySelector(tag) {
        for (const child of this.children) {
            if (child.tag === tag) return child;
            const found = child.querySelector(tag);
            if (found) return found;
        }
        return null;
    }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    remove() { this.isConnected = false; }
    get content() {
        return { textContent: (this.innerHTML || "").replace(/<[^>]*>/g, "") };
    }
    get text() {
        return [this.textContent, ...this.children.map(child => child.text)]
            .join(" ");
    }
}

test("fixed rewards share the victory dialog and require confirmation", async () => {
    const previous = globalThis.document;
    const root = new Element("html");
    globalThis.document = {
        documentElement: root,
        createElement: tag => new Element(tag),
        activeElement: new Element("button"),
    };
    try {
        const result = rewardUI.chooseBattleReward([], {
            fixedRewards: [
                { id: "dilu", name: "的卢", description: "加入个人牌库。" },
                { id: "heal", name: "整顿伤势", description: "回复生命。" },
            ],
        });
        const dialog = root.children[0];
        assert.equal(dialog.className, "mengsan-victory-dialog-shuying");
        assert.match(dialog.text, /固定战利品.*领取固定奖励.*的卢/);
        assert.match(dialog.text, /加入个人牌库。.*整顿伤势：回复生命。/);
        assert.doesNotMatch(dialog.text, /放弃本次选择/);
        assert.equal(dialog.open, true);
        await dialog.querySelector("button").listeners.click();
        assert.equal(await result, null);
        assert.equal(dialog.isConnected, false);

        const choice = rewardUI.chooseBattleReward([
            { id: "gold", kind: "gold", amount: 20 },
        ], { fixedRewards: [{ id: "dilu", name: "的卢" }] });
        const selectable = root.children[1];
        assert.equal(selectable.className, dialog.className);
        assert.match(selectable.text, /固定奖励：的卢/);
        assert.match(selectable.text, /可选战利品.*金币 · 20.*放弃本次选择/);
        await selectable.querySelector("button").listeners.click();
        assert.equal(await choice, "gold");

        const skipped = rewardUI.chooseBattleReward([
            { id: "gold", kind: "gold", amount: 20 },
        ]);
        const optional = root.children[2];
        assert.doesNotMatch(optional.text, /固定奖励/);
        const skip = optional.children[0].children.at(-1);
        assert.equal(skip.textContent, "放弃本次选择");
        skip.listeners.click();
        assert.equal(await skipped, null);
        assert.equal(await rewardUI.chooseBattleReward([]), null);
    } finally {
        globalThis.document = previous;
    }
});

test("fixed reward UI precedes settlement and retry does not award twice", async () => {
    const run = {
        runId: "run", actIndex: 0, revision: 1,
        player: { hp: 4, maxHp: 4, gold: 0 },
        statistics: { defeatedEnemies: 0 },
        map: { nodes: [{ id: "opening", completed: false }] },
    };
    const storage = { run: structuredClone(run) };
    let awarded = 0, presented = 0, disposed = 0;
    const settlement = createBattleSettlement({
        store: {
            read: () => storage,
            update: async change => change(storage),
        },
        config: { saveKey: "run", profileKey: "profile" },
        getRandomRewardChoices: () => { throw Error("Unexpected random reward"); },
        applyReward: (result, id) => {
            assert.equal(id, "dilu");
            awarded++;
            result.reward = id;
        },
        completeNode: result => {
            result.map.nodes[0].completed = true;
            return true;
        },
        enterNextAct: () => false,
    });
    const session = {
        requestStop() {}, drain: async () => {},
        dispose: async () => {
            if (++disposed === 1) throw Error("Cleanup failed");
        },
    };
    const flow = createBattleFlow({
        settlement,
        chooseReward: async (choices, context) => {
            assert.deepEqual(choices, []);
            assert.deepEqual(context.fixedRewards, ["dilu"]);
            assert.equal(awarded, 0);
            presented++;
            return null;
        },
        showMap: async () => null, showEnding: async () => {},
        quiesce: async () => {},
    });
    await flow.enterBattle({
        session, run, node: run.map.nodes[0], start() {},
        encounter: { skipRandomReward: true, fixedRewards: ["dilu"] },
    });
    assert.equal(flow.requestFinish({ session, hp: 3 }), true);
    await assert.rejects(flow.wait(), /Cleanup failed/);
    await flow.retry();
    assert.equal(presented, 1);
    assert.equal(awarded, 1);
    assert.equal(storage.run.reward, "dilu");
    assert.equal(storage.run.map.nodes[0].completed, true);
    assert.equal(flow.state, "map");
});
