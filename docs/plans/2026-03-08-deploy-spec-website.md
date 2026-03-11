# Deploy spec.ai-me.dev Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the AI-Me spec website to a VPS with hardened nginx, TLS, and atomic-swap deploys.

**Architecture:** Docker multi-stage build exports static files to `/var/www/spec.ai-me.dev/`. nginx serves them with TLS (Let's Encrypt), security headers, rate limiting, and caching. `deploy.sh` uses atomic directory swap for zero-downtime updates.

**Tech Stack:** Astro (static), pnpm monorepo, Docker, nginx, certbot/Let's Encrypt

---

### Task 1: Fix Dockerfile — add Umami build args and use non-root user

**Files:**
- Modify: `Dockerfile`

**Step 1: Add build args for Umami analytics and switch to non-root user**

The current Dockerfile creates a `builder` user but never switches to it, and doesn't pass Umami env vars needed at Astro build time.

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS build

# Run build as non-root
RUN corepack enable && corepack prepare pnpm@10 --activate \
    && addgroup -S builder && adduser -S builder -G builder

WORKDIR /app

# Copy dependency manifests first (layer cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY website/package.json website/
COPY packages/validator/package.json packages/validator/
COPY packages/create/package.json packages/create/

RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Umami analytics (optional — pass via --build-arg)
ARG PUBLIC_UMAMI_WEBSITE_ID
ARG PUBLIC_UMAMI_URL

RUN chown -R builder:builder /app
USER builder

# Build only the website (and its workspace dependencies)
RUN pnpm --filter website... build

# Stage 2: Export static files only
FROM scratch AS export
COPY --from=build /app/website/dist /dist
```

**Step 2: Verify Dockerfile builds locally**

Run: `docker build -t spec.ai-me-build .`
Expected: Build succeeds, image contains `/dist` with static files.

**Step 3: Commit**

```bash
git add Dockerfile
git commit -m "fix: add Umami build args and non-root user to Dockerfile"
```

---

### Task 2: Update deploy.sh to pass Umami build args

**Files:**
- Modify: `deploy.sh`

**Step 1: Add build args to docker build command**

Replace the docker build line in `deploy.sh`:

```bash
docker build \
    --build-arg PUBLIC_UMAMI_WEBSITE_ID="${PUBLIC_UMAMI_WEBSITE_ID:-}" \
    --build-arg PUBLIC_UMAMI_URL="${PUBLIC_UMAMI_URL:-}" \
    -t "$IMAGE_NAME" .
```

This allows running with or without analytics:
```bash
# Without analytics
./deploy.sh

# With analytics
PUBLIC_UMAMI_WEBSITE_ID=2379149e-0d3c-4d62-b98c-58f2f9079183 \
PUBLIC_UMAMI_URL=https://analytics.selimsalman.de \
./deploy.sh
```

**Step 2: Commit**

```bash
git add deploy.sh
git commit -m "feat: pass Umami analytics build args in deploy script"
```

---

### Task 3: Create 404 page for Astro

**Files:**
- Create: `website/src/pages/404.astro`

**Step 1: Check existing page layout for consistency**

Read: `website/src/pages/index.astro` (first ~30 lines) to understand the layout pattern.

**Step 2: Create a 404 page matching the site layout**

Create `website/src/pages/404.astro` using the same layout component as other pages. Keep it simple — heading + link back to home.

**Step 3: Verify it builds**

Run: `pnpm build` and check `website/dist/404.html` exists.

**Step 4: Commit**

```bash
git add website/src/pages/404.astro
git commit -m "feat: add 404 error page"
```

---

### Task 4: Move server-quarantine files into place on VPS

This task is manual / must be run on the VPS. These are operational steps, not code changes.

**Step 1: Copy nginx config**

```bash
sudo cp server-quarantine/spec.ai-me.dev.conf /etc/nginx/sites-available/spec.ai-me.dev
sudo ln -sf /etc/nginx/sites-available/spec.ai-me.dev /etc/nginx/sites-enabled/
```

**Step 2: Remove default site if it conflicts**

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

**Step 3: Test nginx config (before SSL — expect warnings about missing certs)**

```bash
sudo nginx -t
```

---

### Task 5: SSL certificate setup (first time only)

**Step 1: Ensure certbot is installed**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Step 2: Get certs (two separate runs for separate cert directories)**

```bash
sudo certbot certonly --webroot -w /var/www/html -d spec.ai-me.dev
sudo certbot certonly --webroot -w /var/www/html -d ai-me.dev -d www.ai-me.dev
```

**Step 3: Verify certs exist**

```bash
sudo ls /etc/letsencrypt/live/spec.ai-me.dev/
sudo ls /etc/letsencrypt/live/ai-me.dev/
```

Expected: `fullchain.pem`, `privkey.pem` in each directory.

**Step 4: Test and reload nginx with certs**

```bash
sudo nginx -t && sudo nginx -s reload
```

Expected: `syntax is ok`, `test is successful`.

---

### Task 6: Build and deploy

**Step 1: Run the deploy script**

```bash
chmod +x deploy.sh
./deploy.sh
```

Expected: Build succeeds, files extracted, nginx reloaded.

With analytics:
```bash
PUBLIC_UMAMI_WEBSITE_ID=2379149e-0d3c-4d62-b98c-58f2f9079183 \
PUBLIC_UMAMI_URL=https://analytics.selimsalman.de \
./deploy.sh
```

**Step 2: Verify files are deployed**

```bash
ls -la /var/www/spec.ai-me.dev/
ls /var/www/spec.ai-me.dev/index.html
ls /var/www/spec.ai-me.dev/.well-known/ai-me.json
```

---

### Task 7: Health checks and verification

**Step 1: HTTP → HTTPS redirect**

```bash
curl -I http://spec.ai-me.dev
```

Expected: `301` redirect to `https://spec.ai-me.dev`

**Step 2: Main site responds**

```bash
curl -I https://spec.ai-me.dev
```

Expected: `200 OK` with security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP, etc.)

**Step 3: Well-known endpoints**

```bash
curl -sf https://spec.ai-me.dev/.well-known/ai-me.json | head
curl -sf https://spec.ai-me.dev/.well-known/llms.txt | head
```

Expected: Valid JSON for ai-me.json, text content for llms.txt.

**Step 4: Domain redirects**

```bash
curl -I https://ai-me.dev
curl -I https://www.ai-me.dev
```

Expected: `301` redirect to `https://spec.ai-me.dev`

**Step 5: Security headers check**

```bash
curl -sI https://spec.ai-me.dev | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy|content-security'
```

Expected: All 6 security headers present.

**Step 6: 404 page**

```bash
curl -s -o /dev/null -w "%{http_code}" https://spec.ai-me.dev/nonexistent-page
```

Expected: `404`
