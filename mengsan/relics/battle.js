import { heldRelics } from "./definitions.js";

export function createRelicBattle(run, { active, draw, log }) {
    const relics = heldRelics(run);
    let started = false, turns = 0, firstLoss = false;
    let openingHandBonus = 0, pendingHpDraw = null;
    const seenTurns = new WeakSet();
    const usable = () => started && active();
    const drawEffect = async relic => {
        if (!usable()) return;
        if (turns === 0) openingHandBonus += relic.amount;
        log(relic, `额外摸${relic.amount}张牌`);
        await draw(relic.amount);
    };
    return {
        get openingHandBonus() { return openingHandBonus; },
        get openingDraw() {
            return relics.filter(relic => relic.effect === "openingDraw")
                .reduce((sum, relic) => sum + relic.amount, 0);
        },
        async start() {
            if (started || !active()) return;
            started = true;
            for (const relic of relics) {
                if (relic.effect === "openingDraw") await drawEffect(relic);
            }
            if (pendingHpDraw) {
                const relic = pendingHpDraw;
                pendingHpDraw = null;
                await drawEffect(relic);
            }
        },
        async turnStart(event) {
            if (!usable() || seenTurns.has(event)) return;
            seenTurns.add(event);
            turns++;
            for (const relic of relics) {
                if ((relic.effect === "earlyTurnDraw" &&
                    turns <= relic.turns) ||
                    (relic.effect === "periodicTurnDraw" &&
                    turns % relic.turns === 0)) await drawEffect(relic);
            }
        },
        async loseHp(event) {
            if (!active() || firstLoss || !(event.num < 0)) return;
            const relic = relics.find(item =>
                item.effect === "firstHpLossDraw");
            if (!relic) return;
            firstLoss = true;
            if (!started) {
                pendingHpDraw = relic;
                return;
            }
            await drawEffect(relic);
        },
        status(relic) {
            if (relic.effect === "firstHpLossDraw") {
                return firstLoss ? "本场已触发" : "本场尚未触发";
            }
            if (relic.effect === "earlyTurnDraw") {
                return `本场已开始${turns}个自身回合`;
            }
            if (relic.effect === "periodicTurnDraw") {
                return `回合计数：${turns % relic.turns}/${relic.turns}`;
            }
            if (relic.effect === "openingDraw") {
                return started ? "本场已触发" : "等待战斗开始";
            }
            return "持续持有";
        },
    };
}

export function applyBattleEndRelics(run, outcome) {
    if (outcome !== "victory" || !(run.player.hp > 0)) return 0;
    const amount = heldRelics(run).filter(relic =>
        relic.effect === "battleHeal").reduce((sum, relic) =>
        sum + relic.amount, 0);
    const before = run.player.hp;
    run.player.hp = Math.min(run.player.maxHp ?? before,
        before + amount);
    return run.player.hp - before;
}

export function createRelicSkills(getBattle, getOwner) {
    return {
        mengsan_relics_shuying: {
            trigger: { global: ["phaseBegin", "changeHp"] },
            forced: true, silent: true, popup: false, priority: 100,
            filter(event) {
                const battle = getBattle(), owner = getOwner();
                return Boolean(battle?.session.active && battle.relics &&
                    owner?.hp > 0 && event.player === owner &&
                    (event.name === "phase" || event.num < 0));
            },
            async content(event, trigger) {
                const battle = getBattle();
                if (!battle?.session.active) return;
                if (event.triggername === "phaseBegin") {
                    await battle.relics.turnStart(trigger);
                } else await battle.relics.loseHp(trigger);
            },
        },
    };
}
