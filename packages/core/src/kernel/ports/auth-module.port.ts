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
 * The optional generic parameter `TMethods` lets module factories declare a
 * concrete methods type while still satisfying the base `AuthModule` constraint
 * used by `AuthOrchestrator` and `createAuth`.
 *
 * Adding a new auth method requires:
 * 1. Creating a new directory in src/modules/
 * 2. Implementing AuthModule interface
 * 3. Adding the module to the modules array in createAuth()
 *
 * Zero kernel changes required.
 */
export interface AuthModule<TMethods extends object = Record<string, unknown>> {
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
   * Methods exposed by this auth module
   * These are the operations available for this auth method
   */
  readonly methods: TMethods;

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
   */
  removeAllCredentialsForAccount(accountId: string): Promise<void>;
}

/**
 * Factory function type for creating AuthModules
 */
export type AuthModuleFactory<Config, Methods extends object> = (
  config: Config,
) => AuthModule<Methods>;
