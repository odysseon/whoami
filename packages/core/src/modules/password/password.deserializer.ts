import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import type { CredentialProofDeserializer } from "../../kernel/ports/auth-module.port.js";
import {
  assertObject,
  credentialProof,
} from "../../kernel/shared/deserializer-helpers.js";

export class PasswordProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "password";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data["kind"] === "password_hash") {
      if (typeof data["hash"] !== "string") {
        throw new Error("Password hash proof must have a hash string");
      }
      return credentialProof({ kind: "password_hash", hash: data["hash"] });
    }

    if (data["kind"] === "password_reset") {
      if (typeof data["tokenHash"] !== "string") {
        throw new Error("Password reset proof must have a tokenHash string");
      }
      if (
        !(data["expiresAt"] instanceof Date) &&
        typeof data["expiresAt"] !== "string"
      ) {
        throw new Error("Password reset proof must have an expiresAt date");
      }
      return credentialProof({
        kind: "password_reset",
        tokenHash: data["tokenHash"],
        expiresAt:
          data["expiresAt"] instanceof Date
            ? data["expiresAt"]
            : new Date(data["expiresAt"]),
        usedAt:
          data["usedAt"] instanceof Date
            ? data["usedAt"]
            : typeof data["usedAt"] === "string"
              ? new Date(data["usedAt"])
              : undefined,
      });
    }

    throw new Error(`Unknown password proof kind: ${String(data["kind"])}`);
  }
}
