/**
 * Open interface for credential proofs.
 *
 * Any auth module can define a proof type that satisfies this interface
 * without touching the kernel. The kernel treats proofs as opaque beyond
 * the `kind` discriminant.
 *
 * @public
 */
export interface CredentialProof {
  /** Discriminant used for routing proofs to the correct module. */
  readonly kind: string;
  /** Serialise this proof to a storable string (e.g. JSON). */
  serialize(): string;
  /** Verify a raw payload against this proof. */
  verify(payload: unknown): boolean;
  /** Optional structured metadata (for auditing, logging, etc.). */
  getMetadata?(): Record<string, unknown>;
}
