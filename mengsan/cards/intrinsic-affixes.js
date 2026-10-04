import { sharedByName } from "./packs/shared/data.js";
import { cardUpgradeLevel } from "./upgrades.js";
const keys = Object.freeze({ethereal:"void",retain:"retain",unplayable:"unplayable",eternal:"eternal",innate:"innate",exhaust:"exhaust"});
export function cardAffixes(card) {
    if (card?.cards?.length === 1 && card.cards[0]?.name === card.name) card=card.cards[0];
    const data=card?.storage?.mengsanCard_shuying || card || {};
    const spec=sharedByName[card?.name], r=spec && (cardUpgradeLevel(card) && spec.upgraded ? spec.upgraded : spec.base);
    const result=new Set(Array.isArray(data.affixes) ? data.affixes : []);
    if(r) for(const [flag,key] of Object.entries(keys)) if(r[flag])result.add(key);
    return [...result];
}
export const hasCardAffix = (card,key) => cardAffixes(card).includes(key);
