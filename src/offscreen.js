// This hidden document owns decoding, OCR, and clipboard access.
// Text never needs to be returned to or inserted into the webpage.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== "offscreen" || message.type !== "recognize") return;
  readSelection(message).then(respond, error => {
    respond({ ok: false, error: error.message || "Could not read text. Try again." });
  });
  return true;
});

function limit(promise, milliseconds, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + " timed out. Try a smaller selection.")), milliseconds);
    })
  ]).finally(() => clearTimeout(timer));
}

async function readSelection({ shot, rect, viewport }) {
  let worker;
  const heartbeat = setInterval(() => {
    chrome.runtime.sendMessage({ target: "background", type: "heartbeat" }).catch(() => {});
  }, 10000);
  try {
    const values = [rect?.x, rect?.y, rect?.width, rect?.height, viewport?.width, viewport?.height];
    if (!values.every(Number.isFinite) || rect.x < 0 || rect.y < 0 ||
        Math.min(rect.width, rect.height, viewport.width, viewport.height) <= 0 ||
        rect.x + rect.width > viewport.width + 1 || rect.y + rect.height > viewport.height + 1) {
      throw new Error("Invalid selection. Please select the text again.");
    }
    if (typeof shot !== "string" || !shot.startsWith("data:image/png;base64,")) {
      throw new Error("Screenshot was not received. Refresh the page and try again.");
    }
    // Image.decode() stalled in the hidden document; bitmap decoding avoids it.
    const blob = await (await fetch(shot)).blob();
    const bitmap = await limit(createImageBitmap(blob), 10000, "Screenshot decoding");
    let source;
    try {
      const sx = bitmap.width / viewport.width;
      const sy = bitmap.height / viewport.height;
      const width = Math.max(1, Math.round(rect.width * sx));
      const height = Math.max(1, Math.round(rect.height * sy));
      // Enlarge small text, with a cap on memory for large selections.
      const scale = Math.min(2, 3000 / Math.max(width, height), Math.sqrt(4500000 / (width * height)));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      source = SnipperImage.canvasOf(w + 32, h + 32);
      const ctx = source.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, source.width, source.height);
      ctx.drawImage(bitmap, rect.x * sx, rect.y * sy, width, height, 16, 16, w, h);
    } finally {
      bitmap.close();
    }

    let rejectWorker;
    const failure = new Promise((_, reject) => { rejectWorker = reject; });
    failure.catch(() => {});
    worker = await limit(Promise.race([
      Tesseract.createWorker("eng", 1, {
        workerPath: chrome.runtime.getURL("vendor/worker.min.js"),
        corePath: chrome.runtime.getURL("vendor/core"),
        langPath: chrome.runtime.getURL("vendor/lang"),
        workerBlobURL: false, gzip: true, cacheMethod: "none",
        errorHandler: error => rejectWorker(new Error(error?.message || String(error)))
      }), failure
    ]), 30000, "OCR startup");

    const candidates = [];
    let originalText = "";
    async function scan(canvas, mode, offsetY = 0, original = false) {
      await worker.setParameters({ tessedit_pageseg_mode: mode });
      const { data } = await limit(Promise.race([
        worker.recognize(canvas.toDataURL("image/png"), {}, { text: true, blocks: true }), failure
      ]), 25000, "Text recognition");
      if (original) originalText = data.text.trim();
      for (const block of data.blocks || []) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            const text = line.text.trim();
            if (text) candidates.push({
              text, confidence: line.confidence,
              bbox: { ...line.bbox, y0: line.bbox.y0 + offsetY, y1: line.bbox.y1 + offsetY }
            });
          }
        }
      }
    }
    await scan(source, "3", 0, true); // Normal page layout.
    const processed = SnipperImage.makeVariants(source);
    await scan(processed.gray, "11"); // Separate text regions, including mixed sizes.
    for (const band of processed.bands.slice(0, 4)) await scan(band.canvas, "7", band.y);

    // Merge competing readings by position. Repeated words elsewhere remain.
    candidates.sort((a, b) => b.confidence - a.confidence);
    const chosen = [];
    for (const line of candidates) {
      if (line.confidence < 55 || !/[A-Za-z0-9]/.test(line.text)) continue;
      if (!chosen.some(other => SnipperImage.sameArea(line.bbox, other.bbox))) chosen.push(line);
    }
    chosen.sort((a, b) => {
      const height = Math.min(a.bbox.y1 - a.bbox.y0, b.bbox.y1 - b.bbox.y0);
      const dy = (a.bbox.y0 + a.bbox.y1 - b.bbox.y0 - b.bbox.y1) / 2;
      return Math.abs(dy) < height * 0.5 ? a.bbox.x0 - b.bbox.x0 : dy;
    });
    const text = chosen.map(line => line.text).join("\n") || originalText;
    if (!text) throw new Error("No readable text found. Zoom in or select a tighter area.");

    // Offscreen documents cannot be focused. Use Chrome's clipboard fallback.
    const field = document.createElement("textarea");
    field.value = text;
    document.body.appendChild(field);
    let copied = false;
    try {
      field.focus();
      field.select();
      copied = document.execCommand("copy");
    } finally {
      field.remove();
    }
    if (!copied) throw new Error("Text was read, but copying failed. Please try again.");
    return { ok: true };
  } finally {
    clearInterval(heartbeat);
    if (worker) await worker.terminate().catch(() => {});
  }
}
