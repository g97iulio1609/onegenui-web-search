// =============================================================================
// @onegenui/web-search - Debug Logger
// =============================================================================

import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve(process.cwd(), "web.log");

/**
 * Write a debug log entry to web.log file AND console
 */
export function logDebug(
  context: string,
  message: string,
  data?: unknown,
): void {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${context}] ${message}${data ? ` | ${JSON.stringify(data)}` : ""}`;

  // Always log to console for real-time visibility
  console.log(`🔍 ${entry}`);

  try {
    fs.appendFileSync(LOG_FILE, entry + "\n");
  } catch (e) {
    // File write failed, console already logged above
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
