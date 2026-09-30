export function mountEnergy(player, session, document) {
    const badge = document.createElement("div");
    badge.className = "mengsan-energy-shuying";
    const refresh = () => {
        const current = player.storage.mengsanEnergy_shuying;
        const maximum = player.storage.mengsanMaxEnergy_shuying;
        badge.textContent = `费用 ${current}/${maximum}`;
    };
    player.appendChild(badge);
    session.ownResource(badge, () => badge.remove());
    refresh();
    return refresh;
}
