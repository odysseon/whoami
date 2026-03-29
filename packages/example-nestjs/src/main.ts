import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env["PORT"] ?? 3000);

  await app.listen(port);

  console.info(`[whoami] NestJS example running on http://localhost:${port}`);
  console.info("[whoami] Public routes:");
  console.info("  POST /accounts/register   { email, password }");
  console.info("  POST /auth/login          { email, password }");
  console.info("  POST /auth/magic-link/request  { email }");
  console.info("  POST /auth/magic-link/verify   { email, token }");
  console.info("  POST /auth/oauth          { email, provider, providerId }");
  console.info("[whoami] Protected routes (Bearer <token> required):");
  console.info("  GET  /me");
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
