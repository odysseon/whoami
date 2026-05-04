# @odysseon/whoami-adapter-webcrypto

`SecureTokenPort` implementation using the native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (SHA-256 + CSPRNG).

## Overview

`WebCryptoSecureTokenAdapter` implements the `SecureTokenPort` interface from `@odysseon/whoami-core`. It provides two operations:

- **`generateToken()`** — produces a 256-bit cryptographically secure random token, base64url-encoded.
- **`hashToken(token)`** — deterministically hashes a token with SHA-256 (base64url output).

Because it uses only `globalThis.crypto`, it runs natively in Node.js ≥ 20, Deno, Bun, Cloudflare Workers, and modern browsers — **zero external dependencies**.

**When to use:** You need to generate and store opaque one-time tokens — magic-link tokens, password reset tokens — and verify them later by hashing the candidate and comparing against the stored hash.

**When not to use:** Passwords. SHA-256 is fast and deterministic — it must never be used for password hashing. Use `@odysseon/whoami-adapter-argon2` for passwords.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-webcrypto
```

## Usage

Pass the adapter to any module factory that accepts a `SecureTokenPort`:

```ts
import { WebCryptoSecureTokenAdapter } from "@odysseon/whoami-adapter-webcrypto";
import { PasswordModule } from "@odysseon/whoami-core/password";
import { MagicLinkModule } from "@odysseon/whoami-core/magiclink";

const secureToken = new WebCryptoSecureTokenAdapter();

// PasswordModule uses it for password reset tokens
const password = PasswordModule({
  accountRepo,
  passwordStore,
  resetTokenStore,
  passwordHasher,
  receiptSigner,
  idGenerator: () => crypto.randomUUID(),
  logger: console,
  secureToken,
});

// MagicLinkModule uses it for magic-link tokens
const magicLink = MagicLinkModule({
  accountRepo,
  magicLinkStore,
  receiptSigner,
  idGenerator: () => crypto.randomUUID(),
  logger: console,
  secureToken,
});
```

## How the token flow works

`generateToken()` produces the raw plaintext token you hand to the user (via email, URL, etc). `hashToken()` produces what you store in the database. On verification, you hash the candidate token and compare hashes — the plaintext never touches your database.

```ts
// On issuance:
const rawToken = secureToken.generateToken(); // send to user
const storedHash = await secureToken.hashToken(rawToken); // store this

// On verification:
const candidateHash = await secureToken.hashToken(userProvidedToken);
const isValid = candidateHash === storedHash;
```

whoami modules handle this flow internally — you do not need to call these methods directly.

## Token properties

| Property              | Value                                          |
| --------------------- | ---------------------------------------------- |
| Entropy               | 256 bits (32 bytes)                            |
| Encoding              | base64url (RFC 4648 §5) — URL-safe, no padding |
| Hash algorithm        | SHA-256                                        |
| External dependencies | None                                           |
