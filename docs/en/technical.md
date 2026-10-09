# BFF_Dashboard — Technical documentation

[Module overview](module.md) · [Français](../fr/technical.md) · [README](../../README.md)

## Architecture and request handling

Express 5.1.0 server written in TypeScript. Zod schemas and their OpenAPI registry describe exchanged objects; routers adapt upstream services to interface needs.

After identity resolution, Project and Calendar sources are queried in parallel. Project details supply unfinished tasks. Events are sorted by date and time (`YYYY-MM-DD` and `DD-MM-YYYY` dates are both ordered chronologically); an event the dashboard cannot use, such as one without an `id`, is skipped without making the calendar unavailable. `sources` distinguishes an empty list from an unavailable source; `metrics.totalProjects` is `null` when the Project summary is missing.

## Data and persistence

BFF User `/me` supplies identity. BFF Project supplies `/projects-page?page=1&limit=6`, followed by each project’s details for tasks. BFF Calendar supplies bootstrap for the date range. The BFF has no database of its own and no business mutations.

The overview is limited and does not replace complete module listings. Unavailable sources are flagged and missing metrics remain null or absent. Reports and population or performance metrics are not supplied by this contract.

## Installation and local startup

Use Node.js 24 to reproduce the contract job and npm with the committed lockfile. Other job and Docker versions are detailed below.

Current direct dependencies include no private `@mairie360/*` client. `.npmrc` still retains the organization’s registry configuration.

```bash
npm ci
```

Create `.env` in the repository root. Local HTTP configuration example to adapt to the running services:

```dotenv
PORT=4007
USER_BFF_URL=http://localhost:4000
PROJECT_BFF_URL=http://localhost:4001
CALENDAR_BFF_URL=http://localhost:4002
```

```bash
npm run start
```

`PORT` is optional; the `src/index.ts` fallback is `4007`. The three upstream URLs have no default (no `localhost` fallback): `src/index.ts` refuses to start, naming every missing or invalid `*_URL`, and they are read again on every call.

Check the process, then open the interactive documentation:

```bash
curl --fail --silent --show-error http://localhost:4007/health
```

Swagger UI: `http://localhost:4007/docs`. JSON specification: `/openapi.json`, with `/swagger.json` as an alias. `/health` checks the process; `/check_apis` is a separate dependency diagnostic: it calls the `/health` operation of BFF User, Project and Calendar (5-second timeout, same `*_URL` variables as real calls) and answers `{ status: 'OK' | 'Error', user_bff, project_bff, calendar_bff }` with `Connected` or `Unreachable` for each (`CheckApisResponse` in the contract), 200 when all are reachable, 502 otherwise; an unconfigured service is `Unreachable`.

## Configuration

Values below are local examples or explicitly described behavior, not production credentials.

| Variable or precedence | Example / stated fallback | Purpose |
| --- | --- | --- |
| `PORT` | 4007 | Port used by this local example. |
| `USER_BFF_URL` | http://localhost:4000 | Identity source; required (startup fails without it). |
| `PROJECT_BFF_URL` | http://localhost:4001 | Project and task source; required (startup fails without it). |
| `CALENDAR_BFF_URL` | http://localhost:4002 | Event source; required (startup fails without it). |
| `USER_BFF_PORT` / `PROJECT_BFF_PORT` / `CALENDAR_BFF_PORT` | — | Optional ports when absent from the URLs. |
| `TRUST_PROXY` | unset (no proxy trusted) | Express `trust proxy` (`true`, a hop count such as `1`, or comma-separated addresses/subnets): set it behind the ingress so `req.ip` is the client. |

## Routes and data contract

Inventory extracted from `contracts/openapi.json`. Replace brace parameters with real identifiers. Detailed types, required fields, responses and any examples are defined in that contract; table statuses are the declared statuses, not an exhaustive list of transport or validation errors.

| Method | Path | Declared body | Declared statuses |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/dashboard/bootstrap` | — | 200, 401, 502, 503 |

## Session, permissions and errors

The only accepted credential is the `Authorization: Bearer <token>` header (read by `@mairie360/bffs-lib`); cookies and `x-session-token` are ignored. Without it, every `/dashboard/*` request is refused with 401 before any upstream call, and `/dashboard/*` answers carry `Cache-Control: no-store`. The token is forwarded, normalised to `Bearer <token>`, to all three BFFs. User-context failure blocks bootstrap. Initial Project and Calendar calls can degrade their respective sections; a 401 rejection from those calls or from a project detail is propagated. Only an upstream 401 is relayed (it is the only upstream status the contract declares); any other upstream status, a network failure or an unusable body becomes 502 (an unusable BFF User body: `The USER_BFF answer is invalid.`), and a missing or invalid upstream URL returns 503. Upstream bodies and messages are never relayed. Clients use a 10-second timeout.

Security headers come from the lib (`securityHeaders`, then `apiOnlyHeaders()`: `default-src 'none'` CSP, `nosniff`, `same-origin` CORP everywhere but `/docs`).

Every error answer, including unknown routes (404) and unparsable bodies (400), uses the envelope shared by all BFFs (`@mairie360/bffs-lib`), declared as `ErrorResponse` in the contract:

```json
{ "error": { "code": "BAD_GATEWAY", "message": "Upstream service error", "details": [] } }
```

The 30-day calendar window (`from`/`to` sent to BFF Calendar) starts on today's date in `Europe/Paris`, not in UTC.

## Synchronization and verification

```bash
npm run contracts:generate
npm run contracts:check
npm test -- --runInBand
npm run lint
npm run build
```

`contracts:generate` exports the runtime registry to `contracts/openapi.json` and regenerates `contracts/bff.d.ts`. `contracts:check` fails when the contract or types are stale. Then run `npm run contracts:sync` in each associated web service and deliver contract changes together.

The type generator is pinned to `openapi-typescript@7.10.1` in `scripts/contracts.mjs` and runs through npm. For documentation-only changes, check links, accuracy in both languages and `git diff --check`; do not regenerate contracts without changing their source.

## CI/CD and Docker execution

The `contracts.yml` job uses Node.js 24, `actions/checkout@v7` and `actions/setup-node@v7`. It runs on pushes, pull requests and manual dispatch; it installs with `npm ci`, checks contracts and runs the associated tests.

`cicd.yml` calls `mairie360/CICD/.github/workflows/BFFs-cicd.yml@v3.2.0`, with `cicd_version: v3.2.0`, `node_version: "24"` and `openapi_spec_path: contracts/openapi.json`. Reusable steps and GitHub environments determine actual checks, publications and deployments; releases are computed by semantic-release (`.releaserc.json`).

The Dockerfile uses `node:24-alpine`, pinned by digest, for build and runtime (`development.Dockerfile` too); the image command is `["node", "dist/index.js"]`. GitHub Packages credentials are only mounted as build secrets (`npmrc`, `node_auth_token`) during `npm ci`. `development.Dockerfile` installs all dependencies and runs `npm run start`.

`security_test.sh` and `performance_test.sh` test the image named by `IMAGE_REF`: in CI, the image `release-dev` has just published, the same artifact that is then promoted to staging and prod. When `IMAGE_REF` is empty (local use), they first build `bff-dashboard:local` from `development.Dockerfile`, which needs `NODE_AUTH_TOKEN` and `./.npmrc`.

`security_test.sh` runs the OWASP ZAP stack of `docker-compose-security.yml`: ZAP replays every operation of `/openapi.json` with an admin JWT (`sub=1`, HS256) signed by `stack_secrets.sh` with the random `JWT_SECRET` it generates for each run and shares with every service of the stack; `init-test.sql` seeds users 1 (Admin) and 2 (User).

The ZAP stack carries the OpenAPI coverage hook of `mairie360/CICD` (`tests/zap/zap_hooks.py`), checked out as `cicd-repo/` by the CI jobs and cloned there by `security_test.sh` / `performance_test.sh` at the pinned `cicd_version` (`CICD_VERSION` overrides it). After the scan, it fails when an operation of the contract was never reached, or when an operation that requires `bearerAuth` only got 401/403. Public operations (`/health`, `/check_apis`) declare `security: []` in their `registerPath`; a new route is authenticated by default. `load-test.js` holds one handler per operation of `contracts/openapi.json` through the shared `tests/k6/coverage.js`: k6 aborts at init when one is missing and fails its `operations_uncovered` threshold when a handler sends no request, so **adding a route means adding its handler in `load-test.js`**. All three operations are reads, so the `reads` scenario runs every handler as random agents of the Project_API volume seed (`init-perf-project.sql`, with `init-perf-calendar.sql`) and carries the gate; `bootstrap_rush` sends `GET /dashboard/bootstrap` at a fixed rate. Every operation has a `p(95)` threshold by family: 50 ms for `/health`, 200 ms for `/check_apis`, 1000 ms for `/dashboard/bootstrap`; every check must pass (the dashboard of the agent, with every source available), with no failed request and no dropped iteration. `K6_PROFILE` is `ci` (default) or `stress`.

Before running Docker, check service variables, build secrets and networks in the repository files. Green CI validates its jobs; it does not prove business-service availability in a remote environment.

## Troubleshooting

Inspect `sources.projects`, `sources.tasks` and `sources.calendar` before interpreting an empty list. A `null` count means unavailable data. Check the same session in the business BFFs to understand visibility differences.

## Repository reference

- [src/app.ts](../../src/app.ts)
- [src/routes/dashboard.ts](../../src/routes/dashboard.ts)
- [src/clients/upstreams.ts](../../src/clients/upstreams.ts)
- [contracts/openapi.json](../../contracts/openapi.json)
- [contracts/bff.d.ts](../../contracts/bff.d.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Historical supplements: [CONTRACT.md](../../CONTRACT.md). Proposed requirements must remain distinct from implemented behavior.
