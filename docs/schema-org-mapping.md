# AI-Me ↔ Schema.org Field Mapping

This document provides a reference mapping between AI-Me vendor card fields and their closest schema.org equivalents. AI-Me is a site-level discovery document; schema.org is page-level vocabulary. They are complementary.

## Top-level fields

- `name` → `schema:Organization.name` or `schema:Project.name`
- `legal_name` → `schema:Organization.legalName`
- `website` → `schema:Organization.url`
- `summary` → `schema:Organization.description`
- `logo` → `schema:Organization.logo`
- `languages` → `schema:Organization.knowsLanguage`
- `regions` → `schema:Organization.areaServed`
- `category` → No direct equivalent. Closest: `schema:Organization.additionalType` or free-text `schema:keywords`

## Canonical pages

- `canonical_pages.home` → `schema:Organization.url`
- `canonical_pages.contact` → `schema:Organization.contactPoint.url`
- `canonical_pages.pricing` → No direct equivalent
- `canonical_pages.docs` → No direct equivalent (could be a `schema:WebPage` with `about` = documentation)
- `canonical_pages.privacy` → `schema:Organization.publishingPrinciples` (loosely)
- `canonical_pages.terms` → No direct equivalent
- `canonical_pages.security` → No direct equivalent
- `canonical_pages.imprint` → No direct equivalent (German/EU legal requirement)

## Offerings

- `offerings[].name` → `schema:Product.name` or `schema:Service.name`
- `offerings[].type` → `schema:Product.additionalType` or distinct type selection (`schema:SoftwareApplication`, `schema:Service`, `schema:Product`)
- `offerings[].description` → `schema:Product.description`
- `offerings[].pricing.model` → Loosely maps to `schema:Offer.priceSpecification` subtypes
- `offerings[].pricing.currency` → `schema:Offer.priceCurrency`
- `offerings[].pricing.url` → `schema:Offer.url`
- `offerings[].cta.label` → `schema:Action.name`
- `offerings[].cta.url` → `schema:Action.target`

## Related

- `related.schema_org` → Direct link to a JSON-LD document (no schema.org equivalent — this IS the bridge)
- `related.llms_txt` → No schema.org equivalent
- `related.mcp` → No schema.org equivalent
- `related.a2a` → No schema.org equivalent

## Support

- `support.email` → `schema:Organization.contactPoint.email`
- `support.hours` → `schema:Organization.contactPoint.hoursAvailable`
- `support.response_time` → No direct equivalent

## Technical

- `technical.api_available` → No direct equivalent
- `technical.api_docs_url` → Could map to `schema:WebAPI.documentation`
- `technical.status_page_url` → No direct equivalent

## Key differences

1. **Scope:** Schema.org describes entities across the web; AI-Me describes a single site at a well-known endpoint.
2. **Shape:** Schema.org is flexible (many valid ways to express the same thing); AI-Me is strict (one shape, validatable).
3. **Discovery:** Schema.org requires crawling pages; AI-Me provides one-fetch discovery.
4. **Purpose:** Schema.org serves search engines and knowledge graphs; AI-Me serves AI agents and automated clients.
