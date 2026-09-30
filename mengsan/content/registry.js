import { validateBattlePlan } from "../battle/battle-director.js";
import act1 from "./acts/act1/index.js";
import act2 from "./acts/act2/index.js";
import act3 from "./acts/act3/index.js";
import shared from "./shared/index.js";

const addEntries = (target, source, category) => {
    Object.entries(source || {}).forEach(([id, value]) => {
        if (Object.prototype.hasOwnProperty.call(target, id)) throw new Error(`梦三${category} ID重复：${id}`);
        target[id] = value;
    });
};

const packages = [shared, act1, act2, act3];
const nodeContents = {};
const rewardPools = {};
const rewards = {};
const dialogueTypes = new Set(["character", "narrator", "sound", "choice"]);

const validateDialogue = (dialogue, location) => {
    if (dialogue == null) return;
    if (!Array.isArray(dialogue)) throw new Error(`梦三剧情台词必须为数组：${location}`);
    dialogue.forEach((line, index) => {
        const lineLocation = `${location} #${index + 1}`;
        if (!line || !dialogueTypes.has(line.type)) throw new Error(`梦三剧情台词类型无效：${lineLocation}`);
        if (typeof line.text != "string" || !line.text.trim()) throw new Error(`梦三剧情台词内容为空：${lineLocation}`);
        if (line.type == "character" && !line.character) throw new Error(`梦三角色台词缺少武将ID：${lineLocation}`);
        if (line.when && (!/^story\.[\w.]+$/.test(line.when.flag || "") || typeof line.when.equals !== "string")) throw new Error(`梦三剧情条件无效：${lineLocation}`);
        if (line.type == "choice" && (!/^story\.[\w.]+$/.test(line.flag || "") || !Array.isArray(line.choices) || line.choices.length < 1 ||
            new Set(line.choices.map(choice => choice.id)).size !== line.choices.length ||
            line.choices.some(choice => !/^[\w.-]+$/.test(choice.id || "") || typeof choice.text !== "string" || !choice.text.trim()) ||
            (line.defaultChoice != null && !line.choices.some(choice => choice.id === line.defaultChoice)))) {
            throw new Error(`梦三发言选项无效：${lineLocation}`);
        }
        if (line.speed != null && (!Number.isFinite(line.speed) || line.speed < 0)) {
            throw new Error(`梦三剧情台词速度无效：${lineLocation}`);
        }
    });
};
packages.forEach(content => {
    addEntries(nodeContents, content.nodeContents, "节点内容");
    addEntries(rewardPools, content.rewardPools, "奖励池");
    addEntries(rewards, content.rewards, "奖励");
});

const acts = [act1.map, act2.map, act3.map];
if (new Set(acts.map(act => act.id)).size != acts.length) throw new Error("梦三大关ID存在重复");
acts.forEach(act => {
    (act.fixedNodes || []).forEach(node => {
        if (!nodeContents[node.contentId]) throw new Error(`梦三固定节点内容不存在：${node.contentId}`);
        if (!Number.isInteger(node.floor) || node.floor < 0 || node.floor >= act.floorNodes.length) {
            throw new Error(`梦三固定节点楼层越界：${node.contentId}`);
        }
    });
});
Object.entries(rewardPools).forEach(([poolId, rewardIds]) => {
    if (!Array.isArray(rewardIds) || rewardIds.length < 3) throw new Error(`梦三奖励池至少需要三项：${poolId}`);
    if (new Set(rewardIds).size != rewardIds.length) throw new Error(`梦三奖励池存在重复项：${poolId}`);
    rewardIds.forEach(rewardId => {
        if (!rewards[rewardId]) throw new Error(`梦三奖励不存在：${poolId} -> ${rewardId}`);
    });
});
Object.entries(nodeContents).forEach(([contentId, content]) => {
    if (content.id != contentId) throw new Error(`梦三节点内容ID不一致：${contentId}`);
    validateDialogue(content.dialogue, contentId);
    validateDialogue(content.victoryDialogue, contentId + " 战后");
    validateDialogue(content.openingDialogue, contentId + " 开场");
    for (const id of content.fixedRewards || []) if (!rewards[id]) throw new Error("固定奖励不存在：" + id);
    if (content.battlePlan) validateBattlePlan(content.battlePlan);
    (content.choices || []).forEach(choice => {
        if (!choice.id) throw new Error(`梦三剧情选项缺少ID：${contentId}`);
        const outcome = choice.outcome || {};
        if (outcome.battle?.battlePlan) validateBattlePlan(outcome.battle.battlePlan);
        validateDialogue(outcome.dialogue, `${contentId} -> ${choice.id}`);
        const referencedPools = [outcome.rewardPool, outcome.battle?.rewardPool].filter(Boolean);
        referencedPools.forEach(poolId => {
            if (!rewardPools[poolId]) throw new Error(`梦三剧情奖励池不存在：${contentId} -> ${poolId}`);
        });
        if (outcome.battle && !outcome.battle.enemies?.length && !outcome.battle.battlePlan) {
            throw new Error(`梦三剧情战斗敌人池为空：${contentId} -> ${choice.id}`);
        }
        if (outcome.confirmResult != null && typeof outcome.confirmResult != "boolean") {
            throw new Error(`梦三剧情confirmResult必须为布尔值：${contentId} -> ${choice.id}`);
        }
        if (choice.requires && !Array.isArray(choice.requires)) throw new Error(`梦三剧情requires必须为数组：${contentId}`);
        if (choice.excludes && !Array.isArray(choice.excludes)) throw new Error(`梦三剧情excludes必须为数组：${contentId}`);
    });
});

Object.values(rewards).forEach(reward => {
    if (!reward.support) return;
    validateBattlePlan({ units: [{ ...reward.support.unit, id: "reward_support" }], rules: [] });
    const battles = reward.support.battles ?? -1;
    if (battles !== -1 && (!Number.isInteger(battles) || battles < 1 || battles > 99)) throw new Error("梦三支援持续场数无效");
});

const contentRegistry = { acts, nodeContents, rewardPools, rewards };

export default contentRegistry;
