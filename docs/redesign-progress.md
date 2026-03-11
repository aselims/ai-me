# Redesign Progress

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Strategy + IA + Copy | Complete |
| Phase 2 | Homepage Redesign | Complete |
| Phase 3 | Navigation + IA | Complete |
| Phase 4 | Secondary Pages | Complete |
| Phase 5 | Verify + Build | Complete |

## Phase 1: Strategy + IA + Copy
- [x] Read brief (derived from task instructions)
- [x] Read current homepage
- [x] Read all secondary pages (quickstart, examples, faq, why-not-schema-org, roadmap, generate, governance, contributing, artifacts, validator, spec)
- [x] Write `docs/redesign-strategy.md` — full positioning, copy, and IA plan
- [x] Update progress

## Phase 2: Homepage Redesign
- [x] Rewrite `index.astro` with new copy/structure
- [x] Hero: outcome-driven headline ("Let AI agents understand your site")
- [x] Problem/pain section before solution ("AI agents are flying blind")
- [x] How it works section with diagram + 3-step breakdown
- [x] Quick start section with code example + CTAs
- [x] Audience targeting blocks (developers, SaaS/API teams, AI builders)
- [x] Compatibility section (maintained, copy cleaned up)
- [x] Trust + roadmap section (open governance, open license, formal schema, v1.0 path)
- [x] Footer CTA section ("Make your site AI-ready")

## Phase 3: Navigation + IA
- [x] Header.astro: No changes needed — nav structure is appropriate
- [x] Footer.astro: Updated tagline from "AI-Me Vendor Card Specification" to "AI-Me Discovery Manifest Specification"

## Phase 4: Secondary Pages
- [x] quickstart.astro: Updated H1, description, step titles, what's-next section
- [x] examples.astro: Updated description, added bridging note about vendor card equivalence
- [x] faq.astro: Updated all FAQ answers to lead with "discovery manifest" framing
- [x] why-not-schema-org.astro: Full rewrite — new title "AI-Me vs Schema.org: Why Both Matter", strengthened differentiation
- [x] roadmap.astro: Full rewrite — added "Why now" callout, clearer v0.1 deliverables, stronger trust signals
- [x] generate.astro: Updated H1 and description
- [x] governance.astro: Updated description and intro, trust framing added, terminology updated
- [x] contributing.astro: Updated "vendor card examples" to "discovery manifest examples"
- [x] artifacts.astro: Updated all primary framing references
- [x] validator.astro: Updated description, page intro, and section copy
- [x] spec.astro: Updated page description and H1 to use "Discovery Manifest" as primary, bridged to "Vendor Card Specification" as secondary
- [x] BaseLayout.astro: Updated default meta description, keywords, and JSON-LD structured data
- [x] ValidatorPlayground.tsx: Updated success message
- [x] GeneratorWizard.tsx: Updated success message
- [x] StatsCounter.tsx: Updated stat label
- [x] AiPromptCard.astro: Updated visible label (kept prompt text for LLM context)

## Phase 5: Verify
- [x] `pnpm build` passes — 0 errors, 12 pages built
- [x] No TypeScript errors
- [x] No stale "vendor card" as primary framing
- [x] All remaining "vendor card" uses are explicit secondary/bridging references or SEO keywords
- [x] Preact interactive components unchanged and functional
- [x] Tailwind design system unchanged
- [x] Dark mode classes preserved
- [x] Semantic HTML preserved
- [x] Responsive classes preserved

## Summary of Changes

### Core message shift
- **Before**: "One JSON file. Site-wide discovery." → "vendor card" as primary term
- **After**: "Let AI agents understand your site." → "discovery manifest" as primary, "vendor card" as secondary

### New sections added to homepage
- Problem/pain section: "AI agents are flying blind" with three failure modes
- Audience targeting: three blocks for developers, SaaS/API teams, agent builders
- Trust signals: open governance, open license, formal schema, v1.0 roadmap path

### Terminology update across all 12 pages
- Primary: "discovery manifest", "AI discovery manifest", "ai-me.json"
- Secondary (bridged): "vendor card" with explicit equivalence notes
- No uses remain as the headline/primary concept in any page
