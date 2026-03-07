#!/usr/bin/env node

import {
  promptRequired,
  promptOptionalIdentity,
  promptOptionalPages,
  promptOfferings,
  promptRelated,
  promptSupport,
  promptTechnical,
  promptOutputPath,
} from "./prompts.js";
import { buildCard, validateCard, writeCard } from "./generator.js";

async function main() {
  console.log("\n🤖 AI-Me Vendor Card Generator v0.1.0");
  console.log("   Create your ai-me.json in minutes.\n");

  // ── Step 1: Required fields ──
  console.log("── Required fields ──\n");
  const required = await promptRequired();

  // ── Step 2: Optional identity ──
  console.log("\n── Optional sections ──\n");
  const identity = await promptOptionalIdentity();

  // ── Step 2b: Optional canonical pages ──
  const extraPages = await promptOptionalPages();

  // ── Step 3: Offerings ──
  const offerings = await promptOfferings();

  // ── Step 4: Related links ──
  const related = await promptRelated();

  // ── Step 5: Support ──
  const support = await promptSupport();

  // ── Step 6: Technical ──
  const technical = await promptTechnical();

  // ── Build & validate ──
  const card = buildCard({
    ...required,
    identity,
    extraPages,
    offerings,
    related,
    support,
    technical,
  });

  console.log("\n── Validation ──\n");
  const result = validateCard(card);

  if (result.valid) {
    console.log("✅ Valid AI-Me vendor card!\n");
  } else {
    console.log("⚠️  Validation warnings:");
    for (const err of result.errors) {
      console.log(`   • ${err}`);
    }
    console.log();
  }

  // ── Preview ──
  console.log("── Preview ──\n");
  console.log(JSON.stringify(card, null, 2));

  // ── Write file ──
  console.log("\n── Output ──\n");
  const outputPath = await promptOutputPath();
  const resolved = writeCard(card, outputPath);
  console.log(`\n✅ Vendor card written to: ${resolved}`);
  console.log("   Deploy this file to /.well-known/ai-me.json on your web server.\n");
}

main().catch((err) => {
  if (err instanceof Error && err.message.includes("User force closed")) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }
  console.error("Unexpected error:", err.message || err);
  process.exit(1);
});
