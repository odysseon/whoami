import { describe, it, beforeEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { WhoamiExceptionFilter } from "./whoami-exception.filter.js";
import { WhoamiError, type WhoamiErrorCode } from "@odysseon/whoami-core";
import { HttpStatus } from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";

type MockResponse = {
  statusCode: number;
  jsonData: Record<string, unknown> | null;
  status: (code: number) => MockResponse;
  json: (data: Record<string, unknown>) => MockResponse;
};

type MockCallCount = { mock: { callCount: () => number } };

describe("WhoamiExceptionFilter", () => {
  let filter: WhoamiExceptionFilter;
  let mockResponse: MockResponse;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new WhoamiExceptionFilter();

    mock.method(filter["logger"], "error", (): void => {});
    mock.method(filter["logger"], "warn", (): void => {});

    mockResponse = {
      statusCode: 0,
      jsonData: null,
      status: function (code: number): MockResponse {
        this.statusCode = code;
        return this;
      },
      json: function (data: Record<string, unknown>): MockResponse {
        this.jsonData = data;
        return this;
      },
    };

    mockHost = {
      switchToHttp: (): {
        getResponse: () => MockResponse;
        getRequest: () => Record<string, unknown>;
      } => ({
        getResponse: (): MockResponse => mockResponse,
        getRequest: (): Record<string, unknown> => ({ url: "/auth/login" }),
      }),
    } as unknown as ArgumentsHost;
  });

  const testCases: { code: WhoamiErrorCode; expectedStatus: number }[] = [
    { code: "INVALID_CREDENTIALS", expectedStatus: HttpStatus.UNAUTHORIZED },
    { code: "TOKEN_MALFORMED", expectedStatus: HttpStatus.UNAUTHORIZED },
    { code: "MISSING_TOKEN", expectedStatus: HttpStatus.UNAUTHORIZED },
    { code: "USER_ALREADY_EXISTS", expectedStatus: HttpStatus.CONFLICT },
    { code: "USER_NOT_FOUND", expectedStatus: HttpStatus.NOT_FOUND },
    { code: "TOKEN_EXPIRED", expectedStatus: HttpStatus.GONE },
    { code: "TOKEN_REUSED", expectedStatus: HttpStatus.GONE },
    { code: "AUTH_METHOD_DISABLED", expectedStatus: HttpStatus.FORBIDDEN },
    {
      code: "INVALID_CONFIGURATION",
      expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    { code: "UNSUPPORTED_AUTH_METHOD", expectedStatus: HttpStatus.BAD_REQUEST },
  ];

  for (const { code, expectedStatus } of testCases) {
    it(`should map ${code} to HTTP ${expectedStatus}`, () => {
      const error = new WhoamiError(code, "Test message");
      filter.catch(error, mockHost);

      assert.equal(mockResponse.statusCode, expectedStatus);
      assert.equal(mockResponse.jsonData?.error, code);
      assert.equal(mockResponse.jsonData?.message, "Test message");
      assert.ok(mockResponse.jsonData?.timestamp);
      assert.equal(mockResponse.jsonData?.path, "/auth/login");
    });
  }

  it("should log INVALID_CONFIGURATION as an error", () => {
    const error = new WhoamiError("INVALID_CONFIGURATION", "Bad config");
    filter.catch(error, mockHost);
    assert.equal(
      (filter["logger"].error as unknown as MockCallCount).mock.callCount(),
      1,
    );
    assert.equal(
      (filter["logger"].warn as unknown as MockCallCount).mock.callCount(),
      0,
    );
  });

  it("should log standard domain errors as warnings", () => {
    const error = new WhoamiError("INVALID_CREDENTIALS", "Bad password");
    filter.catch(error, mockHost);
    assert.equal(
      (filter["logger"].error as unknown as MockCallCount).mock.callCount(),
      0,
    );
    assert.equal(
      (filter["logger"].warn as unknown as MockCallCount).mock.callCount(),
      1,
    );
  });
});
