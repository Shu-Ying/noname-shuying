export function createHandAdapter(player, ui) {
  const zones = [player.node?.handcards1, player.node?.handcards2]
    .filter(Boolean);
  const containers = [ui.handcards1Container, ui.handcards2Container];
  const root = ui.me;
  const cards = () => zones.flatMap(zone => Array.from(zone.children)
    .filter(card => card.classList.contains("card") &&
      !card.classList.contains("removing")));
  const supported = () => Boolean(root?.isConnected && ui.me === root &&
    zones.length === 2 &&
    zones.every((zone, index) =>
      containers[index] === ui[index === 0 ?
        "handcards1Container" : "handcards2Container"] &&
      zone.parentNode === containers[index] &&
      (zone.isConnected ? root.contains(zone) :
        index === 1 && zone.childElementCount === 0) &&
      Array.from(zone.children).every(node =>
        node.classList.contains("card"))));
  return { root, zones, containers, cards, supported };
}
