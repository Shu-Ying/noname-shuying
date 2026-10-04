// 累积仅属于真实牌对象和当前会话；不写Card.storage或永久牌组。
const NAME = "mengsan_baozou";
const growth = new WeakMap();
const validEntry = (card, entry) => card?.name === NAME && entry?.session.active &&
    entry.battle.session === entry.session;
export function snapshotRampage(card) {
    const entry = growth.get(card);
    return validEntry(card, entry) ? {
        mengsanRampageBonus_shuying: entry.bonus,
        mengsanRampageSession_shuying: entry.session.id,
    } : {};
}
export function copyRampageGrowth(source,target,battle) {
    if(source?.cards?.length===1)source=source.cards[0];
    const from=growth.get(source);
    if(!validEntry(source,from) || from.battle!==battle || target?.name!==NAME)return;
    const entry={battle,session:battle.session,bonus:from.bonus};
    growth.set(target,entry);
    battle.session.ownResource(entry,()=>{if(growth.get(target)===entry)growth.delete(target);});
}
function nearestUse(event) {
    const seen = new Set();
    for (let current = event; current && !seen.has(current); current = current.parent) {
        seen.add(current);
        if (current.name === "useCard") return current;
    }
    return null;
}
function original(event) {
    const use = nearestUse(event);
    if(use?.card?.name===NAME && use.mengsanIcRepeatOriginal_shuying?.name===NAME)return use.mengsanIcRepeatOriginal_shuying;
    return use?.card?.name === NAME && use.cards?.length === 1 &&
        use.cards[0]?.name === NAME ? use.cards[0] : null;
}
function cardOf(card) {
    return card?.name === NAME && card.cards?.length === 1 && card.cards[0]?.name === NAME
        ? card.cards[0] : card;
}
function belongsTo(event, root) {
    const seen = new Set();
    for (let current = event; current && !seen.has(current); current = current.parent) {
        if (current === root) return true;
        seen.add(current);
    }
    return false;
}
export function createRampage(game, getActiveBattle) {
    const used = new WeakSet();
    const getPile = (player, battle) => player === game.me
        ? battle.personalPiles : battle.monsterPiles?.get(player);
    function damage(card) {
        const node = cardOf(card), battle = getActiveBattle(), entry = growth.get(node);
        let bonus = validEntry(node, entry) && entry.battle === battle ? entry.bonus : 0;
        // Only plain, current-session UI snapshots may expose serialized growth.
        if (!node?.storage && battle?.session.active &&
            node?.mengsanRampageSession_shuying === battle.session.id &&
            Number.isSafeInteger(node.mengsanRampageBonus_shuying) && node.mengsanRampageBonus_shuying >= 0)
            bonus = node.mengsanRampageBonus_shuying;
        if (bonus > Number.MAX_SAFE_INTEGER - 9) throw new RangeError("暴走伤害越界");
        return 9 + bonus;
    }
    return {
        card: cardOf, original, damage,
        async apply(player, event, baseDamage, increase) {
            if (baseDamage !== 9 || !Number.isSafeInteger(increase) || increase <= 0)
                throw new RangeError("暴走攻击参数无效");
            const use = nearestUse(event), card = original(event);
            const battle = getActiveBattle(), session = battle?.session, root = battle?.root;
            if (!battle || !session?.active || !root || !card || use.player !== player ||
                event.card?.name !== NAME || used.has(use) || !belongsTo(use, root)) return;
            const pile = getPile(player, battle), target = event.target;
            const valid = () => getActiveBattle() === battle && battle.session === session &&
                session.active && battle.root === root && battle.players?.has(player) &&
                player.isAlive() && card.name === NAME && getPile(player, battle) === pile &&
                typeof pile?.battleCards === "function" && pile.battleCards(use.cards).includes(card);
            if (!valid() || !battle.players.has(target) || !target?.isAlive?.() ||
                target === player || !player.isEnemyOf(target)) return;
            const amount = damage(card), bonus = amount - baseDamage;
            if (increase > Number.MAX_SAFE_INTEGER - baseDamage - bonus)
                throw new RangeError("暴走累积伤害越界");
            used.add(use);
            player.line(target, "green");
            const hit = target.damage(amount, player);
            hit.mengsanAttack_shuying = true;
            await hit;
            if (!valid()) return;
            let entry = growth.get(card);
            if (!validEntry(card, entry) || entry.battle !== battle) {
                entry = { battle, session, bonus: 0 };
                const record = entry;
                session.ownResource(record, () => {
                    if (growth.get(card) === record) growth.delete(card);
                });
                growth.set(card, entry);
            }
            // Damage hooks may initiate nested uses; retain their increments without overwrite.
            if (increase > Number.MAX_SAFE_INTEGER - baseDamage - entry.bonus)
                throw new RangeError("暴走累积伤害越界");
            entry.bonus += increase;
            battle.handUI?.refresh();
            battle.pilesUI?.refresh();
        },
    };
}
