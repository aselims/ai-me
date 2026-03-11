# Stage 1: Build
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.31.0 --activate \
    && addgroup -S builder && adduser -S builder -G builder

WORKDIR /app

# Copy dependency manifests first (layer cache)
COPY --chown=builder:builder pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --chown=builder:builder website/package.json website/
COPY --chown=builder:builder packages/validator/package.json packages/validator/
COPY --chown=builder:builder packages/create/package.json packages/create/

# Install as root (needs write access to global store)
RUN pnpm install --frozen-lockfile

# Copy source and fix node_modules ownership, then switch to builder
COPY --chown=builder:builder . .
RUN find /app -name node_modules -exec chown -R builder:builder {} +
USER builder

# Build only the website (and its workspace dependencies)
RUN pnpm --filter website... build

# Stage 2: Export static files only
FROM scratch AS export
COPY --from=build /app/website/dist /dist
