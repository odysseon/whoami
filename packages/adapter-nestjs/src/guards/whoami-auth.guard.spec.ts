import { strict as assert } from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import {
  InvalidReceiptError,
  Receipt,
  VerifyReceiptUseCase,
} from "@odysseon/whoami-core";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { AuthTokenExtractor } from "../extractors/auth-token-extractor.port.js";
import { WhoamiAuthGuard } from "./whoami-auth.guard.js";

type MockCallCount = { mock: { callCount: () => number } };

describe("WhoamiAuthGuard", () => {
  let guard: WhoamiAuthGuard;
  let mockVerifyReceipt: Record<string, unknown>;
  let mockReflector: Record<string, unknown>;
  let mockExtractor: Record<string, unknown>;
  let mockContext: Record<string, unknown>;
  let mockRequest: Record<string, unknown>;

  beforeEach(() => {
    mockVerifyReceipt = {
      execute: mock.fn(
        async (): Promise<Receipt> =>
          Receipt.issue(
            "token",
            { value: "user_123", equals: (): boolean => true } as never,
            new Date("2026-03-27T12:00:00.000Z"),
          ),
      ),
    };
    mockReflector = {
      getAllAndOverride: mock.fn((): boolean => false),
    };
    mockExtractor = {
      extract: mock.fn((): string => "valid.token"),
    };
    mockRequest = {};
    mockContext = {
      getHandler: (): string => "handler",
      getClass: (): string => "class",
      switchToHttp: (): Record<string, unknown> => ({
        getRequest: (): Record<string, unknown> => mockRequest,
      }),
    };

    guard = new WhoamiAuthGuard(
      mockVerifyReceipt as unknown as VerifyReceiptUseCase,
      mockReflector as unknown as Reflector,
      mockExtractor as unknown as AuthTokenExtractor,
    );
  });

  it("allows access if route is marked as public", async () => {
    mockReflector.getAllAndOverride = mock.fn((): boolean => true);

    const result = await guard.canActivate(
      mockContext as unknown as ExecutionContext,
    );

    assert.equal(result, true);
    assert.equal(
      (mockExtractor.extract as unknown as MockCallCount).mock.callCount(),
      0,
    );
  });

  it("throws when the extractor returns no token", async () => {
    mockExtractor.extract = mock.fn((): null => null);

    await assert.rejects(
      () => guard.canActivate(mockContext as unknown as ExecutionContext),
      InvalidReceiptError,
    );
  });

  it("bubbles up verification failures", async () => {
    mockVerifyReceipt.execute = mock.fn(async (): Promise<void> => {
      throw new InvalidReceiptError("Expired receipt.");
    });

    await assert.rejects(
      () => guard.canActivate(mockContext as unknown as ExecutionContext),
      InvalidReceiptError,
    );
  });

  it("attaches the verified receipt to the request", async () => {
    const result = await guard.canActivate(
      mockContext as unknown as ExecutionContext,
    );

    assert.equal(result, true);
    assert.equal(
      (mockRequest as { identity: Receipt }).identity.token,
      "token",
    );
  });
});
