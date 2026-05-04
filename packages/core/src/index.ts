// Kernel exports (domain, ports, shared utilities + DTOs)
export * from "./kernel/index.js";

// Module exports — wildcards, relying on no name collisions
export * from "./modules/password/index.js";
export * from "./modules/oauth/index.js";
export * from "./modules/magiclink/index.js";
