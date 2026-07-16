import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  DomainError,
  type AuthenticateWithReceiptUseCase,
} from "@odysseon/whoami-core";

export const requireAuth = (
  authenticator: AuthenticateWithReceiptUseCase,
): RequestHandler => {
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
      const identity = await authenticator.execute(token);
      req.identity = {
        accountId: identity.accountId,
        expiresAt: identity.expiresAt,
      };
      req.accountId = identity.accountId;
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
  authenticator: AuthenticateWithReceiptUseCase,
): RequestHandler => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const [type, token] = (req.headers.authorization ?? "").split(" ");
    if (type === "Bearer" && token) {
      try {
        const identity = await authenticator.execute(token);
        req.identity = {
          accountId: identity.accountId,
          expiresAt: identity.expiresAt,
        };
        req.accountId = identity.accountId;
      } catch (err) {
        if (!(err instanceof DomainError)) {
          return next(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }
    next();
  };
};
