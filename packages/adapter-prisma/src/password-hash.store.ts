import type { PrismaClientLike } from "./types.js";
import {
  type PasswordHashStore,
  type PasswordHashProof,
  createPasswordHashProof,
} from "@odysseon/whoami-core/password";
import {
  createAccountId,
  createCredentialId,
  Credential,
  type CredentialId,
  type AccountId,
} from "@odysseon/whoami-core/kernel";

interface PasswordHashRow {
  id: string;
  accountId: string;
  hash: string;
  createdAt: Date;
}

export class PrismaPasswordHashStore implements PasswordHashStore {
  readonly #prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.#prisma = prisma;
  }

  async findByAccountId(
    accountId: AccountId,
  ): Promise<Credential<PasswordHashProof> | null> {
    const record = (await this.#prisma.passwordHash.findUnique({
      where: { accountId: accountId.toString() },
    })) as PasswordHashRow | null;

    if (!record) return null;

    return Credential.load({
      id: createCredentialId(record.id),
      accountId: createAccountId(record.accountId),
      proof: createPasswordHashProof(record.hash),
      createdAt: new Date(record.createdAt),
    });
  }

  async findById(
    credentialId: CredentialId,
  ): Promise<Credential<PasswordHashProof> | null> {
    const record = (await this.#prisma.passwordHash.findUnique({
      where: { id: credentialId.toString() },
    })) as PasswordHashRow | null;

    if (!record) return null;

    return Credential.load({
      id: createCredentialId(record.id),
      accountId: createAccountId(record.accountId),
      proof: createPasswordHashProof(record.hash),
      createdAt: new Date(record.createdAt),
    });
  }

  async save(credential: Credential<PasswordHashProof>): Promise<void> {
    const proof = credential.proof;

    await this.#prisma.passwordHash.upsert({
      where: { accountId: credential.accountId.toString() },
      update: { hash: proof.hash, updatedAt: new Date() },
      create: {
        id: credential.id.toString(),
        accountId: credential.accountId.toString(),
        hash: proof.hash,
        createdAt: credential.createdAt,
      },
    });
  }

  async update(
    credentialId: CredentialId,
    proof: PasswordHashProof,
  ): Promise<void> {
    await this.#prisma.passwordHash.update({
      where: { id: credentialId.toString() },
      data: { hash: proof.hash, updatedAt: new Date() },
    });
  }

  async delete(credentialId: CredentialId): Promise<void> {
    await this.#prisma.passwordHash.delete({
      where: { id: credentialId.toString() },
    });
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    const count = await this.#prisma.passwordHash.count({
      where: { accountId: accountId.toString() },
    });
    return count > 0;
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    return await this.#prisma.passwordHash.count({
      where: { accountId: accountId.toString() },
    });
  }
}
