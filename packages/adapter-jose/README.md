# @odysseon/whoami-adapter-jose

`ReceiptSigner` and `ReceiptVerifier` implementations using the [`jose`](https://github.com/panva/jose) library (HS256 JWT).

## Overview

Because `jose` has no Node.js native dependencies, this adapter is fully compatible with edge runtimes — Cloudflare Workers, Vercel Edge, Deno.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-jose
```

## Usage

```ts
import {
  JoseReceiptSigner,
  JoseReceiptVerifier,
} from "@odysseon/whoami-adapter-jose";
import { PasswordModule } from "@odysseon/whoami-core/password";
import { VerifyReceiptUseCase } from "@odysseon/whoami-core/internal";

const config = {
  secret: process.env.JWT_SECRET!, // minimum 32 characters
  issuer: "my-app", // optional
  audience: "my-app-users", // optional
};

const signer = new JoseReceiptSigner(config);
const verifier = new JoseReceiptVerifier(config);

// Pass signer to module factory
const password = PasswordModule({
  // ...
  receiptSigner: signer,
});

// Pass verifier to WhoamiModule (NestJS) or use directly
const verify = new VerifyReceiptUseCase(verifier);
const receipt = await verify.execute(token);
```

## JWT structure

Tokens are HS256 JWTs. The payload includes:

- `sub` — `accountId.value` (string)
- `exp` — expiry timestamp
- `iss` — issuer (if configured)
- `aud` — audience (if configured)
- A custom `receipt_kind` claim to distinguish receipt tokens from other JWTs in your system

## Configuration

| Option     | Type                 | Required | Description                                        |
| ---------- | -------------------- | -------- | -------------------------------------------------- |
| `secret`   | `string`             | ✅       | Symmetric secret for HS256. Minimum 32 characters. |
| `issuer`   | `string`             | ✗        | Value for the `iss` JWT claim.                     |
| `audience` | `string \| string[]` | ✗        | Value for the `aud` JWT claim.                     |
