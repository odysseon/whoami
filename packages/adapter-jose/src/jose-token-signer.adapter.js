"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoseTokenSigner = void 0;
var whoami_core_1 = require("@odysseon/whoami-core");
var jose_1 = require("jose");
var JoseTokenSigner = /** @class */ (function () {
  function JoseTokenSigner(config) {
    this.config = config;
    if (!config.secret || config.secret.length < 32) {
      throw new Error(
        "JoseTokenSigner requires a secret of at least 32 characters for adequate security.",
      );
    }
    // Jose requires the secret to be a Uint8Array for symmetric algorithms
    this.encodedSecret = new TextEncoder().encode(config.secret);
  }
  JoseTokenSigner.prototype.sign = function (payload, expiresInSeconds) {
    return __awaiter(this, void 0, void 0, function () {
      var jwt;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            jwt = new jose_1.SignJWT(payload)
              .setProtectedHeader({ alg: "HS256", typ: "JWT" })
              .setIssuedAt()
              .setExpirationTime("".concat(expiresInSeconds, "s"));
            if (this.config.issuer) {
              jwt = jwt.setIssuer(this.config.issuer);
            }
            if (this.config.audience) {
              jwt = jwt.setAudience(this.config.audience);
            }
            return [4 /*yield*/, jwt.sign(this.encodedSecret)];
          case 1:
            return [2 /*return*/, _a.sent()];
        }
      });
    });
  };
  JoseTokenSigner.prototype.verify = function (token) {
    return __awaiter(this, void 0, void 0, function () {
      var payload, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              (0, jose_1.jwtVerify)(token, this.encodedSecret, {
                issuer: this.config.issuer,
                audience: this.config.audience,
              }),
            ];
          case 1:
            payload = _a.sent().payload;
            // -------------------------------------------------------------
            // The Type Firewall: Validate required claims exist at runtime
            // -------------------------------------------------------------
            if (
              typeof payload.sub !== "string" ||
              payload.sub.trim().length === 0
            ) {
              throw new whoami_core_1.WhoamiError(
                "TOKEN_MALFORMED",
                "Token payload is missing a valid subject (sub) claim.",
              );
            }
            return [2 /*return*/, payload];
          case 2:
            error_1 = _a.sent();
            // If manual WhoamiError was thrown above, just bubble it up
            if (error_1 instanceof whoami_core_1.WhoamiError) {
              throw error_1;
            }
            // -------------------------------------------------------------
            // The Translator Boundary: Map library errors to Domain errors
            // -------------------------------------------------------------
            if (error_1 instanceof jose_1.errors.JWTExpired) {
              throw new whoami_core_1.WhoamiError(
                "TOKEN_EXPIRED",
                "The provided access token has expired.",
              );
            }
            if (
              error_1 instanceof jose_1.errors.JWTInvalid ||
              error_1 instanceof jose_1.errors.JWSInvalid ||
              error_1 instanceof jose_1.errors.JWSSignatureVerificationFailed ||
              error_1 instanceof jose_1.errors.JWTClaimValidationFailed
            ) {
              throw new whoami_core_1.WhoamiError(
                "TOKEN_MALFORMED",
                "The provided token is malformed, tampered with, or invalid.",
              );
            }
            throw new whoami_core_1.WhoamiError(
              "TOKEN_MALFORMED",
              "Failed to verify token.",
            );
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  return JoseTokenSigner;
})();
exports.JoseTokenSigner = JoseTokenSigner;
