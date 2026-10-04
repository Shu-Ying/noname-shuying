import { liubeiRewards, liubeiRewardIds } from "./liubei/rewards.js";
import { colorlessRewards, colorlessRewardIds } from "./colorless/rewards.js";
export const cardPackRewards = Object.freeze({...liubeiRewards,...colorlessRewards});
export const cardPackRewardIds = Object.freeze([...liubeiRewardIds,...colorlessRewardIds]);
