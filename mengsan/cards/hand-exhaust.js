// 坚毅只消耗使用者当时的手牌：普通牌随机，当前选择模式走原生选牌事件。
export function createHandExhauster(game, getActiveBattle, get, randomHandExhaust) {
    const valid = (player, battle) => Boolean(battle &&
        getActiveBattle() === battle && battle.session?.active &&
        battle.players?.has(player) && player?.isAlive?.());
    const getPile = (player, battle) => player === game.me
        ? battle.personalPiles : battle.monsterPiles?.get(player);
    const handCards = (player, event) => {
        const playing = new Set(event?.cards || []);
        return player.getCards("h").filter(card =>
            !playing.has(card) && !card.storage?.mengsanExhausted_shuying);
    };
    return {
        capture(player) {
            const battle = getActiveBattle();
            if (!valid(player, battle)) return null;
            if (typeof getPile(player, battle)?.exhaustFromHand !== "function") {
                throw new Error("坚毅缺少个人消耗牌堆接口");
            }
            if (typeof randomHandExhaust?.exhaust !== "function") throw new Error("坚毅缺少随机手牌消耗接口");
            return { battle, pile: getPile(player, battle) };
        },
        async exhaust(player, event, token, choose) {
            const battle = token?.battle, pile = token?.pile;
            if (!valid(player, battle) || getPile(player, battle) !== pile) return null;
            if (typeof pile?.exhaustFromHand !== "function") throw new Error("坚毅缺少个人消耗牌堆接口");
            if (!choose) return await randomHandExhaust.exhaust(player, event, battle);
            const cards = handCards(player, event);
            if (!cards.length) return null;
            let chosen = cards[0];
            if (cards.length > 1) {
                const result = await player.chooseButton({
                    createDialog: ["坚毅：选择消耗一张你的手牌", cards],
                    forced: true, selectButton: 1,
                    ai(button) { return -get.value(button.link, player); },
                }).forResult();
                if (!result.bool || result.links?.length !== 1) return null;
                chosen = result.links[0];
            }
            // 选牌期间可能已结束、换场、失去此牌或替换牌堆，不提交陈旧选择。
            if (!valid(player, battle) || getPile(player, battle) !== pile ||
                !cards.includes(chosen) || !handCards(player, event).includes(chosen)) return null;
            return await pile.exhaustFromHand(chosen);
        },
    };
}
