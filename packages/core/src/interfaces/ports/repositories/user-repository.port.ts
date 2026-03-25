import type {
  IUser,
  IUserWithEmail,
  IUserWithPassword,
} from "../../models/user.interface.js";
import type { IGoogleIdentity } from "../../models/google-identity.interface.js";
import type { IUserWithGoogle } from "../../models/user.interface.js";

/**
 * The base contract for retrieving an identity.
 */
export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
}

/**
 * An optional, extended contract for systems that support email identification.
 * A consumer's repository can implement this ONLY if they use emails.
 */
export interface IEmailUserRepository extends IUserRepository {
  findByEmail(email: string): Promise<IUserWithPassword | null>;
  create(data: {
    email: string;
    passwordHash: string;
  }): Promise<IUserWithEmail>;
}

/**
 * An optional contract for systems that support Google OAuth identities.
 * The repository decides how to resolve linking, creation, and idempotency.
 */
export interface IGoogleUserRepository extends IUserRepository {
  resolveGoogleUser(
    identity: IGoogleIdentity,
  ): Promise<IUser | IUserWithGoogle>;
}
