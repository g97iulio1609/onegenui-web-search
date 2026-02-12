/**
 * Circuit Breaker — prevents cascading failures by disabling adapters
 * that exceed a threshold of consecutive failures.
 */

import { createLogger } from "@onegenui/utils";

const log = createLogger({ prefix: "web-search" });

interface CircuitState {
  failures: number;
  lastFailure: number;
  open: boolean;
}

/** Simple circuit breaker for adapter fallback chains. */
export class CircuitBreaker {
  private state = new Map<string, CircuitState>();

  constructor(
    private threshold = 5,
    private resetTimeMs = 60_000,
  ) {}

  /** Returns true if the circuit for `name` is currently open (failing). */
  isOpen(name: string): boolean {
    const s = this.state.get(name);
    if (!s || !s.open) return false;

    if (Date.now() - s.lastFailure > this.resetTimeMs) {
      s.open = false;
      s.failures = 0;
      return false;
    }
    return true;
  }

  /** Record a failure; opens the circuit once threshold is reached. */
  recordFailure(name: string): void {
    const s = this.state.get(name) ?? {
      failures: 0,
      lastFailure: 0,
      open: false,
    };

    s.failures++;
    s.lastFailure = Date.now();

    if (s.failures >= this.threshold) {
      s.open = true;
      log.warn(
        `[CircuitBreaker] Circuit opened for ${name} after ${s.failures} failures`,
      );
    }
    this.state.set(name, s);
  }

  /** Reset the circuit after a successful operation. */
  reset(name: string): void {
    this.state.delete(name);
  }
}
