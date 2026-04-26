import type { OAS3Options } from "swagger-jsdoc";
import { env } from "./utils.js";

const port = Number(env("PORT", "3030"));

/**
 * OpenAPI 3.0 specification for the Whoami Express example API.
 *
 * Defined as a plain object so the spec is co-located with the code it
 * documents, fully type-checked, and never requires file-glob scanning.
 */
export const swaggerOptions: OAS3Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Whoami — Express Example",
      version: "0.0.0",
      description:
        "Demonstrates all `@odysseon/whoami-*` adapters wired into an Express 5 server " +
        "with in-memory stores. **Not for production use.**",
      license: { name: "ISC" },
    },
    servers: [
      { url: `http://localhost:${port}`, description: "Local dev server" },
    ],
    tags: [
      { name: "accounts", description: "Account registration" },
      {
        name: "auth",
        description: "Authentication — password, magic-link, OAuth",
      },
      { name: "identity", description: "Authenticated identity endpoints" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Receipt token issued by any `/login` endpoint.",
        },
      },
      schemas: {
        // ── Request bodies ──────────────────────────────────────────────────
        RegisterBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
            },
            password: { type: "string", minLength: 8, example: "secret123" },
          },
        },
        LoginPasswordBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
            },
            password: { type: "string", example: "secret123" },
          },
        },
        MagicLinkRequestBody: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
            },
          },
        },
        MagicLinkVerifyBody: {
          type: "object",
          required: ["email", "token"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
            },
            token: {
              type: "string",
              example: "550e8400-e29b-41d4-a716-446655440000",
            },
          },
        },
        OAuthLoginBody: {
          type: "object",
          required: ["email", "provider", "providerId"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
            },
            provider: { type: "string", example: "google" },
            providerId: { type: "string", example: "g-12345" },
          },
        },
        // ── Responses ───────────────────────────────────────────────────────
        AccountCreated: {
          type: "object",
          properties: {
            accountId: { type: "number", example: 1 },
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
            },
          },
        },
        ReceiptToken: {
          type: "object",
          properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
        MagicLinkIssued: {
          type: "object",
          properties: {
            message: { type: "string", example: "Magic link issued." },
            magicLinkToken: {
              type: "string",
              example: "550e8400-e29b-41d4-a716-446655440000",
              description: "Demo only — never expose raw tokens in production.",
            },
            expiresAt: { type: "string", format: "date-time" },
            note: {
              type: "string",
              example: "demo only — never expose tokens in production",
            },
          },
        },
        Profile: {
          type: "object",
          properties: {
            accountId: { type: "number", example: 1 },
            email: {
              type: "string",
              format: "email",
              example: "ada@example.com",
              nullable: true,
            },
            tokenExpiresAt: { type: "string", format: "date-time" },
          },
        },
        DomainError: {
          type: "object",
          properties: {
            error: { type: "string", example: "AuthenticationError" },
          },
        },
      },
    },
    paths: {
      // ── POST /register ────────────────────────────────────────────────────
      "/register": {
        post: {
          tags: ["accounts"],
          summary: "Register a new account",
          description:
            "Creates an account and stores an Argon2 password credential. " +
            "Returns `409` if the email is already in use.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterBody" },
              },
            },
          },
          responses: {
            "201": {
              description: "Account created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AccountCreated" },
                },
              },
            },
            "409": {
              description: "Email already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DomainError" },
                },
              },
            },
          },
        },
      },
      // ── POST /login ───────────────────────────────────────────────────────
      "/login": {
        post: {
          tags: ["auth"],
          summary: "Login with email + password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginPasswordBody" },
              },
            },
          },
          responses: {
            "200": {
              description: "Receipt token issued",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ReceiptToken" },
                },
              },
            },
            "401": {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DomainError" },
                },
              },
            },
          },
        },
      },
      // ── POST /login/magic-link/request ────────────────────────────────────
      "/login/magic-link/request": {
        post: {
          tags: ["auth"],
          summary: "Request a magic-link token",
          description:
            "Generates a one-time magic-link token valid for 15 minutes and stores its " +
            "SHA-256 hash (via WebCrypto adapter). In production the raw token would be " +
            "emailed; here it is returned in the response body for demo purposes.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MagicLinkRequestBody" },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Magic link token issued (or ambiguous response if email unknown)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MagicLinkIssued" },
                },
              },
            },
          },
        },
      },
      // ── POST /login/magic-link/verify ─────────────────────────────────────
      "/login/magic-link/verify": {
        post: {
          tags: ["auth"],
          summary: "Verify a magic-link token",
          description:
            "Hashes the supplied token with SHA-256 and compares it to the stored hash.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MagicLinkVerifyBody" },
              },
            },
          },
          responses: {
            "200": {
              description: "Receipt token issued",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ReceiptToken" },
                },
              },
            },
            "401": {
              description: "Invalid or expired magic-link token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DomainError" },
                },
              },
            },
          },
        },
      },
      // ── POST /login/oauth ─────────────────────────────────────────────────
      "/login/oauth": {
        post: {
          tags: ["auth"],
          summary: "Login or auto-register via OAuth",
          description:
            "Auto-registers a new account on the first call for a given email. " +
            "On subsequent calls, verifies that the provider + providerId match the stored credential.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OAuthLoginBody" },
              },
            },
          },
          responses: {
            "200": {
              description: "Receipt token issued",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ReceiptToken" },
                },
              },
            },
            "401": {
              description: "OAuth provider mismatch",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DomainError" },
                },
              },
            },
          },
        },
      },
      // ── GET /me ───────────────────────────────────────────────────────────
      "/me": {
        get: {
          tags: ["identity"],
          summary: "Get authenticated account profile",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Authenticated profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Profile" },
                },
              },
            },
            "401": {
              description: "Missing or invalid receipt token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DomainError" },
                },
              },
            },
          },
        },
      },
    },
  },
  // swagger-jsdoc still requires an `apis` array even when all paths are
  // defined inline — an empty array suppresses file scanning entirely.
  apis: [],
};
