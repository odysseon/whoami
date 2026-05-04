# @odysseon/whoami-adapter-argon2

Argon2 implementation of the `PasswordHasher` port from `@odysseon/whoami-core`.

## Overview

Provides salted password hashing via the `argon2` npm package. Ships with prebuilt native binaries for Linux, macOS, and Windows — no build toolchain required.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-argon2
```

## Usage

```ts
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";
import { PasswordModule } from "@odysseon/whoami-core/password";

const password = PasswordModule({
  accountRepo,
  passwordStore,
  passwordHasher: new Argon2PasswordHasher(),
  receiptSigner,
  idGenerator: () => crypto.randomUUID(),
  logger: console,
});
```

## Options

The constructor accepts an optional `argon2.Options` object for tuning memory, time, and parallelism factors:

```ts
const hasher = new Argon2PasswordHasher({
  memoryCost: 65536, // 64 MiB (default: 65536)
  timeCost: 3, // iterations (default: 3)
  parallelism: 4, // threads (default: 4)
});
```

## Note

`Argon2PasswordHasher` implements `PasswordHasher` — a slow, salted algorithm designed for passwords. It is **not** suitable for deterministic token hashing (magic links, API keys, password reset tokens). Use `@odysseon/whoami-adapter-webcrypto` (`WebCryptoTokenHasher`) for those.
