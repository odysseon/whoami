/* eslint-disable @typescript-eslint/explicit-function-return-type */
import assert from "node:assert/strict";
import { describe, it, beforeEach, mock } from "node:test";
import type { ArgumentsHost } from "@nestjs/common";
import {
  AccountAlreadyExistsError,
  AuthenticationError,
  InvalidConfigurationError,
  InvalidEmailError,
  InvalidReceiptError,
} from "@odysseon/whoami-core";
import { WhoamiExceptionFilter } from "./whoami-exception.filter.js";

function makeHost(
  statusFn: ReturnType<typeof mock.fn>,
  jsonFn: ReturnType<typeof mock.fn>,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: (code: number) => {
          statusFn(code);
          return { json: jsonFn };
        },
      }),
      getRequest: () => ({}),
      getNext: () => ({}),
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({ getData: () => ({}), getContext: () => ({}) }),
    switchToWs: () => ({ getData: () => ({}), getClient: () => ({}) }),
    getType: () => "http" as const,
  } as unknown as ArgumentsHost;
}

describe("WhoamiExceptionFilter", () => {
  let filter: WhoamiExceptionFilter;

  beforeEach(() => {
    filter = new WhoamiExceptionFilter();
  });

  it("maps AuthenticationError to HTTP 401", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    filter.catch(new AuthenticationError(), host);
    assert.equal(statusFn.mock.calls[0]?.arguments[0], 401);
  });

  it("maps InvalidReceiptError to HTTP 401", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    filter.catch(new InvalidReceiptError("bad token"), host);
    assert.equal(statusFn.mock.calls[0]?.arguments[0], 401);
  });

  it("maps AccountAlreadyExistsError to HTTP 409", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    filter.catch(new AccountAlreadyExistsError(), host);
    assert.equal(statusFn.mock.calls[0]?.arguments[0], 409);
  });

  it("maps InvalidEmailError to HTTP 400", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    filter.catch(new InvalidEmailError(), host);
    assert.equal(statusFn.mock.calls[0]?.arguments[0], 400);
  });

  it("maps InvalidConfigurationError to HTTP 500", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    filter.catch(new InvalidConfigurationError("bad config"), host);
    assert.equal(statusFn.mock.calls[0]?.arguments[0], 500);
  });

  it("logs invalid configuration errors at error level", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    const logSpy = mock.method(
      (filter as unknown as { logger: { error: () => void } }).logger,
      "error",
    );
    filter.catch(new InvalidConfigurationError("bad config"), host);
    assert.equal(logSpy.mock.calls.length, 1);
  });

  it("logs other domain errors at warn level", () => {
    const statusFn = mock.fn();
    const jsonFn = mock.fn();
    const host = makeHost(statusFn, jsonFn);
    const logSpy = mock.method(
      (filter as unknown as { logger: { warn: () => void } }).logger,
      "warn",
    );
    filter.catch(new AuthenticationError(), host);
    assert.equal(logSpy.mock.calls.length, 1);
  });
});
