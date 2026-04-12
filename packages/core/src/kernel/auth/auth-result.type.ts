import type { Receipt } from "../receipt/receipt.entity.js";
import type { AuthMethod } from "./auth-method.port.js";

/**
 * Unified output of a successful authentication operation.
 * @public
 */
export interface AuthResult {
  receipt: Receipt;
  method: AuthMethod;
}
