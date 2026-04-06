import type { LoggerPort } from "@odysseon/whoami-core";

export const consoleLogger: LoggerPort = {
  info: (msg, ...meta): void => console.info("[whoami]", msg, ...meta),
  warn: (msg, ...meta): void => console.warn("[whoami]", msg, ...meta),
  error: (msg, trace, ...meta): void =>
    console.error("[whoami]", msg, trace, ...meta),
};
