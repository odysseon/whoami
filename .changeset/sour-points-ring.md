---
"@odysseon/whoami-adapter-webcrypto": major
"@odysseon/whoami-core": minor
---

- Add SecureTokenPort interface for cryptographically secure token operations
- Inject SecureTokenPort into MagicLinkModule and PasswordModule
- Remove direct Web Crypto calls from use cases (now behind port boundary)

- Rename WebCryptoTokenHasher → WebCryptoSecureTokenAdapter
- Implement full SecureTokenPort (generateToken + hashToken)
- Use base64url encoding (RFC 4648 §5) instead of hex
- Generate 256-bit (32-byte) secure tokens
- Migrate build from tsup to native TypeScript (ESM + CJS)
- Reset version to 1.0.0 for new package lifecycle
- Add DOM lib for Web Crypto API type definitions
