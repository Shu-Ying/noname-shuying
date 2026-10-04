// 纯数据汇总入口：角色效果运行时不参与注册、费用和强化模块的导入。
import { liubeiDefinitions, liubeiCosts, liubeiUpgradeRules } from "./liubei/metadata.js";
import { sharedCards } from "./shared/data.js";
const sharedDefinitions=sharedCards.map(card=>({name:card.name,category:card.category,
    cardType:card.cardType,rarity:card.rarity,
    owner:null,deck:card.pack,generatedOnly:card.pack==="status"&&card.id!=="deprecated_card"}));
export const cardPackDefinitions=Object.freeze([...liubeiDefinitions,...sharedDefinitions]);
export const cardPackCosts=Object.freeze({...liubeiCosts,...Object.fromEntries(sharedCards.map(card=>[card.name,card.cost]))});
export const cardPackUpgradeRules=Object.freeze({...liubeiUpgradeRules,
    ...Object.fromEntries(sharedCards.filter(card=>card.upgraded).map(card=>[card.name,Object.freeze({maxLevel:1,...card.upgraded})]))});
