import { AccountId } from "../../shared/index.js";

export type AuthResult = {
  accountId: AccountId;
  token: string;
};

export interface AuthMethods {
  registerWithPassword(input: {
    email: string;
    password: string;
  }): Promise<AuthResult>;
  authenticateWithPassword(input: {
    email: string;
    password: string;
  }): Promise<AuthResult>;
}
