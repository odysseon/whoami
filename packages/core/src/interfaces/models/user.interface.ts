/**
 * The absolute root of an identity.
 * The only universal truth of a user is that they have a unique identifier.
 */
export interface IUser {
  id: string;
}

/**
 * Capability Interface: For identities that possess an email address.
 * This is the "Bridge" that connects different authentication methods.
 */
export interface IUserWithEmail extends IUser {
  email: string;
}

/**
 * Capability Interface: For identities that authenticate via a traditional secret.
 * Used exclusively by local/credential strategies.
 */
export interface IUserWithPassword extends IUserWithEmail {
  passwordHash: string;
}

/**
 * Capability Interface: For identities linked to external OAuth providers.
 * Replaces 'IUserWithGoogle' to support Google, GitHub, Apple, etc.
 */
export interface IUserWithProvider extends IUser {
  provider: string;
  providerId: string;
  email?: string;
}
