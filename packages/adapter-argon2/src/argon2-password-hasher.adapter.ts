import * as argon2 from "argon2";
import type { IPasswordHasher } from "@odysseon/whoami-core";

export class Argon2PasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    if (!password) {
      throw new Error("Cannot hash an empty password.");
    }
    return await argon2.hash(password);
  }

  public async verify(hash: string, password: string): Promise<boolean> {
    if (!hash || !password) {
      return false;
    }
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
