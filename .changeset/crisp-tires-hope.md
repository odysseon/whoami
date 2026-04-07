---
"@odysseon/whoami-adapter-nestjs": minor
---

Added support for custom token extractors in WhoamiModule.

- Users can now override the default Bearer token extraction logic via module options.
- Improved DI registration to support both static and async configuration for extractors.
