import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { canAcquireCard } from "../mengsan/cards/card-definitions.js";
import { createCardData } from "../mengsan/cards/card-data.js";
import { rewards, rewardPools } from "../mengsan/content/shared/rewards.js";
import * as upgrades from "../mengsan/cards/upgrades.js";
import { canAcquireReward } from "../mengsan/progression/reward.js";

const load = source => import(`data:text/javascript;base64,${
    Buffer.from(source).toString("base64")}`);
const rulesSource = await readFile(new URL(
    "../mengsan/battle/combat-rules.js", import.meta.url), "utf8");
const rules = await load(rulesSource.replace(
    /^import .*;\r?\n/gm, "const _status = {};\n"));
const cardsSource = await readFile(new URL(
    "../mengsan/cards/mode-cards.js", import.meta.url), "utf8");
const nativeCard = {
    sha: { type: "basic", enable: true, range: () => true,
        filterTarget: (card, player, target) => player !== target,
        content: async event => { event.observedDamage = event.baseDamage; } },
    tao: {}, taoyuan: {}, nanman: {}, wanjian: {}, juedou: {},
    huogong: {}, shandian: {},
};
for (const name of ["nanman", "wanjian", "juedou"]) {
    nativeCard[name].content = nativeCard.sha.content;
}
globalThis.mengsanCardTest = { rules, nativeCard, upgrades, logs: [] };
const { createMengsanCards } = await load(`
    const { rules, nativeCard, upgrades, logs } = globalThis.mengsanCardTest;
    const { cardUpgradeLevel, cardUpgradeRule } = upgrades;
    const { cardCost, canPayCard, isActiveCardUse, SHA_DAMAGE,
        TRICK_DAMAGE } = rules;
    const _status = {};
    const game = { log: (...args) => logs.push(args) };
    const standard = { card: nativeCard, translate: {},
        list: Object.keys(nativeCard).map(name => [null, null, name]) };
    const extra = { card: {}, translate: {}, list: [] };
    ${cardsSource.replace(/^import[\s\S]*?;\r?\n/gm, "")}
`);
const { card, translate, names } = createMengsanCards();
globalThis.mengsanCardTest.card = card;

test("sha damage changes without changing trick damage", async () => {
    const event = {};
    await card.sha.content(event);
    assert.equal(event.observedDamage, 6);
    assert.equal(card.sha.baseDamage, 6);
    assert.match(translate.sha_info, /6点伤害/);
    for (const name of ["nanman", "wanjian", "juedou"]) {
        const trickEvent = {};
        await card[name].content(trickEvent);
        assert.equal(trickEvent.observedDamage, 4);
    }
    assert.equal(card.huogong.baseDamage, 4);
});

test("heavy strike costs two energy and cannot target its user", () => {
    const used = { name: "mengsan_zhongsha" };
    const player = { storage: { mengsanEnergy_shuying: 1 } };
    const event = { name: "phaseUse", player };
    assert.equal(rules.cardCost(used), 2);
    assert.equal(card.mengsan_zhongsha.enable(used, player, event), false);
    player.storage.mengsanEnergy_shuying = 2;
    assert.equal(card.mengsan_zhongsha.enable(used, player, event), true);
    assert.equal(rules.payCard(player, used), true);
    assert.equal(player.storage.mengsanEnergy_shuying, 0);
    assert.equal(card.mengsan_zhongsha.filterTarget(used, player, player), false);
});

test("damage resolves before vulnerability; stacks add and dead targets skip", async () => {
    for (const [alive, stacks] of [[true, 0], [true, 3], [false, 3]]) {
        let settled = false;
        const source = {};
        const target = {
            storage: { mengsanVulnerable_shuying: stacks },
            damage(num, player) {
                assert.equal(num, 8);
                assert.equal(player, source);
                assert.equal(this.storage.mengsanVulnerable_shuying, stacks);
                const result = Promise.resolve().then(() => {
                    assert.equal(result.mengsanAttack_shuying, true);
                    settled = true;
                });
                return result;
            },
            isAlive: () => alive,
            addSkill(skill) {
                assert.equal(settled, true);
                assert.equal(skill, "mengsan_vulnerable_shuying");
            },
            markSkill() {},
        };
        await card.mengsan_zhongsha.content({ target }, null, source);
        assert.equal(target.storage.mengsanVulnerable_shuying,
            alive ? stacks + 2 : stacks);
    }
});

test("card library and rewards use the extension artwork", async () => {
    for (const [file, helper] of [["card-library", "preview"],
        ["reward-ui", "viewCard"]]) {
        const source = await readFile(new URL(
            `../mengsan/ui/${file}.js`, import.meta.url), "utf8");
        const module = await load(`
            const lib = { assetURL: "/game/", translate: {},
                card: { mengsan_zhongsha: {
                    image: "${card.mengsan_zhongsha.image}"
                } } };
            const get = { translation: name => name };
            lib.card.sha = globalThis.mengsanCardTest.card.sha;
            lib.card.mengsan_zhongsha.cardPrompt =
                globalThis.mengsanCardTest.card.mengsan_zhongsha.cardPrompt;
            const ui = {}, AFFIX_INFO = {}, cardCost = () => 2;
            const { cardUpgradeLevel, cardUpgradeRule } =
                globalThis.mengsanCardTest.upgrades;
            ${source.replace(/^import .*;\r?\n/gm, "")}
            export { ${helper} };
        `);
        const expected = "/game/extension/术樱包/mengsan/assets/cards/" +
            "mengsan_zhongsha.png";
        const previous = globalThis.document;
        globalThis.document = { createElement: () => ({
            children: [], appendChild(child) { this.children.push(child); },
            addEventListener() {},
            get content() { return { textContent: this.innerHTML || "" }; },
        }) };
        try {
            if (helper === "viewCard") {
                assert.equal(module.viewCard({ card: {
                    name: "mengsan_zhongsha" } }).image, expected);
                continue;
            }
            const face = module.preview({ name: "mengsan_zhongsha" },
                { name: "重杀", suit: "黑桃", number: 7,
                    affixes: [] }, null);
            const art = face.children[1];
            assert.equal(art.children[1].src, expected);
            const details = module.describeLibraryCard({
                name: "mengsan_zhongsha", upgrade: 1 });
            assert.match(details.description, /10点伤害.*3层易伤/);
            assert.equal(details.upgrade, 1);
            assert.equal(details.upgradeLimit, 1);
        } finally {
            globalThis.document = previous;
        }
    }
});

test("heavy strike is registered, serializable and obtainable in rewards", () => {
    assert.equal(canAcquireCard("mengsan_liubei_shuying", "mengsan_zhongsha"), true);
    const data = createCardData({ id: "heavy", name: "mengsan_zhongsha",
        suit: "spade", number: 7 }, { character: "mengsan_liubei_shuying" });
    assert.equal(data.name, "mengsan_zhongsha");
    assert.ok(names.includes(data.name));
    assert.ok(rewardPools["shared.pool.battle.normal"].includes(
        "shared.reward.card.zhongsha"));
    assert.equal(rewards["shared.reward.card.zhongsha"].card.name, data.name);
});

test("only configured cards can upgrade once, excluding eternal cards", () => {
    const deck = [
        { name: "sha", upgrade: 0 },
        { name: "mengsan_zhongsha", upgrade: 0 },
        { name: "tao", upgrade: 0 },
        { name: "sha", upgrade: 1 },
        { name: "sha", upgrade: 0, affixes: ["eternal"] },
    ];
    assert.deepEqual(deck.map(upgrades.canUpgradeCard),
        [true, true, false, false, false]);
    assert.equal(upgrades.upgradeRandomCard(deck, () => 0.9), deck[1]);
    assert.equal(deck[1].upgrade, 1);
    assert.equal(upgrades.upgradeRandomCard(deck, () => 0), deck[0]);
    assert.equal(deck[0].upgrade, 1);
    assert.equal(upgrades.hasUpgradeableCard(deck), false);
    assert.equal(upgrades.upgradeRandomCard(deck,
        () => { throw new Error("empty candidates must not consume RNG"); }), null);
    assert.equal(canAcquireReward({ player: { deck } },
        { effectId: "upgrade" }), false);
    deck.push({ name: "sha", upgrade: 0 });
    assert.equal(canAcquireReward({ player: { deck } },
        { effectId: "upgrade" }), true);
});

test("new card data rejects upgrades on unsupported or full-level cards", () => {
    const spec = { id: "upgrade", suit: "spade", number: 7,
        name: "sha", upgrade: 1 };
    assert.equal(createCardData(spec).upgrade, 1);
    assert.throws(() => createCardData({ ...spec, upgrade: 2 }));
    assert.throws(() => createCardData({ ...spec, name: "tao" }));
    assert.throws(() => createCardData({ ...spec, upgrade: -1 }));
    assert.equal(upgrades.cardUpgradeLevel({ name: "sha", upgrade: 5 }), 1);
    assert.equal(upgrades.cardUpgradeLevel({ name: "tao", upgrade: 5 }), 0);
});

test("upgraded sha applies nine damage through serialized and runtime data", async () => {
    const stored = { name: "sha", upgrade: 1 };
    for (const used of [stored,
        { name: "sha", storage: { mengsanCard_shuying: stored } }]) {
        const event = { card: used, baseDamage: 6 };
        await card.sha.content(event);
        assert.equal(event.observedDamage, 9);
        assert.match(card.sha.cardPrompt(used), /9点伤害/);
    }
    const changed = { card: { name: "sha", storage: {
        mengsanCard_shuying: { name: "tao", upgrade: 1 } } }, baseDamage: 6 };
    await card.sha.content(changed);
    assert.equal(changed.observedDamage, 6);
    const modified = { card: stored, baseDamage: 7 };
    await card.sha.content(modified);
    assert.equal(modified.observedDamage, 10);
});

test("upgraded heavy strike deals ten before adding three vulnerability", async () => {
    const used = { name: "mengsan_zhongsha", storage: {
        mengsanCard_shuying: { name: "mengsan_zhongsha", upgrade: 1 } } };
    const target = {
        storage: { mengsanVulnerable_shuying: 2 },
        damage(num) {
            assert.equal(num, 10);
            assert.equal(this.storage.mengsanVulnerable_shuying, 2);
            return Promise.resolve();
        },
        isAlive: () => true, addSkill() {}, markSkill() {},
    };
    await card.mengsan_zhongsha.content({ card: used, target }, null, {});
    assert.equal(target.storage.mengsanVulnerable_shuying, 5);
    assert.match(card.mengsan_zhongsha.cardPrompt(used), /10点伤害.*3层易伤/);
    assert.equal(rules.cardCost(used), 2);
});
