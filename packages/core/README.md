# @odysseon/whoami-core

The framework-agnostic, zero-dependency core engine for identity and authentication.
Authorization is project specific, so it is not a concern of this project.

## Overview

This package provides the central orchestration layer for the Odysseon Whoami identity system. It defines the strict interfaces (ports) and domain logic required to manage identities, sessions, and tokens without taking on framework or adapter dependencies.

By design, this core package has zero cryptographic or database dependencies. It uses the Ports and Adapters pattern so it can run anywhere JavaScript runs, from Node.js to edge runtimes.

The core now supports:

- Credentials auth
- Google OAuth
- Optional refresh tokens
- Auth-method status reporting through `WhoamiService.getAuthStatus()`

Every capability is driven by interfaces and configuration only, so consumer apps can enable credentials auth, Google OAuth, both, or neither, while still keeping the package framework-agnostic and adapter-driven.

## Installation

```bash
npm install @odysseon/whoami-core
```

## The Modular Ecosystem

Because the core is mathematically pure, you must inject adapters that satisfy its security requirements to perform password hashing, token signing, Google ID token verification, or refresh-token persistence.

You can write your own adapters, or use the official `@odysseon` ecosystem:

- `@odysseon/whoami-adapter-argon2` - Industry-standard password hashing
- `@odysseon/whoami-adapter-jose` - Secure JWT generation and verification
- `@odysseon/whoami-adapter-webcrypto` - Deterministic refresh-token hashing

## License

[ISC](LICENSE)
