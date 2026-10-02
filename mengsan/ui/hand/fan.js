// 只覆盖命名空间内的 CSS 变量，不移动或复制真实卡牌。
export function fanSlots(count, width, cardWidth = 112, cardHeight = 156) {
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isFinite(width) || width <= 0) return [];
  const step = count > 1 ? Math.min(cardWidth * 0.68,
    Math.max(0, width - cardWidth - 32) / (count - 1)) : 0;
  const half = (count - 1) / 2;
  const angleStep = count > 1 ? Math.min(4, 13 / half) : 0;
  return Array.from({ length: count }, (_, index) => {
    const offset = index - half;
    return { x: width / 2 + offset * step - cardWidth / 2,
      y: -cardHeight + 28 + (half ? Math.pow(offset / half, 2) * 20 : 0),
      angle: offset * angleStep, z: index + 1 };
  });
}

export function createHandFan(adapter, env) {
  const { window } = env;
  const owned = new Map();
  let enabled = false, hover = null, dragging = null;
  function variable(card, key, value) {
    let record = owned.get(card);
    if (!record) { record = new Map(); owned.set(card, record); }
    if (!record.has(key)) record.set(key, {
      before: card.style.getPropertyValue(key), priority: card.style.getPropertyPriority(key), last: null,
    });
    const entry = record.get(key);
    entry.last = value;
    if (card.style.getPropertyValue(key) !== value) card.style.setProperty(key, value);
  }
  function release(card) {
    for (const name of ["mengsan-hand-hover-shuying", "mengsan-hand-drag-shuying", "mengsan-hand-free-drag-shuying"]) card.classList.remove(name);
    for (const [key, record] of owned.get(card) || []) {
      if (card.style.getPropertyValue(key) !== record.last) continue;
      if (record.before) card.style.setProperty(key, record.before, record.priority);
      else card.style.removeProperty(key);
    }
    owned.delete(card);
  }
  function setHover(card) {
    if (hover === card) return;
    hover?.classList.remove("mengsan-hand-hover-shuying");
    hover = enabled && !dragging ? card : null;
    hover?.classList.add("mengsan-hand-hover-shuying");
  }
  function sync(active) {
    enabled = active;
    const cards = adapter.cards().filter(card => !card.classList.contains("display-none"));
    const current = new Set(cards);
    for (const card of owned.keys()) if (!active || !current.has(card)) release(card);
    if (!active) { setHover(null); return; }
    const small = window.innerWidth <= 640 || window.innerHeight <= 500;
    const width = adapter.containers[0]?.clientWidth || adapter.root.clientWidth;
    const slots = fanSlots(cards.length, width, small ? 82 : 112, small ? 114 : 156);
    cards.forEach((card, index) => {
      const slot = slots[index];
      if (!slot) return;
      variable(card, "--mengsan-fan-x", `${slot.x}px`);
      variable(card, "--mengsan-fan-y", `${slot.y}px`);
      variable(card, "--mengsan-fan-angle", `${slot.angle}deg`);
      variable(card, "--mengsan-fan-z", `${slot.z}`);
    });
    if (hover && !current.has(hover)) setHover(null);
  }
  function drag(card, point, targeted) {
    if (dragging && dragging !== card) stopDrag();
    setHover(null);
    dragging = card;
    card.classList.add("mengsan-hand-drag-shuying");
    card.classList.toggle("mengsan-hand-free-drag-shuying", !targeted);
    const zone = card.parentNode;
    const rect = zone.getBoundingClientRect();
    // CSS 像素相对于真实父容器：兼容 documentZoom/缩放，不能直接拿屏幕坐标当布局坐标。
    const scaleX = rect.width / zone.offsetWidth || 1;
    const scaleY = rect.height / zone.offsetHeight || scaleX;
    const rootRect = adapter.root.getBoundingClientRect();
    const small = window.innerWidth <= 640 || window.innerHeight <= 500;
    const width = small ? 82 : 112, height = small ? 114 : 156;
    const x = targeted ? rootRect.left + rootRect.width / 2 : point.x;
    const y = targeted ? rootRect.bottom - height * scaleY / 2 - 6 : point.y;
    variable(card, "--mengsan-drag-x", `${(x - rect.left) / scaleX - width / 2}px`);
    variable(card, "--mengsan-drag-y", `${(y - rect.top) / scaleY - height / 2}px`);
  }
  function stopDrag() {
    dragging?.classList.remove("mengsan-hand-drag-shuying", "mengsan-hand-free-drag-shuying");
    dragging = null;
  }
  return { sync, setHover, drag, stopDrag,
    dispose() { stopDrag(); setHover(null); for (const card of owned.keys()) release(card); } };
}
