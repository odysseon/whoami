# @odysseon/whoami-adapter-jose

The official `jose` JWT signing adapter for the Odysseon Whoami identity core.

## Overview

This package provides a highly secure, edge-compatible JSON Web Token (JWT) signer and verifier using the industry-standard [`jose`](https://github.com/panva/jose) library. It strictly implements the `ITokenSigner` interface required by `@odysseon/whoami-core`.

Because `jose` has zero Node.js native dependencies, this adapter is fully compatible with edge runtimes like Cloudflare Workers, Vercel Edge, and Deno.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-jose jose
```

## Usage

Inject this adapter into your `WhoamiService` configuration to enable secure JWT generation for your access tokens.

```ts
import { WhoamiService } from "@odysseon/whoami-core";
import { JoseTokenSigner } from "@odysseon/whoami-adapter-jose";

// Initialize your core service with the Jose adapter
const authService = new WhoamiService({
  tokenSigner: new JoseTokenSigner({
    secret: process.env.JWT_SECRET,
    issuer: "my-app-auth",
    audience: "my-app-users",
  }),
  // ... other dependencies like your password hasher and repository
});
```
