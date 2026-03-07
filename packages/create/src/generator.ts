import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Offering } from "./prompts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadSchema(): Record<string, unknown> {
  const schemaPath = resolve(__dirname, "..", "..", "..", "schemas", "ai-me.schema.json");
  try {
    return JSON.parse(readFileSync(schemaPath, "utf-8"));
  } catch {
    const bundledPath = resolve(__dirname, "..", "schemas", "ai-me.schema.json");
    return JSON.parse(readFileSync(bundledPath, "utf-8"));
  }
}

export interface CardInput {
  name: string;
  website: string;
  summary: string;
  home: string;
  contact: string;
  identity?: Record<string, unknown> | null;
  extraPages?: Record<string, string> | null;
  offerings?: Offering[] | null;
  related?: Record<string, string> | null;
  support?: Record<string, string> | null;
  technical?: Record<string, unknown> | null;
}

export function buildCard(input: CardInput): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);

  const card: Record<string, unknown> = {
    schema_version: "0.1",
    name: input.name,
    website: input.website,
    summary: input.summary,
  };

  // Merge optional identity fields at the top level
  if (input.identity) {
    Object.assign(card, input.identity);
  }

  // Build canonical_pages
  const canonical_pages: Record<string, string> = {
    home: input.home,
    contact: input.contact,
  };
  if (input.extraPages) {
    Object.assign(canonical_pages, input.extraPages);
  }
  card.canonical_pages = canonical_pages;

  if (input.offerings) card.offerings = input.offerings;
  if (input.related) card.related = input.related;
  if (input.support) card.support = input.support;
  if (input.technical) card.technical = input.technical;

  card.last_updated = today;

  return card;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCard(card: Record<string, unknown>): ValidationResult {
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(card);

  if (valid) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: (validate.errors || []).map(
      (err) => `${err.instancePath || "/"} — ${err.message || "Unknown error"}`
    ),
  };
}

export function writeCard(card: Record<string, unknown>, outputPath: string): string {
  const resolved = resolve(process.cwd(), outputPath);
  const dir = dirname(resolved);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(resolved, JSON.stringify(card, null, 2) + "\n", "utf-8");
  return resolved;
}
