<p align="center">
  <img src="docs/logo.png" alt="AI-Me Logo" width="280">
</p>

<h1 align="center">AI-Me Vendor Card Specification</h1>

<p align="center">
  One-fetch, site-wide discovery for AI agents — a single JSON file at a well-known endpoint.
</p>

<p align="center">
  <a href="https://github.com/aselims/ai-me/actions/workflows/ci.yml"><img src="https://github.com/aselims/ai-me/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/spec-v0.1_(draft)-blue" alt="Spec Version">
  <img src="https://img.shields.io/badge/license-CC--BY--4.0%20%2B%20Apache--2.0-green" alt="License">
</p>

---

## What is AI-Me?

AI-Me defines a JSON document served at `/.well-known/ai-me.json` that provides canonical pages, offerings, pricing model, and primary calls-to-action in a strict, validatable shape. It complements existing efforts like llms.txt, schema.org, MCP, and A2A.

**Website:** [spec.ai-me.dev](https://spec.ai-me.dev)

## Quick Start

1. Create `/.well-known/ai-me.json` on your site:

```json
{
  "schema_version": "0.1",
  "name": "Your Company",
  "website": "https://example.com",
  "summary": "What you do, in one sentence.",
  "canonical_pages": {
    "home": "https://example.com/",
    "contact": "https://example.com/contact"
  },
  "last_updated": "2026-03-05"
}
```

2. (Recommended) Add `/.well-known/llms.txt` with a pointer to your vendor card.

3. Validate:

```bash
npx @ai-me/validator https://yourdomain.com
```

## Repository Structure

```
ai-me/
├── spec/              Normative specification markdown
├── schemas/           JSON Schema for validation
├── examples/          Example vendor cards (SaaS, consulting, OSS, e-commerce)
├── packages/
│   └── validator/     CLI validator tool
├── website/           Astro-based documentation site
└── docs/              Supporting documentation
```

## Development

```bash
# Install dependencies
pnpm install

# Run the website locally
pnpm dev

# Build the website
pnpm build

# Preview the built site
pnpm preview
```

## Adopters

Using AI-Me in production? [Open a PR](CONTRIBUTING.md) to add yourself here.

<!-- Add your organization below in alphabetical order -->
<!-- | [Your Org](https://example.com) | Brief description | -->

*Be the first to adopt the spec and get listed here.*

## Links

- [Specification](https://spec.ai-me.dev/spec)
- [Quick Start Guide](https://spec.ai-me.dev/quickstart)
- [Examples](https://spec.ai-me.dev/examples)
- [Validator Playground](https://spec.ai-me.dev/validator)
- [FAQ](https://spec.ai-me.dev/faq)

## License

This project uses a dual-license structure:

- **Specification, schemas, and examples** — [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Code** (website, validator, tooling) — [Apache 2.0](LICENSE-APACHE)

See [LICENSE](LICENSE) for full details.
