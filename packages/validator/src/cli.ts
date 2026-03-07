#!/usr/bin/env node

import { validateUrl, validateFile } from "./index.js";
import type { ValidationResult } from "./index.js";

const args = process.argv.slice(2);

function printUsage() {
  console.log(`
AI-Me Vendor Card Validator v0.1.0

Usage:
  ai-me-validate <url>              Validate a site's vendor card
  ai-me-validate --file <path>      Validate a local JSON file

Examples:
  ai-me-validate https://example.com
  ai-me-validate --file ./ai-me.json

The URL mode fetches /.well-known/ai-me.json from the given domain.
`);
}

function printResult(result: ValidationResult, source: string) {
  if (result.valid) {
    console.log(`\n✅ Valid AI-Me vendor card`);
    console.log(`   Source: ${source}`);
    if (result.data && typeof result.data === "object" && result.data !== null) {
      const d = result.data as Record<string, unknown>;
      if (d.name) console.log(`   Name: ${d.name}`);
      if (d.schema_version) console.log(`   Schema version: ${d.schema_version}`);
    }
    console.log();
    process.exit(0);
  } else {
    console.log(`\n❌ Invalid AI-Me vendor card`);
    console.log(`   Source: ${source}`);
    console.log(`   Errors (${result.errors.length}):\n`);
    for (const err of result.errors) {
      console.log(`   • ${err.path} — ${err.message}`);
    }
    console.log();
    process.exit(1);
  }
}

async function main() {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  if (args[0] === "--file") {
    const filePath = args[1];
    if (!filePath) {
      console.error("Error: --file requires a path argument");
      process.exit(1);
    }
    console.log(`Validating file: ${filePath}`);
    const result = await validateFile(filePath);
    printResult(result, filePath);
  } else {
    const url = args[0];
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.error("Error: URL must start with http:// or https://");
      process.exit(1);
    }
    const vendorCardUrl = url.replace(/\/$/, "") + "/.well-known/ai-me.json";
    console.log(`Fetching: ${vendorCardUrl}`);
    const result = await validateUrl(url);
    printResult(result, vendorCardUrl);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err.message || err);
  process.exit(1);
});
