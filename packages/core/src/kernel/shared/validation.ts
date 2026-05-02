import { InvalidConfigurationError } from "../domain/errors/index.js";

/**
 * Validates that a required port is present and not null/undefined.
 */
export function requirePort<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) {
    throw new InvalidConfigurationError(
      `Missing required port: ${name}. ` +
        `Ensure you pass a valid implementation to the module factory.`,
    );
  }
  return value;
}

/**
 * Validates that a value is a function (for callbacks, generators, etc).
 */
export function requireFunction<T extends (...args: unknown[]) => unknown>(
  value: T | undefined | null,
  name: string,
): T {
  const fn = requirePort(value, name);
  if (typeof fn !== "function") {
    throw new InvalidConfigurationError(
      `${name} must be a function. Received: ${typeof fn}`,
    );
  }
  return fn;
}

/**
 * Validates that an object has a specific method.
 */
export function requireMethod<T, K extends keyof T>(
  value: T | undefined | null,
  methodName: K,
  portName: string,
): T {
  const obj = requirePort(value, portName);
  if (typeof (obj as T)[methodName] !== "function") {
    throw new InvalidConfigurationError(
      `${portName} must implement ${String(methodName)}(). ` +
        `Check that you passed a complete implementation, not a plain object.`,
    );
  }
  return obj;
}
