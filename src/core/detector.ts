/**
 * Script Detection Utility
 *
 * Detects whether text is primarily Latin, Cyrillic, or mixed.
 * Useful for auto-detection features in the future.
 */

/**
 * Unicode ranges for script detection
 */
const CYRILLIC_RANGE = /[\u0400-\u04FF]/;
const LATIN_RANGE = /[A-Za-z]/;

export type ScriptType = 'latin' | 'cyrillic' | 'mixed' | 'unknown';

export interface ScriptAnalysis {
  type: ScriptType;
  latinCount: number;
  cyrillicCount: number;
  totalLetters: number;
  latinPercentage: number;
  cyrillicPercentage: number;
}

/**
 * Analyze text to determine the predominant script
 */
export function analyzeScript(text: string): ScriptAnalysis {
  let latinCount = 0;
  let cyrillicCount = 0;

  for (const char of text) {
    if (LATIN_RANGE.test(char)) {
      latinCount++;
    } else if (CYRILLIC_RANGE.test(char)) {
      cyrillicCount++;
    }
  }

  const totalLetters = latinCount + cyrillicCount;

  if (totalLetters === 0) {
    return {
      type: 'unknown',
      latinCount: 0,
      cyrillicCount: 0,
      totalLetters: 0,
      latinPercentage: 0,
      cyrillicPercentage: 0,
    };
  }

  const latinPercentage = (latinCount / totalLetters) * 100;
  const cyrillicPercentage = (cyrillicCount / totalLetters) * 100;

  let type: ScriptType;

  if (latinPercentage >= 90) {
    type = 'latin';
  } else if (cyrillicPercentage >= 90) {
    type = 'cyrillic';
  } else if (totalLetters > 0) {
    type = 'mixed';
  } else {
    type = 'unknown';
  }

  return {
    type,
    latinCount,
    cyrillicCount,
    totalLetters,
    latinPercentage,
    cyrillicPercentage,
  };
}

/**
 * Quick check if text contains any Cyrillic characters
 */
export function containsCyrillic(text: string): boolean {
  return CYRILLIC_RANGE.test(text);
}

/**
 * Quick check if text contains any Latin characters
 */
export function containsLatin(text: string): boolean {
  return LATIN_RANGE.test(text);
}

/**
 * Determine the best conversion type based on text analysis
 * Returns null if text is too mixed or unknown
 */
export function suggestConversion(text: string): 'latin-to-cyrillic' | 'cyrillic-to-latin' | null {
  const analysis = analyzeScript(text);

  if (analysis.type === 'latin') {
    return 'latin-to-cyrillic';
  }

  if (analysis.type === 'cyrillic') {
    return 'cyrillic-to-latin';
  }

  return null;
}
