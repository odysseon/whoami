import type { PrismaClientLike } from "./types.js";
import {
  Account,
  type AccountRepository,
  type AccountId,
  type EmailAddress,
} from "@odysseon/whoami-core/kernel";

interface AccountRow {
  id: string;
  email: string;
  createdAt: Date;
}

export class PrismaAccountRepository implements AccountRepository {
  readonly #prisma: PrismaClientLike;

  constructor(prisma: PrismaClientLike) {
    this.#prisma = prisma;
  }

  async save(account: Account): Promise<void> {
    const exists = await this.#prisma.account.findUnique({
      where: { id: account.id.toString() },
    });

    if (exists) {
      await this.#prisma.account.update({
        where: { id: account.id.toString() },
        data: { email: account.email.toString() },
      });
    } else {
      await this.#prisma.account.create({
        data: {
          id: account.id.toString(),
          email: account.email.toString(),
          createdAt: account.createdAt,
        },
      });
    }
  }

  async findById(id: AccountId): Promise<Account | null> {
    const record = (await this.#prisma.account.findUnique({
      where: { id: id.toString() },
    })) as AccountRow | null;

    if (!record) return null;

    return Account.load({
      id: record.id,
      email: record.email,
      createdAt: new Date(record.createdAt),
    });
  }

  async findByEmail(email: EmailAddress): Promise<Account | null> {
    const record = (await this.#prisma.account.findUnique({
      where: { email: email.toString() },
    })) as AccountRow | null;

    if (!record) return null;

    return Account.load({
      id: record.id,
      email: record.email,
      createdAt: new Date(record.createdAt),
    });
  }

  async delete(id: AccountId): Promise<void> {
    await this.#prisma.account.delete({ where: { id: id.toString() } });
  }

  async existsByEmail(email: EmailAddress): Promise<boolean> {
    const count = await this.#prisma.account.count({
      where: { email: email.toString() },
    });
    return count > 0;
  }
}
