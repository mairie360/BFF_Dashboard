# BFF_Dashboard — Documentation technique

[Présentation du module](module.md) · [English](../en/technical.md) · [README](../../README.md)

## Architecture et traitement des requêtes

Serveur Express 5.1.0 écrit en TypeScript. Les schémas Zod et leur registre OpenAPI décrivent les objets échangés; les routeurs adaptent les services amont aux besoins des interfaces.

Après la résolution de l’identité, les sources Project et Calendar sont interrogées en parallèle. Les détails des projets alimentent les tâches non terminées. Les événements sont triés par date et heure. `sources` distingue une liste vide d’une source indisponible; `metrics.totalProjects` vaut `null` si le résumé Project manque.

## Données et persistance

BFF User `/me` fournit l’identité. BFF Project fournit `/projects-page?page=1&limit=6` puis les détails de chaque projet pour les tâches. BFF Calendar fournit le bootstrap de la période. Le BFF ne dispose pas de base propre ni de mutations métier.

L’aperçu est limité et ne remplace pas les listes complètes des modules. Une source indisponible est signalée et les statistiques absentes restent nulles ou non affichées. Les rapports et mesures de population ou de performance ne sont pas fournis par ce contrat.

## Installation et lancement local

Utiliser Node.js 24 pour reproduire le job de contrats et npm avec le fichier de verrouillage versionné. Les versions des autres jobs et de Docker sont précisées plus bas.

Les dépendances directes actuelles ne comprennent pas de client privé `@mairie360/*`. `.npmrc` conserve néanmoins la configuration du registre de cette organisation.

```bash
npm ci
```

Créer `.env` à la racine. Exemple de configuration HTTP locale à adapter aux services démarrés:

```dotenv
PORT=4007
USER_BFF_URL=http://localhost:4000
PROJECT_BFF_URL=http://localhost:4001
CALENDAR_BFF_URL=http://localhost:4002
```

```bash
npm run start
```

`PORT` est optionnel; le repli de `src/index.ts` est `4007`.

Vérifier le processus puis consulter la documentation interactive:

```bash
curl --fail --silent --show-error http://localhost:4007/health
```

Interface Swagger: `http://localhost:4007/docs`. Spécification JSON: `/openapi.json`, avec l’alias `/swagger.json`. `/health` vérifie le processus; `/check_apis` est un diagnostic distinct des dépendances.

## Configuration

Les valeurs ci-dessous sont des exemples locaux ou des comportements explicitement indiqués, pas des identifiants de production.

| Variable ou priorité | Exemple / repli indiqué | Rôle |
| --- | --- | --- |
| `PORT` | 4007 | Port de cet exemple local. |
| `USER_BFF_URL` | http://localhost:4000 | Source de l’identité; doit être configurée. |
| `PROJECT_BFF_URL` | http://localhost:4001 | Source des projets et tâches; doit être configurée. |
| `CALENDAR_BFF_URL` | http://localhost:4002 | Source des événements; doit être configurée. |
| `USER_BFF_PORT` / `PROJECT_BFF_PORT` / `CALENDAR_BFF_PORT` | — | Ports optionnels si absents des URL. |

## Routes et contrat de données

Inventaire extrait de `contracts/openapi.json`. Les paramètres entre accolades sont remplacés par des identifiants réels. Les types détaillés, champs requis, réponses et exemples éventuels sont définis dans ce contrat; les statuts du tableau sont ceux déclarés, sans prétendre lister toutes les erreurs de transport ou de validation.

| Méthode | Chemin | Corps déclaré | Statuts déclarés |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/dashboard/bootstrap` | — | 200, 401, 502 |

## Session, permissions et erreurs

Le Bearer est transmis aux trois BFF. L’échec du contexte utilisateur bloque le bootstrap. Les appels initiaux Project et Calendar peuvent dégrader leur section; un refus 401 de ces appels est propagé. Les clients ont un délai de 10 secondes.

## Synchronisation et vérifications

```bash
npm run contracts:generate
npm run contracts:check
npm test -- --runInBand
npm run lint
npm run build
```

`contracts:generate` exporte le registre runtime dans `contracts/openapi.json` et régénère `contracts/bff.d.ts`. `contracts:check` échoue si le contrat ou les types sont périmés. Exécuter ensuite `npm run contracts:sync` dans chaque web service associé et livrer les modifications de contrat ensemble.

Le générateur de types est fixé à `openapi-typescript@7.10.1` dans `scripts/contracts.mjs` et s’exécute via npm. Pour une modification uniquement documentaire, vérifier les liens, l’exactitude des deux langues et `git diff --check`; ne pas régénérer les contrats sans modification de leur source.

## CI/CD et exécution Docker

Le job `contracts.yml` utilise Node.js 24, `actions/checkout@v7` et `actions/setup-node@v7`. Il s’exécute sur push, pull request et lancement manuel; il installe avec `npm ci`, contrôle les contrats et lance les tests dédiés.

`cicd.yml` appelle `mairie360/CICD/.github/workflows/BFFs-cicd.yml@v2.3.0`, avec `cicd_version: v2.3.0`, `node_version: "22"` et `openapi_spec_path: contracts/openapi.json`. Les étapes réutilisables et les environnements GitHub déterminent les contrôles, publications et déploiements effectifs; les versions sont calculées par semantic-release (`.releaserc.json`).

Le Dockerfile utilise `node:24-alpine` pour la construction et l’exécution; la commande de l’image est `["node", "dist/index.js"]`. Les identifiants GitHub Packages ne sont montés qu’en secrets de build (`npmrc`, `node_auth_token`) pendant `npm ci`. `development.Dockerfile` installe toutes les dépendances et lance `npm run start`; les stacks isolées de sécurité et de performance le construisent.

Avant un lancement Docker, vérifier les variables de service, les secrets de build et les réseaux dans les fichiers du dépôt. Une CI verte valide ses jobs; elle ne prouve pas la disponibilité des services métier dans un environnement distant.

## Diagnostic

Examiner `sources.projects`, `sources.tasks` et `sources.calendar` avant d’interpréter une liste vide. Un compteur `null` signifie une donnée indisponible. Tester la même session dans les BFF métier pour comprendre une différence de visibilité.

## Repères dans le dépôt

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

Compléments historiques: [CONTRACT.md](../../CONTRACT.md). Les besoins proposés doivent rester distincts du comportement effectivement implémenté.
