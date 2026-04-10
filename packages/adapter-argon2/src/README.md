# Source Code (@odysseon/whoami-adapter-argon2)

Single file: `argon2-password-hasher.adapter.ts`

Implements the `PasswordManager` port from `@odysseon/whoami-core` using the `argon2` npm package. Provides `hash(plainText)` and `compare(plainText, hash)` as async methods. Rejects empty inputs rather than silently hashing them.
