import type { IDeterministicTokenHasher } from "../../interfaces/ports/security/deterministic-token-hasher.port.js";

export class WebCryptoTokenHasher implements IDeterministicTokenHasher {
  public async hash(token: string): Promise<string> {
    if (!token) {
      throw new Error("Cannot hash an empty token.");
    }

    const data = new TextEncoder().encode(token);
    // globalThis.crypto is available natively in Node 20+, Deno, Bun, and all modern browsers
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);

    // Convert ArrayBuffer to Hex String
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  public async verify(hash: string, token: string): Promise<boolean> {
    // 1. Fast Precheck: Prevent unnecessary allocations and validate exact hex format
    if (
      !hash ||
      hash.length !== 64 ||
      !/^[0-9a-fA-F]{64}$/.test(hash) ||
      !token
    ) {
      return false;
    }

    const computedHash = await this.hash(token);

    // 2. Constant-Time String Comparison (Timing Attack Defense without node:crypto)
    let mismatch = 0;
    for (let i = 0; i < 64; i++) {
      mismatch |= hash.charCodeAt(i) ^ computedHash.charCodeAt(i);
    }

    return mismatch === 0;
  }
}
