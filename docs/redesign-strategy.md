# AI-Me Redesign Strategy

## Core Positioning Statement

AI-Me is the open standard for machine-readable site identity — a single JSON document at a predictable endpoint that tells AI agents who you are, what you offer, and how to engage. One fetch. Full picture.

## Message Hierarchy

1. **The problem**: AI agents cannot reliably discover what a website is about. Scraping is expensive and inaccurate. Schema.org is scattered. There is no standard "business card" for the AI era.
2. **The solution**: A discovery manifest at `/.well-known/ai-me.json` — one authoritative document, site-wide scope, strict schema, agent-ready.
3. **Why this spec**: Not another verbose vocabulary. Strict, minimal, validatable. Designed for the read patterns of AI agents, not search crawlers.
4. **Why now**: AI agents are proliferating. The window to establish a clean standard is now, while agent tooling is still forming habits.
5. **Why trust it**: Open specification, open governance, complementary to existing standards, no vendor lock-in.

## Adoption Wedge

**Primary wedge**: Developer-led bottom-up adoption. The target is the developer/founder who runs the website, hears "AI agents can't understand your site" and wants a simple, principled fix they can deploy in five minutes.

**Secondary wedge**: Agent builders (people building LLM applications) who need structured, reliable data about third-party services. If enough sites publish ai-me.json, it becomes a datasource agent builders rely on.

## Target Audiences

### 1. Web developers / site owners (primary)
- Pain: "AI agents hallucinate about my product. They can't find my pricing page. They give outdated info."
- Want: A simple, authoritative way to control how AI sees their site.
- Action: Publish ai-me.json, validate, done.
- Message: "Tell AI agents about your site in five minutes."

### 2. AI / LLM application builders (secondary)
- Pain: "I need structured data about third-party services but scraping is fragile and slow."
- Want: A reliable, consistent data source for service discovery.
- Message: "A growing catalog of structured site data at a known endpoint."

### 3. API / SaaS product teams (tertiary)
- Pain: "AI assistants recommend competitors because we don't have structured discoverability."
- Want: Machine-readable representation of their offerings, pricing, CTAs.
- Message: "Give AI agents a direct line to your product, pricing, and API."

## Trust Framing

- Open specification (CC-BY 4.0), open code (Apache-2.0)
- Complementary to — not competing with — schema.org, llms.txt, MCP, A2A
- Hosted at a well-known URI (RFC 8615 pattern) — the same pattern used by robots.txt, security.txt
- Strict JSON Schema — machine-verifiable, not aspirational
- v0.1 is a draft; transparency about maturity builds more trust than overclaiming

**Do not claim**: adoption numbers, company logos, endorsements we don't have. Intellectual honesty is a feature.

## Conversion Flow

Homepage → understand the problem → see the solution → quick start or generate → validate → done.

CTAs in order of friction:
1. "Generate your manifest" (lowest friction — web wizard)
2. "Get started" → quickstart.astro (five-minute guide)
3. "Read the spec" (for the thorough reader)

## Proposed IA / Sitemap

### Navigation (updated)
- Spec
- Quick Start
- Examples
- Validator
- Generate
- FAQ
- Roadmap

No changes to navigation structure. Current nav is appropriate.

### Footer (updated)
- Specification: Read the Spec, Quick Start, Examples, Validator
- Learn: FAQ, Why Not Schema.org?, Artifacts
- Project: Roadmap, Governance, Contributing
- Resources: GitHub, Our ai-me.json, Our llms.txt

Footer copy update: Change "AI-Me Vendor Card Specification v0.1" to "AI-Me Discovery Manifest Specification v0.1" in tagline.

## Language Guidance

### Primary terms (use these):
- "discovery manifest" — site-level document
- "AI discovery manifest" — with qualifier
- "ai-me.json" — always lowercase, with .json
- "site card" — casual shorthand (acceptable)
- "machine-readable site identity"

### Secondary terms (acceptable but not primary):
- "vendor card" — still correct, can use in examples and technical contexts
- "structured discovery" — for agent-oriented copy

### Avoid as primary framing:
- "vendor card" as the headline concept (too narrow, implies only commercial sites)
- Any analogy that implies it's just for businesses

## Full Rewritten Homepage Copy

---

### Hero

**Badge**: v0.1 Draft — Open Specification

**H1**: Let AI agents understand your site.

**Subhead**: AI-Me is an open standard for machine-readable site identity. One JSON file at a well-known endpoint gives AI agents a complete, authoritative picture of who you are and what you offer — without crawling, scraping, or guessing.

**CTAs**:
- Primary: "Get started in 5 minutes" → /quickstart
- Secondary: "Generate your manifest" → /generate
- Tertiary: "Read the spec" → /spec

---

### Credibility / Context Strip

**Label**: Why this matters

Three short callouts (icon + title + 1 sentence):

1. **Agents are reading your site — badly.** Without structured data, AI agents scrape, guess, and hallucinate. Give them authoritative information instead.

2. **One file. Site-wide scope.** A single JSON document covers your identity, canonical pages, offerings, and calls to action — no page-by-page markup.

3. **Strict and validatable.** A formal JSON Schema means any agent, tool, or system can verify conformance automatically.

---

### Problem / Pain Section

**H2**: AI agents are flying blind.

**Body**:
AI assistants, agent frameworks, and LLM-powered tools are increasingly trying to understand what websites offer — to answer user questions, route requests, and take actions on behalf of users.

Right now, they have three bad options:

- **Scrape HTML** — slow, fragile, and hits bot protections
- **Crawl multiple pages** — expensive and still incomplete
- **Make it up** — hallucinated facts, wrong prices, outdated CTAs

Schema.org helps search engines but is scattered across pages. llms.txt is human-readable guidance, not machine-readable structure. There is no standard, compact, authoritative document an AI agent can fetch to understand a site in one request.

**That's the gap AI-Me fills.**

---

### How It Works

**H2**: How AI-Me works

**Subhead**: A single well-known endpoint. One HTTP request. Full picture.

**Diagram**: (keep existing SVG, update labels)

**Steps below diagram**:

1. **Publish** `/.well-known/ai-me.json` — a JSON document conforming to the AI-Me schema.
2. **Agents fetch** that URL on first encounter with your domain.
3. **They get** your name, summary, canonical pages, offerings, support contacts, and links to MCP/A2A/llms.txt — everything needed to engage correctly.

**CTA below**: "See the full data model →" (links to /spec)

---

### Who It Is For

**H2**: Built for the whole web

Three audience blocks side by side:

**Web developers and site owners**
Your site is increasingly accessed by AI agents, not just browsers. Give agents a reliable, authoritative source of truth about your site — and control what they know.

**SaaS and API teams**
AI assistants are becoming purchase research tools. Make your product, pricing, and API discoverable with structured data agents can act on.

**AI and agent builders**
Building with LLMs? Point your agent at `/.well-known/ai-me.json` for reliable, structured data about any site that has published a manifest — no scraping required.

---

### Comparison / Differentiation

**H2**: Works alongside existing standards

**Subhead**: Complementary to schema.org, llms.txt, MCP, and A2A — not competing.

Four cards (keep existing layout, update copy):

**llms.txt**: Human-readable LLM guidance. AI-Me is machine-readable structured data. Use both — link to your ai-me.json from your llms.txt.

**Schema.org**: Page-level vocabulary for search engines. AI-Me is site-level discovery for agents. Reference your schema.org data via the `related` field.

**MCP**: Tool and data integration protocol. AI-Me handles discovery — point agents to your MCP server via `related.mcp`.

**A2A**: Agent-to-agent communication. AI-Me is the discovery layer — link to your A2A agent card via `related.a2a`.

---

### Trust + Roadmap Section

**H2**: An open, evolving standard

**Body**: AI-Me is a community-driven open specification in active draft. The core data model is stable — we're collecting real-world feedback before v1.0.

- Spec licensed under CC-BY 4.0
- Code licensed under Apache-2.0
- Hosted on GitHub — all changes are public
- v1.0 roadmap: IANA registration, verification, conformance test suite

**CTA**: "View the roadmap →" /roadmap

---

### Quick Start CTA Section

**H2**: Start in five minutes

**Subhead**: Publish your AI discovery manifest today.

**Steps** (abbreviated):

1. Create `/.well-known/ai-me.json` with required fields
2. Validate with `npx @ai-me/validator https://yourdomain.com`
3. Link from your llms.txt (recommended)

**JSON snippet**: minimal example

**CTAs**: "Full quick start guide →" /quickstart | "Use the web generator →" /generate

---

### Footer CTA

**H2**: Make your site AI-ready.

**Subhead**: Join the sites publishing a discovery manifest. It takes five minutes and costs nothing.

**CTAs**:
- Primary: "Get started" → /quickstart
- Secondary: "View examples" → /examples

---

## Notes on Secondary Pages

### quickstart.astro
- Change H1 from "Quick Start" to "Publish Your AI Discovery Manifest"
- Change "vendor card" to "discovery manifest" throughout
- Keep all technical steps, code examples intact

### examples.astro
- Change H1 subhead from "vendor card templates" to "discovery manifest templates"
- Keep all JSON examples intact (they're correct)
- Add note: "ai-me.json is sometimes called a vendor card — the terms are equivalent"

### faq.astro
- Update "What is AI-Me?" answer: lead with "discovery manifest" framing
- Update "Who is this for?" — broaden from "vendor card" to any site
- Keep all other answers, just substitute terminology

### why-not-schema-org.astro
- Change title to "AI-Me vs Schema.org: Why Both Matter"
- Strengthen the "use them together" section with concrete example
- More explicit: AI-Me is for agents, schema.org is for search

### roadmap.astro
- Update v0.1 description to be more specific about what exists
- Add "why this matters now" framing at top
- Strengthen trust signals

### generate.astro
- Change "Generate Your Vendor Card" to "Generate Your AI Discovery Manifest"
- Update subhead copy

### governance.astro
- Minimal changes — mostly terminology
- Add trust framing in intro
