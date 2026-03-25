#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function findTsconfigPath() {
  if (process.env.TSX_TSCONFIG_PATH && existsSync(process.env.TSX_TSCONFIG_PATH)) {
    return process.env.TSX_TSCONFIG_PATH;
  }

  const searchRoots = [
    process.cwd(),
    dirname(fileURLToPath(import.meta.url)),
  ];

  for (const root of searchRoots) {
    let current = root;

    while (true) {
      for (const candidate of ["tsconfig.base.json", "tsconfig.json"]) {
        const candidatePath = join(current, candidate);
        if (existsSync(candidatePath)) {
          return candidatePath;
        }
      }

      const parent = dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
  }

  return undefined;
}

const tsconfigPath = findTsconfigPath();
if (tsconfigPath) {
  process.env.TSX_TSCONFIG_PATH = tsconfigPath;
}

await import("tsx");
