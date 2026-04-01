import { AccountId } from "../../../shared/domain/value-objects/account-id.vo.js";
import { CredentialId } from "../../../shared/domain/value-objects/credential-id.vo.js";
import { WrongCredentialTypeError } from "../../../shared/index.js";
import { CredentialProof } from "./types.js";

interface CredentialConstructorProps {
  id: CredentialId;
  accountId: AccountId;
  proof: CredentialProof;
}

interface CreatePasswordProps {
  id: CredentialId;
  accountId: AccountId;
  hash: string;
}

/**
 * Represents an authentication credential bound to an account.
 */
export class Credential {
  public readonly id: CredentialId;
  public readonly accountId: AccountId;
  private readonly proof: CredentialProof;

  private constructor(props: CredentialConstructorProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.proof = props.proof;
  }
  public get passwordHash(): string {
    if (this.proof.kind !== "password") {
      throw new WrongCredentialTypeError("password", this.proof.kind);
    }
    return this.proof.hash;
  }

  public static createPassword(props: CreatePasswordProps): Credential {
    if (!props.hash) {
      throw new Error("Password hash cannot be empty.");
    }

    return new Credential({
      id: props.id,
      accountId: props.accountId,
      proof: {
        kind: "password",
        hash: props.hash,
      },
    });
  }
}
