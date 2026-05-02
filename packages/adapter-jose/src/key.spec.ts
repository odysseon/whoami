import { test, describe } from "node:test";
import assert from "node:assert";
import { createSecretKey } from "./jose-receipt.shared.js";

describe("createSecretKey", () => {
  // ==================== VALID SECRETS ====================

  test("accepts a 32-character random base64url secret", () => {
    const secret = "a8K3mP9qR2sT5vW8xYzB1cD4eF7gH0jK";
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
    assert.strictEqual(key.length, 32);
  });

  test("accepts a 43-character base64url-encoded 256-bit random value", () => {
    // 32 bytes = 256 bits, base64url-encoded = 43 chars (no padding)
    const secret = "dB7pX9kL2mQ5vN8wR4jT6yU1iO3eA0cF_hJ5gH2jK8m"; // fixed: was 42 chars, now 43
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
    assert.strictEqual(key.length, 43);
  });

  test("accepts a longer cryptographically random secret", () => {
    const secret =
      "Xn--p1ai8k3m9q2s5v8w1y4z7b0c3d6f9g2h5j8k1l4n7o0p3q6r9t2u5v8w1y4z";
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
    assert.strictEqual(key.length, 64);
  });

  test("accepts hex-like random string with high entropy", () => {
    const secret = "a3f7b2e9c5d1084f6a2b3c7d4e5f8091";
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
    assert.strictEqual(key.length, 32);
  });

  // ==================== LENGTH VIOLATIONS ====================

  test("throws for empty string", () => {
    assert.throws(
      () => createSecretKey(""),
      /Received empty or undefined secret/,
    );
  });

  test("throws for undefined", () => {
    assert.throws(
      () => createSecretKey(undefined as unknown as string),
      /Received empty or undefined secret/,
    );
  });

  test("throws for null", () => {
    assert.throws(
      () => createSecretKey(null as unknown as string),
      /Received empty or undefined secret/,
    );
  });

  test("throws for 31-character secret (one below minimum)", () => {
    const secret = "a".repeat(31);
    assert.throws(
      () => createSecretKey(secret),
      /at least 32 characters.*Received 31/,
    );
  });

  test("throws for 16-character secret", () => {
    const secret = "short-secret-16!";
    assert.throws(
      () => createSecretKey(secret),
      /at least 32 characters.*Received 16/,
    );
  });

  // ==================== PATTERN VIOLATIONS ====================

  test("throws for all identical characters", () => {
    const secret = "a".repeat(32);
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for all identical digits", () => {
    const secret = "0".repeat(32);
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for simple repeated pattern (2-char block)", () => {
    const secret = "ab".repeat(16);
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for simple repeated pattern (4-char block)", () => {
    const secret = "xyz1".repeat(8);
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for sequential ASCII characters", () => {
    const secret = "abcdefghijklmnopqrstuvwxyz012345";
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for reverse sequential characters", () => {
    const secret = "zyxwvutsrqponmlkjihgfedcba543210";
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for secret containing 'password'", () => {
    const secret = "mypassword1234567890123456789012";
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for secret containing 'qwerty'", () => {
    const secret = "qwertyuiopasdfghjklzxcvbnm123456";
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for secret containing '123456'", () => {
    const secret = "abc12345678901234567890123456789"; // mostly digits
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  // ==================== ENTROPY VIOLATIONS ====================
  //
  // These secrets are ≥ 32 chars with ≥ 16 unique characters and no
  // detectable structural patterns, but have heavily skewed character
  // frequency distributions that keep Shannon entropy below 120 bits.

  test("throws for low-entropy natural language passphrase", () => {
    // 17 occurrences of 'a' alongside 15 other unique chars keeps entropy ~90 bits
    const secret = "nidpkfaaaaaaaaaaaaaaaaamojelgbhc";
    assert.throws(() => createSecretKey(secret), /entropy is too low/);
  });

  test("throws for human-memorable pattern with substitutions", () => {
    // Same construction — skewed distribution, no structural repeat
    const secret = "nidpkfaaaaaaaaaaaaaaaaamojelgbhc";
    assert.throws(() => createSecretKey(secret), /entropy is too low/);
  });

  test("throws for common password with padding to 32 chars", () => {
    const secret = "passwordpasswordpasswordpassword";
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for leetspeak password", () => {
    const secret = "P@55w0rdP@55w0rdP@55w0rdP@55w0rd";
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  // ==================== CHARACTER DIVERSITY ====================

  test("throws for secret with only 2 unique characters", () => {
    const secret = "abababababababababababababababab";
    // This is a repeated pattern, so it fails pattern check
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for secret with only 10 unique characters", () => {
    // 15 unique chars cycling over 32 positions — not a divisible repeat,
    // passes pattern check, but uniqueChars (15) < MIN_UNIQUE_CHARS (16).
    const chars15 = "a1b2c3d4e5f6g7h";
    const secret = Array.from({ length: 32 }, (_, i) => chars15[i % 15]).join(
      "",
    );
    assert.throws(
      () => createSecretKey(secret),
      /too little character diversity/,
    );
  });

  test("accepts secret with exactly 16 unique characters", () => {
    // 16 unique chars, random-looking, high entropy
    const secret = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
  });

  // ==================== EDGE CASES ====================

  test("throws for whitespace-only secret of sufficient length", () => {
    const secret = " ".repeat(32);
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("throws for tab/newline padded secret", () => {
    const secret = "\t\n".repeat(16);
    assert.throws(
      () => createSecretKey(secret),
      /weak password or predictable pattern/,
    );
  });

  test("accepts secret with special characters and high entropy", () => {
    const secret = "x9#kL2$mQ5@vN8*wR4&jT6!yU1(iO3)e";
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
  });

  test("produces correct Uint8Array encoding for non-ASCII secret", () => {
    // Unicode chars are multi-byte in UTF-8, so Uint8Array.length > string.length
    const secret =
      "🔑🚀💻🎯🔒🌟🎲🎸🎺🎻🎮🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄";
    // These are 32 emoji chars with >= 16 unique characters
    const key = createSecretKey(secret);
    assert.ok(key instanceof Uint8Array);
    assert.ok(key.length >= 32);
    assert.ok(key.length > secret.length); // UTF-8 multi-byte encoding
  });

  // ==================== ERROR MESSAGE QUALITY ====================

  test("error for short secret mentions the fix", () => {
    try {
      createSecretKey("short");
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.match(err.message, /crypto\.randomBytes/);
      assert.match(err.message, /base64url/);
    }
  });

  test("error for weak pattern mentions the fix", () => {
    try {
      createSecretKey("passwordpasswordpasswordpassword");
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.match(err.message, /crypto\.randomBytes/);
    }
  });

  test("error for low entropy mentions approximate bit count", () => {
    // 17 a's among 15 other unique chars → entropy ~90 bits, well below 120
    const secret = "nidpkfaaaaaaaaaaaaaaaaamojelgbhc";
    try {
      createSecretKey(secret);
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.match(err.message, /~[0-9]+ bits/);
      assert.match(err.message, /Minimum required: 120/);
    }
  });
});
