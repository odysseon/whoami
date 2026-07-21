
# @odysseon/whoami Future Roadmap & Feature Gap Analysis

As a maintainer of the `whoami` library, building the stateful session overlay for Oríta highlighted several critical authentication and security features that the core library currently lacks out-of-the-box. 

Since `whoami` is infrastructure-agnostic and relies heavily on ports/adapters, many of these features can be introduced by expanding the core domain models and defining new ports for consumers to implement.

Here is a prioritized list of features that would elevate `whoami` to a complete, enterprise-grade identity platform, while strictly maintaining its boundary as an **Authentication engine** (leaving Product Intelligence and Authorization to the consumer):

## 1. Stateful Sessions & Refresh Token Rotation
Currently, `whoami` relies entirely on stateless JWTs ("receipts"). Once minted, they cannot be revoked until expiration.
* **The Gap:** Modern apps require long-lived sessions (weeks/months) but need the ability to revoke them instantly.
* **The Solution:** 
  * Introduce a `SessionQuery` and `SessionStore` port.
  * Implement built-in **Refresh Token Rotation** (where each refresh issues a new pair, and old refresh tokens are invalidated).
  * Implement **Token Reuse Detection** (if a revoked refresh token is used, automatically lock the account/revoke all sessions, assuming token theft).

## 2. Instant Global Revocation (Session Versioning)
When a user changes their password or is compromised, all active sessions across all devices must be invalidated immediately.
* **The Gap:** Stateless JWTs make this difficult without maintaining a massive blocklist of every active JWT.
* **The Solution:**
  * Add a `sessionVersion` (integer) to the core `Account` domain model.
  * Embed this `sessionVersion` inside the payload of the JWT/receipt.
  * Update the `ReceiptVerifier` to optionally check the current `sessionVersion` via the `AccountQuery` port. If the token's version is older than the database's version, throw an `InvalidReceiptError`.

## 3. Device & Context Tracking
Users expect to see a "Where you're logged in" screen to manage their active devices.
* **The Gap:** `whoami` doesn't track login context.
* **The Solution:**
  * When authenticating (via password, magic link, or OAuth), accept optional context parameters: `userAgent`, `ipAddress`, and `deviceName`.
  * Store these alongside the active Session via the new `SessionStore` port.

## 4. Multi-Factor Authentication (MFA)
Passwords alone are no longer sufficient for high-security applications.
* **The Gap:** No built-in flows for two-step verification.
* **The Solution:**
  * Introduce an `MfaModule` (TOTP/Authenticator apps, SMS, or WebAuthn/Passkeys).
  * Modify the authentication flow to return a "partial receipt" (or MFA token) upon successful password verification, which must then be exchanged alongside an MFA code for a full receipt.

## 5. Security Event Hooks (Domain Events)
Consumers often need to run side-effects when auth events occur (e.g., sending a "New login from an unrecognized device" email, or updating product-specific status fields).
* **The Gap:** Consumers have to wrap `whoami` controllers or use-cases to intercept events.
* **The Solution:**
  * Define an `EventPublisher` port.
  * Emit standardized domain events from the core modules (e.g., `AccountCreated`, `PasswordChanged`, `LoginFailed`, `SessionRevoked`). Consumers can listen to these events to trigger product-specific logic (like suspending a user profile).

## 6. Brute Force Protection (Account Lockout)
* **The Gap:** Protection is left entirely to infrastructure (like API rate limiters).
* **The Solution:**
  * Track consecutive failed login attempts on the `Account` model.
  * Introduce temporary lockouts (e.g., locked for 15 minutes after 5 failed attempts) to deter credential stuffing attacks.

## 7. Risk-Based Authentication (Adaptive Authentication)
Enterprise-grade systems evaluate the context of a login attempt to determine if it is anomalous before granting access.
* **The Gap:** `whoami` treats all correct passwords equally, regardless of context.
* **The Solution:**
  * Introduce a `RiskEvaluator` port (e.g., `evaluate(context): Promise<RiskLevel>`).
  * The core engine only needs to understand standardized risk levels (`LOW`, `MEDIUM`, `HIGH`).
  * Consumers can implement the port to evaluate IP velocity, impossible travel, or unrecognized devices. If the risk is `HIGH`, the engine can require a step-up challenge (like MFA) before issuing a full receipt, keeping the library infrastructure-agnostic while enabling advanced security.

## 8. Account Recovery Flows
Users lose passwords, devices, and access to their primary emails. A mature identity platform needs robust fallback mechanisms.
* **The Gap:** Currently limited to standard password resets.
* **The Solution:**
  * Define ports and modules for multi-factor recovery flows.
  * Support implementations like backup recovery codes, secondary emails, administrator approval workflows, or utilizing a trusted device to approve a login on a new device.

## 9. Passkeys & Passwordless Authentication (WebAuthn)
The industry is aggressively moving away from passwords.
* **The Gap:** No first-class support for WebAuthn/Passkeys.
* **The Solution:**
  * Introduce Passkeys not just as an MFA option, but as a **primary, first-class authentication method**.
  * Design the identity abstractions now to support a completely passwordless onboarding and login flow, ensuring the library remains relevant and future-proof as adoption grows.
