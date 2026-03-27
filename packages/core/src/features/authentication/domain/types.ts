export type PasswordProof = {
  kind: "password";
  hash: string;
};

export type MagicLinkProof = {
  kind: "magic_link";
  token: string;
  expiresAt: Date;
};

export type CredentialProof = PasswordProof | MagicLinkProof;
