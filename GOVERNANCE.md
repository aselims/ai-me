# Governance

## Versioning

AI-Me uses semantic-style versioning:

- **0.x** — Draft versions. Breaking changes are possible.
- **1.0** — First stable release. Backwards-compatible changes only.
- **1.x** — Additive changes (new optional fields, extensions).
- **2.0** — Breaking changes, if ever needed.

## Decision Making

During the 0.x phase, project maintainers make final decisions on spec changes, guided by community feedback.

Before the 1.0 release, a more formal governance structure will be established, including an advisory group of early adopters and implementers.

## Change Process

1. Open a GitHub issue describing the proposal
2. Community discussion
3. Pull request with spec, schema, and example changes
4. Two maintainer approvals required
5. Merge and release

## Extensions

Custom fields use namespaced prefixes (e.g. `x_mcp`). No approval needed. Popular extensions may be promoted to official fields.
