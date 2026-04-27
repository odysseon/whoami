import type { PrismaClientLike } from "./types.js";
import {
  type OAuthCredentialStore,
  type OAuthProof,
  createOAuthProof,
} from "@odysseon/whoami-core/oauth";
import {
  createAccountId,
  createCredentialId,
  Credential,
  type CredentialId,
  type AccountId,
} from "@odysseon/whoami-core/kernel";

interface OAuthCredentialRow {
  id: string;
  accountId: string;
  provider: string;
  providerId: string;
  createdAt: Date;
}

export class PrismaOAuthCredentialStore implements OAuthCredentialStore {
  readonly #prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.#prisma = prisma;
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Credential<OAuthProof> | null> {
    const record = (await this.#prisma.oAuthCredential.findUnique({
      where: { provider_providerId: { provider, providerId } },
    })) as OAuthCredentialRow | null;

    if (!record) return null;

    return Credential.load({
      id: createCredentialId(record.id),
      accountId: createAccountId(record.accountId),
      proof: createOAuthProof(record.provider, record.providerId),
      createdAt: new Date(record.createdAt),
    });
  }

  async findAllByAccountId(
    accountId: AccountId,
  ): Promise<Credential<OAuthProof>[]> {
    const records = (await this.#prisma.oAuthCredential.findMany({
      where: { accountId: accountId.toString() },
    })) as OAuthCredentialRow[];

    return records.map((record) =>
      Credential.load({
        id: createCredentialId(record.id),
        accountId: createAccountId(record.accountId),
        proof: createOAuthProof(record.provider, record.providerId),
        createdAt: new Date(record.createdAt),
      }),
    );
  }

  async save(credential: Credential<OAuthProof>): Promise<void> {
    const proof = credential.proof;

    await this.#prisma.oAuthCredential.create({
      data: {
        id: credential.id.toString(),
        accountId: credential.accountId.toString(),
        provider: proof.provider,
        providerId: proof.providerId,
        createdAt: credential.createdAt,
      },
    });
  }

  async delete(credentialId: CredentialId): Promise<void> {
    await this.#prisma.oAuthCredential.delete({
      where: { id: credentialId.toString() },
    });
  }

  async deleteByProvider(
    accountId: AccountId,
    provider: string,
  ): Promise<void> {
    await this.#prisma.oAuthCredential.deleteMany({
      where: { accountId: accountId.toString(), provider },
    });
  }

  async deleteAllForAccount(accountId: AccountId): Promise<void> {
    await this.#prisma.oAuthCredential.deleteMany({
      where: { accountId: accountId.toString() },
    });
  }

  async existsForAccount(accountId: AccountId): Promise<boolean> {
    const count = await this.#prisma.oAuthCredential.count({
      where: { accountId: accountId.toString() },
    });
    return count > 0;
  }

  async countForAccount(accountId: AccountId): Promise<number> {
    return await this.#prisma.oAuthCredential.count({
      where: { accountId: accountId.toString() },
    });
  }
}
