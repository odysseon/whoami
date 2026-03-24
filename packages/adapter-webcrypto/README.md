# @odysseon/whoami-adapter-webcrypto

The official WebCrypto hashing adapter for the Odysseon Whoami identity core.

## Overview

This package provides a blazing-fast, deterministic hashing implementation using the native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). It strictly implements the `ITokenHasher` interface required by `@odysseon/whoami-core`.

By using native platform APIs (`globalThis.crypto`), this adapter requires **zero external dependencies** and runs natively in Node.js, Deno, Bun, and modern browsers/edge environments.

**Note:** This adapter is designed for _fast, deterministic_ hashing (like hashing opaque Refresh Tokens before storing them in a database to prevent database-breach token theft). It is **not** designed for password hashing. For user passwords, use `@odysseon/whoami-adapter-argon2`.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-webcrypto
```

## Usage

Inject this adapter into your `WhoamiService` configuration to enable secure refresh token hashing.

```ts
import { WhoamiService } from "@odysseon/whoami-core";
import { WebCryptoTokenHasher } from "@odysseon/whoami-adapter-webcrypto";

// Initialize your core service with the WebCrypto adapter
const authService = new WhoamiService({
  tokenHasher: new WebCryptoTokenHasher(),
  // ... other dependencies
});
```
