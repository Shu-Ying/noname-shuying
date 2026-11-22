// Exclusive battle resources. Never clear arbitrary global queues or arbitrary timers.
export function createBattleResources(session, {game, ui, _status}) {
    const cards = new Set(), nodes = new Map(), fields = [];
    const containers = () => [ui.arena, ui.control, ui.sidebar, ui.cardPile, ui.discardPile, ui.ordering, ui.special].filter(Boolean);
    const children = () => new Map(containers().map(parent => [parent, new Set(parent.childNodes)]));
    const before = children();
    const uiKeys = ["me","handcards1Container","handcards2Container","handcards1","handcards2"];
    const uiBefore = new Map(uiKeys.map(key => [key,Object.getOwnPropertyDescriptor(ui,key)]));
    function field(object, key, value) {
        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        object[key] = value;
        fields.push({object,key,value,descriptor});
        return value;
    }
    // Install before root.start so global history cannot retain the finished battle tree.
    field(_status, "globalHistory", [{cardMove:[],custom:[],useCard:[],changeHp:[],everything:[]}]);
    field(_status, "cardtag", Object.fromEntries(Object.keys(_status.cardtag || {}).map(key => [key,[]])));
    const counters = {phaseNumber:game.phaseNumber, roundNumber:game.roundNumber};
    game.phaseNumber = 0; game.roundNumber = 0;
    session.ownResource({}, () => {
        // 弃牌展示用的副本在开战后才挂到场上，实体牌回收时不会带走它们。
        const arenaBefore = before.get(ui.arena);
        const thrown = new Set(Array.from(ui.arena?.children || []).filter(node =>
            !arenaBefore?.has(node) && node.classList.contains("card") && node.classList.contains("thrown")));
        for (const node of thrown) node.remove();
        if (thrown.size && Array.isArray(ui.thrown)) ui.thrown = ui.thrown.filter(node => !thrown.has(node));
        for (const card of cards) card.remove();
        for (const [node,parent] of nodes) if (node.parentNode === parent) node.remove();
        for (const {object,key,value,descriptor} of fields.slice().reverse()) {
            if (object[key] !== value) continue; // A replacement owned by another subsystem survives.
            if (descriptor) Object.defineProperty(object,key,descriptor); else delete object[key];
        }
        game.phaseNumber = counters.phaseNumber; game.roundNumber = counters.roundNumber;
        cards.clear(); nodes.clear(); fields.length = 0;
        before.clear(); uiBefore.clear();
    });
    return Object.freeze({
        field,
        card(card) { cards.add(card); return card; },
        capturePreparedArena() {
            for (const key of uiKeys) {
                const descriptor = uiBefore.get(key);
                if (ui[key] !== descriptor?.value) fields.push({object:ui,key,value:ui[key],descriptor});
            }
            // Call synchronously after prepareArena, with onfree already drained.
            for (const parent of containers()) {
                const prior = before.get(parent) || new Set();
                for (const node of parent.childNodes) if (!prior.has(node)) {
                    if ([ui.cardPile,ui.discardPile,ui.ordering,ui.special].includes(parent)) cards.add(node);
                    else nodes.set(node,parent);
                }
            }
        },
        bindPlayers(players) {
            const owned = new Set(players);
            session.ownResource({}, () => {
                for (const key of ["currentPhase","lastPhasedPlayer","roundStart"]) {
                    if (owned.has(_status[key])) delete _status[key];
                }
                owned.clear();
            });
        },
    });
}
