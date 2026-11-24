# BFF_Dashboard

Provide an overview of municipal work using the same sources as the business pages. The BFF aggregates the session, projects, tasks and events into a consistent overview.

Donner une vue d’ensemble du travail municipal à partir des mêmes sources que les pages métier. Le BFF agrège la session, les projets, les tâches et les événements pour construire un aperçu cohérent.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The sections below are a quick reference in English; the French version of the setup, the routes and the checks is in [docs/fr/technical.md](docs/fr/technical.md).

Les sections ci-dessous sont un aide-mémoire en anglais ; leur version française (installation, routes, vérifications) est dans [docs/fr/technical.md](docs/fr/technical.md).

## Quick start

Node.js 24 and read access to the GitHub Packages of `mairie360` (`NODE_AUTH_TOKEN`, `read:packages`) are needed for the private `@mairie360/*` packages.

```bash
export NODE_AUTH_TOKEN=<token with read:packages>
npm ci
cp .env.example .env   # then fill it, see below
npm run start
```

The BFF listens on port `4007`: `GET /health` checks the process, `GET /check_apis` its upstreams, `/docs` serves Swagger UI and `/openapi.json` the contract.

Configuration (local example, every upstream is required: there is no `localhost` default):

```dotenv
PORT=4007
CORE_API_URL=http://localhost:3000
PROJECT_API_URL=http://localhost:3001
CALENDAR_API_URL=http://localhost:3002
# Core's Ed25519 public key (MAIR-680), required: paste the public key of the Core you run against.
# bffs-lib >= 3 refuses HS256 tokens and ignores JWT_SECRET: do not set it.
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n<base64 of Core's public key>\n-----END PUBLIC KEY-----"
```

## Routes

Generated contract: [`contracts/openapi.json`](contracts/openapi.json) (3 operations), published on every release as `@mairie360/bff-dashboard-openapi` for the front.

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/health` | Checks that the BFF process is up |
| `GET` | `/check_apis` | Checks that the three upstream APIs are reachable |
| `GET` | `/dashboard/bootstrap` | Load the dashboard of the signed-in user |

## Upstream contracts

The BFF calls its upstreams through these published packages (never through a local checkout); bumping one of them is how an upstream change reaches this BFF:

- `@mairie360/calendar-api-openapi`
- `@mairie360/core-api-openapi`
- `@mairie360/project-api-openapi`

## Commands

```bash
npm run lint                 # eslint
npm test                     # jest: unit, route and upstream-mock tests
npm run contracts:generate   # regenerate contracts/ after a route, schema or status change
npm run contracts:check      # CI gate: fails when contracts/ is stale
```

Docker stacks, one at a time (they need `NODE_AUTH_TOKEN` and pull access to `ghcr.io/mairie360`):

- `./integration_test.sh`: newman collection against the stack of `docker-compose-integration.yml`
- `./security_test.sh`: OWASP ZAP scan of `/openapi.json` (`docker-compose-security.yml`)
- `./performance_test.sh`: k6 load test (`docker-compose-performance.yml`)
- `./gdpr_marker_test.sh`: GDPR marker check (`docker-compose-gdpr-marker.yml`)
- `./gdpr_simulation_test.sh`: GDPR erasure simulation (`docker-compose-gdpr-simulation.yml`)

CI is the reusable `mairie360/CICD` workflow called by `.github/workflows/cicd.yml`.

## Contracts and background / Contrats et compléments

- [CONTRACT.md](CONTRACT.md)
- [contracts/openapi.json](contracts/openapi.json)
