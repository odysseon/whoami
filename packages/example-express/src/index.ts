import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import express from "express";

/**
 * Starts the example server.
 *
 * @param port - The port to listen on.
 * @returns The started HTTP server.
 */
export function startServer(port: number = 3000): Server {
  const app = express();

  return app.listen(port, (): void => {
    console.info(`Example Whoami server listening on port ${port}.`);
  });
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer(Number(process.env.PORT ?? "3000"));
}
