import { input, confirm, select } from "@inquirer/prompts";

// ── Required fields ──────────────────────────────────────────────

export async function promptRequired() {
  const name = await input({
    message: "Organization / project name:",
    validate: (v) => (v.trim().length > 0 ? true : "Name is required"),
  });

  const website = await input({
    message: "Website URL (e.g. https://example.com):",
    validate: (v) =>
      /^https?:\/\/.+/.test(v.trim()) ? true : "Must be a valid URL starting with http(s)://",
  });

  const summary = await input({
    message: "One-sentence summary of what you do:",
    validate: (v) => (v.trim().length > 0 ? true : "Summary is required"),
  });

  const home = await input({
    message: "Home page URL:",
    default: website.replace(/\/$/, "") + "/",
    validate: (v) =>
      /^https?:\/\/.+/.test(v.trim()) ? true : "Must be a valid URL",
  });

  const contact = await input({
    message: "Contact page URL:",
    default: website.replace(/\/$/, "") + "/contact",
    validate: (v) =>
      /^https?:\/\/.+/.test(v.trim()) ? true : "Must be a valid URL",
  });

  return { name: name.trim(), website: website.trim(), summary: summary.trim(), home: home.trim(), contact: contact.trim() };
}

// ── Optional identity fields ─────────────────────────────────────

export async function promptOptionalIdentity() {
  const add = await confirm({ message: "Add optional identity fields (legal name, logo, languages, regions, category)?", default: false });
  if (!add) return null;

  const legal_name = await input({ message: "Legal entity name (leave blank to skip):" });
  const logo = await input({ message: "Logo URL (leave blank to skip):" });
  const languagesRaw = await input({ message: "Languages (BCP 47 codes, comma-separated, e.g. en,de):" });
  const regionsRaw = await input({ message: "Regions served (comma-separated, e.g. US,EU):" });
  const categoryRaw = await input({ message: "Categories (comma-separated, e.g. saas,enterprise):" });

  const result: Record<string, unknown> = {};
  if (legal_name.trim()) result.legal_name = legal_name.trim();
  if (logo.trim()) result.logo = logo.trim();
  if (languagesRaw.trim()) result.languages = languagesRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (regionsRaw.trim()) result.regions = regionsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (categoryRaw.trim()) result.category = categoryRaw.split(",").map((s) => s.trim()).filter(Boolean);

  return Object.keys(result).length > 0 ? result : null;
}

// ── Optional canonical pages ─────────────────────────────────────

export async function promptOptionalPages() {
  const add = await confirm({ message: "Add optional canonical pages (pricing, docs, privacy, terms, security, imprint)?", default: false });
  if (!add) return null;

  const pages: Record<string, string> = {};
  const pageKeys = ["pricing", "docs", "privacy", "terms", "security", "imprint"] as const;

  for (const key of pageKeys) {
    const url = await input({ message: `${key} page URL (leave blank to skip):` });
    if (url.trim()) pages[key] = url.trim();
  }

  return Object.keys(pages).length > 0 ? pages : null;
}

// ── Offerings ────────────────────────────────────────────────────

const OFFERING_TYPES = [
  "service", "product", "subscription", "api", "tool", "content", "open_source", "other",
] as const;

const PRICING_MODELS = [
  "free", "freemium", "fixed", "tiered", "usage", "quote", "contact_sales", "daily_rate", "open_source",
] as const;

export interface Offering {
  name: string;
  type: string;
  description: string;
  pricing: { model: string; currency: string; url: string };
  cta: { label: string; url: string };
}

async function promptSingleOffering(): Promise<Offering> {
  const name = await input({
    message: "  Offering name:",
    validate: (v) => (v.trim().length > 0 ? true : "Name is required"),
  });

  const type = await select({
    message: "  Offering type:",
    choices: OFFERING_TYPES.map((t) => ({ value: t, name: t })),
  });

  const description = await input({
    message: "  Brief description:",
    validate: (v) => (v.trim().length > 0 ? true : "Description is required"),
  });

  const model = await select({
    message: "  Pricing model:",
    choices: PRICING_MODELS.map((m) => ({ value: m, name: m })),
  });

  const currency = await input({ message: "  Currency (ISO 4217 code, e.g. USD — leave blank if N/A):" });
  const pricingUrl = await input({ message: "  Pricing page URL (leave blank if N/A):" });

  const ctaLabel = await input({
    message: "  CTA button label (e.g. \"Start free trial\"):",
    validate: (v) => (v.trim().length > 0 ? true : "Label is required"),
  });

  const ctaUrl = await input({
    message: "  CTA URL:",
    validate: (v) =>
      /^https?:\/\/.+/.test(v.trim()) ? true : "Must be a valid URL",
  });

  return {
    name: name.trim(),
    type,
    description: description.trim(),
    pricing: { model, currency: currency.trim(), url: pricingUrl.trim() },
    cta: { label: ctaLabel.trim(), url: ctaUrl.trim() },
  };
}

export async function promptOfferings(): Promise<Offering[] | null> {
  const add = await confirm({ message: "Add offerings (products / services)?", default: false });
  if (!add) return null;

  const offerings: Offering[] = [];
  let more = true;

  while (more) {
    console.log(`\n  — Offering #${offerings.length + 1}`);
    offerings.push(await promptSingleOffering());
    more = await confirm({ message: "Add another offering?", default: false });
  }

  return offerings.length > 0 ? offerings : null;
}

// ── Related links ────────────────────────────────────────────────

export async function promptRelated() {
  const add = await confirm({ message: "Add related protocol links (schema.org, llms.txt, MCP, A2A)?", default: false });
  if (!add) return null;

  const related: Record<string, string> = {};
  const keys = [
    { key: "schema_org", label: "Schema.org JSON-LD URL" },
    { key: "llms_txt", label: "llms.txt URL" },
    { key: "mcp", label: "MCP server manifest URL" },
    { key: "a2a", label: "A2A agent card URL" },
  ];

  for (const { key, label } of keys) {
    const url = await input({ message: `${label} (leave blank to skip):` });
    if (url.trim()) related[key] = url.trim();
  }

  return Object.keys(related).length > 0 ? related : null;
}

// ── Support info ─────────────────────────────────────────────────

export async function promptSupport() {
  const add = await confirm({ message: "Add support information?", default: false });
  if (!add) return null;

  const email = await input({ message: "Support email (leave blank to skip):" });
  const hours = await input({ message: "Support hours (e.g. Mon-Fri 09:00-17:00 EST, leave blank to skip):" });
  const response_time = await input({ message: "Typical response time (e.g. 24 hours, leave blank to skip):" });

  const support: Record<string, string> = {};
  if (email.trim()) support.email = email.trim();
  if (hours.trim()) support.hours = hours.trim();
  if (response_time.trim()) support.response_time = response_time.trim();

  return Object.keys(support).length > 0 ? support : null;
}

// ── Technical info ───────────────────────────────────────────────

export async function promptTechnical() {
  const add = await confirm({ message: "Add technical information?", default: false });
  if (!add) return null;

  const api_available = await confirm({ message: "Is an API available?", default: false });
  const api_docs_url = await input({ message: "API docs URL (leave blank to skip):" });
  const status_page_url = await input({ message: "Status page URL (leave blank to skip):" });

  const technical: Record<string, unknown> = { api_available };
  if (api_docs_url.trim()) technical.api_docs_url = api_docs_url.trim();
  if (status_page_url.trim()) technical.status_page_url = status_page_url.trim();

  return technical;
}

// ── Output path ──────────────────────────────────────────────────

export async function promptOutputPath(): Promise<string> {
  return await input({
    message: "Output file path:",
    default: ".well-known/ai-me.json",
  });
}
