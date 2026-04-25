import type { ClockPort } from "@odysseon/whoami-core";

export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined)
    throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
