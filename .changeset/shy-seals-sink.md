---
"@odysseon/whoami-core": major
---

- **Contract Purity:** Removed all Google-specific interfaces and ports. OAuth is now handled via a generic `IOAuthUserRepository` and `IOAuthCredentials` contract.
- **Repository Segregation:** Renamed `IEmailUserRepository` to `IPasswordUserRepository` and updated all methods to use Parameter Objects to prevent argument-order errors.
- **Service Refactor:** `WhoamiService` is now a Facade. Internal logic has been moved to specialized sub-services.
- **Config Schema:** `configuration.authMethods.googleOAuth` renamed to `configuration.authMethods.oauth`.
