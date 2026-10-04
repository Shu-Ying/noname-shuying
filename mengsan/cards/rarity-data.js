// 卡面与机制读取同一注册表；未来职业在各自 metadata 中填写 rarity。
import { cardDefinitions } from "./card-definitions.js";
export const cardRarities = Object.freeze({
    ...Object.fromEntries(Object.values(cardDefinitions).map(card => [card.name, card.rarity])),
    mengsan_dazed_shuying: "status", mengsan_slimed_shuying: "status",
    mengsan_infection_shuying: "status", mengsan_wound_shuying: "status",
});
