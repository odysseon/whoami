import type { Request, Response, NextFunction, RequestHandler } from "express";
import { DomainError, type ReceiptVerifier } from "@odysseon/whoami-core";

export const requireAuth = (verifyReceipt: ReceiptVerifier): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const [type, token] = (req.headers.authorization ?? "").split(" ");
    if (type !== "Bearer" || !token) {
      res.status(401).json({ error: "Bearer token required." });
      return;
    }
    try {
      const receipt = await verifyReceipt.verify(token);
      req.identity = {
        accountId: receipt.accountId,
        expiresAt: receipt.expiresAt,
      };
      req.accountId = receipt.accountId;
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

export const optionalAuth = (
  verifyReceipt: ReceiptVerifier,
): RequestHandler => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const [type, token] = (req.headers.authorization ?? "").split(" ");
    if (type === "Bearer" && token) {
      try {
        const receipt = await verifyReceipt.verify(token);
        req.identity = {
          accountId: receipt.accountId,
          expiresAt: receipt.expiresAt,
        };
        req.accountId = receipt.accountId;
      } catch (err) {
        if (!(err instanceof DomainError)) {
          return next(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }
    next();
  };
};
