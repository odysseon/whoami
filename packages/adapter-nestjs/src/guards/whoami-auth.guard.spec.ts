import { describe, it, beforeEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { WhoamiAuthGuard } from "./whoami-auth.guard.js";
import type { WhoamiService, ITokenExtractor } from "@odysseon/whoami-core";
import type { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";

type MockCallCount = { mock: { callCount: () => number } };

describe("WhoamiAuthGuard", () => {
  let guard: WhoamiAuthGuard;
  let mockService: Record<string, unknown>;
  let mockReflector: Record<string, unknown>;
  let mockExtractor: Record<string, unknown>;
  let mockContext: Record<string, unknown>;
  let mockRequest: Record<string, unknown>;

  beforeEach(() => {
    mockService = {
      verifyAccessToken: mock.fn(
        async (): Promise<{ sub: string }> => ({ sub: "user_123" }),
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
      mockService as unknown as WhoamiService,
      mockReflector as unknown as Reflector,
      mockExtractor as unknown as ITokenExtractor,
    );
  });

  it("should allow access if route is marked as @Public", async () => {
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

  it("should throw MISSING_TOKEN if extractor returns null", async () => {
    mockExtractor.extract = mock.fn((): null => null);
    await assert.rejects(
      () => guard.canActivate(mockContext as unknown as ExecutionContext),
      /No bearer token provided/,
    );
  });

  it("should throw if core verification fails", async () => {
    mockService.verifyAccessToken = mock.fn(async (): Promise<void> => {
      throw new Error("TOKEN_EXPIRED");
    });
    await assert.rejects(
      () => guard.canActivate(mockContext as unknown as ExecutionContext),
      /TOKEN_EXPIRED/,
    );
  });

  it("should attach payload to request and return true on success", async () => {
    const result = await guard.canActivate(
      mockContext as unknown as ExecutionContext,
    );
    assert.equal(result, true);
    assert.equal(
      (mockRequest as { identity: { sub: string } }).identity.sub,
      "user_123",
    );
  });
});
