import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger.native", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  async function loadModule() {
    return (await import("../logger.native")) as {
      logDebug: (ctx: string, msg: string, data?: unknown) => void;
      clearLog: () => void;
    };
  }

  it("logDebug is a function", async () => {
    const { logDebug } = await loadModule();
    expect(typeof logDebug).toBe("function");
  });

  it("clearLog is a function", async () => {
    const { clearLog } = await loadModule();
    expect(typeof clearLog).toBe("function");
  });

  it("logDebug calls console.log in development mode", async () => {
    process.env.NODE_ENV = "development";
    const { logDebug } = await loadModule();

    logDebug("CTX", "hello");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0]![0]).toContain("[CTX] hello");
  });

  it("logDebug does NOT call console.log in production mode", async () => {
    process.env.NODE_ENV = "production";
    const { logDebug } = await loadModule();

    logDebug("CTX", "hello");

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("logDebug formats output correctly: [ISO timestamp] [CONTEXT] message | data", async () => {
    process.env.NODE_ENV = "development";
    const { logDebug } = await loadModule();

    const data = { key: "value" };
    logDebug("MY_CTX", "test message", data);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0]![0] as string;

    // Matches [ISO timestamp] [MY_CTX] test message | {"key":"value"}
    expect(output).toMatch(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[MY_CTX\] test message \| \{"key":"value"\}$/,
    );
  });

  it("logDebug works with no data parameter", async () => {
    process.env.NODE_ENV = "development";
    const { logDebug } = await loadModule();

    logDebug("CTX", "no data");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0]![0] as string;

    // Should NOT contain the " | " separator when no data is provided
    expect(output).toMatch(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[CTX\] no data$/,
    );
    expect(output).not.toContain(" | ");
  });

  it("clearLog does not throw", async () => {
    const { clearLog } = await loadModule();
    expect(() => clearLog()).not.toThrow();
  });
});
