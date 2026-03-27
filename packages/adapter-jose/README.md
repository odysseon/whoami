# @odysseon/whoami-adapter-jose

The official `jose` receipt codec adapter for the Odysseon Whoami identity core.

## Overview

This package provides a highly secure, edge-compatible receipt signer and verifier using the industry-standard [`jose`](https://github.com/panva/jose) library. It implements the `ReceiptSigner` and `ReceiptVerifier` ports from `@odysseon/whoami-core`.

Because `jose` has zero Node.js native dependencies, this adapter is fully compatible with edge runtimes like Cloudflare Workers, Vercel Edge, and Deno.

## Installation

```bash
npm install @odysseon/whoami-core @odysseon/whoami-adapter-jose jose
```

## Usage

Inject this adapter anywhere the core receipt ports are required.

```ts
import {
  type ReceiptSigner,
  type ReceiptVerifier,
} from "@odysseon/whoami-core";
import { JoseReceiptCodec } from "@odysseon/whoami-adapter-jose";

const receiptCodec = new JoseReceiptCodec({
  secret: process.env.JWT_SECRET!,
  issuer: "my-app-auth",
  audience: "my-app-users",
});

const receiptSigner: ReceiptSigner = receiptCodec;
const receiptVerifier: ReceiptVerifier = receiptCodec;
```
