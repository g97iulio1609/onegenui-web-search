/**
 * Python path resolver for Crawl4AI
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Find the Python executable path, preferring virtual environment
 */
export function findPythonPath(pythonDir: string): string {
  const venvPython = path.resolve(pythonDir, ".venv/bin/python");
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  const venvPython3 = path.resolve(pythonDir, ".venv/bin/python3");
  if (fs.existsSync(venvPython3)) {
    return venvPython3;
  }

  try {
    const systemPython = execSync("which python3", { encoding: "utf8" }).trim();
    if (systemPython && fs.existsSync(systemPython)) {
      console.warn(
        `[Crawl4AI] Virtual environment not found at ${pythonDir}/.venv, using system Python: ${systemPython}`,
      );
      return systemPython;
    }
  } catch {
    // python3 not found
  }

  try {
    const systemPython = execSync("which python", { encoding: "utf8" }).trim();
    if (systemPython && fs.existsSync(systemPython)) {
      console.warn(
        `[Crawl4AI] Virtual environment not found at ${pythonDir}/.venv, using system Python: ${systemPython}`,
      );
      return systemPython;
    }
  } catch {
    // python not found
  }

  throw new Error(
    `[Crawl4AI] Python not found. Please either:\n` +
      `1. Create a virtual environment: cd ${pythonDir} && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt\n` +
      `2. Or ensure python3 is available on your system PATH`,
  );
}

/**
 * Find the web-search package Python directory
 */
export function findPythonDir(): string {
  let root = process.cwd();

  for (let i = 0; i < 5; i++) {
    const lockPath = path.join(root, "pnpm-lock.yaml");
    const pkgPath = path.join(root, "packages/web-search/python/crawler.py");
    if (fs.existsSync(lockPath) || fs.existsSync(pkgPath)) {
      break;
    }
    root = path.dirname(root);
  }

  const webSearchPackagePaths = [
    path.resolve(root, "packages/web-search/python"),
    path.resolve(process.cwd(), "node_modules/@onegenui/web-search/python"),
  ];

  let pythonDir = webSearchPackagePaths[0]!;
  for (const p of webSearchPackagePaths) {
    try {
      fs.accessSync(path.join(p, "crawler.py"));
      pythonDir = p;
      break;
    } catch {
      continue;
    }
  }

  return pythonDir;
}
