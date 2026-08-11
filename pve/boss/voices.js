import bossSets from "./sets.js";
import { mergeBossSection } from "./merge.js";

const voices = mergeBossSection("语音台词", bossSets, "voices");

export default voices;
