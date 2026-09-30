export const isDialogueLineVisible = (line, run) => !line.when || run?.storyFlags?.[line.when.flag] === line.when.equals;

export const applyDialogueChoice = (run, line, choiceId) => {
    const choice = line.choices?.find(item => item.id === choiceId);
    if (!choice || !run || !/^story\.[\w.]+$/.test(line.flag || "")) throw new Error("梦三剧情发言选项无效");
    run.storyFlags ||= {};
    run.storyFlags[line.flag] = choice.id;
    return choice.text;
};

export const applySkippedDialogueChoices = (lines, startIndex, run) => {
    for (let index = startIndex; index < lines.length; index++) {
        const line = lines[index];
        if (!isDialogueLineVisible(line, run) || line.type !== "choice") continue;
        applyDialogueChoice(run, line, line.defaultChoice || line.choices[0].id);
    }
};
