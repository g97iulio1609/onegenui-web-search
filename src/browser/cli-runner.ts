// =============================================================================
// CLI Runner - Executes agent-browser commands
// =============================================================================

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CommandResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function runCommand(
  command: string,
  json = true,
): Promise<CommandResult> {
  try {
    const fullCommand = `npx agent-browser ${command}${json ? " --json" : ""}`;
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (stderr && !stderr.includes("WARN")) {
      console.warn("[agent-browser] stderr:", stderr);
    }

    if (json && stdout.trim()) {
      try {
        const parsed = JSON.parse(stdout.trim());
        return { success: true, data: parsed };
      } catch {
        return { success: true, data: stdout.trim() };
      }
    }

    return { success: true, data: stdout.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[agent-browser] command failed:", message);
    return { success: false, error: message };
  }
}
