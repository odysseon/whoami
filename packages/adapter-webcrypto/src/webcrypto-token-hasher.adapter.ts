import type { TokenHasher } from "@odysseon/whoami-core";

/**
 * Native WebCrypto implementation of {@link TokenHasher}.
 *
 * Uses SHA-256 via the platform `crypto.subtle` API which is available
 * natively in Node ≥ 20, Deno, Bun, and all modern browsers — no
 * external dependencies required.
 */
export class WebCryptoTokenHasher implements TokenHasher {
  /**
   * Produces a deterministic SHA-256 hex digest of the supplied token.
   *
   * @param token - The raw token value to hash.
   * @returns A lowercase hex-encoded SHA-256 hash.
   */
  public async hash(token: string): Promise<string> {
    if (!token) {
      throw new Error("Cannot hash an empty token.");
    }

    const data = new TextEncoder().encode(token);
    // globalThis.crypto is available natively in Node 20+, Deno, Bun, and all modern browsers
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
