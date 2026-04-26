import type { CredentialProof } from "../domain/entities/credential.js";
import type { CredentialId } from "../domain/value-objects/index.js";

/**
 * Deserializer for credential proofs.
 * Each auth module provides a deserializer for its proof types.
 */
export interface CredentialProofDeserializer {
  /**
   * The kind of credential this deserializer handles
   */
  readonly kind: string;

  /**
   * Deserializes a raw proof object into a typed CredentialProof
   * @param data - The raw proof data
   * @returns The deserialized proof
   */
  deserialize(data: unknown): CredentialProof;
}

/**
 * AuthModule is the core interface that all authentication modules must implement.
 * This interface enables vertical slicing - each module is completely independent.
 *
 * Module factories return their own concrete methods directly alongside the
 * AuthModule lifecycle interface. There is no central `createAuth` factory;
 * composition happens at the application layer.
 *
 * Adding a new auth method requires:
 * 1. Creating a new directory in src/modules/
 * 2. Implementing AuthModule interface
 * 3. Exporting the module factory from its own sub-path
 *
 * Zero kernel changes required.
 */
export interface AuthModule {
  /**
   * Unique identifier for this auth method
   * Examples: "password", "oauth", "magiclink", "webauthn", "totp"
   */
  readonly kind: string;

  /**
   * Deserializer for this module's credential proofs
   */
  readonly proofDeserializer: CredentialProofDeserializer;

  /**
   * Returns the number of credentials for an account
   * @param accountId - The account ID
   * @returns The number of credentials
   */
  countCredentialsForAccount(accountId: string): Promise<number>;

  /**
   * Removes a credential from an account
   * @param credentialId - The credential ID to remove
   */
  removeCredential(credentialId: CredentialId): Promise<void>;

  /**
   * Removes all credentials for an account
   * @param accountId - The account ID
   * @param options - Optional filter (e.g., specific provider for OAuth)
   */
  removeAllCredentialsForAccount(
    accountId: string,
    options?: { provider?: string },
  ): Promise<void>;
}
