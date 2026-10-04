// Enemy-only growth; ordinary player upgrades never use this field.
export const WITHER_CARD="mengsan_status_wither";
export const MAX_WITHER_LEVEL=Math.floor((Number.MAX_SAFE_INTEGER-3)/3);
export function witherDamage(card) {
    const data=card?.storage?.mengsanCard_shuying||card,level=data?.witherLevel??0;
    if(!Number.isSafeInteger(level)||level<0||level>MAX_WITHER_LEVEL)throw new RangeError("凋萎层数无效");
    return 3+3*level;
}
export function growEnemyWither(card,amount=1) {
    const data=card?.storage?.mengsanCard_shuying||card;
    if(data?.name!==WITHER_CARD||!Number.isSafeInteger(amount)||amount<1)throw new TypeError("凋萎增长参数无效");
    const next=(witherDamage(data)-3)/3+amount;
    if(!Number.isSafeInteger(next)||next>MAX_WITHER_LEVEL)throw new RangeError("凋萎层数越界");
    data.witherLevel=next;return next;
}
