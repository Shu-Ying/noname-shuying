import { createCardData } from "./card-data.js";
import { cardUpgradeLevel } from "./upgrades.js";

// Route generated copies explicitly to their actor's real pile; never infer a public pile.
export function createBattleCardCopier(game, getActiveBattle) {
    return (player, card, originals = []) => {
        const current = getActiveBattle();
        if (!current?.session.active) return null;
        const pile = player === game.me ? current.personalPiles : current.monsterPiles.get(player);
        if (!pile) throw new Error("复制牌的角色没有个人弃牌堆");
        if (!card || typeof card.name !== "string") throw new TypeError("复制牌缺少牌名");
        const physical = Array.isArray(originals) ? originals.find(item => item?.name === card.name) : null;
        const source = card.storage?.mengsanCard_shuying || physical?.storage?.mengsanCard_shuying || {};
        const serial = (current.generatedCardSerial || 0) + 1;
        if (!Number.isSafeInteger(serial)) throw new RangeError("战斗生成牌序号越界");
        const data = createCardData({
            id: `mengsan_copy_${current.session.id}_${serial}`,
            name: card.name,
            suit: card.suit || source.suit || "spade",
            number: card.number || source.number || 1,
            nature: card.nature || source.nature || null,
            upgrade: cardUpgradeLevel({name:card.name, storage:{mengsanCard_shuying:source}}),
            affixes: (source.affixes || []).filter(key => key !== "annihilate"),
        }, { enemy: true });
        // Fresh JSON metadata means no consumed/exhausted flags or source ID are shared.
        current.generatedCardSerial = serial;
        return pile.addToDiscard(data);
    };
}
