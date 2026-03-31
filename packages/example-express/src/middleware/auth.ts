import type { Request, Response, NextFunction } from "express";
import {
  DomainError,
  type Receipt,
  type VerifyReceiptUseCase,
} from "@odysseon/whoami-core";

export type Identity = Receipt;

export interface AuthenticatedRequest extends Request {
  identity?: Identity;
}

export const createAuthMiddleware = (verifyReceipt: VerifyReceiptUseCase) => {
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
      req.identity = await verifyReceipt.execute(token);
      next();
    } catch (err) {
      if (err instanceof DomainError) {
        res.status(401).json({ error: err.message });
        return;
      }
      next(err);
    }
  };
};
