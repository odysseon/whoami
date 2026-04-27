#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const CONSUMER_SCHEMA_PATH = path.join(
  process.cwd(),
  "prisma",
  "schema.prisma",
);
const OUR_SCHEMA_PATH = path.join(__dirname, "..", "schema.prisma");

// Markers to detect if we've already added our content
const START_MARKER =
  "// ============================================\n// @odysseon/whoami-adapter-prisma\n// ============================================";
const END_MARKER =
  "// ============================================\n// End of @odysseon/whoami-adapter-prisma\n// ============================================";

// Models to check for existence (legacy detection before markers existed)
const OUR_MODELS = [
  "model Account",
  "model PasswordHash",
  "model PasswordResetToken",
  "model OAuthCredential",
  "model MagicLinkToken",
];

function hasOurModels(content) {
  return OUR_MODELS.every((model) => content.includes(model));
}

function hasMarkers(content) {
  return content.includes(START_MARKER) && content.includes(END_MARKER);
}

function extractOurContent() {
  return fs.readFileSync(OUR_SCHEMA_PATH, "utf-8");
}

function stripExistingOurContent(content) {
  // If markers exist, remove everything between them
  if (hasMarkers(content)) {
    const startIndex = content.indexOf(START_MARKER);
    const endIndex = content.indexOf(END_MARKER) + END_MARKER.length;
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    return (before + after).replace(/\n{3,}/g, "\n\n");
  }

  // Legacy: if no markers but models exist, strip them out
  if (hasOurModels(content)) {
    let result = content;
    for (const model of OUR_MODELS) {
      const modelRegex = new RegExp(
        `\\n?${model}[\\s\\S]*?(?=\\nmodel |\\n$|\\n// |$)`,
        "g",
      );
      result = result.replace(modelRegex, "");
    }
    return result.replace(/\n{3,}/g, "\n\n").trim();
  }

  return content;
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  // Check if prisma is initialized
  if (!fs.existsSync(CONSUMER_SCHEMA_PATH)) {
    console.log("⚠️  prisma/schema.prisma not found.");
    console.log(
      '   Run "npx prisma init" first, then run this script again.\n',
    );
    console.log("   Or manually copy the models from:");
    console.log(`   ${OUR_SCHEMA_PATH}`);
    process.exit(0);
  }

  // Read current schema
  let consumerSchema = fs.readFileSync(CONSUMER_SCHEMA_PATH, "utf-8");

  // Check if already merged
  if (hasMarkers(consumerSchema) && hasOurModels(consumerSchema)) {
    console.log("✅ Auth tables already present in schema.prisma");
    printNextSteps();
    process.exit(0);
  }

  // Strip any existing our content (for updates)
  consumerSchema = stripExistingOurContent(consumerSchema);

  // Read our content
  const ourContent = extractOurContent();

  // Prepare content to append
  const separator = "\n\n";
  const wrappedOurContent = `${START_MARKER}\n${ourContent}\n${END_MARKER}`;

  // Append to consumer schema
  const newSchema =
    consumerSchema.trimEnd() + separator + wrappedOurContent + "\n";

  // Write back
  ensureDirectoryExists(CONSUMER_SCHEMA_PATH);
  fs.writeFileSync(CONSUMER_SCHEMA_PATH, newSchema);

  console.log("✅ Added whoami auth tables to prisma/schema.prisma");
  printNextSteps();
}

function printNextSteps() {
  console.log(`
${"=".repeat(60)}
📋 NEXT STEPS
${"=".repeat(60)}

1️⃣  Link your User model to Account

   In prisma/schema.prisma, find the Account model and UNCOMMENT this line:
   
      model Account {
        // ... existing fields
        user User?   // ← Uncomment this line
      }

2️⃣  Ensure you have a User model (create if missing):

      model User {
        id        String   @id @default(cuid())
        accountId String   @unique
        account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
        
        // Your business fields
        name      String
        email     String   @unique  // optional, you may use Account.email instead
        role      String   @default("user")
        
        @@map("users")
      }

3️⃣  Run migrations:

      npx prisma migrate dev --name add_whoami_auth

4️⃣  Generate Prisma client:

      npx prisma generate

5️⃣  Use the adapter in your code:

      import { PrismaClient } from './generated/prisma';
      import { PrismaPg } from '@prisma/adapter-pg';
      import { createPrismaAdapters } from '@odysseon/whoami-adapter-prisma';

      const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
      const prisma = new PrismaClient({ adapter });
      const adapters = createPrismaAdapters(prisma);

${"=".repeat(60)}
📖 Documentation: https://github.com/odysseon/whoami
${"=".repeat(60)}
`);
}

main();
