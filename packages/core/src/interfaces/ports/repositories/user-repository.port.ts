import type {
  IUser,
  IUserWithEmail,
  IUserWithPassword,
  IUserWithProvider,
} from "../../models/user.interface.js";

// ------------------------------------------------------------------
// Parameter Objects (Extracted for Reusability in Implementations)
// ------------------------------------------------------------------

export interface ICreateWithEmailParams {
  email: string;
  passwordHash: string;
}

export interface IUpdatePasswordParams {
  userId: string;
  newPasswordHash: string;
}

export interface ICreateWithProviderParams {
  provider: string;
  providerId: string;
  email?: string;
}

export interface ILinkProviderParams {
  userId: string;
  provider: string;
  providerId: string;
}

// ------------------------------------------------------------------
// Repository Contracts
// ------------------------------------------------------------------

/**
 * The base contract for retrieving an identity.
 */
export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
}

/**
 * An optional, extended contract for systems that support traditional email/password identification.
 */
export interface IPasswordUserRepository extends IUserRepository {
  findByEmail(email: string): Promise<IUserWithPassword | null>;
  createWithEmail(params: ICreateWithEmailParams): Promise<IUserWithEmail>;
  updatePassword(params: IUpdatePasswordParams): Promise<void>;
}

/**
 * An optional contract for systems that support external OAuth providers (Google, GitHub, Apple).
 */
export interface IOAuthUserRepository extends IUserRepository {
  findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<IUserWithProvider | null>;
  createWithProvider(
    params: ICreateWithProviderParams,
  ): Promise<IUserWithProvider>;
  linkProvider(params: ILinkProviderParams): Promise<void>;
}
