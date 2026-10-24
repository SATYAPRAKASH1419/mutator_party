// ─── src/security/profanity.ts ────────────────────────────────────────────────
// Server-side profanity filter with leetspeak & look-alike normalization.
// Covers English and Hinglish terms.
// Reference: backend-spec s7 & backend-implementation-plan Step 7.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Common English and Hinglish profanity / offensive tokens.
 */
export const PROFANITY_LIST: readonly string[] = [
  // English
  "fuck",
  "shit",
  "asshole",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  // Hinglish
  "bhenchod",
  "madarchod",
  "chutiya",
  "gaand",
  "bhosadi",
  "bhosdike",
  "harami",
  "randi",
  "lodu",
  "lauda",
  "mc",
  "bc",
] as const;

/**
 * Leetspeak / look-alike translation map.
 */
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "8": "b",
};

/**
 * Normalizes text to uncover hidden leetspeak variations:
 * 1. Convert to lowercase
 * 2. Translate common leet symbols to alphabetic characters
 * 3. Strip non-alphanumeric separators (spaces, dots, underscores, dashes)
 * 4. Deduplicate consecutive repeated characters (e.g. "fuuuck" -> "fuck")
 */
export function normalizeText(raw: string): string {
  let normalized = raw.toLowerCase();

  // 1. Leetspeak substitution
  let substituted = "";
  for (const ch of normalized) {
    substituted += LEET_MAP[ch] ?? ch;
  }

  // 2. Remove symbols and whitespace
  const stripped = substituted.replace(/[^a-z0-9]/g, "");

  // 3. Collapse repeating characters: e.g. "fffuuuuccckkk" -> "fuck"
  const collapsed = stripped.replace(/(.)\1+/g, "$1");

  return collapsed;
}

/**
 * Checks whether the raw string contains profanity or prohibited words.
 */
export function containsProfanity(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;

  const directLower = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalized = normalizeText(raw);

  for (const word of PROFANITY_LIST) {
    if (word.length <= 2) {
      // For short slang tokens like 'mc' / 'bc', match standalone token boundaries to avoid
      // false positives on common words (e.g. 'McQueen', 'Tomcat', 'abc', 'Broadcast')
      const wordRegex = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, "i");
      if (wordRegex.test(raw)) {
        return true;
      }
    } else {
      // Exact or substring match in directly cleaned or normalized forms
      if (directLower.includes(word) || normalized.includes(word)) {
        return true;
      }
    }
  }

  return false;
}

