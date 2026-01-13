/**
 * Bidirectional Latin ↔ Cyrillic character mapping
 *
 * This mapping follows a phonetic transliteration system commonly used
 * for Russian Cyrillic. Multi-character sequences (digraphs/trigraphs)
 * are handled by processing longer sequences first.
 */

export interface CharacterMapping {
  latin: string;
  cyrillic: string;
}

/**
 * Complete mapping table for Latin to Cyrillic conversion
 * Order matters: longer sequences must be checked before shorter ones
 */
export const LATIN_CYRILLIC_MAP: CharacterMapping[] = [
  // Trigraphs (must come first)
  { latin: 'shch', cyrillic: 'щ' },

  // Digraphs
  { latin: 'yo', cyrillic: 'ё' },
  { latin: 'zh', cyrillic: 'ж' },
  { latin: 'kh', cyrillic: 'х' },
  { latin: 'ts', cyrillic: 'ц' },
  { latin: 'ch', cyrillic: 'ч' },
  { latin: 'sh', cyrillic: 'ш' },
  { latin: 'yu', cyrillic: 'ю' },
  { latin: 'ya', cyrillic: 'я' },
  { latin: 'ye', cyrillic: 'э' },

  // Special characters
  { latin: "y'", cyrillic: 'ы' },
  { latin: '"', cyrillic: 'ъ' },
  { latin: "'", cyrillic: 'ь' },

  // Single characters
  { latin: 'a', cyrillic: 'а' },
  { latin: 'b', cyrillic: 'б' },
  { latin: 'v', cyrillic: 'в' },
  { latin: 'g', cyrillic: 'г' },
  { latin: 'd', cyrillic: 'д' },
  { latin: 'e', cyrillic: 'е' },
  { latin: 'z', cyrillic: 'з' },
  { latin: 'i', cyrillic: 'и' },
  { latin: 'y', cyrillic: 'й' },
  { latin: 'k', cyrillic: 'к' },
  { latin: 'l', cyrillic: 'л' },
  { latin: 'm', cyrillic: 'м' },
  { latin: 'n', cyrillic: 'н' },
  { latin: 'o', cyrillic: 'о' },
  { latin: 'p', cyrillic: 'п' },
  { latin: 'r', cyrillic: 'р' },
  { latin: 's', cyrillic: 'с' },
  { latin: 't', cyrillic: 'т' },
  { latin: 'u', cyrillic: 'у' },
  { latin: 'f', cyrillic: 'ф' },
  { latin: 'h', cyrillic: 'х' },
  { latin: 'c', cyrillic: 'ц' },
  { latin: 'w', cyrillic: 'в' },
  { latin: 'x', cyrillic: 'кс' },
  { latin: 'q', cyrillic: 'к' },
];

/**
 * Build lookup maps for efficient conversion
 */
function buildLookupMaps() {
  const latinToCyrillic = new Map<string, string>();
  const cyrillicToLatin = new Map<string, string>();

  for (const { latin, cyrillic } of LATIN_CYRILLIC_MAP) {
    latinToCyrillic.set(latin, cyrillic);
    cyrillicToLatin.set(cyrillic, latin);
  }

  return { latinToCyrillic, cyrillicToLatin };
}

const { latinToCyrillic, cyrillicToLatin } = buildLookupMaps();

/**
 * Get sorted keys for a map (longest first for greedy matching)
 */
function getSortedKeys(map: Map<string, string>): string[] {
  return Array.from(map.keys()).sort((a, b) => b.length - a.length);
}

const sortedLatinKeys = getSortedKeys(latinToCyrillic);
const sortedCyrillicKeys = getSortedKeys(cyrillicToLatin);

/**
 * Check if a character is uppercase
 */
function isUpperCase(char: string): boolean {
  return char !== char.toLowerCase() && char === char.toUpperCase();
}

/**
 * Apply case from source to target string
 */
function matchCase(source: string, target: string): string {
  if (source.length === 0 || target.length === 0) return target;

  // If all uppercase, return target uppercase
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return target.toUpperCase();
  }

  // If first char is uppercase, capitalize first char of target
  if (isUpperCase(source[0])) {
    return target[0].toUpperCase() + target.slice(1);
  }

  return target;
}

/**
 * Convert Latin text to Cyrillic
 */
export function latinToCyrillicConvert(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    let matched = false;

    for (const key of sortedLatinKeys) {
      const chunk = text.substring(i, i + key.length);
      const chunkLower = chunk.toLowerCase();

      if (chunkLower === key) {
        const replacement = latinToCyrillic.get(key)!;
        result += matchCase(chunk, replacement);
        i += key.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Pass through unchanged (numbers, punctuation, already Cyrillic, etc.)
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Convert Cyrillic text to Latin
 */
export function cyrillicToLatinConvert(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    let matched = false;

    for (const key of sortedCyrillicKeys) {
      const chunk = text.substring(i, i + key.length);
      const chunkLower = chunk.toLowerCase();

      if (chunkLower === key) {
        const replacement = cyrillicToLatin.get(key)!;
        result += matchCase(chunk, replacement);
        i += key.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Pass through unchanged
      result += text[i];
      i++;
    }
  }

  return result;
}
