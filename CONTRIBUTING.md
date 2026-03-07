# Contributing to AI-Me

Thank you for your interest in contributing to the AI-Me Vendor Card Specification.

## Ways to Contribute

- **Report bugs** — open an issue describing the problem
- **Propose spec changes** — open an issue with your use case, then submit a PR
- **Add examples** — contribute vendor card examples for new business types
- **Improve documentation** — fix typos, clarify explanations, add guides
- **Build tooling** — create validators, generators, or client libraries

## Getting Started

1. Fork this repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ai-me.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b my-change`
5. Make your changes
6. Run the build: `pnpm build`
7. Submit a pull request

## Pull Request Guidelines

- Keep PRs focused — one change per PR
- Include a clear description of what changed and why
- Spec changes must include updated JSON Schema and examples
- Ensure the build passes before submitting

## Spec Change Process

1. Open an issue describing the proposed change
2. Wait for community discussion
3. If consensus, submit a PR with changes to:
   - `spec/ai-me-v0.1.md` (the spec text)
   - `schemas/ai-me.schema.json` (if the data model changes)
   - `examples/` (if needed)
4. Two maintainer approvals required for merge

## Code Style

- Use TypeScript for all code
- Follow existing formatting conventions
- Use meaningful commit messages

## License

By contributing, you agree that your contributions will be licensed under the project's
dual-license terms: **CC-BY 4.0** for specification content, schemas, and examples;
**Apache 2.0** for code. See [LICENSE](LICENSE) for details.
