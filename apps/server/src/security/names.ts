import { containsProfanity } from "./profanity.js";

export const RESERVED_NAMES = new Set([
  "you",
  "host",
  "admin",
  "system",
  "bot",
  "moderator",
  "server",
  // Reference demo bot names
  "pappu",
  "goli",
  "chintu",
  "bunty",
  "sweety",
  "pinky",
  "bittu",
]);

const ALLOWED_NAME_REGEX = /^[a-zA-Z0-9 _'-]+$/;
const URL_REGEX = /(?:https?:\/\/|\.com|\.net|\.org|\.io|\.gg|\.xyz)/i;
const EMAIL_REGEX = /@/;
const PHONE_OR_LONG_DIGITS = /\d{7,}/;

export interface NameValidationResult {
  valid: boolean;
  name?: string;
  error?: string;
}

/**
 * Validates and sanitizes a requested player name.
 */
export function validatePlayerName(raw: unknown): NameValidationResult {
  if (typeof raw !== "string") {
    return { valid: false, error: "Name must be a string" };
  }

  // 1. Trim and collapse multiple consecutive whitespace characters
  const trimmed = raw.trim().replace(/\s+/g, " ");

  // 2. Length check: 2 to 16 characters
  if (trimmed.length < 2 || trimmed.length > 16) {
    return {
      valid: false,
      error: "Name must be between 2 and 16 characters long",
    };
  }

  // 3. Allowed characters
  if (!ALLOWED_NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Name can only contain letters, numbers, spaces, and _ - '",
    };
  }

  // 4. Anti-spam / Links / Emails / Phone numbers
  if (
    URL_REGEX.test(trimmed) ||
    EMAIL_REGEX.test(trimmed) ||
    PHONE_OR_LONG_DIGITS.test(trimmed)
  ) {
    return {
      valid: false,
      error: "Name cannot contain links, emails, or phone numbers",
    };
  }

  // 5. Reserved words
  if (RESERVED_NAMES.has(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: "That name is reserved. Please choose another name.",
    };
  }

  // 6. Profanity check (English + Hinglish with leetspeak normalization)
  if (containsProfanity(trimmed)) {
    return {
      valid: false,
      error: "Name contains prohibited or offensive language.",
    };
  }

  return { valid: true, name: trimmed };
}

/**
 * De-duplicates a player name against existing names in a room.
 * e.g., if "Ninja" exists, returns "Ninja #2", then "Ninja #3".
 */
export function deduplicatePlayerName(
  name: string,
  existingNames: Iterable<string>,
): string {
  const set = new Set(Array.from(existingNames).map((n) => n.toLowerCase()));
  if (!set.has(name.toLowerCase())) {
    return name;
  }

  let counter = 2;
  while (set.has(`${name.toLowerCase()} #${counter}`)) {
    counter++;
  }
  return `${name} #${counter}`;
}

