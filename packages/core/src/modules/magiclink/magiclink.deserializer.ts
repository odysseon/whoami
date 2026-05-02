import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import type { CredentialProofDeserializer } from "../../kernel/ports/auth-module.port.js";

function assertObject(data: unknown): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object") {
    throw new Error("MagicLink proof must be an object");
  }
}

function credentialProof<T extends CredentialProof>(proof: T): CredentialProof {
  return proof;
}

export class MagicLinkProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "magiclink";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data["kind"] !== "magiclink") {
      throw new Error(
        `Expected kind 'magiclink' but got '${String(data["kind"])}'`,
      );
    }

    if (typeof data["tokenHash"] !== "string") {
      throw new Error("MagicLink proof must have a tokenHash string");
    }

    if (typeof data["email"] !== "string") {
      throw new Error("MagicLink proof must have an email string");
    }

    if (
      !(data["expiresAt"] instanceof Date) &&
      typeof data["expiresAt"] !== "string"
    ) {
      throw new Error("MagicLink proof must have an expiresAt date");
    }

    return credentialProof({
      kind: "magiclink",
      tokenHash: data["tokenHash"],
      email: data["email"],
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
}
