# Source Code (@odysseon/whoami-adapter-nestjs)

This directory contains the NestJS boundary package for receipt-based authentication built on the feature-first `@odysseon/whoami-core` API.

## Architecture

- `decorators/` contains developer-facing route helpers such as `@Public()` and `@CurrentIdentity()`.
- `extractors/` contains NestJS-facing token extraction contracts and implementations.
- `guards/` verifies receipt tokens through `VerifyReceiptUseCase`.
- `filters/` translates core domain errors into HTTP responses.
- `whoami.module.ts` wires the NestJS container to the feature-first receipt verification use case.
