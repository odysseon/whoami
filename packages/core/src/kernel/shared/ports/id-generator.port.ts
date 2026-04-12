/**
 * Deterministic identifier generation port.
 * Inject `() => crypto.randomUUID()` or any UUID v4 factory.
 * @public
 */
export type IdGeneratorPort = () => string;
