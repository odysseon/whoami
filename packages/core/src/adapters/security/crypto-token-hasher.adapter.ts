import { createHash, timingSafeEqual } from "node:crypto";
import type { IDeterministicTokenHasher } from "../../interfaces/ports/security/deterministic-token-hasher.port.js";

export class CryptoTokenHasher implements IDeterministicTokenHasher {
  public async hash(token: string): Promise<string> {
    if (!token) {
      throw new Error("Cannot hash an empty token.");
    }

    // We use sha256 because it is deterministic, fast, and secure.
    return createHash("sha256").update(token).digest("hex");
  }

  public async verify(hash: string, token: string): Promise<boolean> {
    if (!hash || !token) {
      return false;
    }

    const computedHash = await this.hash(token);

    const hashBuffer = Buffer.from(hash, "hex");
    const computedBuffer = Buffer.from(computedHash, "hex");

    // Prevent Timing Attacks: timingSafeEqual requires both buffers to be the exact same length.
    if (hashBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashBuffer, computedBuffer);
  }
}
