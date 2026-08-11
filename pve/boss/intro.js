import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const characterIntros = mergeBossSection("武将介绍", bossSets, "characterIntro");

export default characterIntros;
