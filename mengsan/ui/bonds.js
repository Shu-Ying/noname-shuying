import { bondDefinitions, getBondCombat, getBondDeck }
    from "../bonds/definitions.js";
import { getBondIntents } from "../bonds/intents.js";
import { bondProbability, ensureBonds, selectBond } from "../bonds/state.js";
import { getDiagnostics } from "../../diagnostics/index.js";

export function renderBonds(parent, run, saveRun, onBusy = () => {}) {
    const bonds = ensureBonds(run);
    const root = document.createElement("div");
    root.className = "mengsan-bonds-shuying";
    parent.appendChild(root);
    const text = (tag, content, target = root) => {
        const node = document.createElement(tag);
        node.textContent = content;
        target.appendChild(node);
        return node;
    };
    const status = text("p", "");
    status.setAttribute("role", "status");
    const buttons = [];
    let saving = false;
    const choose = async id => {
        if (saving) return;
        saving = true;
        onBusy(true);
        const previous = bonds.selected;
        for (const button of buttons) button.disabled = true;
        status.textContent = "正在保存助战选择…";
        try {
            selectBond(run, id);
            await saveRun(run);
            const updated = renderBonds(parent, run, saveRun, onBusy);
            root.replaceWith(updated);
            updated.querySelector('button[aria-pressed="true"]')
                ?.focus({ preventScroll: true });
        } catch (error) {
            getDiagnostics().scope("mengsan.bonds").error("selection.save.failed", error,
                { runId: run.runId, revision: run.revision, bondId: id });
            selectBond(run, previous);
            status.textContent = "保存失败，请重试。";
            console.error("梦三助战选择保存失败", error);
            for (const button of buttons) button.disabled = false;
        } finally {
            saving = false;
            onBusy(false);
        }
    };
    const clear = text("button", "不指定助战");
    clear.type = "button";
    clear.setAttribute("aria-pressed", String(bonds.selected === null));
    clear.addEventListener("click", () => choose(null));
    buttons.push(clear);
    if (!Object.keys(bonds.npcs).length) text("p", "尚未结识羁绊 NPC。");
    for (const [id, npc] of Object.entries(bonds.npcs)) {
        const definition = bondDefinitions[id];
        if (!definition) continue;
        const card = document.createElement("section");
        card.className = "mengsan-bond-card-shuying";
        root.appendChild(card);
        text("h3", definition.name, card);
        const combat = getBondCombat(id, npc.level);
        const ready = Boolean(combat);
        const state = npc.down ? "濒死 · 等待救助" :
            ready ? "可助战" : "战斗配置待补";
        text("p", `${state}${npc.down && !ready ?
            " · 战斗配置待补" : ""}`, card);
        text("p", `羁绊 ${npc.level} 级 · 助战概率 ${
            (bondProbability(npc.level) * 100).toFixed(2)}%`, card);
        const progress = text("progress", "", card);
        progress.max = 100;
        progress.value = npc.level === 10 ? 100 : npc.progress;
        progress.setAttribute("aria-label", `${definition.name}升级进度`);
        text("p", npc.level === 10 ? "羁绊已满级" :
            `升级进度 ${npc.progress}% / 100%`, card);
        const button = text("button", bonds.selected === id ?
            "已指定（按概率到场）" : "指定助战", card);
        button.type = "button";
        button.setAttribute("aria-pressed", String(bonds.selected === id));
        button.addEventListener("click", () => choose(id));
        buttons.push(button);
        text("p", combat ? `生命 ${combat.maxHp} · 初始手牌 ${combat.hand}` :
            "生命、初始手牌及技能等待配置。", card);
        if (combat) text("p", `每回合摸 ${combat.draw} 张 · 手牌上限 ${combat.handLimit} · 每回合费用 ${combat.energy}`, card);
        text("p", `独立牌库 ${getBondDeck(definition).length} 张 · 意图 ${
            getBondIntents(definition).map(move => move.name).join(" → ")}`,
            card);
        if (npc.down) {
            const rescue = text("button", "救助道具待补充", card);
            rescue.type = "button";
            rescue.disabled = true;
        }
    }
    text("p", "指定助战后，每场按当前等级概率判定到场；濒死或本等级未配置完整时无法上场。角色专属首战不触发助战，也不累计羁绊成长。");
    text("p", "其余战斗完成结算：到场 +50%，未到场 +25%。");
    return root;
}
