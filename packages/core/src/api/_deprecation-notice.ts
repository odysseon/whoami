/**
 * Emits a one-time deprecation warning when module-specific symbols are
 * imported from the root `@odysseon/whoami-core` barrel.
 *
 * In v12 these exports will be removed. Import from the sub-paths instead:
 *   `@odysseon/whoami-core/password`
 *   `@odysseon/whoami-core/oauth`
 *
 * @internal
 */

let warned = false;

export function warnModuleBarrelDeprecation(): void {
  if (warned) return;
  warned = true;
  process.emitWarning(
    "[whoami] DEPRECATION (v11.1.0): Importing module-specific symbols " +
      "(PasswordConfig, OAuthConfig, PasswordMethods, OAuthMethods, " +
      "PasswordCredentialStore, PasswordHasher, OAuthCredentialStore) " +
      "from '@odysseon/whoami-core' is deprecated and will be removed in v12.0.0. " +
      "Migrate to sub-path imports: " +
      "import type { PasswordConfig } from '@odysseon/whoami-core/password'; " +
      "import type { OAuthConfig } from '@odysseon/whoami-core/oauth'; " +
      "See: https://github.com/odysseon/whoami/blob/main/docs/migration-v11-to-v12.md",
    "DeprecationWarning",
  );
}
