// 梦三局部输入适配：使用真实 ui.click/card/target 和 game.check 提交，不自行 useCard。
export function createHandInput(player, session, adapter, fan, env, refresh, log) {
  const { ui, game, get, _status: status, document, window } = env;
  const listeners = [];
  const maskedControls = new Set(), submittedControls = new Set();
  const maskClass = "mengsan-hand-controls-hidden-shuying";
  function maskControls(hidden) {
    const wanted = hidden ? new Set([ui.control, ui.confirm, gesture?.event.endButton]) : new Set();
    for (const node of maskedControls) {
      if (wanted.has(node)) continue;
      node.classList.remove(maskClass); maskedControls.delete(node);
    }
    // ui.control 是不同 UI 共同的控件入口；独立确认/结束按钮也可能挂在外部。
    for (const node of wanted) {
      if (!node?.classList || node.classList.contains(maskClass)) continue;
      node.classList.add(maskClass); maskedControls.add(node);
    }
  }
  function closeSubmittedControls(state) {
    for (const node of new Set([ui.confirm, state.event.endButton])) {
      if (typeof node?.close !== "function") continue;
      if (node.classList && !node.classList.contains("mengsan-hand-submitted-control-shuying")) {
        node.classList.add("mengsan-hand-submitted-control-shuying"); submittedControls.add(node);
      }
      // 与本体 windowmouseup 的提交路径一致：关闭旧确认后再调用 ui.click.ok。
      node.close();
    }
  }
  let gesture = null, suppressed = null, aim = null, frame = null, lastPoint = null;
  const listen = (node, type, handler, options = true) => {
    const safeHandler = event => {
      try { handler(event); }
      catch (error) {
        log("手牌局部输入异常，取消本次拖动", error);
        try { cleanup(true); }
        catch (cause) { log("取消输入时引擎异常", cause); }
      }
    };
    node.addEventListener(type, safeHandler, options);
    listeners.push(() => node.removeEventListener(type, safeHandler, options));
  };
  const swallow = event => { event.preventDefault(); event.stopImmediatePropagation(); };
  const live = state => session.active && adapter.supported() && state?.card.isConnected &&
    adapter.zones.includes(state.card.parentNode) && status.event === state.event &&
    !state.event.skill && state.event.isMine?.() && player.isAlive?.() !== false;
  // 引擎 checkEnd 的自动确认必须在选牌/试选目标期间禁用；仅在本次同步调用内改标志。
  function engineCall(callback) {
    const previous = {};
    for (const key of ["touchnocheck", "clicked", "dragged"]) previous[key] = { own: Object.hasOwn(status, key), value: status[key] };
    status.touchnocheck = true; status.clicked = false; status.dragged = false;
    try { return callback(); }
    finally {
      for (const [key, old] of Object.entries(previous)) {
        if (old.own) status[key] = old.value;
        else delete status[key];
      }
    }
  }
  function range(event) {
    const value = get.select(event.selectTarget);
    if (!Array.isArray(value) || value.length < 2 || value.some(n => !Number.isFinite(n))) return null;
    return value;
  }
  function eligible(card) {
    const event = status?.event;
    if (!event || typeof ui.click?.card !== "function" || typeof ui.click?.ok !== "function" ||
      typeof get?.select !== "function" || typeof env.isActiveCardUse !== "function" ||
      !session.active || !adapter.supported() || ui.intro || game.online ||
      event.name !== "chooseToUse" || event.player !== player || !event.isMine?.() ||
      event.skill || event.complexSelect || event.custom?.replace?.card || event.custom?.replace?.target || event.custom?.replace?.confirm ||
      !env.isActiveCardUse(event, player) || !env.canPayCard?.(player, card) ||
      ui.selected.cards.length || ui.selected.targets.length || ui.selected.buttons.length ||
      !card.classList.contains("selectable") || card.classList.contains("noclick") ||
      status.mousedragging || status.dragged || status.paused2) return false;
    const cards = get.select(event.selectCard);
    return cards?.[0] === 1 && cards?.[1] === 1;
  }
  function removeAim() { aim?.remove(); aim = null; }
  function showAim(card, point) {
    if (!aim) {
      aim = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      aim.classList.add("mengsan-hand-aim-shuying");
      aim.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(aim.namespaceURI, "path");
      aim.appendChild(path); document.body.appendChild(aim);
    }
    const rect = card.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + 12;
    aim.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    // clientX/Y 与卡牌矩形都是视口坐标，SVG 本身却可能受到 body zoom/transform 影响。
    // 用 SVG 实际屏幕矩阵反变换，不能重复除 documentZoom 或假定 SVG 没有偏移。
    const matrix = aim.getScreenCTM();
    if (!matrix) { removeAim(); return; }
    const inverse = matrix.inverse();
    const start = new window.DOMPoint(x, y).matrixTransform(inverse);
    const end = new window.DOMPoint(point.x, point.y).matrixTransform(inverse);
    if (![start.x, start.y, end.x, end.y].every(Number.isFinite)) { removeAim(); return; }
    // 十周年金色细线（本地 CONFIG.LINE_COLOR/LINE_WIDTH），不采用尖塔箭头/骨节造型。
    aim.firstElementChild.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
    aim.firstElementChild.setAttribute("vector-effect", "non-scaling-stroke");
  }
  function clearSelection(state) {
    if (!live(state) || !state.selected) return;
    engineCall(() => { game.uncheck(); game.check(); });
  }
  function cleanup(cancel = false) {
    const state = gesture;
    gesture = null;
    if (frame != null) window.cancelAnimationFrame(frame);
    frame = null; lastPoint = null;
    removeAim(); fan.stopDrag();
    maskControls(false);
    if (cancel && state) clearSelection(state);
    if (state) suppressed = { card: state.card, until: Date.now() + 450,
      x: state.endX ?? state.x, y: state.endY ?? state.y };
    refresh();
  }
  function start(event) {
    if (event.button !== 0 || !event.isPrimary || gesture) return;
    const card = event.target.closest?.(".card");
    if (!card || !adapter.zones.includes(card.parentNode) || !eligible(card)) return;
    // 在 window 捕获，早于十周年的手牌排序和本体的 windowmousedown；不改全局处理器。
    gesture = { card, event: status.event, id: event.pointerId,
      x: event.clientX, y: event.clientY, moved: false, selected: false, targeted: false, manual: false };
    swallow(event);
  }
  function targetAt(point) {
    const node = document.elementFromPoint(point.x, point.y)?.closest?.(".player");
    return game.players?.includes(node) ? node : null;
  }
  function chooseTarget(state, point) {
    if (!state.targeted || state.manual) return;
    const target = targetAt(point);
    for (const previous of ui.selected.targets.slice()) {
      if (previous !== target) engineCall(() => ui.click.target.call(previous));
    }
    if (target?.classList.contains("selectable") && !ui.selected.targets.includes(target)) {
      engineCall(() => ui.click.target.call(target));
    }
  }
  function paint() {
    frame = null;
    const state = gesture, point = lastPoint;
    if (!state || !point || !state.moved) return;
    if (!live(state) || !env.canPayCard(player, state.card)) { cleanup(true); return; }
    fan.drag(state.card, point, state.targeted);
    if (state.targeted) showAim(state.card, point);
    chooseTarget(state, point);
    maskControls(!state.manual);
  }
  function move(event) {
    const state = gesture;
    if (!state || event.pointerId !== state.id) return;
    swallow(event);
    if (!live(state)) { cleanup(true); return; }
    const point = { x: event.clientX, y: event.clientY };
    if (!state.moved && Math.hypot(point.x - state.x, point.y - state.y) < 9) return;
    if (!state.moved) {
      state.moved = true;
      engineCall(() => ui.click.card.call(state.card));
      state.selected = ui.selected.cards.includes(state.card);
      const targets = range(state.event);
      if (!state.selected || !live(state) || !targets) { cleanup(true); return; }
      state.targeted = targets[1] > 0;
      // 多目标保留选牌和原生确认，不擅自把一条线当作已选全部目标。
      state.manual = state.targeted && (targets[0] !== 1 || targets[1] !== 1);
    }
    lastPoint = point;
    if (frame == null) frame = window.requestAnimationFrame(() => {
      try { paint(); }
      catch (error) { log("手牌拖动绘制失败", error); cleanup(true); }
    });
  }
  function end(event) {
    const state = gesture;
    if (!state || state.id !== event.pointerId) return;
    swallow(event);
    state.endX = event.clientX; state.endY = event.clientY;
    if (!live(state) || event.type === "pointercancel") { cleanup(true); return; }
    if (!state.moved) {
      cleanup();
      // 短点击保持原生选牌/自动确认行为，不强制进入拖动。
      status.clicked = false;
      ui.click.card.call(state.card);
      return;
    }
    lastPoint = { x: event.clientX, y: event.clientY };
    paint();
    if (!gesture) return;
    const targets = range(state.event);
    if (targets && targets[1] > 0 && (targets[0] !== 1 || targets[1] !== 1)) state.manual = true;
    const ready = env.canPayCard(player, state.card) && ui.selected.cards.length === 1 &&
      ui.selected.cards[0] === state.card && targets &&
      (!state.targeted ? state.y - event.clientY >= 60 &&
        event.clientY < adapter.root.getBoundingClientRect().top :
        !state.manual && targets[0] === 1 && targets[1] === 1 &&
        targetAt(lastPoint) === ui.selected.targets[0] && ui.selected.targets.length === 1);
    if (ready && engineCall(() => game.check()) && live(state)) {
      closeSubmittedControls(state);
      cleanup();
      ui.click.ok();
    } else {
      cleanup(!state.manual);
    }
  }
  function compatibility(event) {
    if (gesture || (event.type === "click" && suppressed && Date.now() < suppressed.until &&
      (suppressed.card.contains(event.target) || Math.hypot(event.clientX - suppressed.x, event.clientY - suppressed.y) < 3))) swallow(event);
  }
  function hover(event) {
    if (gesture || event.pointerType === "touch") return;
    const card = event.target.closest?.(".card");
    fan.setHover(adapter.zones.includes(card?.parentNode) ? card : null);
  }
  function cancel(event) {
    if (!gesture) return;
    if (event?.type === "keydown" && event.key !== "Escape") return;
    if (event?.cancelable) swallow(event);
    cleanup(true);
  }
  if (window.PointerEvent && adapter.root && status && get) {
    listen(window, "pointerdown", start);
    listen(window, "pointermove", move);
    listen(window, "pointerup", end);
    listen(window, "pointercancel", cancel);
    listen(window, "blur", cancel);
    listen(window, "keydown", cancel);
    listen(window, "contextmenu", cancel);
    for (const type of ["mousedown", "mousemove", "mouseup", "click", "touchstart", "touchmove", "touchend"]) {
      listen(window, type, compatibility, { capture: true, passive: false });
    }
  }
  listen(adapter.root, "pointerover", hover);
  listen(adapter.root, "pointerleave", () => { if (!gesture) fan.setHover(null); });
  return {
    owns: () => Boolean(gesture),
    reconcile() {
      if (gesture && (!live(gesture) || !gesture.card.isConnected)) cleanup(true);
      else if (gesture?.moved) maskControls(!gesture.manual);
      for (const node of submittedControls) {
        if (node.isConnected) continue;
        node.classList.remove("mengsan-hand-submitted-control-shuying"); submittedControls.delete(node);
      }
    },
    dispose() {
      try { cleanup(true); }
      catch (error) { log("手牌拖动取消失败", error); }
      for (const release of listeners.reverse()) release();
      maskControls(false);
      for (const node of submittedControls) node.classList.remove("mengsan-hand-submitted-control-shuying");
      submittedControls.clear();
      suppressed = null;
    },
  };
}
