// Display-only readers. Entries belong to a battle session, never to the run/save.
const sources = new WeakMap();

export function bindCombatStatusSource(player, session, id, read) {
    if (!player || !session?.active || typeof read !== 'function') return;
    let group = sources.get(player);
    if (!group) sources.set(player, group = new Map());
    const entry = { session, read };
    group.set(id, entry);
    session.ownResource(entry, () => {
        if (group.get(id) !== entry) return;
        group.delete(id);
        if (!group.size && sources.get(player) === group) sources.delete(player);
    });
}

export function readCombatStatusSources(player, session) {
    if (!session?.active) return [];
    const result = [];
    for (const [id, entry] of sources.get(player) || []) {
        if (entry.session !== session) continue;
        const state = entry.read();
        if (state) result.push({ id, state });
    }
    return result;
}
