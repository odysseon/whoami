# Source Code (@odysseon/whoami-adapter-jose)

Three files:

- `jose-receipt.shared.ts` — shared config type (`JoseReceiptConfig`), secret key encoding, and error normalisation utilities used by both adapters.
- `jose-receipt-signer.adapter.ts` — `JoseReceiptSigner` implements `ReceiptSigner`. Signs a JWT with `sub` = `accountId.value`, `exp` = expiry, and a custom `receipt_kind` claim using HS256.
- `jose-receipt-verifier.adapter.ts` — `JoseReceiptVerifier` implements `ReceiptVerifier`. Verifies the JWT, checks the `receipt_kind` claim, and reconstructs a `Receipt` via `Receipt.loadExisting`.
