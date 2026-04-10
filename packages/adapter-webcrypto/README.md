# @odysseon/whoami-adapter-webcrypto

`TokenHasher` implementation using the native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (SHA-256).

## Overview

Provides deterministic, dependency-free hashing via `globalThis.crypto.subtle`. Runs natively in Node.js ≥ 20, Deno, Bun, and modern browsers and edge runtimes — **zero external dependencies**.

**When to use:** Hashing opaque tokens before storing them (e.g. API keys). The same token always produces the same hash, so you can compare a candidate hash against the stored value on every request.

**When not to use:** Passwords. SHA-256 is fast and deterministic — it must not be used for password hashing. Use `@odysseon/whoami-adapter-argon2` for passwords.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-webcrypto
```

## Usage

```ts
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

const tokenHasher = new WebCryptoTokenHasher();

// Hash a raw token before storing it
const storedHash = await tokenHasher.hash(rawToken);

// On verify: hash the candidate and compare to the stored value
const candidateHash = await tokenHasher.hash(providedToken);
const isValid = candidateHash === storedHash;
```

Pass the instance to any component that accepts a `TokenHasher` port.
