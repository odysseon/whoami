/**
 * Port for ID generation.
 * Implemented by infrastructure adapters (e.g., UUID generators).
 */
export interface IdGeneratorPort {
  /**
   * Generates a unique ID
   * @returns A unique string ID
   */
  generate(): string;
}
