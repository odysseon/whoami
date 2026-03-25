/**
 * The strictly typed input required for traditional local authentication.
 * Used for both Registration and Login flows.
 */
export interface IEmailPasswordCredentials {
  email: string;
  password: string;
}

/**
 * The generic credentials payload provided by a consumer
 * after they have verified an external OAuth token.
 */
export interface IOAuthCredentials {
  provider: string; // e.g., 'google', 'github', 'apple'
  providerId: string; // The verified ID from the provider
  email?: string; // Optional overlap for linking
}
