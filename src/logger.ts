// =============================================================================
// @onegenui/web-search - Debug Logger
// =============================================================================

import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve(process.cwd(), "web.log");
const DEBUG = process.env.NODE_ENV === "development";

/**
 * Write a debug log entry to web.log file (and console in dev mode)
 */
export function logDebug(
  context: string,
  message: string,
  data?: unknown,
): void {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${context}] ${message}${data ? ` | ${JSON.stringify(data)}` : ""}`;

  // Console only in development
  if (DEBUG) {
    console.log(`🔍 ${entry}`);
  }

  try {
    fs.appendFileSync(LOG_FILE, entry + "\n");
  } catch {
    // File write failed silently
  }
}

/**
 * Clear the log file
 */
export function clearLog(): void {
  try {
    fs.writeFileSync(
      LOG_FILE,
      `--- Web Search Log Started: ${new Date().toISOString()} ---\n`,
    );
  } catch (e) {
    // Ignore
  }
}
