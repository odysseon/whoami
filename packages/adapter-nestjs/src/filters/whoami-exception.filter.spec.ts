import { strict as assert } from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import {
  AccountAlreadyExistsError,
  AuthenticationError,
  InvalidConfigurationError,
  InvalidEmailError,
  InvalidReceiptError,
} from "@odysseon/whoami-core";
import { HttpStatus } from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import { WhoamiExceptionFilter } from "./whoami-exception.filter.js";

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
      status(code: number): MockResponse {
        this.statusCode = code;
        return this;
      },
      json(data: Record<string, unknown>): MockResponse {
        this.jsonData = data;
        return this;
      },
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: (): MockResponse => mockResponse,
        getRequest: (): Record<string, unknown> => ({ url: "/profile" }),
      }),
    } as unknown as ArgumentsHost;
  });

  const testCases = [
    {
      error: new AuthenticationError("Invalid password."),
      expectedStatus: HttpStatus.UNAUTHORIZED,
    },
    {
      error: new InvalidReceiptError("Receipt expired."),
      expectedStatus: HttpStatus.UNAUTHORIZED,
    },
    {
      error: new AccountAlreadyExistsError(),
      expectedStatus: HttpStatus.CONFLICT,
    },
    {
      error: new InvalidEmailError(),
      expectedStatus: HttpStatus.BAD_REQUEST,
    },
    {
      error: new InvalidConfigurationError("Broken config."),
      expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    },
  ];

  for (const { error, expectedStatus } of testCases) {
    it(`maps ${error.name} to HTTP ${expectedStatus}`, () => {
      filter.catch(error, mockHost);

      assert.equal(mockResponse.statusCode, expectedStatus);
      assert.equal(mockResponse.jsonData?.error, error.name);
      assert.equal(mockResponse.jsonData?.message, error.message);
      assert.equal(mockResponse.jsonData?.path, "/profile");
      assert.ok(mockResponse.jsonData?.timestamp);
    });
  }

  it("logs invalid configuration errors at error level", () => {
    filter.catch(new InvalidConfigurationError("Bad config"), mockHost);

    assert.equal(
      (filter["logger"].error as unknown as MockCallCount).mock.callCount(),
      1,
    );
    assert.equal(
      (filter["logger"].warn as unknown as MockCallCount).mock.callCount(),
      0,
    );
  });

  it("logs other domain errors at warn level", () => {
    filter.catch(new AuthenticationError(), mockHost);

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
