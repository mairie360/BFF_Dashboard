# BFF_Dashboard — Technical documentation

[Module overview](module.md) · [Français](../fr/technical.md) · [README](../../README.md)

## Architecture and request handling

Express 5.1.0 server written in TypeScript. Zod schemas and their OpenAPI registry describe exchanged objects; routers adapt upstream services to interface needs.

After identity resolution, Project and Calendar sources are queried in parallel. Project details supply unfinished tasks. Events are sorted by date and time. `sources` distinguishes an empty list from an unavailable source; `metrics.totalProjects` is `null` when the Project summary is missing.

## Data and persistence

BFF User `/me` supplies identity. BFF Project supplies `/projects-page?page=1&limit=6`, followed by each project’s details for tasks. BFF Calendar supplies bootstrap for the date range. The BFF has no database of its own and no business mutations.

The overview is limited and does not replace complete module listings. Unavailable sources are flagged and missing metrics remain null or absent. Reports and population or performance metrics are not supplied by this contract.

## Installation and local startup

Use Node.js 22 to reproduce the contract job and npm with the committed lockfile. Other job and Docker versions are detailed below.

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

`PORT` is optional; the `src/index.ts` fallback is `4007`.

Check the process, then open the interactive documentation:

```bash
curl --fail --silent --show-error http://localhost:4007/health
```

Swagger UI: `http://localhost:4007/docs`. JSON specification: `/openapi.json`, with `/swagger.json` as an alias. `/health` checks the process; `/check_apis` is a separate dependency diagnostic.

## Configuration

Values below are local examples or explicitly described behavior, not production credentials.

| Variable or precedence | Example / stated fallback | Purpose |
| --- | --- | --- |
| `PORT` | 4007 | Port used by this local example. |
| `USER_BFF_URL` | http://localhost:4000 | Identity source; must be configured. |
| `PROJECT_BFF_URL` | http://localhost:4001 | Project and task source; must be configured. |
| `CALENDAR_BFF_URL` | http://localhost:4002 | Event source; must be configured. |
| `USER_BFF_PORT` / `PROJECT_BFF_PORT` / `CALENDAR_BFF_PORT` | — | Optional ports when absent from the URLs. |

## Routes and data contract

Inventory extracted from `contracts/openapi.json`. Replace brace parameters with real identifiers. Detailed types, required fields, responses and any examples are defined in that contract; table statuses are the declared statuses, not an exhaustive list of transport or validation errors.

| Method | Path | Declared body | Declared statuses |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/dashboard/bootstrap` | — | 200, 401, 502 |

## Session, permissions and errors

The Bearer token is forwarded to all three BFFs. User-context failure blocks bootstrap. Initial Project and Calendar calls can degrade their respective sections; a 401 rejection from those calls is propagated. Clients use a 10-second timeout.

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

The `contracts.yml` job uses Node.js 22, `actions/checkout@v7` and `actions/setup-node@v7`. It runs on pushes, pull requests and manual dispatch; it installs with `npm ci`, checks contracts and runs the associated tests.

The `cicd.yml` file is an entirely commented template: it does not run the shared pipeline. The contract workflow is active. The presence of the template does not imply automatic deployment.

The Dockerfile currently uses `node:20-alpine` for build and runtime; the image command is `["node", "dist/index.js"]`. That version is separate from the Node.js 22 contract job.

Before running Docker, check service variables, build secrets and networks in the repository files. Green CI validates its jobs; it does not prove business-service availability in a remote environment.

## Troubleshooting

Inspect `sources.projects`, `sources.tasks` and `sources.calendar` before interpreting an empty list. A `null` count means unavailable data. Check the same session in the business BFFs to understand visibility differences.

## Repository reference

- [src/app.ts](../../src/app.ts)
- [src/routes/dashboard.ts](../../src/routes/dashboard.ts)
- [src/clients/upstream.ts](../../src/clients/upstream.ts)
- [contracts/openapi.json](../../contracts/openapi.json)
- [contracts/bff.d.ts](../../contracts/bff.d.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Historical supplements: [CONTRACT.md](../../CONTRACT.md). Proposed requirements must remain distinct from implemented behavior.
