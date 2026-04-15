# whoami v12 Migration — Live Task Board

> **Current release**: v11.1.0
> **Target release**: v12.0.0 (breaking)
> **Core principle**: Zero kernel changes for new auth methods. Maximum tree-shaking. Zero side effects at module load time.

---

## Status key

| Symbol | Meaning |
|--------|---------|
| ✅ | Done (exists in codebase) |
| 🔄 | In progress / partial |
| ⬜ | Not started |
| ❌ | Removed from scope (was in original plan but is moot) |

---

## Phase 0 — Foundation (v11.1.0) ✅ Complete

> Non-breaking. All existing consumers continue to work unchanged.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Sub-path exports in `package.json` (`./password`, `./oauth`) | ✅ | Added in v11.1.0 |
| 0.2 | Sub-path entry files (`src/password/index.ts`, `src/oauth/index.ts`) | ✅ | Added in v11.1.0 |
| 0.3 | `tsup.config.ts` multi-entry build for sub-paths | ✅ | Added in v11.1.0 |
| 0.4 | `AuthModule<TConfig, TMethods>` interface | ✅ | Already existed (`modules/module.interface.ts`) |
| 0.5 | Password + OAuth self-contained module objects | ✅ | Already existed (`PasswordModule`, `OAuthModule`) |
| 0.6 | Deprecation `@deprecated` JSDoc on barrel module re-exports | ✅ | Added in v11.1.0 |
| 0.7 | Runtime `console.warn` in `createAuth` for flat config keys | ✅ | Added in v11.1.0 |
| ❌ | `CredentialDeserializer.register()` side-effect removal | ❌ | Never existed in codebase — moot |
| ❌ | `CompositeDeserializer` | ❌ | Depends on open `CredentialProof` interface (Phase 1) |

---

## Phase 1 — Open Proof Model (v11.2.0) ⬜ Not started

> Still non-breaking: add the interface alongside the union. The union is not removed until Phase 3.

### 1.1 — Replace `CredentialProof` union with an open interface

The union type in `kernel/src/credential/credential.types.ts` is the last true kernel edit point. Adding MagicLink today requires touching it.

**What to do:**

```typescript
// NEW: kernel/src/credential/credential.proof.port.ts
export interface CredentialProof {
  readonly kind: string;
  serialize(): string;
  verify(payload: unknown): boolean;
  getMetadata?(): Record<string, unknown>;
}
```

Keep `PasswordProof` and `OAuthProof` as named types but make them implement the interface. `credential.types.ts` stays for now; `CredentialProof` union is aliased to the interface via type narrowing.

### 1.2 — Redesign `Credential` entity accessors

`Credential` in `kernel/credential/credential.entity.ts` exposes typed getters (`passwordHash`, `oauthProvider`, `oauthProviderId`) that rely on the closed union. These must be redesigned before the union is removed.

**Decision needed:** Move accessors to module-level domain wrappers (`PasswordCredential`, `OAuthCredential`) — which already exist — and have modules use those wrappers internally instead of raw `Credential` getters. The kernel `Credential` entity then drops the typed getters and exposes only `id`, `accountId`, `proofKind`, and the raw `proof` as opaque `CredentialProof`.

| # | Task | Status |
|---|------|--------|
| 1.1 | Define `CredentialProof` interface in `kernel/credential/credential.proof.port.ts` | ⬜ |
| 1.2 | Make `PasswordProof`/`OAuthProof` types implement the interface | ⬜ |
| 1.3 | Redesign `Credential` entity: drop typed getters, expose opaque proof | ⬜ |
| 1.4 | Update `PasswordCredential.fromKernel` / `OAuthCredential.fromKernel` to not use typed getters | ⬜ |
| 1.5 | Update all use cases to go through module domain wrappers instead of raw `Credential` getters | ⬜ |
| 1.6 | Add `CompositeDeserializer` (`kernel/infrastructure/composite-deserializer.ts`) | ⬜ |
| 1.7 | Add `proofDeserializer` field to `AuthModule` interface | ⬜ |
| 1.8 | Implement `proofDeserializer` on `PasswordModule` and `OAuthModule` | ⬜ |
| 1.9 | Implement `MagicLinkModule` end-to-end as the proof-of-concept for extensibility | ⬜ |
| 1.10 | Bundle size analyser in CI (`size-limit` or `bundlesize`, fail if kernel >6 KB) | ⬜ |

**Timeline estimate**: 2 weeks
**Risk**: Medium — `Credential` entity change touches all use cases

---

## Phase 2 — `createAuth` API Migration (v11.3.0) ⬜ Not started

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

| # | Task | Status |
|---|------|--------|
| 2.1 | Add `modules: AuthModule[]` overload to `createAuth` | ⬜ |
| 2.2 | Remove `AuthMethodRegistry` from `composition/types.ts` | ⬜ |
| 2.3 | Remove static `MODULES` array from `create-auth.ts` | ⬜ |
| 2.4 | Update `AuthConfig` type to use `modules` field | ⬜ |
| 2.5 | Update `AnyAuthMethods` — can no longer be statically typed per-module | ⬜ |
| 2.6 | Update `adapter-nestjs` `WhoamiModule` to accept new `AuthConfig` shape | ⬜ |
| 2.7 | Update `example-nestjs` and `example-express` to use new API | ⬜ |
| 2.8 | Write `docs/migration-v11-to-v12.md` | ⬜ |
| 2.9 | Write codemod (`npx @odysseon/whoami-codemod`) for call-site transforms | ⬜ |

**Timeline estimate**: 2 weeks
**Risk**: Medium — type-level changes affect all consumers

---

## Phase 3 — Breaking Release (v12.0.0) ⬜ Not started

> Hard breaking. Old API removed. 3-month migration window required after v11.3.0.

| # | Task | Status |
|---|------|--------|
| 3.1 | Remove module re-exports from root barrel (`public.ts`) | ⬜ |
| 3.2 | Remove `CredentialProof` union type — only interface remains | ⬜ |
| 3.3 | Remove old `createAuth` overload (flat keys) | ⬜ |
| 3.4 | Remove `AuthMethodRegistry` residue | ⬜ |
| 3.5 | Final documentation pass — README, `architecture.md`, `type-model.md` | ⬜ |
| 3.6 | Announce on GitHub Discussions + changelog | ⬜ |

**Timeline estimate**: 1 week
**Risk**: High — mitigated by 3-month window + codemod

---

## Phase 4 — Post-release (v12.1.0+) ⬜ Not started

| # | Task | Status |
|---|------|--------|
| 4.1 | `WebAuthnModule` (external contributor template) | ⬜ |
| 4.2 | `TOTPModule` (RFC 6238) | ⬜ |
| 4.3 | `whoami-contrib` repo for community modules | ⬜ |
| 4.4 | Performance benchmarks in CI | ⬜ |

---

## Accurate state of v11 (as-built reference)

The following things the original plan described as "current problems" **do not exist** in the codebase and should not be treated as work items:

| Original plan claim | Reality |
|---------------------|---------|
| `CredentialDeserializer.register()` side-effect at load time | Never existed — no static registrar anywhere |
| Modules embedded in `kernel/` directory | Modules are already in `src/modules/` separate from kernel |
| Single monolithic barrel with no sub-paths | Two export paths existed (`"."`, `"./internal"`); sub-paths added in v11.1.0 |
| No `AuthModule` interface | `modules/module.interface.ts` existed with full `AuthModule<TConfig, TMethods>` |

**Remaining genuine v11 limitations** (what the migration actually fixes):

1. `CredentialProof` is still a closed union — adding MagicLink requires editing `credential.types.ts` *(Phase 1)*
2. `Credential` entity has typed proof accessors tied to the closed union *(Phase 1)*
3. `createAuth` config is still statically typed per-module via `AuthMethodRegistry` — adding a new module requires editing `types.ts` and `create-auth.ts` *(Phase 2)*
4. `./password` and `./oauth` sub-path exports now exist but their tree-shaking benefit is limited while the root barrel still re-exports module types *(Phase 3)*

---

*Last updated: v11.1.0 — 2026-04-15*
