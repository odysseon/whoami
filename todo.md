# whoami v12 Migration — Live Task Board

> **Current release**: v11.2.0
> **Target release**: v12.0.0 (breaking)
> **Core principle**: Zero kernel changes for new auth methods. Maximum tree-shaking. Zero side effects at module load time.

---

## Status key

| Symbol | Meaning                                               |
| :----: | ----------------------------------------------------- |
|  [x]   | Done (exists in codebase)                             |
|  [/]   | In progress / partial                                 |
|  [ ]   | Not started                                           |
|  [-]   | Removed from scope (was in original plan but is moot) |

---

## Phase 0 — Foundation (v11.1.0) [x] Complete

> Non-breaking. All existing consumers continue to work unchanged.

| #   | Task                                                                 | Status | Notes                                             |
| --- | -------------------------------------------------------------------- | ------ | ------------------------------------------------- |
| 0.1 | Sub-path exports in `package.json` (`./password`, `./oauth`)         | [x]    | Added in v11.1.0                                  |
| 0.2 | Sub-path entry files (`src/password/index.ts`, `src/oauth/index.ts`) | [x]    | Added in v11.1.0                                  |
| 0.3 | `tsup.config.ts` multi-entry build for sub-paths                     | [x]    | Added in v11.1.0                                  |
| 0.4 | `AuthModule<TConfig, TMethods>` interface                            | [x]    | Already existed (`modules/module.interface.ts`)   |
| 0.5 | Password + OAuth self-contained module objects                       | [x]    | Already existed (`PasswordModule`, `OAuthModule`) |
| 0.6 | Deprecation `@deprecated` JSDoc on barrel module re-exports          | [x]    | Added in v11.1.0                                  |
| 0.7 | Runtime `console.warn` in `createAuth` for flat config keys          | [x]    | Added in v11.1.0                                  |
| [-] | `CredentialDeserializer.register()` side-effect removal              | [-]    | Never existed in codebase — moot                  |
| [-] | `CompositeDeserializer`                                              | [x]    | Completed ahead of schedule in Phase 1            |

---

## Phase 1 — Open Proof Model (v11.2.0) [x] Complete

> Non-breaking: open interface added; typed getters removed from kernel; module wrappers own type narrowing.

| #    | Task                                                                               | Status | Notes                                                                           |
| ---- | ---------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| 1.1  | Define `CredentialProof` interface in `kernel/credential/credential.proof.port.ts` | [x]    | Open interface with `kind`, `serialize()`, `verify()`, `getMetadata?()`         |
| 1.2  | Make `PasswordProof`/`OAuthProof` implement the interface                          | [x]    | Converted from plain types to classes                                           |
| 1.3  | Redesign `Credential` entity: drop typed getters, expose opaque `getProof()`       | [x]    | `passwordHash`, `oauthProvider`, `oauthProviderId` removed; `proofKind: string` |
| 1.4  | Update `PasswordCredential.fromKernel` / `OAuthCredential.fromKernel`              | [x]    | Use `getProof()` + `instanceof` narrowing                                       |
| 1.5  | Update all use cases to go through module domain wrappers                          | [x]    | `authenticate`, `change-password`, `oauth/index.ts` `countAfterRemoval`         |
| 1.6  | Add `CompositeDeserializer` (`kernel/credential/composite-deserializer.ts`)        | [x]    | Routes serialised proof strings to correct module deserializer                  |
| 1.7  | Add `proofDeserializer` field to `AuthModule` interface                            | [x]    | `ProofDeserializer` type exported alongside                                     |
| 1.8  | Implement `proofDeserializer` on `PasswordModule` and `OAuthModule`                | [x]    | JSON-based; returns `null` on kind mismatch                                     |
| 1.9  | Implement `MagicLinkModule` end-to-end as the proof-of-concept for extensibility   | []     | Deferred — requires UX/design input on token lifecycle                          |
| 1.10 | Bundle size analyser in CI (`size-limit` or `bundlesize`, fail if kernel >6 KB)    | []     | Deferred to Phase 3 (post tree-shaking)                                         |

**Completed**: 2026-04-15
**Tests**: 21/21 pass

### Remaining genuine Phase 1 limitations now resolved

- `CredentialProof` closed union → **open interface** ✅
- `Credential` typed proof accessors → **opaque `getProof()` + module wrappers own narrowing** ✅
- No way for infra to reconstruct proofs without importing module types → **`CompositeDeserializer`** ✅

---

## Phase 2 — `createAuth` API Migration (v11.3.0) [] Not started

> Soft breaking. Old `createAuth({ password: config })` shape deprecated at type level; new `modules: [...]` shape introduced.

### The change

```typescript
// v11 (current — deprecated in v11.3.0, removed in v12):
createAuth({ accountRepo, receiptSigner, ..., password: { passwordStore, passwordHasher } });

// v12 (new):
import { PasswordModule } from '@odysseon/whoami-core/password';
createAuth({ accountRepo, receiptSigner, ..., modules: [PasswordModule({ passwordStore, passwordHasher })] });
```

This removes `AuthMethodRegistry` from `types.ts` and replaces the static `MODULES` array in `create-auth.ts` with the dynamic `modules` parameter. This is the actual OCP fix at the type level — adding a new auth method no longer requires editing any core file.

| #   | Task                                                                    | Status |
| --- | ----------------------------------------------------------------------- | ------ |
| 2.1 | Add `modules: AuthModule[]` overload to `createAuth`                    | []     |
| 2.2 | Remove `AuthMethodRegistry` from `composition/types.ts`                 | []     |
| 2.3 | Remove static `MODULES` array from `create-auth.ts`                     | []     |
| 2.4 | Update `AuthConfig` type to use `modules` field                         | []     |
| 2.5 | Update `AnyAuthMethods` — can no longer be statically typed per-module  | []     |
| 2.6 | Update `adapter-nestjs` `WhoamiModule` to accept new `AuthConfig` shape | []     |
| 2.7 | Update `example-nestjs` and `example-express` to use new API            | []     |
| 2.8 | Write `docs/migration-v11-to-v12.md`                                    | []     |
| 2.9 | Write codemod (`npx @odysseon/whoami-codemod`) for call-site transforms | []     |

**Timeline estimate**: 2 weeks
**Risk**: Medium — type-level changes affect all consumers

---

## Phase 3 — Breaking Release (v12.0.0) [] Not started

> Hard breaking. Old API removed. 3-month migration window required after v11.3.0.

| #   | Task                                                                  | Status |
| --- | --------------------------------------------------------------------- | ------ |
| 3.1 | Remove module re-exports from root barrel (`public.ts`)               | []     |
| 3.2 | Remove `CredentialProof` union type — only interface remains          | []     |
| 3.3 | Remove old `createAuth` overload (flat keys)                          | []     |
| 3.4 | Remove `AuthMethodRegistry` residue                                   | []     |
| 3.5 | Bundle size analyser in CI (kernel >6 KB fails)                       | []     |
| 3.6 | Final documentation pass — README, `architecture.md`, `type-model.md` | []     |
| 3.7 | Announce on GitHub Discussions + changelog                            | []     |

**Timeline estimate**: 1 week
**Risk**: High — mitigated by 3-month window + codemod

---

## Phase 4 — Post-release (v12.1.0+) [] Not started

| #   | Task                                                                     | Status |
| --- | ------------------------------------------------------------------------ | ------ |
| 4.1 | `MagicLinkModule` (deferred from Phase 1 — needs token lifecycle design) | []     |
| 4.2 | `WebAuthnModule` (external contributor template)                         | []     |
| 4.3 | `TOTPModule` (RFC 6238)                                                  | []     |
| 4.4 | `whoami-contrib` repo for community modules                              | []     |
| 4.5 | Performance benchmarks in CI                                             | []     |

---

## Accurate state of v11.2 (as-built reference)

| Original plan claim | Reality |
|---------------------|---------|
| `CredentialDeserializer.register()` side-effect at load time | Never existed — no static registrar anywhere |
| Modules embedded in `kernel/` directory | Modules are in `src/modules/` separate from kernel |
| Single monolithic barrel with no sub-paths | Sub-paths added in v11.1.0 |
| No `AuthModule` interface | `modules/module.interface.ts` existed with full `AuthModule<TConfig, TMethods>` |

**Remaining genuine limitations** (what the migration still needs to fix):

1. `createAuth` config is statically typed per-module via `AuthMethodRegistry` — adding a new module requires editing `types.ts` and `create-auth.ts` *(Phase 2)*
2. `./password` and `./oauth` sub-path exports exist but tree-shaking benefit is limited while root barrel re-exports module types *(Phase 3)*

---

*Last updated: v11.2.0 — 2026-04-15*
