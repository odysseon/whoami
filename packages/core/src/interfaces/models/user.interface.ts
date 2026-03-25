/**
 * The absolute root of an identity.
 * The only universal truth of a user is that they have a unique identifier.
 */
export interface IUser {
  id: string;
}

/**
 * Capability Interface: For identities that possess an email address.
 * Used by strategies that require email verification or login.
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
 * Capability Interface: For identities linked to a Google account.
 * Used by adapters that support Google OAuth flows.
 */
export interface IUserWithGoogle extends IUser {
  googleSub: string;
  email?: string;
}
