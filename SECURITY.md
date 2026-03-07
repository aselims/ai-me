# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in the AI-Me specification, tooling, or website, please report it responsibly.

**Do not open a public issue.** Instead, email the maintainers directly or use GitHub's private vulnerability reporting feature.

## Scope

Security considerations for AI-Me include:

- **Spoofing and phishing:** Malicious sites may advertise misleading CTAs. Clients should treat CTA URLs as untrusted input.
- **Stale information:** Clients should respect caching headers and revalidate periodically.
- **Integrity:** The spec does not currently define integrity mechanisms, but extensions may add DNS-based verification or signatures.
- **Privacy:** Vendor cards should not include personal data beyond business contact points.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
