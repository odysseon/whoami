import type { CredentialProof } from "../../kernel/domain/entities/credential.js";
import type { CredentialProofDeserializer } from "../../kernel/ports/auth-module.port.js";

function assertObject(data: unknown): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object") {
    throw new Error("OAuth proof must be an object");
  }
}

function credentialProof<T extends CredentialProof>(proof: T): CredentialProof {
  return proof;
}

export class OAuthProofDeserializer implements CredentialProofDeserializer {
  readonly kind = "oauth";

  deserialize(data: unknown): CredentialProof {
    assertObject(data);

    if (data["kind"] !== "oauth") {
      throw new Error(
        `Expected kind 'oauth' but got '${String(data["kind"])}'`,
      );
    }

    if (typeof data["provider"] !== "string") {
      throw new Error("OAuth proof must have a provider string");
    }

    if (typeof data["providerId"] !== "string") {
      throw new Error("OAuth proof must have a providerId string");
    }

    return credentialProof({
      kind: "oauth",
      provider: data["provider"],
      providerId: data["providerId"],
    });
  }
}
