# --- Stage 1: build ---
FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS builder
WORKDIR /app
COPY package*.json ./

# GitHub Packages credentials are only available during npm ci.
RUN --mount=type=secret,id=npmrc,target=/app/.npmrc \
    --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN \
    npm ci

COPY . .
RUN npm run build

RUN --mount=type=secret,id=npmrc,target=/app/.npmrc \
    --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN \
    npm ci --omit=dev --ignore-scripts

# --- Stage 2: runtime ---
FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94
ENV NODE_ENV=production
# The runtime only runs `node dist/index.js`: drop the package managers bundled with the base image
# (npm, npx, corepack, yarn), whose own dependencies carry fixable HIGH CVEs flagged by Trivy.
RUN apk add --no-cache curl \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
        /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
        /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

WORKDIR /app
# Files stay owned by root: the node user cannot modify the code it runs.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER node

# Cap the heap at 180 MB to fit within a 256 MB Kubernetes memory limit.
ENV NODE_OPTIONS="--max-old-space-size=180"

EXPOSE 4007
CMD ["node", "dist/index.js"]
