# The Whoami Philosophy: Identity Sovereignty

Modern auth has a dependency problem. **Odysseon Whoami** is a zero-dependency Identity Kernel that returns control to the developer. It isn't a service you call; it is logic you own.

## Why Whoami?

Most developers reach for SaaS auth (Clerk, Auth0) for convenience — and inherit a **single point of failure**. When their infrastructure goes down, your application stops working. Whoami treats identity as **local logic**, not a **remote service**.

| | SaaS Auth (Clerk / Auth0) | Odysseon Whoami |
| :--- | :--- | :--- |
| **Uptime** | Tied to their status page | Tied only to your server |
| **Latency** | Network round-trips (~100ms+) | Local execution (<1ms) |
| **Data ownership** | They hold your users | You own your database |
| **Cost** | Scales with your user count | Fixed compute cost only |

## Core Principles

### 1. Zero Fate-Sharing

If a third-party API is down, your app shouldn't be. Whoami lives inside your process. There is no umbilical cord to a remote server. If your code is running, your auth is running.

### 2. You Own Your Stack

We don't dictate your database, your hashing algorithm, or your token strategy. Swap any piece — PostgreSQL for SQLite, argon2 for bcrypt, JWT for paseto — by swapping one dependency. Your auth logic never changes.

### 3. Strict Boundaries

Whoami is intentionally scoped. It answers exactly one question — *who is this?* — and hands that answer back as an `AccountId`. What you do with it, and what it means in your product, is entirely up to you.

### 4. Intentional Constraints

Whoami favors structured, conventional workflows and strict boundary enforcement. It is built for developers who care about how their system is composed, not just that it "works for now."

---

> **Identity is logic, not a subscription.**
