import { colorlessCards } from "./data.js";
import { eventCards } from "../event/data.js";
import { curseCards } from "../curse/data.js";
export const colorlessRewards = Object.freeze(Object.fromEntries([...colorlessCards,...eventCards,...curseCards].map(card=>[
    `shared.reward.card.${card.name}`,{card:{name:card.name},name:`获得一张【${card.title}】`,description:card.description}
])));
// 事件与诅咒只供明确指定的剧情/奖励调用，不混入普通奖励和无色生成池。
export const colorlessRewardIds = Object.freeze(colorlessCards.map(card=>`shared.reward.card.${card.name}`));
