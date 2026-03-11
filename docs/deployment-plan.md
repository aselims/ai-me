# Deployment Plan — spec.ai-me.dev

## Architecture

- **Build:** Docker multi-stage (node:22-alpine → scratch), exports only static files
- **Serve:** nginx on VPS, static files at `/var/www/spec.ai-me.dev/`
- **Domains:** `spec.ai-me.dev` (primary), `ai-me.dev` + `www.ai-me.dev` (redirect)
- **TLS:** Let's Encrypt via certbot
- **Analytics:** Umami, configured via `website/.env.production` (picked up automatically at build time)

## Expert Review Findings (devops-deploy-advisor)

### Critical Issues Fixed

1. **Root path mismatch** — nginx config had `root /var/www/ai-me.dev` but deploy script writes to `/var/www/spec.ai-me.dev`. Fixed to match.
2. **Missing HSTS** — Added `Strict-Transport-Security` with 2-year max-age, includeSubDomains, preload.
3. **Security headers silently dropped** — `add_header` inside `location` blocks wipes server-level headers. Fixed by repeating headers in every location block.
4. **Zero-downtime gap** — `rm -rf` then `mkdir` then `docker cp` causes 404s during deploy. Fixed with atomic swap via staging directory.
5. **Certbot cert path mismatch** — Single certbot command for all domains creates one cert directory. Fixed: two separate certbot runs.
6. **`server_tokens` leaking** — Already handled by `/etc/nginx/conf.d/security-headers.conf`.

### Warnings Addressed

7. **No `.dockerignore`** — Created. Excludes `.git/`, `node_modules/`, `server-quarantine/`, docs, editor files.
8. **No IPv6** — Added `listen [::]:443 ssl http2` and `listen [::]:80` to all server blocks.
9. **`pnpm build` builds everything** — Changed to `pnpm --filter website... build`.
10. **No custom 404** — Added `error_page 404 /404.html`. Requires `src/pages/404.astro` in website.
11. **Double redirect for ai-me.dev over HTTP** — HTTP block now redirects all to `https://spec.ai-me.dev$request_uri`.
12. **Missing `gzip_vary`** — Added for correct proxy/CDN caching.
13. **No rate limiting** — Added `limit_req_zone` for `.well-known/` endpoints (10 req/s per IP, burst 20).

### Additional Hardening Applied

- **CSP header** — Locks down script sources to self + Umami analytics domain
- **Permissions-Policy** — Disables camera, microphone, geolocation
- **OCSP stapling** — Faster TLS handshakes
- **SSL session tickets disabled** — Preserves forward secrecy
- **Modern cipher suite** — ECDHE-only, no RSA key exchange
- **Dotfile blocking** — `location ~ /\.(?!well-known)` returns 404
- **ACME challenge passthrough** — HTTP block allows certbot webroot challenges
- **Container cleanup trap** — `deploy.sh` uses `trap` to clean up Docker containers on failure
- **File permissions tightened** — `chmod u=rwX,g=rX,o=rX`
- **CORS on ai-me.json** — `Access-Control-Allow-Origin: *` for agent discovery

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build, filtered pnpm build |
| `deploy.sh` | Atomic swap deployment with trap cleanup |
| `website/.env.production` | Umami analytics config (read by Astro at build time) |
| `.dockerignore` | Excludes unnecessary files from build context |
| `server-quarantine/spec.ai-me.dev.conf` | Production nginx config |

## Deploy Steps

```bash
# 1. Copy nginx config
sudo cp server-quarantine/spec.ai-me.dev.conf /etc/nginx/sites-available/spec.ai-me.dev
sudo ln -sf /etc/nginx/sites-available/spec.ai-me.dev /etc/nginx/sites-enabled/

# 2. SSL certs (first time only — run separately per domain group)
sudo certbot certonly --webroot -w /var/www/html -d spec.ai-me.dev
sudo certbot certonly --webroot -w /var/www/html -d ai-me.dev -d www.ai-me.dev

# 3. Test and reload nginx
sudo nginx -t && sudo nginx -s reload

# 4. Build and deploy
chmod +x deploy.sh
./deploy.sh

# 5. Verify
curl -I https://spec.ai-me.dev
curl -sf https://spec.ai-me.dev/.well-known/ai-me.json
curl -I https://ai-me.dev  # should redirect
```

## Future Considerations

- **GitHub Actions CI/CD** — Automate deploy on push to main
- **CDN (Cloudflare)** — Absorb traffic spikes from AI agents, DDoS protection
- **nginx include snippet** — DRY up repeated security headers with `include /etc/nginx/snippets/security-headers.conf`
