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
    return outcome;
};
