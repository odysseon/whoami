export class UuidGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
