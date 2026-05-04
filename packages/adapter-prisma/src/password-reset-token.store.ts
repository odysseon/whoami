import type { PrismaClientLike } from "./types.js";
import {
  type PasswordResetTokenStore,
  type PasswordResetProof,
  createPasswordResetProof,
} from "@odysseon/whoami-core/password";
import {
  createAccountId,
  createCredentialId,
  Credential,
  type CredentialId,
  type AccountId,
} from "@odysseon/whoami-core/kernel";

interface PasswordResetTokenRow {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PrismaPasswordResetTokenStore implements PasswordResetTokenStore {
  readonly #prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.#prisma = prisma;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<PasswordResetProof> | null> {
    const record = (await this.#prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    })) as PasswordResetTokenRow | null;

    if (!record) return null;

    return Credential.load({
      id: createCredentialId(record.id),
      accountId: createAccountId(record.accountId),
      proof: createPasswordResetProof(
        record.tokenHash,
        new Date(record.expiresAt),
      ),
      createdAt: new Date(record.createdAt),
    });
  }

  async save(credential: Credential<PasswordResetProof>): Promise<void> {
    const proof = credential.proof;

    await this.#prisma.passwordResetToken.create({
      data: {
        id: credential.id.toString(),
        accountId: credential.accountId.toString(),
        tokenHash: proof.tokenHash,
        expiresAt: proof.expiresAt,
        usedAt: proof.usedAt ?? null,
        createdAt: credential.createdAt,
      },
    });
  }

  async update(
    credentialId: CredentialId,
    proof: PasswordResetProof,
  ): Promise<void> {
    await this.#prisma.passwordResetToken.update({
      where: { id: credentialId.toString() },
      data: { usedAt: proof.usedAt ?? null },
    });
  }

  async deleteAllForAccount(accountId: AccountId): Promise<void> {
    await this.#prisma.passwordResetToken.deleteMany({
      where: { accountId: accountId.toString() },
    });
  }

  async deleteExpiredBefore(before: Date): Promise<void> {
    await this.#prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: before } },
    });
  }
}
