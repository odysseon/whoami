import type { CredentialProof } from "../domain/entities/credential.js";
import { InvalidCredentialError } from "../domain/errors/index.js";

export function assertObject(
  data: unknown,
): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object") {
    throw new InvalidCredentialError("Proof must be an object");
  }
}

export function credentialProof<T extends CredentialProof>(
  proof: T,
): CredentialProof {
  return proof;
}
