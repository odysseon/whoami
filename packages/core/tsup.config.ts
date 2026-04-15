import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/internal/index.ts",
    // Sub-path exports — each module is a separate build output so bundlers
    // can tree-shake unused auth methods when consumers import selectively.
    "src/password/index.ts",
    "src/oauth/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  tsconfig: "tsconfig.tsup.json",
});
