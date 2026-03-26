import { Injectable } from "@nestjs/common";
import { Request } from "express";
import type { ITokenExtractor } from "@odysseon/whoami-core";

@Injectable()
export class BearerTokenExtractor implements ITokenExtractor {
  public extract(request: unknown): string | null {
    //  cast the unknown object to an Express Request
    const req = request as Request | null | undefined;

    // Add the optional chaining operator to `req` as well!
    const [type, token] = req?.headers?.authorization?.split(" ") ?? [];

    return type === "Bearer" && token ? token : null;
  }
}
