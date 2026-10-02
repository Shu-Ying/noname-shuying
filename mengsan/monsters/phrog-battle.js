import { INFESTED_COUNT, isPhrog, WRIGGLER_CHARACTER } from "./phrog-intent.js";

// 死亡钩子被原生die事件await；所有衍生物入场后才继续原伤害/卡牌结算。
export function createPhrogBattle(game, current, spawn) {
    const consumed = new WeakSet();
    let pending = 0, sequence = 0;
    const controller = {
        get pending() {
            // 原生die先移入dead，再调整负生命至0，最后才调用dieAfter。
            // changeHpAfter可能在这段间隙检查胜利；死体本身也须预留亡语。
            return pending > 0 || current.session.active && game.dead.some(player =>
                current.players.has(player) && isPhrog(player) && !consumed.has(player) &&
                player.storage.mengsanInfested_shuying === INFESTED_COUNT);
        },
        async onDeath(player) {
            if (!current.session.active || !isPhrog(player) || player.isAlive() ||
                !current.players.has(player) || consumed.has(player)) return false;
            const count = player.storage.mengsanInfested_shuying ?? 0;
            if (count !== INFESTED_COUNT) throw new RangeError("寄生物召唤配置无效");
            if (game.players.length + game.dead.length + count > 8) throw new Error("异蛙寄生虫召唤席位不足");
            if (!Number.isSafeInteger(sequence + 1)) throw new RangeError("寄生物召唤序号溢出");
            consumed.add(player); pending++;
            const group = ++sequence;
            try {
                let anchor = player;
                for (let position = 1; position <= count; position++) {
                    if (!current.session.active) break;
                    anchor = await spawn({ id: `wriggler_${player.playerid}_${group}_${position}`,
                        character: WRIGGLER_CHARACTER, camp: "enemy", inheritSkills: false,
                        hand: 4, wrigglerPosition: position, wrigglerSpawned: true }, anchor);
                }
                return true;
            } finally { pending--; }
        },
    };
    current.session.ownResource(controller, () => { if (current.phrog === controller) delete current.phrog; });
    return controller;
}
