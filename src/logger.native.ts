// =============================================================================
// @onegenui/web-search - Debug Logger (React Native Compatible)
// =============================================================================
// Console-only logger without Node.js fs/path dependencies.

const DEBUG =
  typeof process !== "undefined" && process.env?.NODE_ENV === "development";

/**
 * Write a debug log entry to console (React Native compatible).
 * File logging is not available on this platform.
 */
export function logDebug(
  context: string,
  message: string,
  data?: unknown,
): void {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${context}] ${message}${data ? ` | ${JSON.stringify(data)}` : ""}`;

  if (DEBUG) {
    console.log(entry);
  }
}

/**
 * Clear the log (no-op on React Native)
 */
export function clearLog(): void {
  // No file-based logging on React Native
}
