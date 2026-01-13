/**
 * Supported languages
 */
export type Language = "en" | "ru" | "uz-latn" | "uz-cyrl";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  script: "latin" | "cyrillic";
}

export const LANGUAGES: Record<Language, LanguageInfo> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "latin",
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    script: "cyrillic",
  },
  "uz-latn": {
    code: "uz-latn",
    name: "Uzbek (Latin)",
    nativeName: "O'zbek",
    script: "latin",
  },
  "uz-cyrl": {
    code: "uz-cyrl",
    name: "Uzbek (Cyrillic)",
    nativeName: "Ўзбек",
    script: "cyrillic",
  },
};

/**
 * Conversion types supported by ScriptlyX
 */
export type ConversionType =
  | "latin-to-cyrillic"
  | "cyrillic-to-latin"
  | "uz-latn-to-uz-cyrl"
  | "uz-cyrl-to-uz-latn";

/**
 * Translation action type (source-to-target)
 */
export type TranslationType = `translate-${Language}-to-${Language}`;

/**
 * Combined action type
 */
export type ActionType = ConversionType | TranslationType;

/**
 * Message types for communication between background and content scripts
 */
export const MESSAGE_TYPES = {
  CONVERT_SELECTION: "CONVERT_SELECTION",
  TRANSLATE_SELECTION: "TRANSLATE_SELECTION",
  CONVERSION_RESULT: "CONVERSION_RESULT",
  GET_SETTINGS: "GET_SETTINGS",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

/**
 * Message sent from background to content script to trigger conversion
 */
export interface ConvertSelectionMessage {
  action: typeof MESSAGE_TYPES.CONVERT_SELECTION;
  conversionType: ConversionType;
  selectedText: string;
}

/**
 * Message sent from background to content script to trigger translation
 */
export interface TranslateSelectionMessage {
  action: typeof MESSAGE_TYPES.TRANSLATE_SELECTION;
  sourceLang: Language;
  targetLang: Language;
  selectedText: string;
}

export type SelectionMessage =
  | ConvertSelectionMessage
  | TranslateSelectionMessage;

/**
 * Response from content script after conversion/translation attempt
 */
export interface ConversionResult {
  success: boolean;
  converted?: string;
  error?: string;
}

/**
 * User settings stored in chrome.storage.sync
 */
export interface UserSettings {
  enabled: boolean;
  showNotifications: boolean;
  mappingVariant: "standard" | "phonetic";
  preferredSourceLang: Language;
  preferredTargetLang: Language;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: UserSettings = {
  enabled: true,
  showNotifications: true,
  mappingVariant: "standard",
  preferredSourceLang: "en",
  preferredTargetLang: "ru",
};

/**
 * Context menu item configuration
 */
export interface ContextMenuItem {
  id: string;
  title: string;
  parentId?: string;
}

/**
 * Menu structure for script conversions
 */
export const CONVERSION_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "latin-to-cyrillic",
    title: "Latin → Cyrillic (Russian)",
  },
  {
    id: "cyrillic-to-latin",
    title: "Cyrillic → Latin (Russian)",
  },
  {
    id: "uz-latn-to-uz-cyrl",
    title: "Uzbek Latin → Cyrillic",
  },
  {
    id: "uz-cyrl-to-uz-latn",
    title: "Uzbek Cyrillic → Latin",
  },
];

/**
 * Generate translation menu items dynamically
 */
export function getTranslationMenuItems(): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];
  const languages = Object.values(LANGUAGES);

  for (const source of languages) {
    for (const target of languages) {
      if (source.code !== target.code) {
        // Skip Uzbek Latin to Uzbek Cyrillic (use transliteration instead)
        if (
          (source.code === "uz-latn" && target.code === "uz-cyrl") ||
          (source.code === "uz-cyrl" && target.code === "uz-latn")
        ) {
          continue;
        }

        items.push({
          id: `translate-${source.code}-to-${target.code}`,
          title: `${source.name} → ${target.name}`,
        });
      }
    }
  }

  return items;
}
