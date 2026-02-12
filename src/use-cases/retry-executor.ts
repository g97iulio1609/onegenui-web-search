/**
 * Retry Executor — exponential backoff retry with per-attempt timeout.
 */

import { createLogger } from "@onegenui/utils";

const log = createLogger({ prefix: "web-search" });

/** Retry configuration. */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Execute `fn` with exponential-backoff retry and a per-operation deadline. */
export async function executeWithRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  adapterName: string,
  retryConfig: RetryConfig,
  options: { timeoutMs: number; signal?: AbortSignal },
): Promise<T> {
  const { maxRetries, initialDelay, backoffMultiplier, maxDelay } = retryConfig;
  const deadline = Date.now() + options.timeoutMs;
  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options.signal?.aborted) throw new Error(`${adapterName} aborted`);

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new Error(`${adapterName} timed out after ${options.timeoutMs}ms`);
    }

    const ctrl = new AbortController();
    const abortParent = () => ctrl.abort();
    const tid = setTimeout(() => ctrl.abort(), remainingMs);

    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(tid);
        throw new Error(`${adapterName} aborted`);
      }
      options.signal.addEventListener("abort", abortParent, { once: true });
    }

    try {
      return await fn(ctrl.signal);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (options.signal?.aborted) throw new Error(`${adapterName} aborted`);
      if (Date.now() >= deadline) {
        throw new Error(
          `${adapterName} timed out after ${options.timeoutMs}ms`,
        );
      }
      if (attempt < maxRetries) {
        log.debug(
          `[RetryExecutor] ${adapterName} attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        );
        await sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    } finally {
      clearTimeout(tid);
      options.signal?.removeEventListener("abort", abortParent);
    }
  }

  throw lastError ?? new Error(`${adapterName} failed after ${maxRetries} retries`);
}
