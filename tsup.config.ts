import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/index.native.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["agent-browser"],
});
