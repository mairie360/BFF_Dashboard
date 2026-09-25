# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`bff-dashboard` is a Backend-for-Frontend for the Mairie360 Dashboard screens (web service:
`mairie360/Dashboard_Web_Service`). It aggregates read-only data from three other BFFs (User,
Project, Calendar) into one `/dashboard/bootstrap` payload. It has **no database and performs no
business mutations** — it only adapts upstream data and enforces session rules.

## Commands

```bash
npm ci                      # install (use Node.js 24 to match the contracts CI job)
npm run start               # dev server via ts-node (src/index.ts), default port 4007
npm run build               # tsc -> dist/
npm run lint                # eslint . --ext .ts   (lint:fix to autofix)
npm test                    # jest
npm test -- --runInBand     # how CI runs it
npx jest tests/health.test.ts            # single file
npx jest -t "failed sources stay"        # single test by name
```

Contract regeneration (**required whenever routes or Zod schemas change**, or CI fails):

```bash
npm run contracts:generate  # export runtime OpenAPI -> contracts/openapi.json + root openapi.json,
                            # then regenerate contracts/bff.d.ts via openapi-typescript@7.10.1
npm run contracts:check     # verifies both are up to date (this is what contracts.yml enforces)
```

Commit the regenerated `contracts/openapi.json`, root `openapi.json`, and `contracts/bff.d.ts`.
`tests/contracts.test.ts` also asserts the live `/openapi.json` equals the committed file.

Isolated perf/security stacks (need Docker + GHCR pull access for the upstream images):

```bash
./performance_test.sh   # k6 load test  (docker-compose-performance.yml)
./security_test.sh      # OWASP ZAP DAST (docker-compose-security.yml)
```

Each stack brings up the **full real upstream chain** — postgres + liquibase + seeder
(`init-test.sql`, user id 2) + redis + core/project/calendar APIs + bff-user/bff-project/bff-calendar
+ this BFF — then runs k6 (`load-test.js`) or ZAP against `/dashboard/bootstrap`. Test JWTs are
HS256 signed with `JWT_SECRET=secret`, `sub=2`. The BFF under test is never built by the compose files:
they run `IMAGE_REF` (CI passes the image `release-dev` just pushed); with `IMAGE_REF` empty the scripts
build `bff-dashboard:local` from `development.Dockerfile` first.

## Architecture

**Request entry:** `src/index.ts` → `src/app.ts`. `app.ts` mounts JSON + raw-multipart body parsers,
Swagger UI at `/docs`, the spec at `/openapi.json` and `/swagger.json`, and the three routers
(`health`, `check_apis`, `dashboard`). `/dashboard/*` responses get `Cache-Control: no-store`.

**Upstream calls — `src/clients/upstream.ts`:** all outbound requests go through here.
- `baseUrl(service)` resolves `process.env[`${service}_URL`]` (e.g. `USER_BFF_URL`), optionally
  appending `${service}_PORT`. Missing config → `UpstreamError(503)`.
- `authorization(req)` requires a `Bearer <token>` header (→ `UpstreamError(401)`); the same token
  is forwarded to every upstream BFF.
- `json()` / `upstream()` wrap `fetch` with a 10s timeout, mapping network failure → 502,
  non-2xx → the upstream status. `routeError(res, err)` renders `{ error: { message } }`.
- `forward()` is a transparent proxy helper (method/body/headers/status passthrough) — currently
  unused by the mounted routes but kept for future proxy routes.

**OpenAPI generation — zod-to-openapi:** `src/openapi-registry.ts` exports a single shared
`registry`. Every route module calls `registry.registerPath(...)` and registers its Zod schemas
**at import time**. `src/openapi.ts` imports all route modules (for their side effects) and builds
the document. Consequence: a new route only appears in the spec if its module is imported by
`src/openapi.ts` / `src/app.ts`.

**`/dashboard/bootstrap` flow (`src/routes/dashboard.ts`):** validate Bearer → `USER_BFF /me` for
identity (failure blocks the whole response) → in parallel `PROJECT_BFF /projects-page?page=1&limit=6`
and `CALENDAR_BFF /calendar/bootstrap?from=&to=` (next 30 days) → per-project `PROJECT_BFF
/projects/{id}` for unfinished tasks. A 401 from any upstream propagates; any other upstream failure
degrades that section to `sources.<x> = "unavailable"` and `metrics.totalProjects = null` rather
than inventing data. Output is capped at 6 projects / 8 tasks / 6 events.

## Tests with contract-driven upstream mocks

`tests/dashboard.upstream-mocks.test.ts` serves BFF User / Project / Calendar from real local HTTP
servers (`tests/support/contract-mock-server.ts`). Their contracts are rebuilt at test time from the
**installed** `@mairie360/bff-user-openapi`, `bff-project-openapi`, `bff-calendar-openapi` devDependencies
(`tests/support/orval-contract.ts` parses the orval `endpoints/*.ts` + `model/*.ts` with the TypeScript
compiler API; the packages ship no `openapi.json`). Keep their versions aligned with the upstream images of
the perf/security stacks and bump them to test against a new upstream contract. Each mock rejects paths,
methods and query parameters absent from the upstream contract and validates mocked success responses.
Orval does not type error statuses: every mocked error reply needs `outOfContract: true`. Dashboard 200
responses are validated against the current `contracts/openapi.json` **and** the last published
`@mairie360/bff-dashboard-openapi` (compatibility for consumers).
`tests/support/openapi-contract.ts`, `contract-mock-server.ts` and `orval-contract.ts` are shared verbatim
with `BFF_Calendar`; keep the copies identical.

## Conventions & gotchas

- **ESLint:** `eslint.config.cjs` (flat config, ESLint 9) is the active one; `.eslintrc.js` is
  legacy and ignored. `@typescript-eslint/no-explicit-any` is an **error**.
- User-facing error messages in code are in **French**; keep that consistent.
- **Docs are bilingual:** any change to `docs/en/*.md` must be mirrored in `docs/fr/*.md`.
- CI: `contracts.yml` (Node 24: `contracts:check` + tests) and `cicd.yml` (shared
  `mairie360/CICD/.github/workflows/BFFs-cicd.yml@v2.3.0` — lint / audits / build / test / release
  dev→staging→prod, plus `security_tests` / `performance_tests` which run `./security_test.sh` /
  `./performance_test.sh` at repo root). Keep the `@vX.Y.Z` ref and `cicd_version:` input in sync.
- Dockerfiles use `node:24-alpine`; npm credentials only enter through BuildKit secrets
  (`npmrc`, `node_auth_token`). Locally, the test scripts build `development.Dockerfile` when `IMAGE_REF` is empty.
- `.npmrc` points `@mairie360:*` at GitHub Packages and needs `NODE_AUTH_TOKEN`: the
  `@mairie360/bff-*-openapi` devDependencies used by the tests are private.
- **Known stale bits** (don't rely on them): `npm run contracts:sync` is referenced in `CONTRACT.md`
  / docs but is not defined in `package.json`, and `scripts/contracts.mjs --sync` has a hardcoded
  `source = null` so it throws.
- `src/routes/check_apis.ts` probes services named `CORE_API` / `PROJECT_API` (via `CORE_API_URL`
  etc.), which don't match the `USER_BFF` / `PROJECT_BFF` / `CALENDAR_BFF` names used everywhere
  else or `.env.example` — treat `/check_apis` as an incomplete diagnostic.

## Environment

Copy `.env.example` to `.env`: `PORT` (default 4007), `USER_BFF_URL`, `PROJECT_BFF_URL`,
`CALENDAR_BFF_URL`. Optional `*_BFF_PORT` counterparts.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.
