import type { CredentialProof } from "./credential.proof.port.js";

export type { CredentialProof };

/**
 * Password credential proof — stores the bcrypt/argon2 hash, never plain-text.
 *
 * Implements {@link CredentialProof} so it can be stored in the kernel
 * `Credential` entity without the kernel knowing about password specifics.
 * @public
 */
export class PasswordProof implements CredentialProof {
  readonly kind = "password" as const;
  readonly hash: string;

  constructor(hash: string) {
    this.hash = hash;
  }

  serialize(): string {
    return JSON.stringify({ kind: this.kind, hash: this.hash });
  }

  verify(payload: unknown): boolean {
    // Verification (hash comparison) is delegated to PasswordHasher — this
    // satisfies the interface contract without embedding bcrypt in the kernel.
    return typeof payload === "string" && payload === this.hash;
  }

  getMetadata(): Record<string, unknown> {
    return { kind: this.kind };
  }
}

/**
 * OAuth credential proof — stores provider identity, not an access token.
 *
 * Implements {@link CredentialProof} so it can be stored in the kernel
 * `Credential` entity without the kernel knowing about OAuth specifics.
 * @public
 */
export class OAuthProof implements CredentialProof {
  readonly kind = "oauth" as const;
  readonly provider: string;
  readonly providerId: string;

  constructor(provider: string, providerId: string) {
    this.provider = provider;
    this.providerId = providerId;
  }

  serialize(): string {
    return JSON.stringify({
      kind: this.kind,
      provider: this.provider,
      providerId: this.providerId,
    });
  }

  verify(_payload: unknown): boolean {
    // OAuth flows don't verify a payload via the proof — verification happens
    // at the provider level before credentials are saved.
    return false;
  }

  getMetadata(): Record<string, unknown> {
    return { kind: this.kind, provider: this.provider };
  }
}
