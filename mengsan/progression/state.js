import { createStartingDeck } from "../cards/starting-deck.js";
import config from "../config.js";
import { initializeInnateBonds } from "../bonds/state.js";
import { RAIDER_TRIO_ENCOUNTER, createRaiderTrioBattlePlan } from "../content/acts/act1/raider-trio.js";

const hashText = text => {
    let value = 2166136261;
    for (let index = 0; index < text.length; index++) {
        value ^= text.charCodeAt(index);
        value = Math.imul(value, 16777619);
    }
    return value >>> 0;
};

export const nextRandom = run => {
    let value = Number(run.randomState || run.seed || Date.now()) >>> 0;
    value += 0x6d2b79f5;
    run.randomState = value >>> 0;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
};

export const randomGet = (run, list) => list[Math.floor(nextRandom(run) * list.length)];

const weightedType = (run, weights) => {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);
    let cursor = nextRandom(run) * total;
    for (const [type, weight] of entries) {
        cursor -= weight;
        if (cursor <= 0) return type;
    }
    return entries[0][0];
};

const connectFloors = (run, edges, currentFloor, nextFloor) => {
    const addEdge = (source, target) => {
        if (!edges.some(edge => edge[0] == source.id && edge[1] == target.id)) {
            edges.push([source.id, target.id]);
        }
    };
    currentFloor.forEach(source => {
        const targets = nextFloor.slice().sort((left, right) => {
            const distance = Math.abs(left.routeIndex - source.routeIndex) - Math.abs(right.routeIndex - source.routeIndex);
            return distance || left.routeIndex - right.routeIndex;
        });
        addEdge(source, targets[0]);
        if (targets.length > 1 && Math.abs(targets[1].routeIndex - source.routeIndex) <= 1 && nextRandom(run) < 0.45) {
            addEdge(source, targets[1]);
        }
    });
    nextFloor.forEach(target => {
        if (!edges.some(edge => edge[1] == target.id)) {
            const source = currentFloor.slice().sort((left, right) => {
                const distance = Math.abs(left.routeIndex - target.routeIndex) - Math.abs(right.routeIndex - target.routeIndex);
                return distance || left.routeIndex - right.routeIndex;
            })[0];
            addEdge(source, target);
        }
    });
};

const getFloorRoutes = (run, act, floor, lastFloor) => {
    const routeCount = Math.max(1, config.routeCount);
    if (floor == 0 || floor == lastFloor) return [(routeCount - 1) / 2];
    const maximum = Math.max(1, Math.min(routeCount, act.floorNodes[floor] || routeCount));
    const configuredMinimum = act.minFloorNodes?.[floor] ?? Math.max(2, maximum - 1);
    const minimum = Math.max(1, Math.min(maximum, configuredMinimum));
    const count = minimum + Math.floor(nextRandom(run) * (maximum - minimum + 1));
    const routes = Array.from({ length: routeCount }, (_, index) => index);
    for (let index = routes.length - 1; index > 0; index--) {
        const target = Math.floor(nextRandom(run) * (index + 1));
        [routes[index], routes[target]] = [routes[target], routes[index]];
    }
    const selectedRoutes = routes.slice(0, count);
    const fixedRoutes = [...new Set((act.fixedNodes || [])
        .filter(node => node.floor == floor)
        .map(node => node.routeIndex)
        .filter(routeIndex => Number.isInteger(routeIndex) && routeIndex >= 0 && routeIndex < routeCount))];
    fixedRoutes.forEach(routeIndex => {
        if (selectedRoutes.includes(routeIndex)) return;
        let replaceIndex = -1;
        for (let index = selectedRoutes.length - 1; index >= 0; index--) {
            if (!fixedRoutes.includes(selectedRoutes[index])) {
                replaceIndex = index;
                break;
            }
        }
        if (replaceIndex >= 0) selectedRoutes[replaceIndex] = routeIndex;
        else if (selectedRoutes.length < routeCount) selectedRoutes.push(routeIndex);
    });
    return selectedRoutes.sort((left, right) => left - right);
};

export const generateActMap = (run, actIndex) => {
    const act = config.acts[actIndex];
    const nodes = [];
    const edges = [];
    const floors = [];
    const lastFloor = act.floorNodes.length - 1;
    act.floorNodes.forEach((count, floor) => {
        const floorNodes = [];
        const routes = getFloorRoutes(run, act, floor, lastFloor);
        routes.forEach((routeIndex, index) => {
            const fixedNode = act.fixedNodes?.find(node => {
                if (node.floor != floor) return false;
                if (node.position == "start") return floor == 0;
                return node.routeIndex == routeIndex;
            });
            let type;
            if (floor == lastFloor) type = "boss";
            else if (fixedNode?.type) type = fixedNode.type;
            else if (act.requiredFloors?.[floor + 1]) {
                type = act.requiredFloors[floor + 1];
            }
            else if (floor == 0) type = "battle";
            else type = weightedType(run, act.nodeWeights);
            const id = `${act.id}_f${floor}_n${index}_${Math.floor(nextRandom(run) * 1e6)}`;
            const node = {
                id,
                floor,
                type,
                contentId: fixedNode?.contentId || null,
                routeIndex,
                x: Math.round((routeIndex + 1) * 100 / (config.routeCount + 1)),
                y: Math.round(90 - floor * 80 / Math.max(1, lastFloor)),
                completed: false,
            };
            nodes.push(node);
            floorNodes.push(node);
        });
        floors.push(floorNodes);
    });
    for (let floor = 0; floor < floors.length - 1; floor++) {
        connectFloors(run, edges, floors[floor], floors[floor + 1]);
    }
    return {
        layoutVersion: config.mapLayoutVersion,
        routeCount: config.routeCount,
        actIndex,
        actId: act.id,
        nodes,
        edges,
        currentNodeId: null,
        completedNodeIds: [],
    };
};

export const createRun = character => {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    const run = {
        schemaVersion: config.schemaVersion,
        runId: `mengsan_${Date.now()}`,
        seed,
        randomState: seed,
        status: "running",
        revision: 0,
        actIndex: 0,
        player: {
            id: "player_1",
            ownerId: "local",
            character,
            hp: null,
            maxHp: null,
            gold: 0,
            deck: createStartingDeck(character),
            permanentSkills: [],
            temporarySkills: [],
            items: [],
            handLimitBonus: 0,
        },
        statistics: {
            completedNodes: 0,
            defeatedEnemies: 0,
            goldEarned: 0,
        },
        storyFlags: {},
    };
    initializeInnateBonds(run);
    run.map = generateActMap(run, 0);
    return run;
};

export const getSelectableNodes = run => {
    const map = run.map;
    if (!map.currentNodeId) {
        return map.nodes.filter(node => node.floor == 0 && !node.completed);
    }
    const ids = map.edges.filter(edge => edge[0] == map.currentNodeId).map(edge => edge[1]);
    return map.nodes.filter(node => ids.includes(node.id) && !node.completed);
};

export const completeNode = (run, nodeId) => {
    const node = run.map.nodes.find(current => current.id == nodeId);
    if (!node || node.completed) return false;
    node.completed = true;
    run.map.currentNodeId = node.id;
    run.map.completedNodeIds.push(node.id);
    run.statistics.completedNodes++;
    run.revision++;
    return true;
};

export const insertStoryNode = (run, sourceId) => {
    const map = run.map;
    const source = map.nodes.find(node => node.id == sourceId);
    const outgoingEdges = map.edges.filter(edge => edge[0] == sourceId);
    if (!source || !outgoingEdges.length) return null;
    const targets = outgoingEdges.map(edge => map.nodes.find(node => node.id == edge[1])).filter(Boolean);
    if (!targets.length) return null;
    const averageTargetX = targets.reduce((sum, target) => sum + target.x, 0) / targets.length;
    const averageTargetY = targets.reduce((sum, target) => sum + target.y, 0) / targets.length;
    const node = {
        id: `story_${hashText(`${run.runId}_${sourceId}_${run.revision}`)}`,
        floor: source.floor + 0.45,
        type: "story",
        x: Math.max(8, Math.min(92, Math.round((source.x + averageTargetX) / 2 + (nextRandom(run) - 0.5) * 16))),
        y: Math.round((source.y + averageTargetY) / 2),
        completed: false,
        dynamic: true,
    };
    map.edges = map.edges.filter(edge => edge[0] != sourceId);
    map.edges.push([source.id, node.id], ...targets.map(target => [node.id, target.id]));
    map.nodes.push(node);
    return node;
};

export const enterNextAct = run => {
    run.actIndex++;
    if (run.actIndex >= config.acts.length) {
        run.status = "completed";
        return false;
    }
    run.map = generateActMap(run, run.actIndex);
    run.revision++;
    return true;
};

export const getNodeEncounter = (run, node, override = null) => {
    const act = config.acts[run.actIndex];
    const content = node.contentId ? config.nodeContents?.[node.contentId] : null;
    const encounter = override || content;
    let pool = encounter?.enemies || act.enemies;
    if (node.type == "elite" || node.type == "story") pool = act.eliteEnemies?.length ? act.eliteEnemies : act.enemies;
    if (encounter?.enemies?.length) pool = encounter.enemies;
    if (node.type == "boss") {
        return { battlePlan: encounter?.battlePlan || act.bossBattlePlan || null, enemy: act.boss, tier: "boss", gold: act.baseGold * 3, boss: true, rewardPool: "shared.pool.boss.premium" };
    }
    const enemy = randomGet(run, pool.filter(Boolean));
    return {
        name: encounter?.name || (enemy === RAIDER_TRIO_ENCOUNTER ? "劫掠者团伙" : ""),
        requiredCharacter: encounter?.requiredCharacter || null,
        openingDialogue: encounter?.openingDialogue || [],
        fixedRewards: encounter?.fixedRewards || [],
        skipRandomReward: encounter?.skipRandomReward === true,
        victoryDialogue: encounter?.victoryDialogue || [],
        battlePlan: encounter?.battlePlan || (enemy === RAIDER_TRIO_ENCOUNTER ?
            createRaiderTrioBattlePlan(() => nextRandom(run)) : null),
        tier: encounter?.tier || (node.type === "elite" ? "elite" : "normal"),
        enemy,
        gold: encounter?.gold ?? (node.type == "elite" || node.type == "story" ? act.baseGold * 2 : act.baseGold),
        boss: false,
        contentId: node.contentId || null,
        description: encounter?.description || "",
        rewardPool: encounter?.rewardPool || "shared.pool.battle.normal",
        rewardTitle: encounter?.rewardTitle || "战斗奖励（三选一）",
    };
};
