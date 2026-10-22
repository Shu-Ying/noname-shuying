import { collectCombatStatuses } from './status-model.js';
import { createOverlayLayout } from './overlays.js';

// Native cards, players and controls stay under their original parents.
export function mountBattleHUD(player, battle, env) {
    const { ui, get, _status, document, window, assetBase } = env;
    const arena = ui.arena;
    if (!arena || !ui.me || !ui.control || !battle.session.active) throw new Error('梦三 HUD 缺少原生界面容器');
    const handRoot = ui.me, controlRoot = ui.control;
    const overlays = createOverlayLayout(arena, handRoot, ui, player);
    const restores = [], styled = new WeakMap(), hiddenMarks = new Set();
    let disposed = false, frozen = false, frame = null, dialog = null, previousFocus = null, resize, observer;
    const ownClass = (node, name) => {
        if (!node || node.classList.contains(name)) return;
        node.classList.add(name); restores.push(() => node.classList.remove(name));
    };
    const style = (node, key, value) => {
        let values = styled.get(node);
        if (!values) styled.set(node, values = new Map());
        if (!values.has(key)) {
            const old = node.style.getPropertyValue(key), priority = node.style.getPropertyPriority(key);
            const record = { last: null }; values.set(key, record);
            restores.push(() => {
                if (node.style.getPropertyValue(key) !== record.last) return;
                if (old) node.style.setProperty(key, old, priority); else node.style.removeProperty(key);
            });
        }
        const record = values.get(key);
        if (record.requested !== value || node.style.getPropertyValue(key) !== record.last) {
            node.style.setProperty(key, value, 'important');
            record.requested = value;
            // CSSOM rounds long decimal pixel values; compare the actual stored value on release.
            record.last = node.style.getPropertyValue(key);
        }
    };
    const text = (node, value) => { if (node.textContent !== String(value)) node.textContent = String(value); };
    const create = (tag, className, parent, label) => {
        const node = document.createElement(tag); node.className = className;
        if (label != null) node.textContent = label;
        if (tag === 'button') node.type = 'button';
        parent?.appendChild(node); return node;
    };
    const plain = value => String(value || '').replace(/<[^>]*>/g, '');
    const nameOf = target => plain(get.translation(target.name || target.playerid || '角色'));
    const root = create('section', 'mengsan-hud-shuying', arena);
    root.setAttribute('aria-label', '梦三战斗操作区');
    const info = create('div', 'mengsan-hud-info-shuying', root);
    const name = create('strong', 'mengsan-hud-name-shuying', info, nameOf(player));
    const hp = create('span', 'mengsan-hud-hp-shuying', info);
    const healthTrack = create('div', 'mengsan-hud-health-track-shuying', info);
    healthTrack.setAttribute('aria-hidden', 'true');
    const healthFill = create('span', '', healthTrack);
    const block = create('span', 'mengsan-hud-block-shuying', info), energy = create('strong', 'mengsan-hud-energy-shuying', info);
    const center = create('div', 'mengsan-hud-center-shuying', root);
    const statuses = create('div', 'mengsan-hud-statuses-shuying', center);
    statuses.setAttribute('aria-label', '玩家当前状态');
    const link = create('link', '', null); link.rel = 'stylesheet'; link.href = `${assetBase}/ui/hud/style.css`;
    const closeDialog = () => {
        if (!dialog) return;
        const current = dialog; dialog = null;
        if (current.open) current.close(); current.remove();
        if (previousFocus?.isConnected) previousFocus.focus();
    };
    const openDetails = target => {
        if (disposed || !battle.session.active) return;
        closeDialog(); previousFocus = document.activeElement;
        dialog = create('dialog', 'mengsan-hud-dialog-shuying', document.body);
        const current = dialog;
        create('h2', '', dialog, `${nameOf(target)} · 当前状态`);
        const close = create('button', 'mengsan-hud-dialog-close-shuying', dialog, '关闭'); close.addEventListener('click', closeDialog);
        const entries = collectCombatStatuses(target, battle);
        for (const entry of entries) {
            const row = create('section', 'mengsan-hud-detail-row-shuying', dialog);
            create('strong', '', row, `${entry.name}${entry.value == null ? '' : ` ${entry.value}${entry.unit ? ` ${entry.unit}` : ''}`}`);
            create('p', '', row, entry.detail);
        }
        if (!entries.length) create('p', '', dialog, '暂无已登记状态。');
        // Unknown/native marks retain their engine intro and are never hidden by the HUD.
        dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
        dialog.addEventListener('close', () => { if (dialog === current) closeDialog(); });
        for (const type of ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend', 'keydown']) dialog.addEventListener(type, event => event.stopPropagation());
        dialog.showModal(); close.focus();
    };
    let statusSignature = null;
    function renderStatuses() {
        const entries = collectCombatStatuses(player, battle);
        const columns = layout === 'narrow' ? 1 : 2;
        const rows = Math.max(1, Math.floor((statuses.clientHeight || 80) / 38));
        const maximum = Math.max(0, columns * rows - (entries.length > columns * rows ? 1 : 0));
        const signature = JSON.stringify([maximum, entries]);
        if (signature !== statusSignature) {
            statusSignature = signature; statuses.replaceChildren();
            center.hidden = entries.length === 0;
            for (const entry of entries.slice(0, maximum)) {
                const button = create('button', 'mengsan-hud-status-shuying', statuses);
                button.setAttribute('aria-label', `${entry.name} ${entry.value ?? ''} ${entry.unit}，查看状态详情`);
                if (entry.icon) {
                    const image = create('img', '', button); image.src = `${assetBase}/assets/status/${entry.icon}`; image.alt = '';
                    image.addEventListener('error', () => image.remove(), { once: true });
                }
                create('span', '', button, entry.name);
                if (entry.value != null) create('b', '', button, entry.value);
                button.addEventListener('click', () => openDetails(player));
            }
            if (entries.length > maximum) {
                const more = create('button', 'mengsan-hud-status-shuying', statuses, `+${entries.length - maximum}`);
                more.setAttribute('aria-label', '查看全部状态'); more.addEventListener('click', () => openDetails(player));
            }
        }
        const wanted = new Set();
        for (const target of [player]) {
            for (const entry of collectCombatStatuses(target, battle)) {
                for (const skill of entry.markSkills) {
                    const mark = target.marks?.[skill]; if (mark?.classList) wanted.add(mark);
                }
            }
        }
        for (const mark of hiddenMarks) if (!wanted.has(mark)) { mark.classList.remove('mengsan-hud-represented-mark-shuying'); hiddenMarks.delete(mark); }
        for (const mark of wanted) if (!mark.classList.contains('mengsan-hud-represented-mark-shuying')) { mark.classList.add('mengsan-hud-represented-mark-shuying'); hiddenMarks.add(mark); }
    }
    let layout = null;
    const hudHeightFor = () => layout === 'short' ? 188 : layout === 'narrow' ? 288 : 274;
    const oldLayout = arena.getAttribute('data-mengsan-hud-layout');
    restores.push(() => {
        if (arena.getAttribute('data-mengsan-hud-layout') !== layout) return;
        if (oldLayout === null) arena.removeAttribute('data-mengsan-hud-layout'); else arena.setAttribute('data-mengsan-hud-layout', oldLayout);
    });
    function skinActor(target) {
        // Decade nests these in camp/hp wraps; direct-child .hp/.name selectors miss them.
        for (const key of ['campWrap', 'hpWrap', 'hp', 'identity', 'framebg', 'count', 'name', 'name2', 'nameol']) {
            ownClass(target.node?.[key], 'mengsan-hud-replaced-node-shuying');
        }
        ownClass(target.node?.avatar, 'mengsan-hud-portrait-shuying');
        ownClass(target.node?.equips, 'mengsan-hud-equips-shuying');
        if (target === player) ownClass(target.node?.equips, 'mengsan-hud-self-equips-shuying');
    }
    function syncActors() {
        const width = arena.clientWidth, height = arena.clientHeight;
        const narrow = width <= 600 && height >= 480;
        const short = height <= 500 && !narrow;
        layout = short ? 'short' : narrow ? 'narrow' : 'wide';
        if (arena.getAttribute('data-mengsan-hud-layout') !== layout) arena.setAttribute('data-mengsan-hud-layout', layout);
        const hudHeight = hudHeightFor();
        style(arena, '--mengsan-hud-height', `${hudHeight}px`);
        const large = width >= 1000;
        style(arena, '--mengsan-hud-left', short ? '216px' : narrow ? '116px' : large ? '352px' : '292px');
        style(arena, '--mengsan-hud-right', short ? '132px' : narrow ? '116px' : '184px');
        style(arena, '--mengsan-profile-info-left', short ? '108px' : narrow ? '22px' : large ? '200px' : '160px');
        style(arena, '--mengsan-profile-width', short ? '172px' : narrow ? '76px' : large ? '200px' : '130px');
        skinActor(player);
        // Inline important dimensions also beat skins with #arena > .player !important rules.
        const selfBottom = narrow ? 180 : 24;
        const selfHeight = short || narrow ? 104 : large ? 196 : 148;
        const infoTop = narrow ? hudHeight - selfBottom + 16 : hudHeight - selfBottom - selfHeight + (short ? 0 : 20);
        style(arena, '--mengsan-profile-info-top', `${infoTop}px`);
        for (const [key, value] of Object.entries({left: short ? '24px' : narrow ? '22px' : '40px', right:'auto', top:'auto',
            bottom:`${selfBottom}px`, width:short ? '76px' : narrow ? '76px' : large ? '144px' : '104px',
            height:`${selfHeight}px`, transform:'none'})) style(player, key, value);
        style(arena, '--mengsan-side-dock-bottom', `${selfBottom + selfHeight + 12}px`);
        style(arena, '--mengsan-relic-dock-bottom', `${selfBottom + selfHeight + (narrow ? -4 : 12)}px`);
        style(arena, '--mengsan-skill-ceiling', `${Math.min(hudHeight - 36, selfBottom + selfHeight)}px`);
        style(arena, '--mengsan-status-height', short ? '52px' : narrow ? '84px' : '160px');
    }
    function syncExternalEquipment() {
        const equips = player.node?.equips;
        if (!equips?.isConnected || equips.parentNode === player) return;
        // An optional skin can keep the same real equipment nodes in a separate arena wrapper.
        ownClass(ui.equipSolts, 'mengsan-hud-equip-host-shuying');
        const host = equips.offsetParent || arena, h = host.getBoundingClientRect(), a = arena.getBoundingClientRect(), p = player.getBoundingClientRect();
        const sx = h.width / host.offsetWidth || 1, sy = h.height / host.offsetHeight || sx;
        const arenaScale = a.width / arena.clientWidth || 1;
        const width = Math.max(0, p.width - 12 * arenaScale);
        const equipHeight = Math.min(100 * arenaScale, p.height * .58);
        for (const [key, value] of Object.entries({position:'absolute',left:`${(p.left + 6 * arenaScale - h.left) / sx}px`,right:'auto',bottom:'auto',
            top:`${(p.bottom - 6 * arenaScale - equipHeight - h.top) / sy}px`,width:`${width / sx}px`,height:`${equipHeight / sy}px`,'max-height':`${equipHeight / sy}px`})) style(equips, key, value);
    }
    function placeControl(node, bottom, maxHeight) {
        ownClass(node, 'mengsan-hud-external-control-shuying');
        const host = node.offsetParent || arena, a = arena.getBoundingClientRect(), h = host.getBoundingClientRect();
        const scale = h.width / host.offsetWidth || 1, arenaScale = a.width / arena.clientWidth || 1;
        const rail = layout === 'wide' ? 142 : layout === 'short' ? 112 : 96;
        for (const [key, value] of Object.entries({position:'absolute',left:'auto',top:'auto',transform:'none',
            right:`${(h.right - a.right + (layout === 'wide' ? 24 : 16) * arenaScale) / scale}px`, bottom:`${(h.bottom - a.bottom + bottom * arenaScale) / scale}px`,
            width:`${rail * arenaScale / scale}px`, 'max-height':`${maxHeight * arenaScale / scale}px`})) style(node, key, value);
    }
    function syncControls() {
        // The actual action controls stay horizontal above the hand; skill references get their own rail.
        const candidates = [...new Set([ui.skills, ui.skills2, ui.skills3, ui.skillControl, ui.gskillControl])]
            .filter(node => node?.isConnected && node !== ui.control);
        const external = candidates.filter(node => !candidates.some(other => other !== node && other.contains(node)));
        const hudHeight = hudHeightFor();
        const rail = layout === 'wide' ? 142 : layout === 'short' ? 112 : 96;
        const actionBottom = layout === 'narrow' ? hudHeight - 48 : hudHeight + 8;
        const compactActions = arena.clientWidth < 1000;
        for (const [key,value] of Object.entries({position:'absolute',left:compactActions?'16px':'var(--mengsan-hud-left)',right:compactActions?'16px':'var(--mengsan-hud-right)',top:'auto',bottom:`${actionBottom}px`,width:'auto','max-height':'none',transform:'none'})) style(ui.control,key,value);
        for (const group of ui.control.children) if (group.classList.contains('control')) {
            if (external.includes(group)) {
                ownClass(group,'mengsan-hud-native-skills-shuying');
                for (const button of group.children) if (button.tagName === 'DIV') style(button, 'margin', '0px');
                continue;
            }
            for (const [key, value] of Object.entries({position:'relative',left:'auto',right:'auto',top:'auto',bottom:'auto',transform:'none'})) style(group, key, value);
        }
        let bottom = 20;
        const ceiling = parseFloat(arena.style.getPropertyValue('--mengsan-skill-ceiling'));
        external.forEach((node, index) => {
            if (node === ui.skillControl || node === ui.gskillControl) ownClass(node, 'mengsan-hud-skin-skills-shuying');
            placeControl(node, bottom, Math.max(24, (ceiling - bottom - 6 * (external.length - index - 1)) / (external.length - index)));
            bottom += node.offsetHeight + 6;
        });
        for (const node of [ui.confirm,_status.event?.endButton]) {
            if (!node?.isConnected || ui.control.contains(node)) continue;
            ownClass(node,'mengsan-hud-external-action-shuying');
            const host=node.offsetParent||arena,a=arena.getBoundingClientRect(),h=host.getBoundingClientRect();
            const scale=h.width/host.offsetWidth||1,zoom=a.width/arena.clientWidth||1;
            const center=(parseFloat(arena.style.getPropertyValue('--mengsan-hud-left'))+arena.clientWidth-parseFloat(arena.style.getPropertyValue('--mengsan-hud-right')))/2;
            const side=node===ui.confirm?-1:1;
            for(const [key,value] of Object.entries({position:'absolute',left:`${(a.left+center*zoom-h.left)/scale+side*80}px`,right:'auto',top:'auto',bottom:`${(h.bottom-a.bottom+actionBottom*zoom)/scale}px`,width:`${Math.min(rail,140)}px`,transform:'translateX(-50%)'}))style(node,key,value);
        }
    }
    function syncNotifications() {
        const maxTop = arena.clientHeight - hudHeightFor() - 48;
        // Decade positions string popups at player.top + 80, which now intersects our footer.
        for (const popup of arena.querySelectorAll(':scope > .damage.skill-popup')) {
            if(!popup.classList.contains('mengsan-hud-notification-shuying') &&
                (Math.abs(popup.offsetLeft-player.offsetLeft)>1 || Math.abs(popup.offsetTop-player.offsetTop-80)>1))continue;
            ownClass(popup, 'mengsan-hud-notification-shuying');
            if (popup.offsetTop > maxTop) style(popup, 'top', `${Math.max(0, maxTop)}px`);
            const maxLeft = Math.max(0, arena.clientWidth - 160);
            style(popup, 'left', `${Math.max(12, Math.min(maxLeft, popup.offsetLeft))}px`);
        }
    }
    function refresh() {
        if (disposed || frozen) return;
        if (!battle.session.active || !arena.isConnected || !handRoot.isConnected || ui.me !== handRoot || ui.control !== controlRoot) { dispose(); return; }
        text(name, nameOf(player)); text(hp, `生命 ${player.hp} / ${player.maxHp}`); text(block, `格挡 ${player.hujia || 0}`);
        healthFill.style.width = `${Math.max(0, Math.min(100, player.maxHp > 0 ? player.hp / player.maxHp * 100 : 0))}%`;
        text(energy, `费用 ${player.storage.mengsanEnergy_shuying ?? 0} / ${player.storage.mengsanMaxEnergy_shuying ?? 0}`);
        syncActors(); syncExternalEquipment(); renderStatuses(); syncControls(); syncNotifications();
        overlays.refresh({ footerHeight:hudHeightFor(), status:_status });
    }
    function schedule() {
        if (disposed || frozen || document.hidden || frame !== null) return;
        frame = window.requestAnimationFrame(() => { frame = null; refresh(); });
    }
    const timer = window.setInterval(schedule, 200);
    function freeze() {
        if(disposed || frozen)return;
        frozen=true;window.clearInterval(timer);
        if(frame!==null){window.cancelAnimationFrame(frame);frame=null;}
        observer?.disconnect();resize?.disconnect();closeDialog();overlays.dispose();
        ownClass(arena,'mengsan-hud-frozen-shuying');
    }
    function dispose() {
        if (disposed) return; disposed = true;
        window.clearInterval(timer); if (frame !== null) window.cancelAnimationFrame(frame);
        observer?.disconnect(); resize?.disconnect(); window.removeEventListener('resize', schedule);
        document.removeEventListener('visibilitychange', schedule);
        overlays.dispose();
        closeDialog();
        for (const mark of hiddenMarks) mark.classList.remove('mengsan-hud-represented-mark-shuying'); hiddenMarks.clear();
        for (const restore of restores.reverse()) restore();
        root.remove(); link.remove();
    }
    ownClass(document.body, 'mengsan-hud-active-shuying'); ownClass(arena, 'mengsan-hud-arena-shuying');
    ownClass(ui.me, 'mengsan-hud-hand-shuying'); ownClass(ui.control, 'mengsan-hud-controls-shuying');
    ownClass(ui.mebg, 'mengsan-hud-mebg-shuying'); ownClass(player, 'mengsan-hud-self-shuying');
    // Panel events must not reach native selection/drag handlers.
    for (const type of ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend', 'contextmenu']) root.addEventListener(type, event => event.stopPropagation());
    link.addEventListener('load', schedule);
    link.addEventListener('error', () => { env.log?.('梦三 HUD 样式加载失败，保留原生布局'); dispose(); });
    document.head.appendChild(link);
    observer = new window.MutationObserver(schedule); observer.observe(ui.control, { childList: true, subtree: true });
    observer.observe(arena, { childList: true });
    if(ui.window && ui.window!==arena) observer.observe(ui.window,{childList:true});
    if (window.ResizeObserver) { resize = new window.ResizeObserver(schedule); resize.observe(arena); }
    window.addEventListener('resize', schedule); document.addEventListener('visibilitychange', schedule);
    const api = { refresh, freeze, dispose }; battle.session.ownResource(api, dispose); refresh(); return api;
}
