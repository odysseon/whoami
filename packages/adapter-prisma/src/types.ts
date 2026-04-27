/**
 * Minimal structural interface for the PrismaClient instance expected by this adapter.
 * Uses structural typing so consumers can pass their generated PrismaClient without
 * requiring a direct dependency on the Prisma package from this adapter.
 */
export interface PrismaClientLike {
  readonly account: {
    findUnique(args: unknown): Promise<unknown>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
    count(args: unknown): Promise<number>;
  };
  readonly passwordHash: {
    findUnique(args: unknown): Promise<unknown>;
    upsert(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
    count(args: unknown): Promise<number>;
  };
  readonly passwordResetToken: {
    findUnique(args: unknown): Promise<unknown>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    deleteMany(args: unknown): Promise<unknown>;
  };
  readonly oAuthCredential: {
    findUnique(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<unknown[]>;
    create(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
    deleteMany(args: unknown): Promise<unknown>;
    count(args: unknown): Promise<number>;
  };
  readonly magicLinkToken: {
    findUnique(args: unknown): Promise<unknown>;
    findMany(args: unknown): Promise<unknown[]>;
    create(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
    delete(args: unknown): Promise<unknown>;
    deleteMany(args: unknown): Promise<unknown>;
    count(args: unknown): Promise<number>;
  };
}
