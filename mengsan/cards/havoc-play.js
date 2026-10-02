// 破灭通过原生使用事件执行自己的堆顶原牌；授权不写入永久牌数据。
import { authorizeFreeCardUse } from "../battle/combat-rules.js";
export function createHavocPlayer(game, getActiveBattle, status) {
    const valid = (player, battle) => Boolean(battle && getActiveBattle() === battle &&
        battle.session?.active && battle.players?.has(player) && player?.isAlive?.());
    const getPile = (player, battle) => player === game.me ? battle.personalPiles : battle.monsterPiles?.get(player);
    return async function playDrawTop(player) {
        const battle = getActiveBattle();
        if (!valid(player, battle)) return null;
        const pile = getPile(player, battle);
        if (typeof pile?.beginTopPlay !== "function" || typeof pile?.finishTopPlay !== "function") {
            throw new Error("破灭缺少个人牌堆接口");
        }
        const original = pile.beginTopPlay();
        if (!original) return null;
        let release = () => {};
        try {
            const stillValid = () => valid(player, battle) && getPile(player, battle) === pile;
            const choice = player.chooseUseTarget({
                card: original, cards: [original], forced: true, addCount: false,
                prompt: "破灭：使用抽牌堆顶部的牌",
                oncard() {
                    // 目标选择期间可能已死亡、结束或换场，不执行陈旧的使用。
                    if (!stillValid()) status.event?.cancel?.();
                },
            });
            release = authorizeFreeCardUse(player, original, choice, stillValid);
            await choice;
        } finally {
            release();
            // 只认这一张实体原牌，不添加消耗词缀，避免愤怒的副本继承消耗。
            await pile.finishTopPlay(original);
        }
        return original;
    };
}
