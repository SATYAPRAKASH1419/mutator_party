// ─── src/security/origin.ts ───────────────────────────────────────────────────
// Validates incoming HTTP / WebSocket Origin headers against configured allowlist.
// Reference: backend-spec section 7.
// ─────────────────────────────────────────────────────────────────────────────

import type { IncomingMessage } from "node:http";

/**
 * Validates an Origin string against an array of allowed origins.
 * Supports exact matches and wildcard ('*').
 * Non-browser clients or requests without an Origin header are permitted.
 */
export function validateOrigin(
  origin: string | undefined,
  allowedOrigins: readonly string[],
): boolean {
  if (!origin) {
    return true; // Non-browser clients (e.g. curl, tests, mobile native)
  }

  const normalized = origin.trim().toLowerCase().replace(/\/+$/, "");

  return allowedOrigins.some((allowed) => {
    const cleanAllowed = allowed.trim().toLowerCase().replace(/\/+$/, "");
    if (cleanAllowed === "*") return true;
    return cleanAllowed === normalized;
  });
}

/**
 * Convenience helper for extracting and validating Origin from an IncomingMessage.
 */
export function isOriginAllowed(
  req: IncomingMessage,
  allowedOrigins: readonly string[],
): boolean {
  const origin = req.headers.origin;
  return validateOrigin(origin, allowedOrigins);
}

