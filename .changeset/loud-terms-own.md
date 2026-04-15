---
"@odysseon/whoami-core": minor
---

This release completely decouples the identity kernel from specific authentication methods by replacing the rigid `CredentialProof` union type with an open interface.

**Architectural Improvements**

- **Open Proof Interface:** The kernel now treats all credential proofs as opaque. Pluggable authentication methods can now define their own proofs that satisfy the `CredentialProof` port without requiring modifications to kernel types.
- **Module-Owned Deserialization:** Introduced `CompositeDeserializer` to handle dynamic proof rehydration. The `PasswordModule` and `OAuthModule` now supply their own `proofDeserializer` functions, allowing infrastructure adapters to reconstruct proofs without hardcoding module dependencies.
- **Encapsulated Domain Wrappers:** Kernel `Credential` entities no longer expose module-specific typed getters (e.g., `passwordHash` or `oauthProvider`). Type narrowing and validation are now strictly isolated to the module-level domain wrappers (`PasswordCredential`, `OAuthCredential`).
