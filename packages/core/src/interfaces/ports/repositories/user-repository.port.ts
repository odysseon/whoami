import type {
  HasId,
  UserWithEmail,
  UserWithPassword,
  UserWithProvider,
} from "../../models/user.interface.js";

// ------------------------------------------------------------------
// Parameter Objects (Extracted for Reusability in Implementations)
// ------------------------------------------------------------------

/**
 * Parameters for creating a user with email/password authentication.
 */
export interface ICreateWithEmailParams {
  /** The user's email address (must be unique) */
  email: string;
  /** The hashed password (should use a secure hashing algorithm like bcrypt) */
  passwordHash: string;
}

/**
 * Parameters for updating a user's password.
 */
export interface IUpdatePasswordParams {
  /** The unique identifier of the user */
  userId: HasId["id"];
  /** The new hashed password */
  newPasswordHash: string;
}

/**
 * Parameters for creating a user via OAuth provider authentication.
 */
export interface ICreateWithProviderParams {
  /** The OAuth provider name (e.g., 'google', 'github', 'apple') */
  provider: string;
  /** The provider's unique identifier for this user */
  providerId: string;
  /** Optional email address (some providers may not share this) */
  email?: string;
}

/**
 * Parameters for linking an existing user account to an OAuth provider.
 */
export interface ILinkProviderParams {
  /** The unique identifier of the existing user */
  userId: HasId["id"];
  /** The OAuth provider name to link (e.g., 'google', 'github', 'apple') */
  provider: string;
  /** The provider's unique identifier for this user */
  providerId: string;
}

// ------------------------------------------------------------------
// Repository Contracts
// ------------------------------------------------------------------

/**
 * The base contract for retrieving an identity.
 *
 * @typeParam TEntity - The consumer's real-world entity type that must include an `id` property.
 *
 * @remarks
 * The `id` type is inferred dynamically from `TEntity['id']` to support both string and number IDs.
 */
export interface IUserRepository<TEntity extends HasId = HasId> {
  /**
   * Finds a user by their unique identifier.
   *
   * @param id - The unique identifier of the user
   * @returns A promise that resolves to the user entity or `null` if not found
   */
  findById(id: TEntity["id"]): Promise<TEntity | null>;
}

/**
 * Repository contract for users with email/password authentication capabilities.
 * Extends the base user repository with email-specific operations.
 *
 * @typeParam TEntity - The consumer's entity type that must include an `id` property
 */
export interface IPasswordUserRepository<
  TEntity extends HasId = HasId,
> extends IUserRepository<TEntity> {
  /**
   * Finds a user by their email address.
   *
   * @param email - The email address to search for
   * @returns A promise that resolves to the user with password data, or `null` if not found
   */
  findByEmail(email: string): Promise<UserWithPassword<TEntity> | null>;

  /**
   * Creates a new user with email/password authentication.
   *
   * @param params - The parameters containing email and password hash
   * @returns A promise that resolves to the newly created user with email data
   */
  createWithEmail(
    params: ICreateWithEmailParams,
  ): Promise<UserWithEmail<TEntity>>;

  /**
   * Updates the password hash for an existing user.
   *
   * @param params - The parameters containing user ID and new password hash
   * @returns A promise that resolves when the update is complete
   */
  updatePassword(
    params: Omit<IUpdatePasswordParams, "userId"> & { userId: TEntity["id"] },
  ): Promise<void>;
}

/**
 * Repository contract for users with OAuth provider authentication support.
 * Extends the base user repository with provider-specific operations.
 *
 * @typeParam TEntity - The consumer's entity type that must include an `id` property
 *
 * @remarks
 * Supports external OAuth providers such as Google, GitHub, Apple, etc.
 */
export interface IOAuthUserRepository<
  TEntity extends HasId = HasId,
> extends IUserRepository<TEntity> {
  /**
   * Finds a user by their OAuth provider details.
   *
   * @param provider - The OAuth provider name (e.g., 'google', 'github')
   * @param providerId - The provider's unique identifier for the user
   * @returns A promise that resolves to the user with provider data, or `null` if not found
   */
  findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<UserWithProvider<TEntity> | null>;

  /**
   * Creates a new user via OAuth provider authentication.
   *
   * @param params - The parameters containing provider details and optional email
   * @returns A promise that resolves to the newly created user with provider data
   */
  createWithProvider(
    params: ICreateWithProviderParams,
  ): Promise<UserWithProvider<TEntity>>;

  /**
   * Links an existing user account to an OAuth provider.
   *
   * @param params - The parameters containing user ID and provider details
   * @returns A promise that resolves when the linking is complete
   *
   * @remarks
   * This allows users to sign in with multiple providers after account creation.
   */
  linkProvider(
    params: Omit<ILinkProviderParams, "userId"> & { userId: TEntity["id"] },
  ): Promise<void>;
}
