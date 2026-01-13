/**
 * Service Worker (Background Script)
 *
 * Responsibilities:
 * - Create and manage context menus
 * - Handle context menu clicks
 * - Route messages to content scripts
 * - Handle translations via API
 * - Manage extension lifecycle
 */

import {
  MESSAGE_TYPES,
  CONVERSION_MENU_ITEMS,
  ConversionType,
  Language,
  ConvertSelectionMessage,
  TranslateSelectionMessage,
  ConversionResult,
  DEFAULT_SETTINGS,
  UserSettings,
  LANGUAGES,
} from "../shared/types";
import { translate } from "../core/translator";

// Valid conversion types for quick lookup
const CONVERSION_TYPES = new Set([
  "latin-to-cyrillic",
  "cyrillic-to-latin",
  "uz-latn-to-uz-cyrl",
  "uz-cyrl-to-uz-latn",
]);

/**
 * Create context menus on extension install/update
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Main parent menu
    chrome.contextMenus.create({
      id: "scriptly-x-parent",
      title: "ScriptlyX",
      contexts: ["selection"],
    });

    // --- Transliteration submenu ---
    chrome.contextMenus.create({
      id: "scriptly-x-convert",
      parentId: "scriptly-x-parent",
      title: "Transliterate",
      contexts: ["selection"],
    });

    for (const item of CONVERSION_MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        parentId: "scriptly-x-convert",
        title: item.title,
        contexts: ["selection"],
      });
    }

    // --- Translation submenu ---
    chrome.contextMenus.create({
      id: "scriptly-x-translate",
      parentId: "scriptly-x-parent",
      title: "Translate",
      contexts: ["selection"],
    });

    // Create submenus for each source language
    const languages = Object.values(LANGUAGES);

    for (const source of languages) {
      // Create "From English" submenu, etc.
      chrome.contextMenus.create({
        id: `translate-from-${source.code}`,
        parentId: "scriptly-x-translate",
        title: `From ${source.name}`,
        contexts: ["selection"],
      });

      // Add target languages under each source
      for (const target of languages) {
        if (source.code === target.code) continue;

        // Skip Uzbek Latin ↔ Cyrillic (use transliteration)
        if (
          (source.code === "uz-latn" && target.code === "uz-cyrl") ||
          (source.code === "uz-cyrl" && target.code === "uz-latn")
        ) {
          continue;
        }

        chrome.contextMenus.create({
          id: `translate-${source.code}-to-${target.code}`,
          parentId: `translate-from-${source.code}`,
          title: `→ ${target.name}`,
          contexts: ["selection"],
        });
      }
    }

    // --- Separator ---
    chrome.contextMenus.create({
      id: "scriptly-x-separator",
      parentId: "scriptly-x-parent",
      type: "separator",
      contexts: ["selection"],
    });

    // --- Quick translate (using preferred languages) ---
    chrome.contextMenus.create({
      id: "quick-translate",
      parentId: "scriptly-x-parent",
      title: "Quick Translate (EN ↔ RU)",
      contexts: ["selection"],
    });

    console.log("[ScriptlyX] Context menus created");
  });

  // Initialize default settings
  chrome.storage.sync.get("settings", (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
      console.log("[ScriptlyX] Default settings initialized");
    }
  });
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(
  async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (!tab?.id || !info.selectionText) {
      console.warn("[ScriptlyX] Missing tab ID or selection text");
      return;
    }

    const { settings } = (await chrome.storage.sync.get("settings")) as {
      settings: UserSettings;
    };

    if (settings && !settings.enabled) {
      console.log("[ScriptlyX] Extension is disabled");
      return;
    }

    const menuId = info.menuItemId as string;

    // Handle transliteration
    if (CONVERSION_TYPES.has(menuId)) {
      await handleConversion(
        tab.id,
        menuId as ConversionType,
        info.selectionText
      );
      return;
    }

    // Handle translation
    if (menuId.startsWith("translate-") && menuId.includes("-to-")) {
      const match = menuId.match(/^translate-(.+)-to-(.+)$/);
      if (match) {
        const sourceLang = match[1] as Language;
        const targetLang = match[2] as Language;
        await handleTranslation(
          tab.id,
          sourceLang,
          targetLang,
          info.selectionText
        );
      }
      return;
    }

    // Handle quick translate
    if (menuId === "quick-translate") {
      // Auto-detect: if text looks Cyrillic, translate to English; otherwise to Russian
      const hasCyrillic = /[\u0400-\u04FF]/.test(info.selectionText);
      const sourceLang: Language = hasCyrillic ? "ru" : "en";
      const targetLang: Language = hasCyrillic ? "en" : "ru";
      await handleTranslation(
        tab.id,
        sourceLang,
        targetLang,
        info.selectionText
      );
      return;
    }
  }
);

/**
 * Handle transliteration request
 */
async function handleConversion(
  tabId: number,
  conversionType: ConversionType,
  selectedText: string
): Promise<void> {
  const message: ConvertSelectionMessage = {
    action: MESSAGE_TYPES.CONVERT_SELECTION,
    conversionType,
    selectedText,
  };

  try {
    const response: ConversionResult = await chrome.tabs.sendMessage(
      tabId,
      message
    );

    if (response.success) {
      console.log(
        `[ScriptlyX] Converted: "${selectedText}" → "${response.converted}"`
      );
    } else {
      console.warn(`[ScriptlyX] Conversion failed: ${response.error}`);
    }
  } catch (error) {
    console.error("[ScriptlyX] Error:", error);
    await tryInjectAndRetry(tabId, message);
  }
}

/**
 * Handle translation request
 */
async function handleTranslation(
  tabId: number,
  sourceLang: Language,
  targetLang: Language,
  selectedText: string
): Promise<void> {
  console.log(
    `[ScriptlyX] Translating from ${sourceLang} to ${targetLang}: "${selectedText}"`
  );

  // Perform translation in background
  const result = await translate(selectedText, sourceLang, targetLang);

  if (!result.success || !result.translatedText) {
    console.error(`[ScriptlyX] Translation failed: ${result.error}`);
    return;
  }

  console.log(
    `[ScriptlyX] Translated: "${selectedText}" → "${result.translatedText}"`
  );

  // Send result to content script for replacement
  const message: TranslateSelectionMessage = {
    action: MESSAGE_TYPES.TRANSLATE_SELECTION,
    sourceLang,
    targetLang,
    selectedText: result.translatedText, // Send translated text
  };

  try {
    const response: ConversionResult = await chrome.tabs.sendMessage(
      tabId,
      message
    );

    if (!response.success) {
      console.warn(`[ScriptlyX] Replacement failed: ${response.error}`);
    }
  } catch (error) {
    console.error("[ScriptlyX] Error sending to content script:", error);
    await tryInjectAndRetry(tabId, message);
  }
}

/**
 * Try to inject content script and retry message
 */
async function tryInjectAndRetry(
  tabId: number,
  message: ConvertSelectionMessage | TranslateSelectionMessage
): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["build/content/content-script.js"],
    });

    const response: ConversionResult = await chrome.tabs.sendMessage(
      tabId,
      message
    );
    if (response.success) {
      console.log("[ScriptlyX] Success after injection");
    }
  } catch (injectionError) {
    console.error("[ScriptlyX] Cannot inject content script:", injectionError);
  }
}

/**
 * Handle messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === MESSAGE_TYPES.GET_SETTINGS) {
    chrome.storage.sync.get("settings", (result) => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true;
  }

  if (message.action === MESSAGE_TYPES.UPDATE_SETTINGS) {
    chrome.storage.sync.set({ settings: message.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});

console.log("[ScriptlyX] Service worker loaded");
