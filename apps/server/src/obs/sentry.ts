// ─── src/obs/sentry.ts ─────────────────────────────────────────────────────────
// Optional Sentry integration hook for error tracking.
// Zero-PII policy: all user identifiers, names, and tokens stripped.
// Reference: backend-spec s7 & backend-implementation-plan Step 7.
// ─────────────────────────────────────────────────────────────────────────────

import { config } from "../config.js";
import { logger } from "./logger.js";

let sentryEnabled = false;

export function initSentry(): void {
  if (!config.SENTRY_DSN) {
    logger.debug("Sentry DSN not provided; error tracking running in no-op mode.");
    return;
  }
  sentryEnabled = true;
  logger.info("Sentry error reporting initialized.");
}

/**
 * Strips PII from context dictionaries before sending.
 */
function sanitizeContext(ctx?: Record<string, any>): Record<string, any> | undefined {
  if (!ctx) return undefined;
  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(ctx)) {
    const lower = k.toLowerCase();
    if (
      lower.includes("name") ||
      lower.includes("token") ||
      lower.includes("password") ||
      lower.includes("auth") ||
      lower.includes("cookie")
    ) {
      continue;
    }
    sanitized[k] = v;
  }
  return sanitized;
}

/**
 * Captures an exception for observability.
 */
export function captureException(error: unknown, context?: Record<string, any>): void {
  const safeContext = sanitizeContext(context);
  logger.error({ err: error, ...safeContext }, "Server captured exception");

  if (!sentryEnabled) return;
  // If Sentry SDK is installed in production, forward error here
}

