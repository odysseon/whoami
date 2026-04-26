import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env["PORT"] ?? 3040);

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Whoami — NestJS Example")
    .setDescription(
      "Demonstrates all `@odysseon/whoami-*` adapters wired into a NestJS 11 application " +
        "with in-memory stores. **Not for production use.**",
    )
    .setVersion("0.0.0")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Receipt token issued by any `/auth/*` endpoint.",
    })
    .addTag("accounts", "Account registration")
    .addTag("auth", "Authentication — password, OAuth")
    .addTag("identity", "Authenticated identity endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs.json",
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });
  // ──────────────────────────────────────────────────────────────────────────

  await app.listen(port);

  console.info(`[whoami] NestJS example running on http://localhost:${port}`);
  console.info(`[whoami] Swagger UI  → http://localhost:${port}/docs`);
  console.info(`[whoami] OpenAPI JSON → http://localhost:${port}/docs.json`);
  console.info("[whoami] Public routes:");
  console.info("  POST /accounts/register   { email, password }");
  console.info("  POST /auth/login          { email, password }");
  console.info("  POST /auth/oauth          { email, provider, providerId }");
  console.info("[whoami] Protected routes (Bearer <token> required):");
  console.info("  GET  /me");
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
