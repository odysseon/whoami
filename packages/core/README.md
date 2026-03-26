# @odysseon/whoami-core

The framework-agnostic, zero-dependency core engine for identity and authentication.
Authorization is project-specific, so it is strictly not a concern of this library.

## Overview

This package provides the central orchestration layer (Facade) for the Odysseon Whoami identity system. It defines the strict interfaces (ports) and domain logic required to manage identities, sessions, and tokens without taking on framework or adapter dependencies.

By design, this core package has zero cryptographic or database dependencies. It uses the Ports and Adapters pattern so it can run anywhere JavaScript runs.

The core supports:

- **Credentials Auth** (Email/Password)
- **Generic OAuth** (Google, GitHub, Apple, etc., via unified contracts)
- **Refresh Tokens** (Atomic rotation and reuse detection)
- **Auth Status Reporting** via `WhoamiService.getAuthStatus()`

Every capability is driven by interfaces and configuration only. Consumer apps can enable credentials auth, OAuth, both, or neither.

### Strict Configuration

Default behavior is incredibly strict:

- Auth methods are disabled unless `configuration.authMethods.credentials` or `configuration.authMethods.oauth` are explicitly set to `true`.
- Refresh tokens are disabled unless `configuration.refreshTokens.enabled` is explicitly `true`.
- If dependencies (like a `passwordUserRepository`) are supplied but the corresponding configuration flag is missing or false, the service fails fast with `INVALID_CONFIGURATION`.

## Installation

```bash
npm install @odysseon/whoami-core
```

## The Modular Ecosystem

Because the core is mathematically pure, you must inject adapters that satisfy its security requirements to perform password hashing, token signing, or persistence.

You can write your own adapters by implementing the `I...` ports, or use the official `@odysseon` ecosystem:

- `@odysseon/whoami-adapter-argon2` - Industry-standard password hashing
- `@odysseon/whoami-adapter-jose` - Secure JWT generation and verification
- `@odysseon/whoami-adapter-webcrypto` - Deterministic refresh-token hashing

## License

[ISC](LICENSE)

```

---
```
