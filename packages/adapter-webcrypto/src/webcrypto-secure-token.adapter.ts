import type { SecureTokenPort } from "@odysseon/whoami-core/kernel";

/**
 * WebCrypto implementation of SecureTokenPort.
 *
 * Uses the Web Crypto API (available in browsers, Node >=20, Deno, Bun, Cloudflare Workers).
 * This is the only file in the monorepo permitted to call Web Crypto globals directly —
 * it is the adapter that satisfies the zone boundary defined by SecureTokenPort.
 *
 * Token encoding: base64url (RFC 4648 §5) — URL-safe, no padding.
 * Token entropy: 32 bytes = 256 bits.
 * Hash algorithm: SHA-256.
 */
export class WebCryptoSecureTokenAdapter implements SecureTokenPort {
  /**
   * Generates a cryptographically secure random token.
   * @returns A base64url-encoded string with 256 bits of entropy.
   */
  generateToken(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return toBase64Url(buffer);
  }

  /**
   * Hashes a token with SHA-256 using the Web Crypto subtle API.
   * @param token - The plaintext token to hash.
   * @returns A base64url-encoded SHA-256 digest.
   */
  async hashToken(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return toBase64Url(new Uint8Array(hashBuffer));
  }
}

/**
 * Encodes a Uint8Array as a base64url string (RFC 4648 §5).
 * Base64url uses `-` and `_` instead of `+` and `/`, with no `=` padding.
 * This makes tokens safe for use in URLs and HTTP headers without encoding.
 */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
