/**
 * Password credential proof — stores the bcrypt/argon2 hash, never plain-text.
 * @public
 */
export type PasswordProof = {
  kind: "password";
  hash: string;
};

/**
 * OAuth credential proof — stores provider identity, not an access token.
 * @public
 */
export type OAuthProof = {
  kind: "oauth";
  provider: string;
  providerId: string;
};

/**
 * Discriminated union of all supported credential proof variants.
 * Switch on `proof.kind` to narrow safely.
 * @public
 */
export type CredentialProof = PasswordProof | OAuthProof;
