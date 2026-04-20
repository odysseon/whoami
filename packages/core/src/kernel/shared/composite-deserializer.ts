import type { CredentialProof } from "../domain/entities/credential.js";
import type { CredentialProofDeserializer } from "../ports/auth-module.port.js";
import { InvalidCredentialError } from "../domain/errors/index.js";

/**
 * Composite deserializer that combines multiple proof deserializers.
 * This enables runtime assembly of auth modules without kernel modifications.
 */
export class CompositeDeserializer implements CredentialProofDeserializer {
  readonly kind = "composite";
  readonly #deserializers: Map<string, CredentialProofDeserializer>;

  constructor(deserializers: CredentialProofDeserializer[]) {
    this.#deserializers = new Map();
    for (const deserializer of deserializers) {
      this.#deserializers.set(deserializer.kind, deserializer);
    }
  }

  /**
   * Deserializes a raw proof object into a typed CredentialProof
   * @param data - The raw proof data
   * @returns The deserialized proof
   * @throws InvalidCredentialError if the proof kind is not registered
   */
  deserialize(data: unknown): CredentialProof {
    if (data === null || typeof data !== "object") {
      throw new InvalidCredentialError("Proof must be an object");
    }

    const proofData = data as Record<string, unknown>;
    const kind = proofData.kind;

    if (typeof kind !== "string") {
      throw new InvalidCredentialError("Proof must have a kind property");
    }

    const deserializer = this.#deserializers.get(kind);
    if (!deserializer) {
      throw new InvalidCredentialError(`Unknown proof kind: ${kind}`);
    }

    return deserializer.deserialize(data);
  }

  /**
   * Registers a new deserializer
   * @param deserializer - The deserializer to register
   */
  register(deserializer: CredentialProofDeserializer): void {
    this.#deserializers.set(deserializer.kind, deserializer);
  }

  /**
   * Gets all registered proof kinds
   * @returns Array of registered proof kinds
   */
  getRegisteredKinds(): string[] {
    return Array.from(this.#deserializers.keys());
  }

  /**
   * Checks if a proof kind is registered
   * @param kind - The proof kind to check
   * @returns True if the kind is registered
   */
  hasKind(kind: string): boolean {
    return this.#deserializers.has(kind);
  }
}
