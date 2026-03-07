import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: unknown;
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

function loadSchema(): Record<string, unknown> {
  // Try loading from the schemas directory relative to the package
  const schemaPath = resolve(__dirname, "..", "..", "..", "schemas", "ai-me.schema.json");
  try {
    return JSON.parse(readFileSync(schemaPath, "utf-8"));
  } catch {
    // Fallback: try loading from bundled schemas dir
    const bundledPath = resolve(__dirname, "..", "schemas", "ai-me.schema.json");
    return JSON.parse(readFileSync(bundledPath, "utf-8"));
  }
}

export function validate(data: unknown): ValidationResult {
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validateFn = ajv.compile(schema);
  const valid = validateFn(data);

  if (valid) {
    return { valid: true, errors: [], data };
  }

  return {
    valid: false,
    errors: (validateFn.errors || []).map((err: ErrorObject) => ({
      path: err.instancePath || "/",
      message: err.message || "Unknown error",
      keyword: err.keyword,
    })),
    data,
  };
}

export async function validateUrl(url: string): Promise<ValidationResult> {
  const vendorCardUrl = url.replace(/\/$/, "") + "/.well-known/ai-me.json";

  const response = await fetch(vendorCardUrl);

  if (!response.ok) {
    return {
      valid: false,
      errors: [
        {
          path: "/",
          message: `HTTP ${response.status}: Could not fetch ${vendorCardUrl}`,
          keyword: "fetch",
        },
      ],
    };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
    // Warn but don't fail — some servers don't set Content-Type correctly
    console.warn(
      `Warning: Expected Content-Type application/json, got: ${contentType}`
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return {
      valid: false,
      errors: [
        {
          path: "/",
          message: "Response is not valid JSON",
          keyword: "parse",
        },
      ],
    };
  }

  return validate(data);
}

export async function validateFile(filePath: string): Promise<ValidationResult> {
  const content = readFileSync(filePath, "utf-8");
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return {
      valid: false,
      errors: [
        {
          path: "/",
          message: "File is not valid JSON",
          keyword: "parse",
        },
      ],
    };
  }

  return validate(data);
}
