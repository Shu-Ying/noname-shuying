import { createHandAdapter } from "./adapter.js";
import { createHandOverlays } from "./overlays.js";
import { createHandDiagnostics } from "./diagnostics.js";
import { createHandFan } from "./fan.js";
import { createHandInput } from "./input.js";

export async function mountHandUI(player, session, env) {
  const { ui, document, window, cardCost, styleURL } = env;
  const adapter = createHandAdapter(player, ui);
  const overlays = createHandOverlays(document, card => cardCost(card, player));
  const fan = createHandFan(adapter, env);
  let input = null;
  const restores = [];
  const diagnose = createHandDiagnostics(env.game, session.id);
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = styleURL;
  let disposed = false;
  let observer, resizeObserver, pointer = null, nativeInput = false;
  let finishStyleLoad = null, refreshTimer = null;
  const touchScrollClasses = new Map();
  let layoutEnabled = false, warned = false;
  const log = (message, error) => {
    diagnose(message, error);
    env.log?.(`梦三手牌 UI：${message}`);
  };
  function ownClass(node, name) {
    if (!node || node.classList.contains(name)) return;
    node.classList.add(name);
    restores.push(() => node.classList.remove(name));
  }
  function ownAttribute(node, name, value) {
    const previous = node.getAttribute(name);
    node.setAttribute(name, value);
    restores.push(() => {
      if (node.getAttribute(name) !== value) return;
      if (previous === null) node.removeAttribute(name);
      else node.setAttribute(name, previous);
    });
  }
  function nativeLayout() {
    if (ui.me !== adapter.root) return;
    try { ui.updateh?.(true); ui.updatehl?.(); }
    catch (error) { log("原手牌布局刷新失败", error); }
  }
  function setLayout(enabled) {
    if (layoutEnabled === enabled) return;
    layoutEnabled = enabled;
    for (const zone of adapter.zones) {
      zone.classList.toggle("mengsan-hand-layout-shuying", enabled);
    }
    for (const container of adapter.containers.filter(Boolean)) {
      container.classList.toggle("mengsan-hand-scroll-shuying", enabled);
    }
    if (!enabled) nativeLayout();
  }
  function refresh() {
    if (disposed) return;
    if (!session.active || !adapter.zones.some(zone => zone.isConnected)) {
      dispose();
      return;
    }
    const supported = adapter.supported();
    setLayout(supported && !nativeInput);
    fan.sync(supported && !nativeInput);
    input?.reconcile();
    if (!supported && !warned) {
      warned = true;
      log("当前容器不支持独立排列，已保留原排列与费用/强化标记");
    }
    overlays.sync(adapter.cards());
  }
  function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    restores.push(() => target.removeEventListener(type, listener, options));
  }
  // 不可使用的真实手牌不能触发旧手势的横排回退；选中牌保留原生交互。
  function canBeginNativeInput(card) {
    if (!adapter.zones.includes(card?.parentNode) ||
        card.classList.contains("noclick") ||
        (!card.classList.contains("selectable") &&
         !card.classList.contains("selected"))) return false;
    const current = env._status?.event;
    return !(current?.name === "chooseToUse" && current.player === player &&
      env.isActiveCardUse?.(current, player) &&
      env.canPayCard?.(player, card) === false);
  }
  function beginInput(event) {
    if (input?.owns()) return;
    const card = event.target.closest?.(".card");
    if (event.button !== 0 || pointer ||
        !canBeginNativeInput(card)) {
      return;
    }
    pointer = { card, id: event.pointerId, x: event.clientX, y: event.clientY,
      touch: event.pointerType === "touch" };
  }
  function moveInput(event) {
    if (input?.owns()) return;
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!canBeginNativeInput(pointer.card)) { endInput(event); return; }
    if (nativeInput) return;
    // 未接管的上拖（包括响应牌或已选牌）不属于手牌排序，不退回横排。
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (dy < 0 && Math.abs(dy) >= Math.abs(dx)) return;
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 8) {
      return;
    }
    if (pointer.touch && Math.abs(event.clientX - pointer.x) >
        Math.abs(event.clientY - pointer.y)) return;
    nativeInput = true;
    setLayout(false);
  }
  function endInput(event) {
    if (event?.pointerId != null && event.pointerId !== pointer?.id) return;
    restoreTouchScroll();
    pointer = null;
    if (disposed || !nativeInput) return;
    nativeInput = false;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refresh, 0);
  }
  function restoreTouchScroll() {
    for (const [container, hadScroll] of touchScrollClasses) {
      if (!hadScroll) container.classList.remove("scrollh");
    }
    touchScrollClasses.clear();
  }
  function scrollWheel(event) {
    if (!layoutEnabled || event.ctrlKey || event.metaKey) return;
    const container = event.currentTarget;
    if (container.scrollWidth <= container.clientWidth) return;
    const scale = event.deltaMode === 1 ? 16 :
      event.deltaMode === 2 ? container.clientWidth : 1;
    container.scrollLeft += (event.deltaX || event.deltaY) * scale;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function allowTouchScroll(event) {
    const container = event.currentTarget;
    if (!layoutEnabled || container.scrollWidth <= container.clientWidth) {
      return;
    }
    if (!touchScrollClasses.has(container)) {
      touchScrollClasses.set(container,
        container.classList.contains("scrollh"));
    }
    container.classList.add("scrollh");
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    finishStyleLoad?.();
    window.clearTimeout(refreshTimer);
    restoreTouchScroll();
    observer?.disconnect();
    resizeObserver?.disconnect();
    input?.dispose();
    fan.dispose();
    overlays.dispose();
    setLayout(false);
    for (const restore of restores.reverse()) restore();
    style.remove();
    pointer = null;
    diagnose("已卸载手牌 UI");
  }
  session.ownResource({}, dispose);
  try {
    await new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => finish(
        new Error("梦三手牌样式加载超时")
      ), 10000);
      const finish = error => {
        window.clearTimeout(timer);
        finishStyleLoad = null;
        style.onload = style.onerror = null;
        if (error) reject(error);
        else resolve();
      };
      finishStyleLoad = finish;
      style.onload = () => finish();
      style.onerror = () => finish(new Error("梦三手牌样式加载失败"));
      document.head.appendChild(style);
    });
    if (!session.active || disposed) { dispose(); return { refresh, dispose }; }
    ownClass(adapter.root, "mengsan-hand-root-shuying");
    ownClass(document.body, "mengsan-hand-ui-shuying");
    for (const zone of adapter.zones) {
      ownClass(zone, "mengsan-hand-zone-shuying");
    }
    for (const container of adapter.containers.filter(Boolean)) {
      if (!container.hasAttribute("tabindex")) {
        ownAttribute(container, "tabindex", "0");
      }
      ownAttribute(container, "aria-label", "梦三扇形手牌，悬停查看；上拖出牌，拖向目标后松手确认");
      listen(container, "wheel", scrollWheel,
        { capture: true, passive: false });
      listen(container, "touchmove", allowTouchScroll, true);
      listen(container, "touchend", () => restoreTouchScroll(), true);
      listen(container, "touchcancel", () => restoreTouchScroll(), true);
    }
    observer = new window.MutationObserver(refresh);
    for (const zone of adapter.zones) {
      observer.observe(zone, { childList: true, subtree: true,
        attributes: true, attributeFilter: ["class"] });
    }
    input = createHandInput(player, session, adapter, fan, env, refresh, log);
    if (adapter.root?.parentNode) {
      observer.observe(adapter.root.parentNode, { childList: true });
    }
    if (window.ResizeObserver && adapter.root) {
      resizeObserver = new window.ResizeObserver(refresh);
      resizeObserver.observe(adapter.root);
    }
    if (window.PointerEvent && adapter.root) {
      listen(adapter.root, "pointerdown", beginInput, true);
      listen(window, "pointermove", moveInput, true);
      listen(window, "pointerup", endInput, true);
      listen(window, "pointercancel", endInput, true);
      listen(window, "blur", () => endInput());
    }
    refresh();
    diagnose(`已挂载手牌 UI，独立排列=${layoutEnabled}`);
    return { refresh, dispose };
  } catch (error) {
    log("必需模块挂载失败，停止进入战斗", error);
    dispose();
    throw error;
  }
}
