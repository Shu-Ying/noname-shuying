import { heldRelics } from "./definitions.js";

export const restRecovery = run => 8 + heldRelics(run)
    .filter(relic => relic.effect === "restHeal")
    .reduce((sum, relic) => sum + relic.amount, 0);

export function applyRoomRelics(run, node, action) {
    const resting = node.type === "rest" && action === "heal";
    if (node.type !== "shop" && !resting) return null;
    const receipt = `${node.type}:${node.id}`;
    const receipts = run.player.relicRoomReceipts || [];
    if (receipts.includes(receipt)) return null;
    const effect = resting ? "restHeal" : "shopHeal";
    const relics = heldRelics(run).filter(relic => relic.effect === effect);
    const amount = (resting ? 8 : 0) + relics.reduce((sum, relic) =>
        sum + relic.amount, 0);
    if (!amount) return null;
    const before = run.player.hp;
    run.player.hp = Math.min(run.player.maxHp, before + amount);
    run.player.relicRoomReceipts = [...receipts, receipt];
    return { recovered: run.player.hp - before, relics };
}
