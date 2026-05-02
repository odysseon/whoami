import { estimateEntropy } from "./secret-entropy.js";
import { hasWeakPattern } from "./secret-patterns.js";
import {
  emptySecretError,
  lowDiversityError,
  lowEntropyError,
  tooShortError,
  weakPatternError,
} from "./secret-errors.js";

const MIN_SECRET_LENGTH = 32;
const MIN_UNIQUE_CHARS = 16;
const MIN_SHANNON_ENTROPY_BITS = 120;

/**
 * Validates `secret` against length, pattern, diversity, and entropy
 * constraints, then returns its UTF-8 byte representation.
 *
 * Throws descriptive {@link Error}s for each failure mode so callers can
 * surface actionable messages without catching a generic exception.
 */
export function createSecretKey(secret: string): Uint8Array {
  if (!secret) throw emptySecretError();

  if (secret.length < MIN_SECRET_LENGTH) {
    throw tooShortError(secret.length, MIN_SECRET_LENGTH);
  }

  if (hasWeakPattern(secret)) throw weakPatternError();

  const uniqueChars = new Set(secret).size;
  if (uniqueChars < MIN_UNIQUE_CHARS) {
    throw lowDiversityError(uniqueChars, secret.length);
  }

  const entropy = estimateEntropy(secret);
  if (entropy < MIN_SHANNON_ENTROPY_BITS) {
    throw lowEntropyError(entropy, MIN_SHANNON_ENTROPY_BITS);
  }

  return new TextEncoder().encode(secret);
}
