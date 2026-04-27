import type { PrismaClientLike } from "./types.js";
import {
  type MagicLinkTokenStore,
  type MagicLinkProof,
  createMagicLinkProof,
} from "@odysseon/whoami-core/magiclink";
import {
  createAccountId,
  createCredentialId,
  Credential,
  type CredentialId,
  type AccountId,
} from "@odysseon/whoami-core/kernel";

interface MagicLinkTokenRow {
  id: string;
  accountId: string;
  tokenHash: string;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PrismaMagicLinkTokenStore implements MagicLinkTokenStore {
  readonly #prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.#prisma = prisma;
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<Credential<MagicLinkProof> | null> {
    const record = (await this.#prisma.magicLinkToken.findUnique({
      where: { tokenHash },
    })) as MagicLinkTokenRow | null;

    if (!record) return null;

    return Credential.load({
      id: createCredentialId(record.id),
      accountId: createAccountId(record.accountId),
      proof: createMagicLinkProof(
        record.tokenHash,
        record.email,
        new Date(record.expiresAt),
      ),
      createdAt: new Date(record.createdAt),
    });
  }

  async findAllByAccountId(
    accountId: AccountId,
  ): Promise<Credential<MagicLinkProof>[]> {
    const records = (await this.#prisma.magicLinkToken.findMany({
      where: { accountId: accountId.toString() },
    })) as MagicLinkTokenRow[];

    return records.map((record) =>
      Credential.load({
        id: createCredentialId(record.id),
        accountId: createAccountId(record.accountId),
        proof: createMagicLinkProof(
          record.tokenHash,
          record.email,
          new Date(record.expiresAt),
        ),
        createdAt: new Date(record.createdAt),
      }),
    );
  }

  async save(credential: Credential<MagicLinkProof>): Promise<void> {
    const proof = credential.proof;

    await this.#prisma.magicLinkToken.create({
      data: {
        id: credential.id.toString(),
        accountId: credential.accountId.toString(),
        tokenHash: proof.tokenHash,
        email: proof.email,
        expiresAt: proof.expiresAt,
        usedAt: proof.usedAt ?? null,
        createdAt: credential.createdAt,
      },
    });
  }

  async update(
    credentialId: CredentialId,
    proof: MagicLinkProof,
  ): Promise<void> {
    await this.#prisma.magicLinkToken.update({
      where: { id: credentialId.toString() },
      data: { usedAt: proof.usedAt ?? null },
    });
  }

  async delete(credentialId: CredentialId): Promise<void> {
    await this.#prisma.magicLinkToken.delete({
      where: { id: credentialId.toString() },
    });
  }

  async deleteAllForAccount(accountId: AccountId): Promise<void> {
    await this.#prisma.magicLinkToken.deleteMany({
      where: { accountId: accountId.toString() },
    });
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    return await this.#prisma.magicLinkToken.count({
      where: { accountId: accountId.toString() },
    });
  }

  async deleteExpired(before: Date): Promise<void> {
    await this.#prisma.magicLinkToken.deleteMany({
      where: { expiresAt: { lt: before } },
    });
  }
}
