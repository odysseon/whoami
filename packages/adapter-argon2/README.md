# @odysseon/whoami-adapter-argon2

Argon2 implementation of the `PasswordManager` port from `@odysseon/whoami-core`.

## Overview

Provides salted password hashing via the `argon2` npm package. Ships with prebuilt native binaries for Linux, macOS, and Windows — no build toolchain required.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-argon2
```

## Usage

```ts
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";

const hashManager = new Argon2PasswordHasher();

// Hash on registration
const hash = await hashManager.hash(plainTextPassword);

// Verify on login
const isMatch = await hashManager.compare(plainTextPassword, storedHash);
```

Pass the instance to `createAuth` as the `password.hashManager`:

```ts
import { createAuth } from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";

const auth = createAuth({
  // ...
  password: {
    hashManager: new Argon2PasswordHasher(),
    passwordStore: myPasswordStore,
  },
});
```

## Options

The constructor accepts an optional `argon2.Options` object for tuning memory, time, and parallelism factors:

```ts
const hashManager = new Argon2PasswordHasher({
  memoryCost: 65536, // 64 MiB (default: 65536)
  timeCost: 3, // iterations (default: 3)
  parallelism: 4, // threads (default: 4)
});
```

## Note on use

`Argon2PasswordHasher` implements `PasswordManager` — a slow, salted algorithm designed for passwords. It is **not** suitable for deterministic token hashing (magic links, API keys). Use `@odysseon/whoami-adapter-webcrypto` (`WebCryptoTokenHasher`) for those.
