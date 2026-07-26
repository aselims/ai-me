# Improvement Spec — ai-me

## Context

**What this is:** The AI-Me Vendor Card Specification — an open spec defining a JSON "discovery manifest" served at `/.well-known/ai-me.json` so AI agents can discover a site's identity, canonical pages, offerings, pricing, and CTAs in one fetch. It positions itself alongside llms.txt, schema.org, MCP, and A2A. Public site: https://spec.ai-me.dev (GitHub: aselims/ai-me).

**Stack & layout (pnpm monorepo, workspace = `website` + `packages/*`):**

- `spec/ai-me-v0.1.md` — normative spec text (v0.1 draft, CC-BY-4.0).
- `schemas/ai-me.schema.json` — JSON Schema draft-07 for the manifest (single source of truth).
- `examples/*.json` — 4 example manifests (saas, consulting, open-source, ecommerce). All currently validate against the schema (verified with python-jsonschema during this analysis).
- `packages/validator/` — `@ai-me/validator` v0.1.0, TypeScript CLI (`ai-me-validate`) using Ajv. Entry: `src/cli.ts`, library: `src/index.ts`. Builds `src/` → `dist/` via `tsc`.
- `packages/create/` — `@ai-me/create` v0.1.0, interactive CLI generator using `@inquirer/prompts`. Files: `src/cli.ts`, `src/prompts.ts`, `src/generator.ts`.
- `website/` — Astro 5 static site (Preact islands, Tailwind 4 with dark mode). Interactive islands: `src/components/GeneratorWizard.tsx` (7-step manifest wizard), `src/components/ValidatorPlayground.tsx` (in-browser Ajv validation), `src/components/StatsCounter.tsx` (Umami stats — currently unused). Pages read `schemas/` and `examples/` from the repo root at build time via `path.resolve("../...")`.
- CI: `.github/workflows/ci.yml` (website typecheck+build; validator build). Deploy: `.github/workflows/deploy.yml` → SSH to VPS → `git pull` → `deploy.sh` (Docker build of static site, atomic-ish swap into `/var/www/spec.ai-me.dev`, nginx reload).

**Current state:** Working tree clean, `main` up to date with origin, 12 commits total (initial spec Mar 2026 → deploy hardening Apr 2026). `node_modules` is NOT installed locally, so `tsc`/`astro check` could not be run during this analysis — CI is green per the repo's own history. No test framework, no tests anywhere in the repo. No TODO/FIXME markers in source. No secrets found in the repo (deploy uses GitHub secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`).

**The single most important fact:** the README, FAQ, quickstart, validator, and generate pages all instruct users to run `npx @ai-me/validator` / `npx @ai-me/create`, but **neither package is published to npm** (`npm view @ai-me/validator` and `npm view @ai-me/create` both return E404, verified 2026-07-12). Worse, even if published as-is, both would crash at runtime because the JSON schema they load is not shipped in the package (details in F1/F2).

---

## Findings

### F1 — CRITICAL: Advertised npm packages do not exist; the spec's primary CTA fails for every user

- **Evidence:** `npm view @ai-me/validator` → 404; `npm view @ai-me/create` → 404 (checked 2026-07-12).
- **Where it's advertised:**
  - `README.md:48` — `npx @ai-me/validator https://yourdomain.com` (Quick Start step 3)
  - `website/src/pages/validator.astro:38` and `:44`
  - `website/src/pages/quickstart.astro:156`
  - `website/src/pages/roadmap.astro:30`
  - `website/src/pages/faq.astro:39`
  - `website/src/pages/generate.astro:41` — `npx @ai-me/create`
  - `docs/redesign-strategy.md:225`
- **Impact:** 100% failure rate on the documented validation flow. For a spec whose adoption depends on trust, a broken quickstart is fatal.

### F2 — CRITICAL (blocker for F1): Schema file is not shipped in either package; published CLIs would crash on startup

- **Evidence:** `packages/validator/src/index.ts:22-32` (`loadSchema`) resolves `__dirname/../../../schemas/ai-me.schema.json` first. In the published layout (`node_modules/@ai-me/validator/dist/index.js`) that resolves to `node_modules/schemas/ai-me.schema.json` (does not exist). The fallback `__dirname/../schemas/ai-me.schema.json` resolves to `node_modules/@ai-me/validator/schemas/` — but `packages/validator/` has **no `schemas/` directory** (verified: `ls packages/validator/schemas` → No such file or directory) and no build/prepack step copies one in. `packages/validator/package.json` lists `"files": ["dist", "schemas"]`, which silently packs nothing for the schemas entry.
- Identical bug in `packages/create/src/generator.ts:11-19`; `packages/create/package.json` `"files": ["dist"]` doesn't even attempt to include schemas.
- **Impact:** both CLIs only work when run from inside the monorepo checkout. `npx` usage would throw `ENOENT` on every invocation, unhandled inside `loadSchema` (the second `readFileSync` is outside any try/catch).

### F3 — HIGH: GeneratorWizard Review step shows "✓ Valid AI-Me discovery manifest" without ever validating

- **Evidence:** `website/src/components/GeneratorWizard.tsx:482-486` — the success banner renders when `validationErrors.length === 0 && step === STEPS.length - 1`. `validationErrors` initializes to `[]` (`:136`), so on entering the Review step the green "valid" banner is always shown, even for a card missing required fields (`name`, `home`, `contact` are all schema-required; `buildCard()` at `:149-200` omits empty ones, producing an invalid card). The user must manually click "Validate" to discover errors — and the false banner is displayed above the Validate button until then.
- Related: `:175-177` filters offerings only by `o.name`, so an offering with a name but empty `description`/`cta.label`/`cta.url` is included and fails schema validation — again masked by the default banner.
- **Impact:** users download/copy invalid manifests believing they are valid. This directly undermines the spec's "strict, validatable shape" pitch.

### F4 — HIGH: CI validates neither the examples nor the schema, and never builds `@ai-me/create`

- **Evidence:** `.github/workflows/ci.yml` has two jobs: website (typecheck+build) and validator (build only). There is no job that (a) validates `examples/*.json` against `schemas/ai-me.schema.json`, (b) validates `website/public/.well-known/ai-me.json`, (c) checks the schema itself is a valid draft-07 schema, or (d) compiles `packages/create` at all — a type error in `packages/create/src/*.ts` would merge green.
- **Impact:** for a *specification* repo, the examples and schema are the product. Nothing stops a PR from landing an example that violates the schema (this is the #1 conformance guarantee a spec repo should have).

### F5 — HIGH: Zero tests in the entire repository

- **Evidence:** no `*.test.*`/`*.spec.*` files, no vitest/jest config, no `test` script in any of the 4 package.json files.
- Highest-value untested logic: `packages/validator/src/index.ts` (`validate`, `validateUrl` error paths: HTTP non-200 at `:62`, non-JSON body at `:84-97`), `packages/create/src/generator.ts` (`buildCard` merge logic at `:35-68`, `writeCard`), and `GeneratorWizard.buildCard` (`website/src/components/GeneratorWizard.tsx:149-200`).

### F6 — MEDIUM: Duplicated artifacts with no drift guard (3 copies of the schema, 2 copies of the site manifest, 2 copies of the spec)

- **Evidence:**
  - `schemas/ai-me.schema.json` vs `website/public/schemas/ai-me.schema.json` — currently byte-identical, manually copied. The schema's `$id` (`schemas/ai-me.schema.json:4`) points at the *served* copy `https://spec.ai-me.dev/schemas/ai-me.schema.json`, so drift would be public.
  - `website/public/ai-manifest.json` vs `website/public/.well-known/ai-me.json` — currently identical (the alias is legitimate per spec §4.2, `spec/ai-me-v0.1.md:54`), but hand-maintained.
  - `docs/spec.md` vs `spec/ai-me-v0.1.md` — near-duplicates; only difference is the license header (`docs/spec.md:5` still says "Recommend Apache-2.0 for spec text", contradicting the actual dual CC-BY-4.0/Apache-2.0 licensing). `docs/spec.md` is a stale draft.
- **Impact:** silent divergence of the publicly served schema from the normative one; contradictory license statement in-tree.

### F7 — MEDIUM: Dead code — `StatsCounter.tsx` is never imported; all Umami tracking is a no-op

- **Evidence:** `website/src/components/StatsCounter.tsx` (75 lines) has zero importers (grepped all `.astro`/`.tsx`). `GeneratorWizard.tsx:71-79` (`track()`) and `AiPromptCard.astro:42-43` call `window.umami.track(...)`, but no Umami `<script>` is loaded anywhere (`grep -c umami website/src/layouts/BaseLayout.astro` → 0). Every analytics call silently does nothing.
- **Impact:** dead weight in the bundle + a false impression that generator funnel metrics exist.

### F8 — MEDIUM: Website islands are hardcoded light-mode inside a dark-mode site

- **Evidence:** the site uses Tailwind `dark:` variants throughout (e.g. `website/src/pages/index.astro`, `spec.astro:16-20`), but `GeneratorWizard.tsx` (`inputStyle`/`btnSecondary` at `:83-121`, white backgrounds `#fff`, gray-900 text) and `ValidatorPlayground.tsx` (`:73-105`, `#f9fafb` textarea, `#fff` buttons) use hardcoded light inline styles.
- **Impact:** on the two most interactive pages (`/generate`, `/validator`), dark-mode users get jarring white panels; form labels like `#374151` on dark backgrounds are low-contrast.

### F9 — MEDIUM: Build-time file loading depends on `process.cwd()`

- **Evidence:** `website/src/pages/generate.astro:8`, `validator.astro:8,11`, `examples.astro:7` use `path.resolve("../schemas/...")` / `path.resolve("../examples")` — correct only when the Astro build's cwd is `website/`. Works under `pnpm --filter website build` and the Dockerfile, but breaks under any invocation with a different cwd (e.g. `npx astro build --root website` from repo root) with a confusing ENOENT.
- **Impact:** latent build fragility; trivially hardened with `import.meta.url`-relative resolution or `Astro`'s root.

### F10 — LOW: Validator CLI robustness gaps

- `packages/validator/src/index.ts:60` — `fetch(vendorCardUrl)` has no timeout (hangs indefinitely on a black-holed host) and no response size cap.
- `packages/validator/src/cli.ts:68` duplicates the `/.well-known/ai-me.json` URL construction already done in `index.ts:58` (two sources of truth for the endpoint path).
- `packages/validator/src/cli.ts:10` hardcodes "v0.1.0" in the usage banner instead of reading `package.json`.
- `validate()` (`index.ts:34-39`) re-reads the schema from disk and re-instantiates/compiles Ajv on every call — harmless for the CLI, wasteful if the library entry (`main`) is used in a loop.

### F11 — LOW: Schema format inconsistencies

- **Evidence:** `schemas/ai-me.schema.json:229-230` — `technical.api_docs_url` and `technical.status_page_url` are plain `"type": "string"` with no `"format": "uri"`, unlike every other URL field. (`offerings[].pricing.url` at `:158-161` is *deliberately* un-formatted to allow `""` per its description — that one is fine.)
- `last_updated` pattern (`:237`) `^\d{4}-\d{2}-\d{2}` is unanchored at the end — intentional to allow date-times, but also accepts garbage like `2026-03-05xyz`. A tighter pattern: `^\d{4}-\d{2}-\d{2}($|[T ].*)`.

### F12 — LOW: Deploy/CI supply-chain and hygiene nits

- `.github/workflows/deploy.yml:38` — `appleboy/ssh-action@v1` is a mutable major tag on a third-party action holding SSH access to the production VPS; pin to a full commit SHA.
- `deploy.sh:19-22` — the swap (`mv` old away, `mv` new in) has a brief window where `/var/www/spec.ai-me.dev` doesn't exist; if the second `mv` fails (e.g. cross-device on a differently mounted `/tmp`), the site stays down and the old dir has already been renamed. A safer pattern: rsync into a versioned dir + atomic symlink flip.
- No `engines.node` field in `packages/validator/package.json` or `packages/create/package.json` despite using `fetch` (needs Node ≥ 18).

---

## Prioritized Work Plan

> Ordering: packaging correctness first (unblocks the spec's core promise), then conformance CI, then the false-valid UX bug, then hygiene. Tasks 1–5 are independent enough to be done in sequence in one session. `pnpm install` at the repo root is required first (node_modules is currently absent).

### Task 1 — Ship the schema inside both CLI packages and fix schema resolution

**Goal:** `@ai-me/validator` and `@ai-me/create` work when installed from a packed tarball (i.e., are actually publishable).

**Files:** `packages/validator/package.json`, `packages/validator/src/index.ts`, `packages/create/package.json`, `packages/create/src/generator.ts`.

**Steps:**
1. In `packages/validator/package.json` add a copy step so the schema is bundled:
   ```json
   "scripts": {
     "build": "tsc && node -e \"require('node:fs').cpSync('../../schemas/ai-me.schema.json','schemas/ai-me.schema.json')\"",
     "prepack": "pnpm build"
   }
   ```
   (or equivalently a small `scripts/copy-schema.mjs`; keep it cross-platform — no `cp -r`). `"files": ["dist", "schemas"]` is already correct once the dir exists.
2. In `packages/validator/src/index.ts:22-32` invert `loadSchema()` resolution order: try the **bundled** path `resolve(__dirname, "..", "schemas", "ai-me.schema.json")` first, fall back to the monorepo path `resolve(__dirname, "..", "..", "..", "schemas", "ai-me.schema.json")`. Wrap the fallback read in try/catch too and throw a single clear error ("Could not locate ai-me.schema.json — reinstall @ai-me/validator") if both fail.
3. Mirror steps 1–2 for `packages/create`: add the same copy-into-`schemas/` build step, add `"schemas"` to its `"files"` array in `packages/create/package.json`, and apply the same resolution-order fix in `packages/create/src/generator.ts:11-19`.
4. Add `"engines": { "node": ">=18" }` to both package.json files (F12).
5. Add `packages/*/schemas/` to `.gitignore` (it's a build artifact) — check `.gitignore` first; append if absent.

**Acceptance:** From a clean temp dir (`/tmp/claude-*/scratchpad/pack-test`): `pnpm --filter @ai-me/validator build && (cd packages/validator && npm pack --pack-destination /tmp/...)`, then `npm install <tarball>` in the temp dir and run `npx ai-me-validate --file <repo>/examples/saas.json` → exits 0 with "✅ Valid". Repeat the pack test for `@ai-me/create` (just verify `node dist/cli.js --help`-equivalent startup doesn't throw ENOENT; full interactive run not required).

### Task 2 — Add a conformance job to CI (validate examples + schema + site manifest, build create)

**Goal:** CI fails if any example, the served manifest, or the schema itself is broken, or if `@ai-me/create` doesn't compile.

**Files:** `.github/workflows/ci.yml`, new file `scripts/validate-examples.mjs` (repo root `scripts/` dir — create it).

**Steps:**
1. Write `scripts/validate-examples.mjs`: a Node ESM script that (a) loads `schemas/ai-me.schema.json`, (b) compiles it with Ajv (`allErrors: true, strict: false`) + ajv-formats — this itself catches an invalid schema, (c) validates every file in `examples/*.json` plus `website/public/.well-known/ai-me.json` and `website/public/ai-manifest.json`, (d) prints per-file results and exits 1 on any failure. Import ajv from the validator workspace package's node_modules (run it via `pnpm --filter @ai-me/validator exec node ../../scripts/validate-examples.mjs` or add ajv to root devDependencies — pick one and be consistent).
2. Add drift guards to the same script: assert `schemas/ai-me.schema.json` is byte-identical to `website/public/schemas/ai-me.schema.json`, and `website/public/ai-manifest.json` byte-identical to `website/public/.well-known/ai-me.json` (F6). Exit 1 with a "copies have drifted — re-sync" message otherwise.
3. In `.github/workflows/ci.yml`: extend the `validator` job (or add a `conformance` job with the same pnpm/node setup steps) to run the script after build, and add `- run: pnpm --filter @ai-me/create build` so the create package is compiled in CI (F4).

**Acceptance:** `node scripts/validate-examples.mjs` (with deps installed) exits 0 on current tree; temporarily corrupting `examples/saas.json` (e.g. delete the `name` key) makes it exit 1; workflow YAML passes `actionlint`/visual review and mirrors the existing job structure.

### Task 3 — Fix the false "valid" banner in GeneratorWizard

**Goal:** The Review step never claims validity before validation has actually run, and re-validates when the card changes.

**Files:** `website/src/components/GeneratorWizard.tsx`.

**Steps:**
1. Replace the `validationErrors: string[]` state (`:136`) usage for the banner with an explicit tri-state, mirroring `ValidatorPlayground.tsx`: add `const [isValid, setIsValid] = useState<boolean | null>(null);`. `validateJSON()` (`:202-216`) sets `setIsValid(valid)`.
2. Auto-run `validateJSON()` when the Review step is entered: in `goNext()` (`:220-228`) and in the stepper `onClick` (`:533`), when the destination step is `STEPS.length - 1`, call `validateJSON()`.
3. Change the success banner condition at `:482` from `validationErrors.length === 0 && step === STEPS.length - 1` to `isValid === true`; keep the error block keyed on `isValid === false && validationErrors.length > 0`.
4. Reset `isValid` to `null` whenever the form changes (`updateField`, `updateOffering`, `addOffering`, `removeOffering` at `:236-266`) so a stale "valid" doesn't survive edits.
5. Fix the offering filter at `:176`: include an offering if any of its fields are non-empty (so half-filled offerings surface validation errors instead of silently passing when only `name` is empty), i.e. filter out only fully-empty offerings.

**Acceptance:** `pnpm --filter website typecheck` passes. Manual check via `pnpm dev`: open `/generate`, click straight to step 7 with an empty form → red error list (missing `name`, `home`, `contact` etc.), no green banner; fill required fields on steps 1–2, return to Review → green banner appears automatically.

### Task 4 — Reconcile the "npx" story: publish-readiness + honest copy

**Goal:** No documented command that 404s. (Actual `npm publish` needs credentials and is the maintainer's call — this task makes it one command and stops the site lying meanwhile.)

**Files:** `README.md`, `website/src/pages/validator.astro`, `website/src/pages/quickstart.astro`, `website/src/pages/faq.astro`, `website/src/pages/roadmap.astro`, `website/src/pages/generate.astro`, new `.github/workflows/release.yml`.

**Steps:**
1. Add `.github/workflows/release.yml`: `workflow_dispatch`-triggered, same pnpm/node setup as ci.yml, runs Task 2's conformance script, builds both packages, then `pnpm publish --filter @ai-me/validator --filter @ai-me/create --access public --no-git-checks` using `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` (document in the workflow header comment that the `NPM_TOKEN` secret and the `@ai-me` npm org must exist first).
2. Until publication happens, change user-facing copy to a command that works today. Recommended replacement for every `npx @ai-me/validator ...` occurrence (exact locations in F1): keep the npx form but add the GitHub fallback, e.g. show `npx @ai-me/validator https://yourdomain.com` only alongside/after publication; interim text: "Validate with the [online validator](/validator) or clone the repo and run `pnpm --filter @ai-me/validator build && node packages/validator/dist/cli.js <url>`". Apply judgment per page: `faq.astro:39` and `quickstart.astro:156` should lead with the online playground (zero-install). Same treatment for `npx @ai-me/create` at `generate.astro:41` (lead with the on-page wizard, which already works).
3. `roadmap.astro:30` currently lists the CLI under shipped v0.1 deliverables — reword to "CLI validator tool (in repo; npm publish pending)" until published.

**Acceptance:** `git grep -n "npx @ai-me"` returns only locations that are explicitly framed as post-publication or the release workflow itself; `pnpm --filter website build` succeeds; release workflow YAML is valid.

### Task 5 — Add a vitest suite for the validator and generator core

**Goal:** Regression coverage for the two packages' pure logic, wired into CI.

**Files:** new `packages/validator/src/index.test.ts`, new `packages/create/src/generator.test.ts`, `packages/validator/package.json`, `packages/create/package.json`, `.github/workflows/ci.yml`.

**Steps:**
1. Add `vitest` to devDependencies of both packages; add `"test": "vitest run"` scripts.
2. `packages/validator/src/index.test.ts` covering `validate()`:
   - all four `examples/*.json` files (read from `../../examples/`) → `valid: true`;
   - a card missing `name` → `valid: false` with an error whose `keyword === "required"`;
   - `schema_version: "0.2"` → invalid (const violation);
   - `canonical_pages` missing `contact` → invalid;
   - `validateUrl()` error paths using a mocked global `fetch` (vi.stubGlobal): non-ok response → single error with `keyword: "fetch"` (index.ts:62-73); ok response with non-JSON body → `keyword: "parse"` (index.ts:84-97).
3. `packages/create/src/generator.test.ts` covering `buildCard()` (`generator.ts:35-68`): minimal input yields exactly the required keys + `last_updated` = today (UTC — note `toISOString().slice(0,10)` is UTC-based); identity fields merge to top level; `extraPages` merge into `canonical_pages`; result of a full input passes `validateCard()`.
4. Add `- run: pnpm --filter @ai-me/validator test && pnpm --filter @ai-me/create test` to the CI validator/conformance job.

**Acceptance:** `pnpm --filter @ai-me/validator test` and `pnpm --filter @ai-me/create test` pass locally; CI job includes the test step.

### Task 6 — Remove dead analytics code (or wire it up — default: remove)

**Goal:** No dead components, no silent no-op tracking.

**Files:** `website/src/components/StatsCounter.tsx` (delete), `website/src/components/GeneratorWizard.tsx:69-79` and call sites (`:142`, `:221`, `:225`, `:275`, `:291`), `website/src/components/AiPromptCard.astro:42-43`.

**Steps:** Delete `StatsCounter.tsx` (zero importers — verified). For the `track()` helper: either (a) delete it and all call sites, or (b) keep it and add the Umami script tag to `website/src/layouts/BaseLayout.astro` `<head>` — choose (a) unless the maintainer supplies a real Umami URL/site-id, since no Umami instance is configured anywhere in the repo. Do the same for the inline umami block in `AiPromptCard.astro`.

**Acceptance:** `git grep -n "umami\|StatsCounter" website/src` returns nothing; `pnpm --filter website build` passes.

### Task 7 — Kill the stale spec duplicate and fix its license contradiction

**Goal:** One normative spec file.

**Files:** `docs/spec.md` (delete), `docs/redesign-strategy.md` / `docs/deployment-plan.md` (check for references first).

**Steps:** `git grep -n "docs/spec.md"` — update any references to point at `spec/ai-me-v0.1.md`, then delete `docs/spec.md` (it is a stale near-duplicate whose line 5 contradicts the repo's actual CC-BY-4.0 + Apache-2.0 licensing).

**Acceptance:** file gone; `git grep -n "docs/spec.md"` empty; website build unaffected (the site reads `spec/` via the content collection in `website/src/content.config.ts`, not `docs/`).

### Task 8 — Harden the validator CLI (timeout, dedupe, version)

**Goal:** CLI doesn't hang, has one source of truth for the endpoint path and version.

**Files:** `packages/validator/src/index.ts`, `packages/validator/src/cli.ts`.

**Steps:**
1. `index.ts`: export `const WELL_KNOWN_PATH = "/.well-known/ai-me.json"` and a `vendorCardUrl(base: string)` helper; use it in `validateUrl` (`:58`). Add `signal: AbortSignal.timeout(15_000)` to the `fetch` at `:60` and catch `TimeoutError`/abort into a clean `{ keyword: "fetch" }` error instead of an unhandled rejection.
2. `cli.ts:68`: use the exported helper instead of rebuilding the URL string; replace the hardcoded "v0.1.0" at `:10` with the version read from `package.json` (`JSON.parse(readFileSync(new URL("../package.json", import.meta.url)))`).

**Acceptance:** Task 5's tests still pass; `node packages/validator/dist/cli.js https://spec.ai-me.dev` validates OK (if network available); pointing it at a non-routable IP (e.g. `http://10.255.255.1`) exits within ~15s with a fetch error, not a hang.

### Task 9 — Dark-mode support for GeneratorWizard and ValidatorPlayground

**Goal:** `/generate` and `/validator` islands respect the site's dark mode.

**Files:** `website/src/components/GeneratorWizard.tsx`, `website/src/components/ValidatorPlayground.tsx`.

**Steps:** Replace the hardcoded inline color styles (GeneratorWizard `:83-121` style constants and per-element styles; ValidatorPlayground `:68-185`) with Tailwind utility classes including `dark:` variants, matching the palette already used in `website/src/pages/generate.astro` / `index.astro` (`bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`, `border-gray-300 dark:border-gray-600`, primary buttons `bg-primary-600 hover:bg-primary-700`). Tailwind 4 scans `.tsx` via the Vite plugin — verify generated classes appear by checking the built CSS or visually in dev. Keep layout-only inline styles if convenient; colors must move to classes.

**Acceptance:** `pnpm --filter website build` passes; in `pnpm dev` with OS dark mode (or the site's dark class mechanism — check `website/src/styles/global.css` for how `dark` is activated), `/generate` and `/validator` show dark panels/inputs with readable contrast; light mode unchanged.

### Task 10 — Deploy hygiene

**Goal:** Reduce supply-chain and deploy-window risk.

**Files:** `.github/workflows/deploy.yml`, `deploy.sh`.

**Steps:**
1. Pin `appleboy/ssh-action@v1` (`deploy.yml:38`) to a full commit SHA (look up the current v1.x release SHA; add a `# vX.Y.Z` comment).
2. In `deploy.sh`, replace the two-step `mv` swap (`:17-22`) with: build into `${DEPLOY_DIR}.new` (same filesystem as `DEPLOY_DIR`, i.e. under `/var/www/`), then `sudo mv "$DEPLOY_DIR" "${DEPLOY_DIR}.old" && sudo mv "${DEPLOY_DIR}.new" "$DEPLOY_DIR"` immediately adjacent, keep the `.old` cleanup after `nginx -t` succeeds so a bad deploy can be rolled back by renaming `.old` back. Add a curl health check (`curl -fsS -o /dev/null http://127.0.0.1/ -H "Host: spec.ai-me.dev"` or the appropriate local port) after reload; on failure, restore `.old` and exit 1.

**Acceptance:** `bash -n deploy.sh` passes; shellcheck-clean (or existing-level); dry-read review confirms the rollback path. (Cannot be integration-tested without the VPS — flag for the maintainer to run manually.)

---

## Out of Scope / Deliberate Non-Goals

- **Actually publishing to npm** — requires the maintainer's npm credentials and `@ai-me` org ownership; Task 4 only makes it a one-click workflow.
- **Spec content changes (v0.2 design)** — schema semantics like the `pricing.url` empty-string allowance, `last_updated` pattern tightening (F11), or adding `format: uri` to `technical.*` are normative spec decisions; changing them mid-draft without a spec-change issue (`.github/ISSUE_TEMPLATE/spec_change.md` exists for this) would be wrong. Noted, not tasked.
- **Redesign/visual overhaul of the website** — the site was recently redesigned (docs/redesign-progress.md, all phases complete); only the dark-mode island fix (Task 9) is in scope.
- **Setting up a real Umami analytics instance** — infra decision; Task 6 defaults to removal.
- **`pnpm audit` / dependency upgrades** — lockfile resolves to recent versions (astro 5.18.0, ajv 8.18.0, typescript 5.9.3, preact 10.28.4 as of Apr 2026); no known-vulnerable pin was identified from the lockfile read, and node_modules is not installed to run an audit. Run `pnpm audit` after `pnpm install` as part of verification, but proactive major-version bumps are not tasked.
- **VPS/nginx configuration itself** — only the in-repo `deploy.sh` and workflow are touched.

---

## Verification Checklist

Run from `/home/adminy/Coding/ai-me` after implementing:

```bash
# 0. Install (node_modules is currently absent)
pnpm install

# 1. Typecheck + build everything
pnpm --filter website typecheck
pnpm --filter website build
pnpm --filter @ai-me/validator build
pnpm --filter @ai-me/create build

# 2. Conformance (Task 2)
node scripts/validate-examples.mjs   # or the pnpm exec variant chosen in Task 2

# 3. Tests (Task 5)
pnpm --filter @ai-me/validator test
pnpm --filter @ai-me/create test

# 4. Packaging (Task 1) — tarball smoke test
cd packages/validator && npm pack --pack-destination /tmp/claude-1000/-home-adminy-Coding/752d94e3-9985-4568-aff7-6bfa4c7bead5/scratchpad && cd ../..
mkdir -p /tmp/claude-1000/-home-adminy-Coding/752d94e3-9985-4568-aff7-6bfa4c7bead5/scratchpad/pack-test && cd $_ \
  && npm install ../ai-me-validator-*.tgz \
  && npx ai-me-validate --file /home/adminy/Coding/ai-me/examples/saas.json   # must print "✅ Valid" and exit 0
cd /home/adminy/Coding/ai-me

# 5. CLI behavior (Task 8)
node packages/validator/dist/cli.js --help
node packages/validator/dist/cli.js https://spec.ai-me.dev        # exit 0 if site reachable
timeout 30 node packages/validator/dist/cli.js http://10.255.255.1  # must exit (fetch error) well before 30s

# 6. Dead code / copy checks (Tasks 4, 6, 7)
git grep -n "umami\|StatsCounter" website/src        # expect: no output
git grep -n "docs/spec.md"                            # expect: no output
git grep -n "npx @ai-me"                              # expect: only release workflow / post-publication-framed copy

# 7. Manual UI check (Tasks 3, 9)
pnpm dev
# /generate: jump to Review with empty form → errors shown, NO green banner;
#            fill Basics+Pages required fields → banner turns green automatically.
# /generate and /validator in dark mode: panels/inputs dark, text readable.

# 8. Hygiene
pnpm audit
bash -n deploy.sh
```
