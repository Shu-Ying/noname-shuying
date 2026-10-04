// 保留完整滚动高度，只挂载可见行与上下各两行；滚动时不重建仍可见的卡牌。
export function createVirtualCardGrid(viewport, grid, createCard) {
    const mounted = new Map();
    let records = [], columns = 1, height = 218, gap = 8, padding = 5, viewportHeight = 0;
    let frame = 0, disposed = false;
    function draw() {
        if (disposed || grid.hidden || !viewportHeight) return;
        const stride = height + gap;
        const offset = viewport.scrollTop;
        const firstRow = Math.max(0, Math.floor((offset - padding) / stride) - 2);
        const lastRow = Math.ceil((offset + viewportHeight - padding) / stride) + 2;
        const first = firstRow * columns, end = Math.min(records.length, lastRow * columns);
        // 不因滚动删除正在使用键盘操作的卡牌。
        for (const [index, node] of mounted) {
            if ((index < first || index >= end) && node !== document.activeElement) {
                node.remove(); mounted.delete(index);
            }
        }
        for (let index = first; index < end; index++) {
            if (mounted.has(index)) continue;
            const node = createCard(records[index], index);
            node.dataset.cardIndex = String(index);
            node.style.gridRow = String(Math.floor(index / columns) + 1);
            node.style.gridColumn = String(index % columns + 1);
            // 保持 DOM 顺序与屏幕顺序一致，方便键盘与读屏浏览。
            let next = null;
            for (const [otherIndex, other] of mounted) {
                if (otherIndex > index && (!next || otherIndex < Number(next.dataset.cardIndex))) next = other;
            }
            grid.insertBefore(node, next); mounted.set(index, node);
        }
    }
    function schedule() {
        if (!frame && !disposed) frame = requestAnimationFrame(() => { frame = 0; draw(); });
    }
    function layout(cardHeight = height) {
        height = cardHeight;
        if (disposed || grid.hidden || !grid.clientWidth) return;
        const style = getComputedStyle(grid);
        viewportHeight = viewport.clientHeight;
        const nextColumns = Math.max(1, style.gridTemplateColumns.split(/\s+/).filter(track => parseFloat(track) > 0).length);
        gap = parseFloat(style.rowGap) || 0;
        padding = parseFloat(getComputedStyle(viewport).paddingTop) || 0;
        columns = nextColumns;
        const rows = Math.ceil(records.length / columns);
        grid.style.gridTemplateRows = rows ? `repeat(${rows}, ${height}px)` : "none";
        for (const [index, node] of mounted) {
            node.style.gridRow = String(Math.floor(index / columns) + 1);
            node.style.gridColumn = String(index % columns + 1);
        }
        draw();
    }
    function focus(index) {
        if (!Number.isInteger(index) || index < 0 || index >= records.length || disposed) return;
        const top = padding + Math.floor(index / columns) * (height + gap);
        if (top < viewport.scrollTop) viewport.scrollTop = top;
        else if (top + height > viewport.scrollTop + viewportHeight) {
            viewport.scrollTop = top + height - viewportHeight;
        }
        draw(); mounted.get(index)?.focus({ preventScroll: true });
    }
    function keydown(event) {
        const card = event.target.closest("[data-card-index]");
        if (!card || !grid.contains(card) || event.altKey || event.ctrlKey || event.metaKey) return;
        const index = Number(card.dataset.cardIndex);
        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns,
            Tab: event.shiftKey ? -1 : 1 }[event.key];
        if (delta == null) return;
        const target = index + delta;
        if (target < 0 || target >= records.length) return;
        event.preventDefault(); focus(target);
    }
    viewport.addEventListener("scroll", schedule, { passive: true });
    grid.addEventListener("keydown", keydown);
    return {
        setRecords(value) {
            // 调用方更新筛选栏后再统一量尺寸，避免用旧高度先生成一批预览。
            records = value; mounted.clear(); grid.replaceChildren();
        },
        layout,
        focus,
        resume() { draw(); },
        dispose() {
            disposed = true; cancelAnimationFrame(frame);
            viewport.removeEventListener("scroll", schedule);
            grid.removeEventListener("keydown", keydown);
            mounted.clear(); records = [];
        },
    };
}
