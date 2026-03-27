export type Brand<K, T> = K & { readonly __brand: T };

export type AccountId = Brand<string | number, "AccountId">;
export type EmailAddress = Brand<string, "EmailAddress">;
