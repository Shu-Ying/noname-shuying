import { mountMenu } from "./navigation.js";
import { ui, get } from "../../../../noname.js";
import { isDialogueLineVisible, applyDialogueChoice, applySkippedDialogueChoices } from "../progression/dialogue-choice.js";

const TYPE_NAMES = {
    character: "角色",
    narrator: "旁白",
    sound: "音效",
    choice: "选择发言",
};


const resolveCharacter = (character, run) => character == "$player" ? run?.player?.character : character;

const resolveSpeaker = (line, character) => {
    if (line.speaker == "$player") return character ? get.translation(character) : "你";
    if (line.speaker) return line.speaker;
    if (line.type == "character" && character) return get.translation(character);
    return TYPE_NAMES[line.type] || "旁白";
};

export const splitDialogueText = text => Array.from(String(text || ""));

export const playDialogue = (lines, options = {}) => new Promise(resolve => {
    if (!Array.isArray(lines) || !lines.length) {
        resolve();
        return;
    }

    const overlay = ui.create.div(".mengsan-dialogue-overlay-shuying", ui.window);
    const stage = ui.create.div(".mengsan-dialogue-stage-shuying", overlay);
    ui.create.div(".mengsan-dialogue-chapter-shuying", options.title || "剧情", stage);
    const textBox = ui.create.div(".mengsan-dialogue-box-shuying", stage);
    const portraitFrame = ui.create.div(
        ".mengsan-dialogue-portrait-frame-shuying", textBox);
    const speaker = ui.create.div(".mengsan-dialogue-speaker-shuying", textBox);
    const text = ui.create.div(".mengsan-dialogue-text-shuying", textBox);
    const progress = ui.create.div(".mengsan-dialogue-progress-shuying", textBox);
    const indicator = ui.create.div(".mengsan-dialogue-indicator-shuying", "◆", textBox);
    const choices = ui.create.div(".mengsan-dialogue-choices-shuying", stage);
    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.className = "mengsan-dialogue-skip-shuying";
    skipButton.textContent = "跳过对话";
    skipButton.setAttribute("aria-label", "跳过对话，未选择的发言使用默认选项");
    stage.appendChild(skipButton);

    let lineIndex = -1;
    let timer = null;
    let typing = false;
    let paused = false;
    let currentSpeed = 28;
    let characters = [];
    let characterIndex = 0;
    let currentLine = null;
    let awaitingChoice = false;
    const portrait = ui.create.div(".mengsan-dialogue-portrait-shuying", portraitFrame);
    const reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const stopTimer = () => {
        if (timer != null) clearTimeout(timer);
        timer = null;
    };

    const finishTyping = () => {
        stopTimer();
        text.textContent = characters.join("");
        characterIndex = characters.length;
        typing = false;
        if (currentLine?.type === "choice" && awaitingChoice) showChoices(currentLine);
        else indicator.classList.add("visible");
    };

    function showChoices(line) {
        choices.replaceChildren();
        for (const item of line.choices) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "mengsan-dialogue-choice-shuying";
            button.textContent = item.text;
            button.addEventListener("click", event => {
                event.stopPropagation();
                if (!awaitingChoice) return;
                text.textContent = applyDialogueChoice(options.run, line, item.id);
                awaitingChoice = false;
                choices.replaceChildren();
                speaker.textContent = get.translation(options.run.player.character);
                stage.dataset.lineType = "character";
                const character = options.run.player.character;
                portraitFrame.classList.add("visible");
                portrait.setBackground(character, "character");
                indicator.classList.add("visible");
                textBox.focus();
            });
            choices.appendChild(button);
        }
        choices.querySelector("button")?.focus();
    }

    const scheduleCharacter = speed => {
        if (!typing || paused) return;
        text.textContent += characters[characterIndex++];
        if (characterIndex >= characters.length) {
            finishTyping();
            return;
        }
        timer = setTimeout(() => scheduleCharacter(speed), speed);
    };

    const close = () => {
        stopTimer();
        skipButton.removeEventListener("click", handleSkip);
        textBox.removeEventListener("click", handleClick);
        textBox.removeEventListener("keydown", handleKeydown);
        choices.replaceChildren();
        overlay.remove();
        resolve();
    };

    const showNextLine = () => {
        do { lineIndex++; } while (lineIndex < lines.length && !isDialogueLineVisible(lines[lineIndex], options.run));
        if (lineIndex >= lines.length) {
            close();
            return;
        }

        const line = lines[lineIndex];
        currentLine = line;
        awaitingChoice = line.type === "choice";
        choices.replaceChildren();
        const lineType = TYPE_NAMES[line.type] ? line.type : "narrator";
        const character = resolveCharacter(line.character, options.run);
        stage.dataset.lineType = lineType;
        speaker.textContent = resolveSpeaker(line, character);
        progress.textContent = `${lineIndex + 1} / ${lines.length}`;
        indicator.classList.remove("visible");

        if (lineType == "character" && character) {
            portraitFrame.classList.add("visible");
            portrait.setBackground(character, "character");
            portrait.setAttribute("aria-label", `${speaker.textContent}立绘`);
        }
        else {
            portraitFrame.classList.remove("visible");
            portrait.removeAttribute("aria-label");
        }

        characters = splitDialogueText(line.text);
        characterIndex = 0;
        text.textContent = "";
        typing = characters.length > 0;
        const speed = Number.isFinite(line.speed) ? Math.max(0, line.speed) : 28;
        currentSpeed = speed;
        if (!typing || reduceMotion || speed == 0) finishTyping();
        else scheduleCharacter(speed);
    };

    function handleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        if (paused) return;
        if (typing) finishTyping();
        else if (awaitingChoice) return;
        else showNextLine();
    }

    function handleKeydown(event) {
        if (event.key == "Enter" || event.key == " ") handleClick(event);
    }

    function handleSkip(event) {
        event.preventDefault();
        event.stopPropagation();
        if (paused) return;
        applySkippedDialogueChoices(lines, lineIndex + (awaitingChoice ? 0 : 1), options.run);
        close();
    }

    textBox.setAttribute("role", "button");
    textBox.setAttribute("tabindex", "0");
    textBox.setAttribute("aria-label", "剧情文本：点击补全文字或继续");
    textBox.addEventListener("click", handleClick);
    textBox.addEventListener("keydown", handleKeydown);
    skipButton.addEventListener("click", handleSkip);
    mountMenu(overlay, {
        onOpen() { paused = true; stopTimer(); },
        onClose() { paused = false; if (typing) scheduleCharacter(currentSpeed); },
    });
    const help = ui.create.div(".mengsan-dialogue-help-shuying", stage);
    help.textContent = "点击补全文字 · 再次点击继续 · Enter / 空格";
    showNextLine();
    textBox.focus();
});
