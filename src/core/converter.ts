/**
 * Conversion Engine
 *
 * Provides a pluggable interface for text conversion and translation.
 * - Transliteration: Latin ↔ Cyrillic (Russian, Uzbek)
 * - Translation: English, Russian, Uzbek
 */

import { ConversionType, Language } from '../shared/types';
import {
  latinToCyrillicConvert,
  cyrillicToLatinConvert,
  uzbekLatinToCyrillic,
  uzbekCyrillicToLatin,
} from './mappings';
import { translate, TranslationResult } from './translator';

/**
 * Converter interface for transliteration
 */
export interface Converter {
  id: ConversionType;
  name: string;
  convert: (text: string) => string;
}

/**
 * Registry of transliteration converters
 */
const converters = new Map<ConversionType, Converter>();

/**
 * Register a converter
 */
export function registerConverter(converter: Converter): void {
  converters.set(converter.id, converter);
}

/**
 * Get a converter by ID
 */
export function getConverter(id: ConversionType): Converter | undefined {
  return converters.get(id);
}

/**
 * Get all registered converters
 */
export function getAllConverters(): Converter[] {
  return Array.from(converters.values());
}

/**
 * Convert text using transliteration
 * @throws Error if converter not found
 */
export function convert(text: string, type: ConversionType): string {
  const converter = converters.get(type);

  if (!converter) {
    throw new Error(`Unknown converter: ${type}`);
  }

  return converter.convert(text);
}

/**
 * Translate text between languages
 */
export async function translateText(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> {
  return translate(text, sourceLang, targetLang);
}

/**
 * Check if an action is a transliteration type
 */
export function isConversionType(action: string): action is ConversionType {
  return converters.has(action as ConversionType);
}

/**
 * Check if an action is a translation type
 */
export function isTranslationType(action: string): boolean {
  return action.startsWith('translate-');
}

/**
 * Parse translation action to get source and target languages
 */
export function parseTranslationAction(action: string): { source: Language; target: Language } | null {
  const match = action.match(/^translate-(.+)-to-(.+)$/);
  if (!match) return null;

  return {
    source: match[1] as Language,
    target: match[2] as Language,
  };
}

// Register built-in converters

// Russian transliteration
registerConverter({
  id: 'latin-to-cyrillic',
  name: 'Latin → Cyrillic (Russian)',
  convert: latinToCyrillicConvert,
});

registerConverter({
  id: 'cyrillic-to-latin',
  name: 'Cyrillic → Latin (Russian)',
  convert: cyrillicToLatinConvert,
});

// Uzbek transliteration
registerConverter({
  id: 'uz-latn-to-uz-cyrl',
  name: 'Uzbek Latin → Cyrillic',
  convert: uzbekLatinToCyrillic,
});

registerConverter({
  id: 'uz-cyrl-to-uz-latn',
  name: 'Uzbek Cyrillic → Latin',
  convert: uzbekCyrillicToLatin,
});
