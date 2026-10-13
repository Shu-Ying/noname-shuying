export function mountRelicStrip(root, getRelics, open, createIcon,
    document, window) {
  const strip = document.createElement("div");
  strip.className = "mengsan-hand-relics-shuying";
  strip.setAttribute("aria-label", "持有遗物，长按查看描述");
  const before = root.style.getPropertyValue("--mengsan-relic-space");
  const priority = root.style.getPropertyPriority("--mengsan-relic-space");
  let pending = null, timer = null, signature = null, disposed = false;
  const cancel = () => {
    if (timer !== null) window.clearTimeout(timer);
    pending?.button.classList.remove("is-pressed");
    timer = null;
    pending = null;
  };
  const stop = event => event.stopPropagation();
  const down = event => {
    stop(event);
    cancel();
    const button = event.target.closest?.("button");
    if (!button || !strip.contains(button) || event.button !== 0) return;
    pending = { button, id: event.pointerId,
      x: event.clientX, y: event.clientY };
    button.classList.add("is-pressed");
    timer = window.setTimeout(() => {
      const relic = getRelics().find(item => item.id === button.dataset.relicId);
      cancel();
      if (!disposed && relic) open(relic);
    }, 500);
  };
  const move = event => {
    if (event.pointerId !== pending?.id) return;
    if (Math.hypot(event.clientX - pending.x,
        event.clientY - pending.y) > 8) cancel();
  };
  const up = event => {
    if (event.pointerId === pending?.id) cancel();
  };
  const click = event => {
    stop(event);
    event.preventDefault();
    if (event.detail !== 0) return;
    const button = event.target.closest?.("button");
    const relic = getRelics().find(item => item.id === button?.dataset.relicId);
    if (relic) open(relic);
  };
  const context = event => { stop(event); event.preventDefault(); };
  const listeners = [
    [strip, "pointerdown", down], [strip, "pointermove", stop],
    [strip, "pointerup", stop], [strip, "click", click],
    [strip, "keydown", stop], [strip, "keyup", stop],
    [strip, "contextmenu", context], [strip, "scroll", cancel],
    [strip, "wheel", stop], [strip, "touchstart", stop],
    [strip, "touchmove", stop], [strip, "touchend", stop],
    [window, "pointermove", move, true],
    [window, "pointerup", up, true],
    [window, "pointercancel", up, true], [window, "blur", cancel],
  ];
  for (const args of listeners) args[0].addEventListener(...args.slice(1));
  root.appendChild(strip);
  const refresh = () => {
    if (disposed) return;
    const relics = getRelics();
    const next = JSON.stringify(relics.map(item => [item.id, item.image, item.name]));
    if (next === signature) return;
    signature = next;
    cancel();
    strip.replaceChildren();
    strip.hidden = relics.length === 0;
    root.style.setProperty("--mengsan-relic-space", relics.length ? "88px" : "0px");
    for (const relic of relics) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.relicId = relic.id;
      button.setAttribute("aria-label", `${relic.name}，长按查看描述`);
      button.setAttribute("aria-haspopup", "dialog");
      const fallback = document.createElement("span");
      fallback.textContent = relic.name;
      const icon = createIcon(relic.image);
      if (icon) {
        fallback.hidden = true;
        icon.addEventListener("error", () => { fallback.hidden = false; },
          { once: true });
        button.appendChild(icon);
      }
      button.appendChild(fallback);
      strip.appendChild(button);
    }
  };
  refresh();
  return { refresh, dispose() {
    if (disposed) return;
    disposed = true;
    cancel();
    for (const args of listeners) args[0].removeEventListener(...args.slice(1));
    strip.remove();
    const value = root.style.getPropertyValue("--mengsan-relic-space");
    if (value === "88px" || value === "0px") {
      if (before) root.style.setProperty("--mengsan-relic-space", before, priority);
      else root.style.removeProperty("--mengsan-relic-space");
    }
  } };
}
