import { fileURLToPath } from "node:url";

process.env.TSX_TSCONFIG_PATH ??= fileURLToPath(
  new URL("../tsconfig.base.json", import.meta.url),
);

await import("tsx");
