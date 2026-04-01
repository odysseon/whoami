/**
 * Password-based credential proof.
 */
export type PasswordProof = {
  kind: "password";
  hash: string;
};

/**
 * Magic-link credential proof.
 */
export type MagicLinkProof = {
  kind: "magic_link";
  token: string;
  expiresAt: Date;
};

/**
 *  OAuth credential proof.
 */
export type OAuthProof = {
  kind: "oauth";
  provider: string;
  providerId: string;
};

/**
 * Supported credential proof variants.
 */
export type CredentialProof = PasswordProof | MagicLinkProof | OAuthProof;
