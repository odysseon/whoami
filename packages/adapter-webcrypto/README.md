# @odysseon/whoami-adapter-webcrypto

The official WebCrypto hashing adapter for the Odysseon Whoami identity core.

## Overview

This package provides deterministic, dependency-free SHA-256 hashing via the native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). It implements the `TokenHasher` port from `@odysseon/whoami-core`.

By using `globalThis.crypto.subtle` it runs natively in Node.js ≥ 20, Deno, Bun, and modern browsers and edge runtimes with **zero external dependencies**.

**Note:** This adapter is designed for _fast, deterministic_ hashing of opaque tokens (e.g. hashing a magic-link token before storing it to prevent database-breach token theft). It is **not** suitable for password hashing — use `@odysseon/whoami-adapter-argon2` for passwords.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-webcrypto
```

## Usage

```ts
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

const tokenHasher = new WebCryptoTokenHasher();

// Hash a raw magic-link token before storing it
const stored = await tokenHasher.hash(rawToken);

// On verify: hash the candidate and compare to the stored value
const candidate = await tokenHasher.hash(providedToken);
const isValid = candidate === stored;
```

Pass the `tokenHasher` instance anywhere a `TokenHasher` is required, for example when constructing an in-memory `CredentialStore` that stores hashed magic-link tokens.
