import { describe, it, beforeEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { WhoamiController } from "./whoami.controller.js";
import { WhoamiService } from "@odysseon/whoami-core";

type MockCallCount = {
  mock: { callCount: () => number; calls: { arguments: unknown[] }[] };
};

describe("WhoamiController", () => {
  let controller: WhoamiController;
  let mockService: Record<string, unknown>;

  beforeEach(() => {
    mockService = {
      getAuthStatus: mock.fn((): Record<string, unknown> => ({ status: "ok" })),
      registerWithEmail: mock.fn(
        async (dto: unknown): Promise<Record<string, unknown>> => ({
          id: "user1",
          ...(dto as object),
        }),
      ),
      loginWithEmail: mock.fn(
        async (): Promise<Record<string, unknown>> => ({
          accessToken: "access_123",
        }),
      ),
      loginWithOAuth: mock.fn(
        async (): Promise<Record<string, unknown>> => ({
          accessToken: "oauth_123",
        }),
      ),
      refreshTokens: mock.fn(
        async (): Promise<Record<string, unknown>> => ({
          accessToken: "refreshed_123",
        }),
      ),
    };
    controller = new WhoamiController(mockService as unknown as WhoamiService);
  });

  it("should route getStatus", () => {
    const res = controller.getStatus();
    assert.deepEqual(res, { status: "ok" });
    assert.equal(
      (mockService.getAuthStatus as unknown as MockCallCount).mock.callCount(),
      1,
    );
  });

  it("should route registerWithEmail", async () => {
    const dto = { email: "test@test.com", password: "pass" };
    const res = await controller.registerWithEmail(dto);
    assert.equal(res.email, dto.email);
    assert.equal(
      (
        mockService.registerWithEmail as unknown as MockCallCount
      ).mock.callCount(),
      1,
    );
  });

  it("should route loginWithEmail", async () => {
    const dto = { email: "test@test.com", password: "pass" };
    const res = await controller.loginWithEmail(dto);
    assert.equal(res.accessToken, "access_123");
    assert.equal(
      (mockService.loginWithEmail as unknown as MockCallCount).mock.callCount(),
      1,
    );
  });

  it("should route loginWithOAuth", async () => {
    const dto = { provider: "google", providerId: "g123" };
    const res = await controller.loginWithOAuth(dto);
    assert.equal(res.accessToken, "oauth_123");
    assert.equal(
      (mockService.loginWithOAuth as unknown as MockCallCount).mock.callCount(),
      1,
    );
  });

  it("should route refreshTokens", async () => {
    const dto = { refreshToken: "raw_refresh_token" };
    const res = await controller.refreshTokens(dto);
    assert.equal(res.accessToken, "refreshed_123");
    assert.equal(
      (mockService.refreshTokens as unknown as MockCallCount).mock.calls[0]
        .arguments[0],
      "raw_refresh_token",
    );
  });
});
