import type { SecureTokenPort } from "@odysseon/whoami-core/kernel";

/**
 * WebCrypto implementation of SecureTokenPort.
 */
export class WebCryptoSecureTokenAdapter implements SecureTokenPort {
  generateToken(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return toBase64Url(buffer);
  }

  async hashToken(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return toBase64Url(new Uint8Array(hashBuffer));
  }

  async verifyToken(
    candidateToken: string,
    storedHash: string,
  ): Promise<boolean> {
    const candidateHash = await this.hashToken(candidateToken);
    return timingSafeEqual(candidateHash, storedHash);
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
