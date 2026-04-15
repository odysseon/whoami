---
"@odysseon/whoami-core": minor
---

This release introduces the foundational, non-breaking architectural changes required for the upcoming v12.0.0 open-proof model. The focus is strictly on improving tree-shaking and enforcing module isolation.

**Features & Improvements**

- **Sub-path Exports:** Added `@odysseon/whoami-core/password` and `@odysseon/whoami-core/oauth` entry points. Consumers can now import auth modules selectively, ensuring no unused authentication logic or dependencies are included in the final bundle.
- **Build Optimization:** The build pipeline has been reconfigured to emit isolated chunks for each sub-path.

**Deprecations (Migration runway for v12.0.0)**

- **Flat Configuration:** Configuring auth modules via top-level keys (`password`, `oauth`) in `createAuth()` is deprecated. A runtime warning is now emitted to guide consumers toward the explicit `modules: [...]` injection array pattern planned for v12.
- **Root Barrel Imports:** Importing module-specific configs, methods, or ports from the root `@odysseon/whoami-core` barrel is deprecated. Consumers should migrate to importing these exclusively from their respective module sub-paths.
