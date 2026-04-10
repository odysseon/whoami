# @odysseon/whoami-adapter-jose

`ReceiptSigner` and `ReceiptVerifier` implementations using the [`jose`](https://github.com/panva/jose) library (HS256 JWT).

## Overview

Because `jose` has no Node.js native dependencies, this adapter is fully compatible with edge runtimes such as Cloudflare Workers, Vercel Edge, and Deno.

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
import {
  IssueReceiptUseCase,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core/internal";

const config = {
  secret: process.env.JWT_SECRET!, // must be at least 32 characters
  issuer: "my-app", // optional
  audience: "my-app-users", // optional
};

const tokenSigner = new IssueReceiptUseCase({
  signer: new JoseReceiptSigner(config),
  tokenLifespanMinutes: 60,
});

const verifyReceipt = new VerifyReceiptUseCase(new JoseReceiptVerifier(config));
```

Pass `tokenSigner` and `verifyReceipt` to `createAuth` (or `WhoamiModule.registerAsync` in NestJS).

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
