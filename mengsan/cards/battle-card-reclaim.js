// Actor-local discard recovery. Do not infer ownership from the active global UI pile.
export function createBattleCardReclaimer(game, getActiveBattle, get) {
    return async player => {
        const current = getActiveBattle();
        if (!current?.session.active || !player.isAlive()) return null;
        const getPile = () => player === game.me
            ? current.personalPiles : current.monsterPiles.get(player);
        const pile = getPile();
        if (!pile) throw new Error("回收牌的角色没有个人牌堆");
        const cards = pile.discardCards();
        if (!cards.length) return null;
        let chosen = cards[0];
        if (cards.length > 1) {
            const result = await player.chooseButton({
                createDialog: ["头槌：选择一张个人弃牌，放到个人抽牌堆顶部", cards],
                forced: true, selectButton: 1,
                ai(button) { return get.value(button.link, player); },
            }).forResult();
            if (!result.bool || result.links?.length !== 1) return null;
            chosen = result.links[0];
        }
        // The selection is asynchronous: reject stale battles, piles and removed cards.
        if (getActiveBattle() !== current || !current.session.active ||
            !player.isAlive() || getPile() !== pile || !cards.includes(chosen)) return null;
        if (!pile.moveDiscardToTop(chosen)) return null;
        game.log(player, "将", chosen, "放到个人抽牌堆顶部");
        return chosen;
    };
}
