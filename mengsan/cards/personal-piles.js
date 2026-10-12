// Mode-owned piles use real Card nodes so native searches/gain/insert operations agree.
// DIY must access ui piles inside the acting player's engine event, never cache global nodes.
import { AFFIX_INFO } from "./affixes.js";
import { snapshotRampage } from "./rampage.js";
import { cardDefinitions } from "./card-definitions.js";
import { hasCardAffix } from "./intrinsic-affixes.js";
import { sharedHooks } from "./shared-hooks.js";
import { queueIroncladExhaust, flushIroncladExhaust, ironcladSkillExhausts, ironcladHooks } from "./ironclad-hooks.js";
import { queueRelicExhaust, queueRelicShuffle } from "../relics/hooks.js";


export function installPersonalPiles(session, owner, battle, run, resources, env) {
    const { game, ui, get, _status, document, MutationObserver, shuffle } = env;
    for (const key of ["cardPile", "discardPile"]) {
        const descriptor = Object.getOwnPropertyDescriptor(ui, key);
        if (!descriptor || !descriptor.configurable || (!Object.hasOwn(descriptor, "value") && typeof descriptor.get !== "function")) throw new Error("Unsupported pile property: " + key);
    }
    const draw = document.createElement("div"), discard = document.createElement("div");
    const exhausted = document.createElement("div"); exhausted.id = "special";
    // Detached nodes: engine get.position recognises these IDs; no duplicate document IDs.
    draw.id = "cardPile"; discard.id = "discardPile";
    const owned = new Set(), topPlaying = new Set(), restores = [];
    const strict = env.strict !== false;
    let released = false, forcedOwner = false, forcedPublic = false, exhaustTotal = 0;
    function recordExhaust(card) {
        if (card.storage?.mengsanExhausted_shuying) return false;
        card.storage.mengsanExhausted_shuying = true;
        battle.exhaustPile.push(snapshot(card)); exhaustTotal++;
        queueIroncladExhaust(owner, card); queueRelicExhaust(owner, card); refresh(); return true;
    }
    const personal = () => {
        if (released || forcedPublic) return false;
        if (forcedOwner) return true;
        const seen = new Set();
        for (let event = _status.event; event && !seen.has(event); event = event.parent) {
            seen.add(event);
            // 判定及其公共牌清理沿用原生牌堆；判定触发的独立摸牌/弃牌事件
            // 会先遇到自己的 player，仍按个人牌堆处理。
            if (event.name === "judge" || event.name === "judgeCallback" ||
                event.name === "orderingDiscard" && event.relatedEvent?.name === "judge") return false;
            if (event.player) return event.player === owner;
        }
        return false; // Never infer ownership from whose turn it is.
    };
    const refresh = () => { if (!released) env.refresh(); };
    const canReceiveTransfer = (card, sourceSession) => !released && session.active && sourceSession===session &&
        owner.isAlive() && !owned.has(card) && typeof card?.storage?.mengsanCard_shuying?.id==="string" &&
        ![...owned].some(c=>c.storage?.mengsanCard_shuying?.id===card.storage.mengsanCard_shuying.id);
    function adopt(card, data) {
        if (owned.has(card)) return;
        owned.add(card); resources.card(card);
        card.storage ||= {};
        card.storage.mengsanOwnerId_shuying = owner.playerid;
        if (data) {
            card.storage.mengsanCard_shuying = JSON.parse(JSON.stringify(data));
            const classification = cardDefinitions[card.name] || env.lib?.card?.[card.name];
            card.storage.mengsanCard_shuying.cardType = classification?.cardType ?? null;
            card.storage.mengsanCard_shuying.rarity = classification?.rarity ?? "common";
            // Retired affixes from old saves must not acquire new battle behaviour.
            card.storage.mengsanCard_shuying.affixes = (card.storage.mengsanCard_shuying.affixes || []).filter(key => key !== "annihilate");
        }
        // Existing foreign/generated cards retain their original destruction semantics.
        if (!data) return;
        card.destroyLog = false;
        card.destroyed = (current, position) => {
            if (released || !["discardPile", "equip", "judge"].includes(position)) return false;
            if (position === "discardPile" && topPlaying.has(current)) {
                if (!current.storage.mengsanExhausted_shuying) {
                    recordExhaust(current);
                }
                return true;
            }
            // 能力牌退出战斗牌堆，不进入消耗牌堆，也不触发消耗收益。
            if (env.lib?.card?.[current.name]?.mengsanPower_shuying && current.storage.mengsanConsumed_shuying) {
                current.storage.mengsanPowerRemoved_shuying = true;
                return true;
            }
            const exhaustRule = env.lib?.card?.[current.name]?.mengsanExhaust_shuying;
            const exhaust = (typeof exhaustRule === "function" ? exhaustRule(current) : exhaustRule === true) ||
                current.storage.mengsanCard_shuying.affixes.includes("exhaust") ||
                ironcladSkillExhausts(owner,current);
            if (exhaust && current.storage.mengsanConsumed_shuying) {
                if (current.storage.mengsanExhausted_shuying) return true;
                recordExhaust(current);
                return true;
            }
            return false; // Actual discarded cards remain available to native skills.
        };
        // Only explicit affixes are native gaintags; intrinsic keywords can change on upgrade.
        for (const key of card.storage.mengsanCard_shuying.affixes) card.addGaintag(AFFIX_INFO[key]?.name || key);
        // 强化仅用手牌 +X 角标显示；数值仍保存在 mengsanCard_shuying.upgrade。
    }
    function snapshot(card) {
        const data = card.storage?.mengsanCard_shuying || {};
        return { ...data, ...snapshotRampage(card), ...ironcladHooks(owner)?.snapshotCard(card), ...sharedHooks(owner)?.snapshotCard?.(card), name: card.name, suit: card.suit, number: card.number,
            nature: card.nature || null, affixes: data.affixes?.slice() || [], upgrade: data.upgrade || 0 };
    }
    for (const data of battle.drawPile) {
        const card = game.createCard(data.name, data.suit, data.number, data.nature);
        adopt(card, data); draw.appendChild(card);
    }
    const publicDiscard = ui.discardPile;
    for (const [key, node] of [["cardPile", draw], ["discardPile", discard]]) {
        const descriptor = Object.getOwnPropertyDescriptor(ui, key);
        let publicNode = descriptor.value;
        const read = () => personal() ? node : (descriptor.get ? descriptor.get.call(ui) : publicNode);
        Object.defineProperty(ui, key, { configurable: true, enumerable: descriptor.enumerable,
            get: read, set(value) { if (descriptor.set) descriptor.set.call(ui, value); else publicNode = value; } });
        restores.push(() => {
            if (Object.getOwnPropertyDescriptor(ui, key)?.get === read) Object.defineProperty(ui, key, descriptor.get ? descriptor : { ...descriptor, value: publicNode });
        });
    }
    for (const [key, node] of [["drawPile", draw], ["discardPile", discard]]) {
        Object.defineProperty(battle, key, { configurable: true, enumerable: true,
            get: () => Array.from(node.childNodes, snapshot) });
    }
    const observer = new MutationObserver(() => {
        if (released) return;
        // A card from our deck can be discarded during an enemy-owned event.
        for (const card of Array.from(publicDiscard.childNodes)) if (owned.has(card)) discard.appendChild(card);
        for (const node of [draw, discard]) for (const card of node.childNodes) adopt(card);
        refresh();
    });
    for (const node of [draw, discard, publicDiscard]) observer.observe(node, { childList: true });
    function wash() {
        const cards = [...draw.childNodes, ...discard.childNodes];
        if (!cards.length) return false;
        shuffle(run, cards);
        queueRelicShuffle(owner);
        for (const card of cards) { card.fix?.(); draw.appendChild(card); }
        refresh();
        return true;
    }
    function take(number = 1, putBack = false, bottom = false) {
        if (!Number.isFinite(number) || number <= 0) return [];
        number = Math.ceil(number);
        if (draw.childNodes.length + discard.childNodes.length < number) {
            if (strict) { game.mengsanFailRun_shuying("个人牌堆与弃牌堆不足，挑战失败"); return []; }
            number = draw.childNodes.length + discard.childNodes.length;
        }
        const cards = [];
        while (cards.length < number) {
            if (!draw.childNodes.length) wash();
            const card = draw.removeChild(bottom ? draw.lastChild : draw.firstChild); card.original = "c"; cards.push(card);
        }
        if (putBack) for (let i = cards.length - 1; i >= 0; i--) {
            if (bottom) draw.appendChild(cards[i]); else draw.insertBefore(cards[i], draw.firstChild);
        }
        refresh(); return cards;
    }
    function wrap(object, key, replacement, shouldReplace = personal) {
        const descriptor = Object.getOwnPropertyDescriptor(object, key), original = object[key];
        const wrapped = function (...args) { return shouldReplace() ? replacement.apply(this, args) : original.apply(this, args); };
        object[key] = wrapped;
        restores.push(() => { if (object[key] === wrapped) { if (descriptor) Object.defineProperty(object, key, descriptor); else delete object[key]; } });
    }
    wrap(get, "cards", (number, putBack) => take(typeof number === "number" ? number : 1, putBack));
    wrap(get, "bottomCards", (number, putBack) => take(typeof number === "number" ? number : 1, putBack, true));
    wrap(game, "washCard", wash);
    // 原生 player.judge 在事件创建时就读取默认弃牌位置，此时尚未进入 judge。
    // 仅在同步创建期间读取公共节点，不把此状态延续到异步判定或子技能。
    // 敌人或助战也可能在玩家事件中创建判定，须统一默认位置。
    const judgeHost = env.lib?.element?.Player?.prototype || owner;
    const nativeJudge = judgeHost.judge;
    wrap(judgeHost, "judge", function (...args) {
        const before = forcedPublic;
        forcedPublic = true;
        try { return nativeJudge.apply(this, args); }
        finally { forcedPublic = before; }
    }, () => !released);
    session.ownResource(draw, () => {
        if (released) return;
        observer.disconnect(); released = true;
        for (const restore of restores.reverse()) restore();
        for (const card of owned) card.remove();
        owned.clear(); topPlaying.clear(); draw.remove(); discard.remove(); exhausted.remove();
    });
    return {
        take,
        canReceiveTransfer,
        receiveTransfer(card,sourceSession) {
            if(!canReceiveTransfer(card,sourceSession))return null;
            const originalData=card.storage.mengsanCard_shuying;
            adopt(card,originalData);
            return {
                gain:()=>owner.gain(card,"gain2"),
                received:()=>!released && session.active && owner.isAlive() && owned.has(card) && owner.getCards("h").includes(card),
                rollback:()=>{owned.delete(card);refresh();},
            };
        },
        async transferTo(card,recipient) {
            if(released || !session.active || !owner.isAlive() || !owned.has(card) ||
                card.storage?.mengsanExhausted_shuying || card.storage?.mengsanPowerRemoved_shuying ||
                !recipient?.canReceiveTransfer?.(card,session))return false;
            const previous={data:card.storage.mengsanCard_shuying,ownerId:card.storage.mengsanOwnerId_shuying,
                destroyed:card.destroyed,parent:card.parentNode,next:card.nextSibling};
            owned.delete(card);
            let receipt,committed=false;
            try {
                receipt=recipient.receiveTransfer(card,session);
                if(!receipt)return false;
                await receipt.gain();
                if(receipt.received()){committed=true;refresh();return true;}
                return false;
            } finally {
                if(!committed)receipt?.rollback();
                if(!committed && !released && session.active){
                    owned.add(card);card.storage.mengsanCard_shuying=previous.data;
                    card.storage.mengsanOwnerId_shuying=previous.ownerId;card.destroyed=previous.destroyed;
                    if(previous.parent)previous.parent.insertBefore(card,previous.next?.parentNode===previous.parent?previous.next:null);
                    else discard.appendChild(card);
                    refresh();
                }
            }
        },
        // 取出当前堆顶，不算抽牌、不洗牌，也不触发不足牌堆失败。
        beginTopPlay() {
            if (released || !session.active || !owner.isAlive() || !draw.firstChild) return null;
            const card = draw.firstChild;
            adopt(card); card.original = "c"; card.fix?.();
            exhausted.appendChild(card); topPlaying.add(card); refresh();
            return card;
        },
        async finishTopPlay(card) {
            if (!topPlaying.has(card)) return null;
            try {
                if (released || !session.active) return null;
                if (card.storage?.mengsanExhausted_shuying) { card.remove(); await flushIroncladExhaust(owner); return card; }
                if (owner.getCards("hej").includes(card)) {
                    const loss = owner.lose(card, exhausted); loss.type = "mengsanExhaust";
                    await loss;
                    if (released || !session.active || card.parentNode !== exhausted) return null;
                }
                // 被使用后在排序区/弃牌堆，或无法使用而仍在暂存区，均消耗原牌一次。
                if (!owned.has(card)) return null;
                recordExhaust(card); card.remove(); refresh(); await flushIroncladExhaust(owner);
                return card;
            } finally { topPlaying.delete(card); }
        },
        // Explicit exhaustion is not a discard and must not touch the public piles.
        async exhaustFromHand(card) {
            if (released || !session.active || !owner.isAlive() ||
                !owner.getCards("h").includes(card) || card.storage?.mengsanExhausted_shuying) return null;
            adopt(card);
            const loss = owner.lose(card, exhausted);
            loss.type = "mengsanExhaust";
            await loss;
            // A cancelled/redirection event must not falsely consume its original.
            if (released || !session.active || card.parentNode !== exhausted) return null;
            if (!card.storage.mengsanExhausted_shuying) {
                recordExhaust(card);
            }
            card.remove();
            refresh();
            await flushIroncladExhaust(owner);
            return card;
        },
        exhaustTotal() { return exhaustTotal; },
        exhaustedCards() { return [...owned].filter(card => card.storage?.mengsanExhausted_shuying); },
        syncExhaustSnapshots() {
            if(released || !session.active)return;
            const current=new Map([...owned].filter(card=>card.storage?.mengsanExhausted_shuying)
                .map(card=>[card.storage.mengsanCard_shuying?.id,card]));
            for(let index=0;index<battle.exhaustPile.length;index++){
                const card=current.get(battle.exhaustPile[index].id);
                if(card)battle.exhaustPile[index]=snapshot(card);
            }
            refresh();
        },
        // 自动打出不会触发抽牌、洗牌或堆顶牌不足的失败规则。
        beginAutoPlay(card, fromExhaust = false) {
            if (released || !session.active || !owned.has(card)) return false;
            if (fromExhaust) {
                if (!card.storage?.mengsanExhausted_shuying) return false;
                const id = card.storage?.mengsanCard_shuying?.id;
                const index = battle.exhaustPile.findIndex(data => data.id === id);
                if (index >= 0) battle.exhaustPile.splice(index,1);
                delete card.storage.mengsanExhausted_shuying;
                delete card._selfDestroyed;
            } else if (card.parentNode !== draw && card.parentNode !== discard) return false;
            delete card.storage.mengsanConsumed_shuying;
            card.fix?.(); exhausted.appendChild(card); refresh(); return true;
        },
        finishAutoPlay(card) {
            if (released || !session.active || !owned.has(card)) return;
            // 已由原生用牌处理过的牌保留真实去向；没有合法目标的牌进入弃牌堆。
            if (card.parentNode === exhausted && !card.storage?.mengsanExhausted_shuying &&
                !card.storage?.mengsanPowerRemoved_shuying) discard.appendChild(card);
            refresh();
        },
        drawTop() { return released || !session.active ? null : draw.firstChild; },
        drawCards() { return released || !session.active ? [] : Array.from(draw.childNodes); },
        async gainFromDraw(card) {
            if(released || !session.active || !owned.has(card) || card.parentNode!==draw)return false;
            await owner.gain(card,"gain2");refresh();return owner.getCards("h").includes(card);
        },
        async moveHandToTop(card) {
            if(released || !session.active || !owned.has(card) || !owner.getCards("h").includes(card))return false;
            await owner.lose(card,draw);
            if(released || !session.active || card.parentNode!==draw)return false;
            card.fix?.();draw.insertBefore(card,draw.firstChild);refresh();return true;
        },
        addToDraw(data,index=0) {
            if(!Number.isSafeInteger(index) || index<0)throw new RangeError("插入牌堆的位置无效");
            const card=this.addToDiscard(data);if(!card)return null;
            draw.insertBefore(card,draw.childNodes[Math.min(index,draw.childNodes.length)] || null);refresh();return card;
        },
        async gainToHand(card) {
            if (released || !session.active || !owned.has(card) || card.storage?.mengsanExhausted_shuying ||
                card.parentNode !== discard) return false;
            await owner.gain(card,"gain2"); refresh(); return owner.getCards("h").includes(card);
        },
        async returnToHand(card) {
            if(released || !session.active || !owner.isAlive() || !owned.has(card))return false;
            if(owner.getCards("h").includes(card))return true;
            if(card.storage?.mengsanExhausted_shuying){
                const id=card.storage.mengsanCard_shuying?.id;
                const index=battle.exhaustPile.findIndex(data=>data.id===id);
                if(index>=0)battle.exhaustPile.splice(index,1);
                delete card.storage.mengsanExhausted_shuying;delete card._selfDestroyed;
            }
            delete card.storage.mengsanConsumed_shuying;
            card.fix?.();await owner.gain(card,"gain2");refresh();return owner.getCards("h").includes(card);
        },
        transformHand(card, data) {
            if (released || !session.active || !owned.has(card) || !owner.getCards("h").includes(card) ||
                hasCardAffix(card,"eternal")) return false;
            card.init([data.suit,data.number,data.name,data.nature]);
            card.storage ||= {}; card.storage.mengsanCard_shuying = {...data,affixes:data.affixes.slice()};
            card.storage.mengsanOwnerId_shuying = owner.playerid;
            refresh(); return true;
        },
        // Current physical combat cards only. Exhausted originals remain in owned;
        // never add the serialized exhaust snapshots a second time.
        battleCards(playing = []) {
            if (released || !session.active) return [];
            const cards = new Set([...owner.getCards("h"), ...draw.childNodes, ...discard.childNodes, ...exhausted.childNodes]);
            for (const card of owned) {
                if (card.storage?.mengsanOwnerId_shuying === owner.playerid &&
                    card.storage?.mengsanExhausted_shuying) cards.add(card);
            }
            // The caller supplies this actor's native use-card originals, not virtual cards.
            for (const card of playing) if (ui.ordering && card?.parentNode === ui.ordering) cards.add(card);
            return [...cards];
        },
        addToDiscard(data) {
            if (released || !session.active) return null;
            if (!data || typeof data.id !== "string" || !data.id ||
                typeof data.name !== "string" || !/^[a-z][a-z0-9_]*$/.test(data.name) ||
                !["spade", "heart", "club", "diamond"].includes(data.suit) ||
                !Number.isInteger(data.number) || data.number < 1 || data.number > 13 ||
                !Array.isArray(data.affixes) || data.affixes.some(key => !Object.hasOwn(AFFIX_INFO, key))) {
                throw new TypeError("战斗生成牌数据无效");
            }
            const card = game.createCard(data.name, data.suit, data.number, data.nature);
            adopt(card, data);
            discard.appendChild(card);
            refresh();
            return card;
        },
        async addToHand(data) {
            const card = this.addToDiscard(data);
            if (!card) return null;
            await owner.gain(card,"gain2"); refresh(); return card;
        },
        // Return references only to cards currently in this actor's discard node.
        discardCards() {
            if (released || !session.active) return [];
            return Array.from(discard.childNodes).filter(card => owned.has(card) &&
                !card.storage?.mengsanExhausted_shuying);
        },
        moveDiscardToTop(card) {
            if (released || !session.active || !owned.has(card) ||
                card.parentNode !== discard || card.storage?.mengsanExhausted_shuying) return false;
            card.fix?.();
            draw.insertBefore(card, draw.firstChild);
            refresh();
            return true;
        },
        addAffix(card, key) {
            if (released || !Object.hasOwn(AFFIX_INFO, key) || !owned.has(card) || !owner.getCards("h").includes(card)) return false;
            const affixes = card.storage?.mengsanCard_shuying?.affixes;
            if (!Array.isArray(affixes) || affixes.includes(key)) return false;
            affixes.push(key);
            card.addGaintag(AFFIX_INFO[key].name);
            refresh();
            return true;
        },
        // Engine/mod opening draws must not stack with the mode's four-card opening hand.
        resetOpeningHand() {
            for (const card of owner.getCards("h")) {
                if (owned.has(card)) draw.insertBefore(card, draw.firstChild);
                else card.remove();
            }
            refresh();
        },
        trimOpeningHand(limit = 4) {
            for (const card of owner.getCards("h").filter(card => !card.storage?.mengsanCard_shuying?.affixes?.includes("innate") &&
                !env.lib?.card?.[card.name]?.mengsanInnate_shuying?.(card)).slice(limit)) {
                if (owned.has(card)) draw.insertBefore(card, draw.firstChild);
                else card.remove();
            }
            refresh();
        },
        drawInnate() {
            const cards = Array.from(draw.childNodes).filter(card =>
                (card.storage?.mengsanCard_shuying?.affixes?.includes("innate") ||
                    env.lib?.card?.[card.name]?.mengsanInnate_shuying?.(card)) && !owner.getCards("h").includes(card));
            if (cards.length) owner.directgain(cards);
            refresh();
            return cards;
        },
        withOwner(callback) { const before = forcedOwner; forcedOwner = true; try { return callback(); } finally { forcedOwner = before; } },
    };
}
