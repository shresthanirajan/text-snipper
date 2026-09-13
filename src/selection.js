(() => {
  const key = "__textSnipperUI";
  if (globalThis[key]) globalThis[key]();
  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      .overlay{position:fixed;inset:0;cursor:crosshair;pointer-events:auto;touch-action:none;user-select:none;background:#0001}
      .box{display:none;position:absolute;box-sizing:border-box;border:2px solid #2563eb;background:#2563eb14;pointer-events:none}
      .notice{position:fixed;top:20px;left:50%;transform:translateX(-50%);max-width:85vw;padding:12px 20px;border-radius:10px;background:#172033;color:white;font:14px system-ui,sans-serif;text-align:center;box-shadow:0 4px 18px #0003;pointer-events:none}
    </style>
    <div class="overlay"><div class="box"></div></div>`;
  document.documentElement.appendChild(host);
  const overlay = shadow.querySelector(".overlay");
  const box = shadow.querySelector(".box");
  const viewport = { width: innerWidth, height: innerHeight };
  let start = null;
  let selecting = true;
  let alive = true;
  let timer;

  function detach() {
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", close);
    window.removeEventListener("scroll", close, true);
  }
  function close() {
    alive = false;
    clearTimeout(timer);
    detach();
    chrome.runtime.onMessage.removeListener(onStatus);
    host.remove();
    if (globalThis[key] === close) delete globalThis[key];
  }
  globalThis[key] = close;

  function notice(text, duration = 0) {
    if (!alive) return;
    clearTimeout(timer);
    shadow.querySelector(".notice")?.remove();
    const element = document.createElement("div");
    element.className = "notice";
    element.setAttribute("role", "status");
    element.textContent = text;
    shadow.appendChild(element);
    if (duration) timer = setTimeout(close, duration);
  }
  function onStatus(message) {
    if (message.type === "snipper-status" && alive && !selecting) notice("Reading text…");
  }
  chrome.runtime.onMessage.addListener(onStatus);

  function onKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
      event.preventDefault();
    }
  }
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", close);
  window.addEventListener("scroll", close, true);

  const point = event => ({
    x: Math.max(0, Math.min(innerWidth, event.clientX)),
    y: Math.max(0, Math.min(innerHeight, event.clientY))
  });
  function rectangle(event) {
    const end = point(event);
    return {
      x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
      width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y)
    };
  }
  overlay.addEventListener("wheel", event => event.preventDefault(), { passive: false });
  overlay.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    event.preventDefault();
    start = point(event);
    overlay.setPointerCapture(event.pointerId);
  });
  overlay.addEventListener("pointermove", event => {
    if (!start || !selecting) return;
    const area = rectangle(event);
    Object.assign(box.style, {
      display: "block", left: area.x + "px", top: area.y + "px",
      width: area.width + "px", height: area.height + "px"
    });
  });
  overlay.addEventListener("pointercancel", close);
  overlay.addEventListener("pointerup", async event => {
    if (!start || !selecting) return;
    const rect = rectangle(event);
    selecting = false;
    overlay.remove();
    if (rect.width < 8 || rect.height < 8) {
      detach(); notice("Select a slightly larger area.", 3000); return;
    }
    // Let Chrome paint the page without the selector before capture.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!alive) return;
    detach();
    try {
      const result = await chrome.runtime.sendMessage({ target: "background", type: "capture", rect, viewport });
      if (!alive) return;
      chrome.runtime.onMessage.removeListener(onStatus);
      if (!result?.ok) throw new Error(result?.error || "Could not read text. Try again.");
      notice("Copied!", 2000);
    } catch (error) {
      chrome.runtime.onMessage.removeListener(onStatus);
      notice(error.message || "Something went wrong. Refresh the page and try again.", 6000);
    }
  });
})();
