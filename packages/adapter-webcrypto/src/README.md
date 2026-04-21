# Source Code (@odysseon/whoami-adapter-webcrypto)

Single file: `webcrypto-token-hasher.adapter.ts`

Implements the `TokenHasher` port from `@odysseon/whoami-core` using `globalThis.crypto.subtle.digest("SHA-256", ...)`. Returns a lowercase hex-encoded hash string. Rejects empty tokens with a thrown `Error` rather than silently hashing them.
