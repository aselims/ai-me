AI-Me Vendor Card Specification v0.1

Status: Draft
Canonical home: ai-me.dev (project site)
License: CC-BY 4.0 (specification text) · Apache-2.0 (reference code)

<!-- SPDX-License-Identifier: CC-BY-4.0 -->
<!-- Copyright 2026 AI-Me Contributors -->

1. Abstract

This specification defines a machine-readable “vendor card” served at a single well-known endpoint. Unlike page-level structured data (e.g. schema.org JSON-LD), the vendor card provides one-fetch, site-wide discovery — canonical pages, offerings, pricing model, and primary calls-to-action — in a strict, validatable shape.

The format is JSON, designed to be easy to generate, validate, and cache. It is complementary to existing efforts such as llms.txt (human-readable guidance for LLMs), MCP (tool and data integration for AI applications), and A2A (agent-to-agent interoperability). Sites that already publish schema.org markup are encouraged to keep doing so; the vendor card acts as a discovery and normalization layer, not a replacement.

2. Conformance and terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as normative requirements.

An implementation is conformant if it satisfies all requirements labeled MUST and MUST NOT.

3. Goals and non-goals

3.1 Goals
	•	Provide a single stable JSON document at a predictable location.
	•	Allow agents to quickly identify a site’s canonical pages and primary business intent.
	•	Enable automated validation and scoring.
	•	Support extensions without breaking existing clients.

3.2 Non-goals
	•	This spec does not define agent messaging, negotiation, payments, or tool execution. Those are addressed by protocols like A2A, MCP, and payment protocols.
	•	This spec does not replace schema.org markup or SEO practices.

3.3 Relation to schema.org

Schema.org provides a rich vocabulary for describing organizations, products, offers, and actions. It is typically embedded as JSON-LD across individual pages and consumed by search engines and knowledge graphs.

This specification addresses a different need: a single, site-wide document at a predictable well-known endpoint, with a strict minimal shape that agents can validate and compare. Schema.org is page-level vocabulary; AI-Me is site-level discovery.

They are complementary. A vendor card SHOULD reference existing schema.org data via the related field (section 6.7) so agents can use AI-Me for discovery and schema.org for depth.

4. Discovery

4.1 Well-known location

A conforming site MUST serve the vendor card at:
	•	/.well-known/ai-me.json

This uses the well-known URI mechanism defined in RFC 8615.  ￼

4.2 Optional aliases

A site MAY also serve identical content at:
	•	/ai-manifest.json

If an alias is provided, the /.well-known/ai-me.json resource remains canonical.

4.3 Relation to llms.txt

A site SHOULD provide /.well-known/llms.txt and or /llms.txt and SHOULD include a pointer to the vendor card URL within it.  ￼

5. Retrieval and caching

5.1 HTTP requirements

The vendor card endpoint:
	•	MUST return 200 OK for successful retrieval.
	•	MUST return Content-Type: application/json.
	•	SHOULD return Cache-Control headers suitable for caching (recommended: at least 1 hour).
	•	SHOULD support ETag or Last-Modified to enable conditional requests.

5.2 Size constraints

The vendor card SHOULD be compact. Recommended maximum size is 64 KB to keep retrieval cheap for automated clients.

6. Data model

6.1 Top-level object

The document MUST be a single JSON object.

6.2 Required fields

A conforming vendor card MUST include:
	•	schema_version (string)
	•	name (string)
	•	website (absolute URL string)
	•	summary (string)
	•	canonical_pages (object)
	•	last_updated (string, ISO 8601 date or date-time)

6.3 Recommended fields

A vendor card SHOULD include, when applicable:
	•	legal_name (string)
	•	logo (absolute URL string, square image, minimum 256×256 pixels, PNG or SVG preferred)
	•	languages (array of BCP 47 language tags)
	•	regions (array of strings)
	•	category (array of strings)
	•	offerings (array of offering objects; see 6.5)
	•	related (object; see 6.7)
	•	support (object)
	•	technical (object)

6.4 Canonical pages

canonical_pages MUST be an object containing at least:
	•	home (absolute URL)
	•	contact (absolute URL)

It SHOULD include when available:
	•	pricing (absolute URL)
	•	docs (absolute URL)
	•	privacy (absolute URL)
	•	terms (absolute URL)
	•	security (absolute URL)
	•	imprint (absolute URL, especially where legally required)

6.5 Offerings

When present, offerings MUST be an array of objects. Each offering MUST include:
	•	name (string)
	•	type (string, one of: service, product, subscription, api, tool, content, open_source, other)
	•	description (string)
	•	pricing (object)
	•	cta (object)

pricing MUST include:
	•	model (string, one of: free, freemium, fixed, tiered, usage, quote, contact_sales, daily_rate, open_source)
	•	currency (string, ISO 4217 code; empty if not applicable, e.g. for free or quote)
	•	url (absolute URL string; empty if not applicable)

cta MUST include:
	•	label (string)
	•	url (absolute URL string)

Sites with no commercial offerings (open-source projects, government portals, personal sites) MAY omit the offerings field entirely. The vendor card remains conformant without it.

6.6 Canonical pages as trust surface

The canonical_pages object (section 6.4) serves as the authoritative list of policy and trust-related URLs. Specifically, privacy, terms, security, and imprint within canonical_pages define the site's trust surface. There is no separate trust object; clients seeking policy URLs SHOULD read them from canonical_pages.

6.7 Related resources

A vendor card SHOULD include a related object to link to complementary structured data and protocols:
	•	schema_org (absolute URL to a site-level JSON-LD document, if available)
	•	llms_txt (absolute URL to the site's llms.txt file)
	•	mcp (absolute URL to an MCP server manifest, if available)
	•	a2a (absolute URL to an A2A agent card, if available)

This positions the vendor card as a discovery layer that routes agents to richer, protocol-specific resources.

Clients MAY use these URLs to fetch additional structured data. All URLs in related are treated as optional hints, not guarantees.

6.8 Extension mechanism

A vendor card MAY include additional fields not defined here.
Clients MUST ignore unknown fields.

To avoid collisions, extensions SHOULD be namespaced using a prefix, for example:
	•	x_mcp
	•	x_a2a
	•	x_ai_me

This supports optional pointers to other protocols (for example MCP servers or A2A agent cards) without requiring them.  ￼

7. Examples

7.1 SaaS vendor (commercial, full card)

{
  "schema_version": "0.1",
  "name": "Example Co",
  "legal_name": "Example Co GmbH",
  "website": "https://example.com",
  "summary": "We provide X for Y.",
  "logo": "https://example.com/logo.png",
  "languages": ["en", "de"],
  "regions": ["EU"],
  "category": ["saas"],
  "canonical_pages": {
    "home": "https://example.com/",
    "pricing": "https://example.com/pricing",
    "docs": "https://example.com/docs",
    "contact": "https://example.com/contact",
    "privacy": "https://example.com/privacy",
    "terms": "https://example.com/terms",
    "security": "https://example.com/security"
  },
  "offerings": [
    {
      "name": "Example SaaS",
      "type": "subscription",
      "description": "Does X reliably.",
      "pricing": {
        "model": "tiered",
        "currency": "EUR",
        "url": "https://example.com/pricing"
      },
      "cta": {
        "label": "Start trial",
        "url": "https://example.com/signup"
      }
    }
  ],
  "related": {
    "schema_org": "https://example.com/schema.jsonld",
    "llms_txt": "https://example.com/.well-known/llms.txt"
  },
  "support": {
    "email": "support@example.com",
    "hours": "Mon-Fri 09:00-17:00 CET",
    "response_time": "1-2 business days"
  },
  "technical": {
    "api_available": false,
    "api_docs_url": "",
    "status_page_url": ""
  },
  "last_updated": "2026-03-04"
}

7.2 Open-source project (non-commercial, minimal card)

{
  "schema_version": "0.1",
  "name": "ExampleLib",
  "website": "https://examplelib.dev",
  "summary": "A fast, lightweight library for parsing X.",
  "logo": "https://examplelib.dev/icon.svg",
  "languages": ["en"],
  "category": ["open_source", "developer_tools"],
  "canonical_pages": {
    "home": "https://examplelib.dev/",
    "docs": "https://examplelib.dev/docs",
    "contact": "https://github.com/examplelib/examplelib/issues"
  },
  "offerings": [
    {
      "name": "ExampleLib",
      "type": "open_source",
      "description": "MIT-licensed library for parsing X.",
      "pricing": {
        "model": "free",
        "currency": "",
        "url": ""
      },
      "cta": {
        "label": "View on GitHub",
        "url": "https://github.com/examplelib/examplelib"
      }
    }
  ],
  "related": {
    "llms_txt": "https://examplelib.dev/llms.txt"
  },
  "last_updated": "2026-03-04"
}

8. Security considerations

Publishers and consumers should account for:
	•	Spoofing and phishing: A malicious site can advertise misleading CTAs. Clients SHOULD treat CTA URLs as untrusted input and apply standard anti-phishing checks.
	•	Stale information: Clients SHOULD respect caching headers and SHOULD revalidate periodically.
	•	Integrity: Publishers MAY add integrity mechanisms via extensions, such as DNS-based verification or signatures. Clients MAY prefer verified vendor cards.
	•	Privacy: The vendor card SHOULD NOT include personal data beyond business contact points.

9. IANA considerations

This specification uses the well-known URI prefix mechanism defined in RFC 8615. Registering a new well-known URI suffix is done through the IANA “Well-Known URIs” registry, which operates under “Specification Required.”  ￼

Draft v0.1 does not claim registration. Once there is demonstrated adoption, the project maintainers may submit a registration request for the suffix ai-me.json or an alternative final suffix.

10. Roadmap to v1.0

The following are explicitly out-of-scope for v0.1 but candidates for later versions:
	•	Formal JSON Schema publication and test vectors
	•	Vendor verification (DNS TXT, signatures)
	•	Optional bridges to MCP servers and A2A agent cards through namespaced extensions  ￼

