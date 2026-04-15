import type { CredentialProof } from "./credential.proof.port.js";

/**
 * A function that attempts to deserialize a raw proof string into a
 * {@link CredentialProof}. Returns `null` if the kind does not match.
 * @public
 */
export type ProofDeserializer = (raw: string) => CredentialProof | null;

/**
 * Composes multiple {@link ProofDeserializer} functions into one.
 *
 * Each registered module supplies a deserializer via its `proofDeserializer`
 * field. `CompositeDeserializer` tries each in registration order and returns
 * the first non-null result. This allows infrastructure adapters (e.g. a
 * database repository) to reconstruct the correct proof class without
 * depending on any specific module.
 *
 * @example
 * ```ts
 * const deserialize = new CompositeDeserializer([
 *   PasswordModule.proofDeserializer,
 *   OAuthModule.proofDeserializer,
 * ]);
 * const proof = deserialize.fromString(row.proof_json);
 * ```
 * @public
 */
export class CompositeDeserializer {
  private readonly deserializers: readonly ProofDeserializer[];

  constructor(deserializers: readonly ProofDeserializer[]) {
    this.deserializers = deserializers;
  }

  /**
   * Deserialize a raw proof string.
   *
   * @throws {Error} if no registered deserializer recognises the proof kind.
   */
  fromString(raw: string): CredentialProof {
    for (const deserialize of this.deserializers) {
      const proof = deserialize(raw);
      if (proof !== null) return proof;
    }
    let kind = "<unknown>";
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        "kind" in parsed &&
        typeof (parsed as Record<string, unknown>)["kind"] === "string"
      ) {
        const kindValue = (parsed as Record<string, unknown>)["kind"];
        kind = typeof kindValue === "string" ? kindValue : "<unknown>";
      }
    } catch {
      // raw was not valid JSON — leave kind as <unknown>
    }
    throw new Error(
      `No deserializer registered for credential proof kind "${kind}".`,
    );
  }
}
