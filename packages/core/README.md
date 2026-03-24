# @odysseon/whoami-core

The framework-agnostic, zero-dependency core engine for identity, authentication.
Authorisation is project specific, so it is not a concern of this project.

## Overview

This package provides the central orchestration layer for the Odysseon Whoami identity system. It defines the strict interfaces (Ports) and domain logic required to securely manage users, sessions, and tokens.

By design, this core package contains **zero cryptographic or database dependencies**. It is architected using the Ports and Adapters pattern, ensuring it can run in any JavaScript environment—from Node.js to edge runtimes like Cloudflare Workers.

## Installation

```bash
npm install @odysseon/whoami-core
```

## The Modular Ecosystem

Because the core is mathematically pure, you must inject adapters that satisfy its security requirements to perform standard password or JWT-based authentication.

You can write your own adapters, or use the official `@odysseon` ecosystem:

- `@odysseon/whoami-adapter-argon2` - Industry-standard password hashing
- `@odysseon/whoami-adapter-jose` - Secure JWT generation and verification

## License

[ISC](LICENSE)
