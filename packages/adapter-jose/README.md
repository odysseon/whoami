# @odysseon/whoami-adapter-jose

The official `jose` receipt codec adapter for the Odysseon Whoami identity core.

## Overview

This package provides a secure, edge-compatible receipt signer and verifier using the [`jose`](https://github.com/panva/jose) library. It implements the `ReceiptSigner` and `ReceiptVerifier` ports from `@odysseon/whoami-core` as two separate classes using HS256 (HMAC-SHA256).

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

const config = {
  secret: process.env.JWT_SECRET!, // must be at least 32 characters
  issuer: "my-app-auth", // optional
  audience: "my-app-users", // optional
};

const receiptSigner = new JoseReceiptSigner(config);
const receiptVerifier = new JoseReceiptVerifier(config);
```

Pass `receiptSigner` wherever `IssueReceiptUseCase` requires a `ReceiptSigner`, and `receiptVerifier` wherever `VerifyReceiptUseCase` requires a `ReceiptVerifier`.

## Configuration

| Option     | Type                 | Required | Description                                        |
| ---------- | -------------------- | -------- | -------------------------------------------------- |
| `secret`   | `string`             | ✅       | Symmetric secret for HS256. Minimum 32 characters. |
| `issuer`   | `string`             | ✗        | Value for the `iss` JWT claim.                     |
| `audience` | `string \| string[]` | ✗        | Value for the `aud` JWT claim.                     |
