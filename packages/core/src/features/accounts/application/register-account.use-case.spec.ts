import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AccountAlreadyExistsError } from "../../../shared/domain/errors/account.error.js";
import { EmailAddress } from "../../../shared/domain/value-objects/email-address.vo.js";
import { RegisterAccountUseCase } from "./register-account.use-case.js";

describe("RegisterAccountUseCase", () => {
  it("creates and persists a new account", async () => {
    const saved: { email?: string } = {};
    const useCase = new RegisterAccountUseCase(
      {
        save: async (account): Promise<void> => {
          saved.email = account.email.value;
        },
        findByEmail: async (): Promise<null> => null,
        findById: async (): Promise<null> => null,
      },
      () => "acc_1",
    );

    const account = await useCase.execute("USER@example.com");

    assert.equal(account.id.value, "acc_1");
    assert.equal(account.email.value, "user@example.com");
    assert.equal(saved.email, "user@example.com");
  });

  it("throws when the email is already registered", async () => {
    const existingEmail = new EmailAddress("user@example.com");
    const useCase = new RegisterAccountUseCase(
      {
        save: async (): Promise<void> => undefined,
        findByEmail: async (): Promise<{
          id: { value: string; equals: () => boolean };
          email: EmailAddress;
        }> => ({
          id: { value: "acc_existing", equals: (): boolean => true },
          email: existingEmail,
        }),
        findById: async (): Promise<null> => null,
      },
      () => "acc_2",
    );

    await assert.rejects(
      () => useCase.execute("user@example.com"),
      AccountAlreadyExistsError,
    );
  });
});
