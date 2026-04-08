import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/internal/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  tsconfig: "tsconfig.tsup.json",
});
