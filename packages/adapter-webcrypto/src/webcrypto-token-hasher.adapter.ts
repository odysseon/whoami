export class WebCryptoTokenHasher {
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
}
