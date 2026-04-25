declare module "@odysseon/whoami-adapter-jose" {
  import type { ReceiptSigner, ReceiptVerifier } from "@odysseon/whoami-core";
  export class JoseReceiptSigner implements ReceiptSigner {
    constructor(config: { secret: string; issuer: string });
    sign(
      accountId: import("@odysseon/whoami-core").AccountId,
      expiresAt: Date,
    ): Promise<import("@odysseon/whoami-core").Receipt>;
  }
  export class JoseReceiptVerifier implements ReceiptVerifier {
    constructor(config: { secret: string; issuer: string });
    verify(token: string): Promise<import("@odysseon/whoami-core").Receipt>;
  }
}

declare module "@odysseon/whoami-adapter-argon2" {
  import type { PasswordHasher } from "@odysseon/whoami-core";
  export class Argon2PasswordHasher implements PasswordHasher {
    hash(plainText: string): Promise<string>;
    compare(plainText: string, hash: string): Promise<boolean>;
  }
}

declare module "@odysseon/whoami-adapter-webcrypto" {
  import type { SecureTokenPort } from "@odysseon/whoami-core";
  export class WebCryptoSecureTokenAdapter implements SecureTokenPort {
    generateToken(): string;
    hashToken(token: string): Promise<string>;
  }
}
