# @odysseon/whoami-adapter-argon2

The official Argon2 password hashing adapter for the Odysseon Whoami identity core.

## Overview

This package provides a highly secure, salted password hashing implementation using the industry-standard `argon2` algorithm. It strictly implements the `IPasswordHasher` interface required by `@odysseon/whoami-core`.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-argon2 argon2
```

## Usage

Inject this adapter into your `WhoamiService` configuration to enable secure password storage and verification during the registration and login flows.

```ts
import { WhoamiService } from "@odysseon/whoami-core";
import { Argon2PasswordHasher } from "@odysseon/whoami-adapter-argon2";

// Initialize your core service with the Argon2 adapter
const authService = new WhoamiService({
  passwordHasher: new Argon2PasswordHasher(),
  // ... other dependencies
});
```

```

```
