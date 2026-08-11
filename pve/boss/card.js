import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const cards = mergeBossSection("卡牌", bossSets, "card");

export default cards;
