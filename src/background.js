// The user must click the toolbar (or shortcut) to grant access to a tab.
// One job at a time avoids competing screenshot and clipboard operations.
let activeJob = null;

async function badge(tabId, text, title) {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text }),
    chrome.action.setTitle({ tabId, title })
  ]);
}

async function closeOCR() {
  await chrome.offscreen.closeDocument().catch(() => {});
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  if (activeJob) {
    await badge(tab.id, "…", "Still reading text. Please wait.");
    return;
  }
  try {
    await badge(tab.id, "", "Text Snipper — select text");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id }, files: ["src/selection.js"]
    });
  } catch {
    await badge(tab.id, "!", "Cannot select here. Try a normal webpage or refresh the page.");
  }
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.target !== "background") return;
  if (message.type === "heartbeat") {
    respond({ ok: true });
    return;
  }
  if (message.type !== "capture" || !sender.tab || sender.frameId !== 0) return;
  if (activeJob) {
    respond({ ok: false, error: "Another snip is processing. Please wait." });
    return;
  }
  const job = { tabId: sender.tab.id, windowId: sender.tab.windowId };
  activeJob = job;
  finishJob(job, message).then(respond, () => {
    respond({ ok: false, error: "Could not finish. Reload the extension and try again." });
  });
  return true;
});

async function finishJob(job, message) {
  let result;
  let timer;
  let expired = false;
  try {
    result = await Promise.race([
      (async () => {
        const assertCurrent = () => {
          if (expired || activeJob !== job) throw new Error("Snip expired. Try again.");
        };
        const [tab] = await chrome.tabs.query({ active: true, windowId: job.windowId });
        if (tab?.id !== job.tabId) throw new Error("Tab changed. Return to the page and try again.");
        assertCurrent();
        const shot = await chrome.tabs.captureVisibleTab(job.windowId, { format: "png" });
        assertCurrent();
        const [stillActive] = await chrome.tabs.query({ active: true, windowId: job.windowId });
        if (stillActive?.id !== job.tabId) throw new Error("Tab changed during capture. Please try again.");
        // Display status after capture so it is never included in the OCR image.
        await chrome.tabs.sendMessage(job.tabId, { type: "snipper-status" }).catch(() => {});
        await badge(job.tabId, "…", "Reading text…");
        assertCurrent();
        await closeOCR();
        assertCurrent();
        await chrome.offscreen.createDocument({
          url: "src/offscreen.html", reasons: ["CLIPBOARD", "WORKERS", "BLOBS"],
          justification: "Read the selected screenshot locally and copy its text."
        });
        if (expired) { await closeOCR(); assertCurrent(); }
        const answer = await chrome.runtime.sendMessage({
          target: "offscreen", type: "recognize", shot,
          rect: message.rect, viewport: message.viewport
        });
        assertCurrent();
        if (!answer?.ok) throw new Error(answer?.error || "Could not recognize text.");
        return answer;
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error("Reading took too long. Try a smaller area."));
        }, 120000);
      })
    ]);
  } catch (error) {
    result = { ok: false, error: error.message || "Could not read text. Try again." };
  } finally {
    clearTimeout(timer);
    await closeOCR(); // Also terminates a worker that failed to initialize.
    if (activeJob === job) activeJob = null;
  }
  await badge(job.tabId, result.ok ? "OK" : "!",
    result.ok ? "Copied! Click to snip again." : result.error).catch(() => {});
  return result;
}
