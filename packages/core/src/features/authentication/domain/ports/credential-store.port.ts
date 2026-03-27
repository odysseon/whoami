import { EmailAddress } from "src/shared/domain/types.js";
import { Credential } from "../credential.entity.js";

export interface CredentialStore {
  findByEmail(email: EmailAddress): Promise<Credential | null>;
}
