// Background service worker for the Trading Journal Chrome extension.
// Clicking the toolbar icon opens the app as a full-page tab, reusing the
// existing tab if it's already open.

const APP_PATH = "index.html";

async function openApp() {
  const url = chrome.runtime.getURL(APP_PATH);

  // Try to focus a previously opened app tab.
  const { appTabId } = await chrome.storage.session.get("appTabId");
  if (typeof appTabId === "number") {
    try {
      const tab = await chrome.tabs.get(appTabId);
      await chrome.tabs.update(tab.id, { active: true });
      if (typeof tab.windowId === "number") {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      return;
    } catch {
      // The stored tab was closed; fall through and open a fresh one.
    }
  }

  const created = await chrome.tabs.create({ url });
  await chrome.storage.session.set({ appTabId: created.id });
}

chrome.action.onClicked.addListener(() => {
  openApp();
});

// Open the app automatically the first time the extension is installed.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    openApp();
  }
});
