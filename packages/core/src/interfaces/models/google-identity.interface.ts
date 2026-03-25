/**
 * A normalized Google identity payload after successful ID token verification.
 * Adapters may enrich this with extra claims, but `sub` remains the only
 * baseline identity guarantee required by the core service.
 */
export interface IGoogleIdentity {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}
