# @odysseon/whoami-adapter-argon2

The official Argon2 password hashing adapter for the Odysseon Whoami identity core.

## Overview

This package provides a highly secure, salted password hashing implementation using the industry-standard `argon2` algorithm. It implements the feature-first `PasswordHasher` port from `@odysseon/whoami-core`.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-argon2 argon2
```

## Usage

Inject this adapter anywhere the core `PasswordHasher` port is required.

```ts
import { type PasswordHasher } from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";

const passwordHasher: PasswordHasher = new Argon2PasswordHasher();
```
