/**
 * Uzbek Latin ↔ Cyrillic Transliteration
 *
 * Based on the official Uzbek Latin alphabet adopted in 1995
 * and the Cyrillic alphabet used until 1992 (still in use).
 *
 * Reference: https://en.wikipedia.org/wiki/Uzbek_alphabet
 */

export interface CharacterMapping {
  latin: string;
  cyrillic: string;
}

/**
 * Complete Uzbek Latin to Cyrillic mapping
 * Order matters: longer sequences first for proper matching
 */
export const UZBEK_LATIN_CYRILLIC_MAP: CharacterMapping[] = [
  // Digraphs and special combinations (must come first)
  { latin: 'ch', cyrillic: 'ч' },
  { latin: 'sh', cyrillic: 'ш' },
  { latin: "g'", cyrillic: 'ғ' },
  { latin: "o'", cyrillic: 'ў' },
  { latin: 'ng', cyrillic: 'нг' },
  { latin: "'", cyrillic: 'ъ' },  // Tutuq belgisi (glottal stop)

  // Single letters - uppercase handled by case matching
  { latin: 'a', cyrillic: 'а' },
  { latin: 'b', cyrillic: 'б' },
  { latin: 'd', cyrillic: 'д' },
  { latin: 'e', cyrillic: 'е' },
  { latin: 'f', cyrillic: 'ф' },
  { latin: 'g', cyrillic: 'г' },
  { latin: 'h', cyrillic: 'ҳ' },
  { latin: 'i', cyrillic: 'и' },
  { latin: 'j', cyrillic: 'ж' },
  { latin: 'k', cyrillic: 'к' },
  { latin: 'l', cyrillic: 'л' },
  { latin: 'm', cyrillic: 'м' },
  { latin: 'n', cyrillic: 'н' },
  { latin: 'o', cyrillic: 'о' },
  { latin: 'p', cyrillic: 'п' },
  { latin: 'q', cyrillic: 'қ' },
  { latin: 'r', cyrillic: 'р' },
  { latin: 's', cyrillic: 'с' },
  { latin: 't', cyrillic: 'т' },
  { latin: 'u', cyrillic: 'у' },
  { latin: 'v', cyrillic: 'в' },
  { latin: 'x', cyrillic: 'х' },
  { latin: 'y', cyrillic: 'й' },
  { latin: 'z', cyrillic: 'з' },

  // Additional Cyrillic-only letters (for reverse mapping)
  // These don't have direct Latin equivalents but may appear in text
];

/**
 * Additional Cyrillic to Latin mappings for characters
 * that don't have a 1:1 Latin equivalent
 */
export const UZBEK_CYRILLIC_TO_LATIN_EXTRAS: CharacterMapping[] = [
  { latin: 'ye', cyrillic: 'е' },  // At word start or after vowel
  { latin: 'yo', cyrillic: 'ё' },
  { latin: 'yu', cyrillic: 'ю' },
  { latin: 'ya', cyrillic: 'я' },
  { latin: 'ts', cyrillic: 'ц' },  // Used in loanwords
  { latin: 'shch', cyrillic: 'щ' }, // Rare, in loanwords
  { latin: '', cyrillic: 'ь' },    // Soft sign (usually omitted)
  { latin: '', cyrillic: 'ъ' },    // Hard sign
];

/**
 * Build lookup maps
 */
function buildLookupMaps() {
  const latinToCyrillic = new Map<string, string>();
  const cyrillicToLatin = new Map<string, string>();

  // Main mappings
  for (const { latin, cyrillic } of UZBEK_LATIN_CYRILLIC_MAP) {
    latinToCyrillic.set(latin, cyrillic);
    cyrillicToLatin.set(cyrillic, latin);
  }

  // Extra Cyrillic to Latin mappings
  for (const { latin, cyrillic } of UZBEK_CYRILLIC_TO_LATIN_EXTRAS) {
    if (!cyrillicToLatin.has(cyrillic)) {
      cyrillicToLatin.set(cyrillic, latin);
    }
  }

  return { latinToCyrillic, cyrillicToLatin };
}

const { latinToCyrillic, cyrillicToLatin } = buildLookupMaps();

/**
 * Get sorted keys (longest first)
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
 * Apply case from source to target
 */
function matchCase(source: string, target: string): string {
  if (source.length === 0 || target.length === 0) return target;

  // All uppercase
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return target.toUpperCase();
  }

  // First letter uppercase
  if (isUpperCase(source[0])) {
    return target[0].toUpperCase() + target.slice(1);
  }

  return target;
}

/**
 * Convert Uzbek Latin to Cyrillic
 */
export function uzbekLatinToCyrillic(text: string): string {
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
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Convert Uzbek Cyrillic to Latin
 */
export function uzbekCyrillicToLatin(text: string): string {
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
      result += text[i];
      i++;
    }
  }

  return result;
}
