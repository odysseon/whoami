---
"@odysseon/whoami-core": patch
---

**Password Module**

- `PasswordCredentialStore` has been split into two separate ports:
  - `PasswordHashStore` — manages password hash credentials (unique per account, permanent)
  - `PasswordResetTokenStore` — manages password reset tokens (many per account, short-lived, expirable)
- If you implemented `PasswordCredentialStore`, you must now implement both `PasswordHashStore` and `PasswordResetTokenStore`
- The `deleteAllResetCredentialsForAccount` and `deleteExpiredResetCredentials` methods moved to `PasswordResetTokenStore`

**MagicLink Module**

- `MagicLinkCredentialStore` renamed to `MagicLinkTokenStore` (reflects that magic links are transient tokens)

Separating hash storage from token storage resolves a fundamental design conflict where a single store was forced to manage both permanent credentials and transient tokens with incompatible invariants:

- Hash store: at most ONE record per accountId (unique constraint required)
- Token store: MANY records per accountId allowed (no unique constraint)

```diff
- const password = PasswordModule({
-   passwordStore: myPasswordStore,
-   // ...
- });

+ const password = PasswordModule({
+   passwordHashStore: myPasswordHashStore,
+   resetTokenStore: myPasswordResetTokenStore,
+   // ...
+ });

- const magiclink = MagicLinkModule({
-   magicLinkStore: myMagicLinkStore,
-   // ...
- });

+ const magiclink = MagicLinkModule({
+   magicLinkStore: myMagicLinkTokenStore,  // same interface, renamed
+   // ...
+ });
```
