import { colorlessCards } from "../colorless/data.js";
import { eventCards } from "../event/data.js";
import { statusCards } from "../status/data.js";
import { curseCards } from "../curse/data.js";
export const sharedCards = Object.freeze([...colorlessCards,...eventCards,...statusCards,...curseCards]);
export const sharedByName = Object.freeze(Object.fromEntries(sharedCards.map(c=>[c.name,c])));
