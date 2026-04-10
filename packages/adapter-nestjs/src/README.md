# Source Code (@odysseon/whoami-adapter-nestjs)

NestJS boundary package. Wires `@odysseon/whoami-core` into the NestJS DI container via a single global `WhoamiModule`.

## Directory structure

```
src/
├── whoami.module.ts          WhoamiModule — DynamicModule with register/registerAsync
├── tokens.ts                 AUTH_METHODS DI token constant
├── index.ts                  Public exports
├── decorators/
│   ├── public.decorator.ts   @Public() — bypasses WhoamiAuthGuard
│   └── current-identity.decorator.ts  @CurrentIdentity() — resolves request.identity
├── extractors/
│   ├── auth-token-extractor.port.ts   AuthTokenExtractor abstract class (port)
│   └── bearer-token.extractor.ts      BearerTokenExtractor (default implementation)
├── filters/
│   └── whoami-exception.filter.ts     WhoamiExceptionFilter — maps DomainError → HTTP
├── guards/
│   └── whoami-auth.guard.ts           WhoamiAuthGuard — verifies receipt on each request
└── oauth/
    ├── oauth-callback-handler.ts      OAuthCallbackHandler — injectable OAuth flow service
    └── index.ts
```

## What WhoamiModule registers

`WhoamiModule` is `@Global()`. All providers it registers are available application-wide without re-importing the module:

| Token                   | Type                         | Description                                |
| ----------------------- | ---------------------------- | ------------------------------------------ |
| `AUTH_METHODS`          | `AuthMethods`                | The composed auth facade from `createAuth` |
| `VerifyReceiptUseCase`  | `VerifyReceiptUseCase`       | Used by `WhoamiAuthGuard`                  |
| `AuthTokenExtractor`    | `AuthTokenExtractor`         | Defaults to `BearerTokenExtractor`         |
| `BearerTokenExtractor`  | alias → `AuthTokenExtractor` | Convenience alias                          |
| `WhoamiAuthGuard`       | `WhoamiAuthGuard`            | Injectable guard                           |
| `WhoamiExceptionFilter` | `WhoamiExceptionFilter`      | Injectable exception filter                |
| `OAuthCallbackHandler`  | `OAuthCallbackHandler`       | Injectable OAuth handler                   |
