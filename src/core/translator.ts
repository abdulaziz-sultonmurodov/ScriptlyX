/**
 * Translation Service
 *
 * Uses free translation APIs:
 * 1. MyMemory API (free, no API key required, 5000 chars/day)
 * 2. LibreTranslate (fallback, some instances are free)
 *
 * For production, consider using Google Translate API or DeepL with API keys.
 */

import { Language } from '../shared/types';

/**
 * API language code mapping
 * Some APIs use different codes for language variants
 */
const API_LANG_CODES: Record<Language, string> = {
  'en': 'en',
  'ru': 'ru',
  'uz-latn': 'uz',  // Most APIs just use 'uz'
  'uz-cyrl': 'uz',  // Same - we handle script conversion separately
};

/**
 * Translation result interface
 */
export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
  source?: string;
}

/**
 * MyMemory API response structure
 */
interface MyMemoryResponse {
  responseStatus: number;
  responseData: {
    translatedText: string;
    match: number;
  };
  matches?: Array<{
    translation: string;
    quality: number;
  }>;
}

/**
 * Translate using MyMemory API
 * Free tier: 5000 chars/day, no API key required
 * Docs: https://mymemory.translated.net/doc/spec.php
 */
async function translateWithMyMemory(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const sourceCode = API_LANG_CODES[sourceLang];
  const targetCode = API_LANG_CODES[targetLang];

  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', `${sourceCode}|${targetCode}`);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MyMemoryResponse = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(`API error: status ${data.responseStatus}`);
    }

    // Check for quota exceeded message
    if (data.responseData.translatedText.includes('MYMEMORY WARNING')) {
      throw new Error('Daily translation limit exceeded');
    }

    return {
      success: true,
      translatedText: data.responseData.translatedText,
      source: 'MyMemory',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * LibreTranslate API (fallback)
 * Free instances available at: https://github.com/LibreTranslate/LibreTranslate#mirrors
 */
async function translateWithLibreTranslate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const sourceCode = API_LANG_CODES[sourceLang];
  const targetCode = API_LANG_CODES[targetLang];

  // List of free LibreTranslate instances
  const instances = [
    'https://libretranslate.com',
    'https://translate.argosopentech.com',
    'https://translate.terraprint.co',
  ];

  for (const baseUrl of instances) {
    try {
      const response = await fetch(`${baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceCode,
          target: targetCode,
          format: 'text',
        }),
      });

      if (!response.ok) {
        continue; // Try next instance
      }

      const data = await response.json();

      if (data.translatedText) {
        return {
          success: true,
          translatedText: data.translatedText,
          source: 'LibreTranslate',
        };
      }
    } catch {
      // Try next instance
      continue;
    }
  }

  return {
    success: false,
    error: 'All LibreTranslate instances unavailable',
  };
}

/**
 * Google Translate (unofficial - web scraping approach)
 * This is a fallback that mimics browser requests
 * Note: May be rate limited or blocked
 */
async function translateWithGoogleFree(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  const sourceCode = API_LANG_CODES[sourceLang];
  const targetCode = API_LANG_CODES[targetLang];

  // Using the translate.googleapis.com endpoint (free tier)
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', sourceCode);
  url.searchParams.set('tl', targetCode);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Response format: [[["translated text","original text",null,null,10]],null,"en",...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translatedParts = data[0]
        .filter((part: unknown[]) => Array.isArray(part) && part[0])
        .map((part: unknown[]) => part[0])
        .join('');

      if (translatedParts) {
        return {
          success: true,
          translatedText: translatedParts,
          source: 'Google',
        };
      }
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main translation function with fallback chain
 */
export async function translate(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  // Validate input
  if (!text || text.trim().length === 0) {
    return { success: false, error: 'Empty text' };
  }

  if (sourceLang === targetLang) {
    return { success: true, translatedText: text };
  }

  // Special handling for Uzbek script variants
  // These should use transliteration, not translation
  if (
    (sourceLang === 'uz-latn' && targetLang === 'uz-cyrl') ||
    (sourceLang === 'uz-cyrl' && targetLang === 'uz-latn')
  ) {
    return {
      success: false,
      error: 'Use transliteration for Uzbek script conversion',
    };
  }

  // Try Google first (usually fastest and most reliable)
  let result = await translateWithGoogleFree(text, sourceLang, targetLang);
  if (result.success) {
    return result;
  }

  // Fallback to MyMemory
  result = await translateWithMyMemory(text, sourceLang, targetLang);
  if (result.success) {
    return result;
  }

  // Fallback to LibreTranslate
  result = await translateWithLibreTranslate(text, sourceLang, targetLang);
  if (result.success) {
    return result;
  }

  return {
    success: false,
    error: 'All translation services failed. Please try again later.',
  };
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult[]> {
  // Translate sequentially to avoid rate limits
  const results: TranslationResult[] = [];

  for (const text of texts) {
    const result = await translate(text, sourceLang, targetLang);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
