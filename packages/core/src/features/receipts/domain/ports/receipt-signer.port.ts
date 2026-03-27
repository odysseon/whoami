import { AccountId } from "src/shared/index.js";

export interface ReceiptSigner {
  sign(accountId: AccountId): Promise<string>;
}
