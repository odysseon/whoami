# Source Code (@odysseon/whoami-adapter-nestjs)

This directory contains the NestJS integration layer that bridges the `@odysseon/whoami-core` pure domain with the NestJS HTTP lifecycle and Dependency Injection container.

## Architecture

- **`decorators/`** - Contains developer experience (DX) utilities like `@Public()` to bypass the global guard, and `@CurrentIdentity()` to extract strict JWT payloads in controllers.
- **`dtos/`** - Data Transfer Objects utilizing `class-validator` to sanitize incoming HTTP requests before they reach the pure core.
- **`extractors/`** - Implementations of the core `ITokenExtractor` port (e.g., `BearerTokenExtractor`) to decouple token retrieval from the HTTP headers.
- **`filters/`** - Contains the `WhoamiExceptionFilter`, which catches core domain `WhoamiError` instances and translates them into semantic HTTP status codes (e.g., mapping `TOKEN_EXPIRED` to `410 Gone`).
- **`guards/`** - Contains the `WhoamiAuthGuard`, designed to be bound globally to make the application secure-by-default.
- **`whoami.controller.ts`** - A declarative, pure routing layer exposing the core capabilities over HTTP.
- **`whoami.module.ts`** - The dynamic module (`registerAsync`) that maps NestJS DI tokens and the native Logger to the strict interfaces required by the core.
