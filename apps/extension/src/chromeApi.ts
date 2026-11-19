import type { Api } from "./popup";
import type { ExtractedJob } from "./extract";

const KEY = "resume";

/** The real browser bindings. Everything is local: nothing here makes a network request. */
export const chromeApi: Api = {
  async getResume() {
    const stored = await chrome.storage.local.get(KEY);
    return typeof stored[KEY] === "string" ? stored[KEY] : "";
  },

  async setResume(text) {
    await chrome.storage.local.set({ [KEY]: text });
  },

  async extractFromActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) throw new Error("No active tab");
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    const result = injection?.result as ExtractedJob | undefined;
    if (!result) throw new Error("No result from page");
    return result;
  },

  async writeClipboard(text) {
    await navigator.clipboard.writeText(text);
  },
};
