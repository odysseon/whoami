const FIX_HINT = `Generate a proper key with: crypto.randomBytes(32).toString('base64url')`;

export function emptySecretError(): Error {
  return new Error(
    `JoseReceipt requires a secret. Received empty or undefined secret.`,
  );
}

export function tooShortError(length: number, min: number): Error {
  return new Error(
    `JoseReceipt requires a secret of at least ${min} characters. ` +
      `Received ${length} characters. ${FIX_HINT}`,
  );
}

export function weakPatternError(): Error {
  return new Error(
    `JoseReceipt secret appears to be a weak password or predictable pattern. ${FIX_HINT}`,
  );
}

export function lowDiversityError(unique: number, total: number): Error {
  return new Error(
    `JoseReceipt secret has too little character diversity ` +
      `(${unique} unique out of ${total}). ${FIX_HINT}`,
  );
}

export function lowEntropyError(bits: number, min: number): Error {
  return new Error(
    `JoseReceipt secret entropy is too low (~${Math.round(bits)} bits). ` +
      `Minimum required: ${min} bits. ${FIX_HINT}`,
  );
}
