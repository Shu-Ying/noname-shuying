import { meetBond } from "../bonds/state.js";

export const getAvailableStoryChoices = (run, content) => {
    const flags = run.storyFlags || {};
    return (content?.choices || []).filter(choice => {
        return (choice.requires || []).every(flag => Boolean(flags[flag]))
            && (choice.excludes || []).every(flag => !flags[flag]);
    });
};

export const applyStoryOutcome = (run, outcome = {}) => {
    if (!run.storyFlags) run.storyFlags = {};
    Object.assign(run.storyFlags, outcome.flags || {});
    for (const bond of outcome.bonds || []) {
        meetBond(run, typeof bond === "string" ? bond : bond.id,
            typeof bond === "string" ? 1 : bond.level ?? 1);
    }
    return outcome;
};
