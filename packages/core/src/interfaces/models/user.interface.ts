/**
 * Base constraint requiring an object to have an `id` property.
 * The id can be either a string or a number.
 */
export type HasId = { id: string | number };

/**
 * Extends a base type that has an `id` property with an `email` field.
 *
 * @typeParam T - The base type that must satisfy the `HasId` constraint
 * @returns A type that combines all properties of `T` with an `email` string property
 */
export type UserWithEmail<T extends HasId> = T & {
  email: string;
};

/**
 * Extends a user type with password authentication capabilities.
 * Combines `UserWithEmail` with a password hash field.
 *
 * @typeParam T - The base type that must satisfy the `HasId` constraint
 * @returns A type that includes all properties from `T`, plus `email` and `passwordHash`
 */
export type UserWithPassword<T extends HasId> = UserWithEmail<T> & {
  passwordHash: string;
};

/**
 * Extends a base type with third-party provider authentication details.
 *
 * @typeParam T - The base type that must satisfy the `HasId` constraint
 * @returns A type that combines all properties of `T` with provider information
 *
 * @remarks
 * The `email` field is optional when using provider authentication,
 * as some providers may not share the user's email address.
 */
export type UserWithProvider<T extends HasId> = T & {
  provider: string;
  providerId: string;
  email?: string;
};
