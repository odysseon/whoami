import type { Request, Response, NextFunction } from "express";
import { DomainError, Receipt } from "@odysseon/whoami-core";
import type { ReceiptVerifier } from "@odysseon/whoami-core";

export interface AuthenticatedRequest extends Request {
  identity?: Receipt;
}

export const createAuthMiddleware = (verifyReceipt: ReceiptVerifier) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const [type, token] = (req.headers.authorization ?? "").split(" ");
    if (type !== "Bearer" || !token) {
      res.status(401).json({ error: "Bearer token required." });
      return;
    }
    try {
      req.identity = await verifyReceipt.verify(token);
      next();
    } catch (err) {
      if (err instanceof DomainError) {
        res.status(401).json({ error: err.message });
        return;
      }
      next(err instanceof Error ? err : new Error(String(err)));
    }
  };
};
