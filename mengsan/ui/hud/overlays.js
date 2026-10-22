// Position existing native prompts and popped descriptions; never recreate their content or handlers.
export function createOverlayLayout(arena, hand, ui, player) {
    const records = new Map();
    const roots = new Set([ui.window, arena].filter(Boolean));
    const popped = () => new Set([...roots].flatMap(root => [...root.querySelectorAll(':scope > .dialog.popped')]));
    const markPopups = new WeakSet();
    let activeMarkPopup = null, openingMark = false, disposed = false, options = null;
    // Native mark intros do not reject repeated clicks themselves. Observe their real
    // popup after the native handler, and block duplicate opens without replacing it.
    const guardMark = event => {
        const target = event.target.closest?.('.mark');
        if (!target || !player.contains(target)) return;
        if (openingMark || activeMarkPopup?.isConnected) {
            event.preventDefault(); event.stopImmediatePropagation(); return;
        }
        const before = popped();
        openingMark = true;
        arena.ownerDocument.defaultView.queueMicrotask(() => {
            openingMark = false;
            if (disposed) return;
            activeMarkPopup = [...popped()].find(node => !before.has(node)) || null;
            if (activeMarkPopup) { markPopups.add(activeMarkPopup); if (options) api.refresh(options); }
        });
    };
    const markEvents = ['click', 'touchend', 'contextmenu'];
    for (const type of markEvents) player.addEventListener(type, guardMark, true);
    function release(node, record) {
        for (const [key, field] of record.styles) {
            if (node.style.getPropertyValue(key) !== field.last) continue;
            if (field.before) node.style.setProperty(key,field.before,field.priority); else node.style.removeProperty(key);
        }
        for (const [name, had] of record.classes) if (!had) node.classList.remove(name);
        records.delete(node);
    }
    function mark(node, name) {
        let record=records.get(node);
        if(!record) {record={styles:new Map(),classes:new Map()};records.set(node,record);}
        if(!record.classes.has(name))record.classes.set(name,node.classList.contains(name));
        node.classList.add(name);return record;
    }
    function style(node,key,value) {
        const record=records.get(node);
        if(!record.styles.has(key))record.styles.set(key,{before:node.style.getPropertyValue(key),priority:node.style.getPropertyPriority(key)});
        const field=record.styles.get(key);
        if(field.requested!==value||node.style.getPropertyValue(key)!==field.last)node.style.setProperty(key,value,'important');
        field.requested=value;field.last=node.style.getPropertyValue(key);
    }
    function position(node,x,y,width,maxHeight) {
        for(const [key,value] of Object.entries({position:'absolute',right:'auto',bottom:'auto',transform:'none',margin:'0px',width:`${width}px`,'max-height':`${maxHeight}px`}))style(node,key,value);
        const host=node.offsetParent||arena.ownerDocument.documentElement,h=host.getBoundingClientRect();
        const sx=h.width/host.offsetWidth||1,sy=h.height/host.offsetHeight||sx;
        style(node,'left',`${(x-h.left)/sx-host.clientLeft+host.scrollLeft}px`);
        style(node,'top',`${(y-h.top)/sy-host.clientTop+host.scrollTop}px`);
    }
    const api = {
        refresh(nextOptions) {
            options = nextOptions;
            const {footerHeight,status} = nextOptions;
            const used=new Set(),a=arena.getBoundingClientRect(),zoom=a.width/arena.clientWidth||1;
            const left=parseFloat(arena.style.getPropertyValue('--mengsan-hud-left'))||0;
            const right=parseFloat(arena.style.getPropertyValue('--mengsan-hud-right'))||0;
            const x=a.left+left*zoom,width=Math.max(100,arena.clientWidth-left-right);
            const controlTop=ui.control.getBoundingClientRect().top;
            const prompts=new Set(arena.querySelectorAll(':scope > .hand-tip,:scope > .hand-tip-info'));
            const dialog=ui.dialog;
            if(dialog?.isConnected && !dialog.classList.contains('popped') && !dialog.classList.contains('fullheight') && !dialog.forcebutton && !dialog.buttons?.length && !dialog.querySelector('.button,.card,.player,input,textarea,select') && status.event?.player===player)prompts.add(dialog);
            // The event owns simple native prompt dialogs too, without a global game dependency.
            const eventDialog=status.event?.dialog;
            if(eventDialog?.isConnected && eventDialog===dialog && !eventDialog.buttons?.length && !eventDialog.forcebutton && !eventDialog.querySelector('.button,.card,.player,input,textarea,select'))prompts.add(eventDialog);
            let promptBottom=Math.min(controlTop-10*zoom,a.bottom-(footerHeight+54)*zoom);
            for(const node of prompts) {
                if(node.hidden || node.style.display==='none')continue;
                mark(node,'mengsan-hud-prompt-shuying');used.add(node);
                position(node,x,0,width,arena.clientHeight<=500?34:64);
                const height=node.getBoundingClientRect().height;
                position(node,x,Math.max(a.top+50*zoom,promptBottom-height),width,arena.clientHeight<=500?34:64);
                promptBottom=node.getBoundingClientRect().top-6*zoom;
            }
            const handBox=hand.getBoundingClientRect();
            const handTop=Math.min(handBox.top,...[...hand.querySelectorAll('.handcards>.card')].map(node=>node.getBoundingClientRect().top));
            const popups=popped();
            let hasPopup=false;
            for(const node of popups) {
                const rect=node.getBoundingClientRect();
                if(!markPopups.has(node) && !records.has(node) && !(rect.bottom>handTop && rect.left<handBox.right && rect.right>handBox.left))continue;
                mark(node,'mengsan-hud-card-intro-shuying');used.add(node);hasPopup=true;
                const popupWidth=Math.min(320,Math.max(180,rect.width/zoom),arena.clientWidth-24);
                const maxHeight=Math.max(64,(promptBottom-a.top)/zoom-12);
                const center=Math.max(a.left+12*zoom,Math.min(a.right-(popupWidth+12)*zoom,markPopups.has(node)?x:rect.left));
                position(node,center,a.top+12*zoom,popupWidth,maxHeight);
                const height=node.getBoundingClientRect().height;
                position(node,center,Math.max(a.top+12*zoom,promptBottom-height-8*zoom),popupWidth,maxHeight);
            }
            if(hasPopup)for(const root of roots)for(const node of root.querySelectorAll(':scope > .poplayer')) {mark(node,'mengsan-hud-intro-layer-shuying');style(node,'z-index','89');used.add(node);}
            for(const [node,record] of records)if(!node.isConnected||!used.has(node))release(node,record);
        },
        dispose(){disposed=true;for(const type of markEvents)player.removeEventListener(type,guardMark,true);for(const [node,record]of records)release(node,record);},
    };
    return api;
}
