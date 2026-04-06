/**
 * Password-based credential proof.
 *
 * Stores the bcrypt / argon2 hash of the user's password.  The plain-text
 * password is **never** persisted.
 *
 * @public
 */
export type PasswordProof = {
  kind: "password";
  /** The hashed password produced by the configured {@link PasswordManager}. */
  hash: string;
};

/**
 * OAuth credential proof.
 *
 * Stores the external provider identity, not an access token.
 *
 * @public
 */
export type OAuthProof = {
  kind: "oauth";
  /** The OAuth provider name, e.g. `"google"` or `"github"`. */
  provider: string;
  /** The stable user identifier returned by the provider (the `sub` claim). */
  providerId: string;
};

/**
 * Discriminated union of all supported credential proof variants.
 *
 * Switch on `proof.kind` to narrow to the specific proof type without casts.
 *
 * @public
 */
export type CredentialProof = PasswordProof | OAuthProof;
