# @odysseon/whoami-adapter-argon2

The official Argon2 password hashing adapter for the Odysseon Whoami identity core.

## Overview

This package provides a salted password hashing implementation using the `argon2` algorithm. It implements the `PasswordHasher` port from `@odysseon/whoami-core` and ships with prebuilt native binaries for Linux, macOS, and Windows — no build toolchain required.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-argon2
```

## Usage

```ts
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";

const passwordHasher = new Argon2PasswordHasher();

// Hash on registration
const hash = await passwordHasher.hash(plainTextPassword);

// Verify on login — pass directly to VerifyPasswordUseCase
const isMatch = await passwordHasher.compare(plainTextPassword, storedHash);
```

Pass the instance wherever `VerifyPasswordUseCase` requires a `PasswordHasher`:

```ts
import { VerifyPasswordUseCase } from "@odysseon/whoami-core";

const verifyPassword = new VerifyPasswordUseCase({
  credentialStore,
  hasher: passwordHasher,
  logger,
});
```

## Options

The constructor accepts an optional `argon2.Options` object for tuning memory, time, and parallelism factors:

```ts
const passwordHasher = new Argon2PasswordHasher({
  memoryCost: 65536, // 64 MiB (default: 65536)
  timeCost: 3, // iterations (default: 3)
  parallelism: 4, // threads (default: 4)
});
```
