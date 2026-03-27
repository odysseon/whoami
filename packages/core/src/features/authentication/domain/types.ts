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
 * Supported credential proof variants.
 */
export type CredentialProof = PasswordProof | MagicLinkProof;
