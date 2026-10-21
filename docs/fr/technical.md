# BFF_Dashboard — Documentation technique

[Présentation du module](module.md) · [English](../en/technical.md) · [README](../../README.md)

## Architecture et traitement des requêtes

Serveur Express 5.1.0 écrit en TypeScript. Les schémas Zod et leur registre OpenAPI décrivent les objets échangés; les routeurs adaptent les services amont aux besoins des interfaces.

Après la résolution de l’identité, les sources Project et Calendar sont interrogées en parallèle. La liste de tâches transverse de Project API fournit les tâches actives, indépendamment de la section projets, triées par échéance (sans échéance en dernier). Un événement récurrent est affiché à sa prochaine occurrence (Calendar API le liste avec le premier jour de sa série), et un événement ou une occurrence déjà terminés sont exclus (MAIR-563). Les événements sont triés par date et heure (les dates `YYYY-MM-DD` et `DD-MM-YYYY` sont ordonnées chronologiquement); un événement inexploitable, par exemple sans `id`, est ignoré sans rendre le calendrier indisponible. `sources` distingue une liste vide d’une source indisponible; `metrics.totalProjects` vaut `null` si le résumé Project manque.

## Données et persistance

Le dashboard lit les API, jamais un autre BFF (MAIR-525), en une seule vague parallèle : Core API `GET /api/v1/user/me/` fournit le prénom (et les rôles d’un jeton sans claim `role`), Project API `GET /api/v1/projects/?limit=6` les premiers projets et leur total, Project API `GET /api/v1/tasks/?limit=8` les premières tâches actives de tous les projets visibles, échéance la plus proche d’abord, en un seul appel (MAIR-557), et Calendar API `GET /api/v1/calendar` les événements des 30 prochains jours. Les tâches suivent la visibilité de BFF Project : Admin, Maire et Responsable voient toutes les tâches actives des projets visibles, les autres rôles seulement les leurs (`assigned_to`) ; le rôle vient du jeton vérifié. Le BFF ne dispose pas de base propre ni de mutations métier.

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
CORE_API_URL=http://localhost:3000
PROJECT_API_URL=http://localhost:3001
CALENDAR_API_URL=http://localhost:3002
```

```bash
npm run start
```

`PORT` est optionnel; le repli de `src/index.ts` est `4007`. Les trois URL amont n’ont pas de valeur par défaut (pas de repli `localhost`) : `src/index.ts` refuse de démarrer en nommant chaque `*_URL` manquante ou invalide, et elles sont relues à chaque appel.

Vérifier le processus puis consulter la documentation interactive:

```bash
curl --fail --silent --show-error http://localhost:4007/health
```

Interface Swagger: `http://localhost:4007/docs`. Spécification JSON: `/openapi.json`, avec l’alias `/swagger.json`. `/health` vérifie le processus; `/check_apis` est un diagnostic distinct des dépendances : il appelle l’opération `/health` de Core API, Project API et Calendar API (délai de 5 secondes, mêmes variables `*_URL` que les appels réels) et répond `{ status: 'OK' | 'Error', core_api, project_api, calendar_api }` avec `Connected` ou `Unreachable` pour chacun (`CheckApisResponse` dans le contrat), 200 si tous sont joignables, 502 sinon ; un service non configuré est `Unreachable`.

## Configuration

Les valeurs ci-dessous sont des exemples locaux ou des comportements explicitement indiqués, pas des identifiants de production.

| Variable ou priorité | Exemple / repli indiqué | Rôle |
| --- | --- | --- |
| `PORT` | 4007 | Port de cet exemple local. |
| `CORE_API_URL` | http://localhost:3000 | Source de l’identité (prénom, rôles d’un jeton ancien); obligatoire (le démarrage échoue sans elle). |
| `PROJECT_API_URL` | http://localhost:3001 | Source des projets et tâches; obligatoire (le démarrage échoue sans elle). |
| `CALENDAR_API_URL` | http://localhost:3002 | Source des événements; obligatoire (le démarrage échoue sans elle). |
| `CORE_API_PORT` / `PROJECT_API_PORT` / `CALENDAR_API_PORT` | — | Ports optionnels si absents des URL. |
| `TRUST_PROXY` | non défini (aucun proxy de confiance) | Réglage Express `trust proxy` (`true`, un nombre de sauts comme `1`, ou des adresses/sous-réseaux séparés par des virgules) : à définir derrière l’ingress pour que `req.ip` soit le client. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | non défini (télémétrie désactivée) | Collecteur OpenTelemetry de l’instance, par ex. `http://otel-collector:4318` : les traces et les métriques HTTP y sont exportées en OTLP (MAIR-504). Seuls la méthode, le statut, la route paramétrée et l’hôte appelé sortent du BFF, jamais une URL, une query string, un en-tête, un identifiant ou une IP. |
| `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES` | `bff-dashboard` ; non défini | Remplacent le nom du service ; attributs de ressource supplémentaires comme `service.version=<tag de l’image>,deployment.environment.name=prod`. `OTEL_SDK_DISABLED=true` désactive la télémétrie. |

## Routes et contrat de données

Inventaire extrait de `contracts/openapi.json`. Les paramètres entre accolades sont remplacés par des identifiants réels. Les types détaillés, champs requis, réponses et exemples éventuels sont définis dans ce contrat; les statuts du tableau sont ceux déclarés, sans prétendre lister toutes les erreurs de transport ou de validation.

| Méthode | Chemin | Corps déclaré | Statuts déclarés |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/dashboard/bootstrap` | — | 200, 401, 502, 503 |

## Session, permissions et erreurs

Le seul identifiant accepté est l’en-tête `Authorization: Bearer <token>` (lu par `@mairie360/bffs-lib`) ; les cookies et `x-session-token` sont ignorés. Sans lui, toute requête `/dashboard/*` est refusée en 401 avant tout appel amont, et les réponses `/dashboard/*` portent `Cache-Control: no-store`. Le jeton est transmis, normalisé en `Bearer <token>`, aux trois API. L’échec du profil Core bloque le bootstrap. Les appels Project et Calendar peuvent dégrader leur section ; un refus 401 de n’importe quel appel, liste de tâches comprise, est propagé. Seul un 401 amont est relayé (c’est le seul statut amont déclaré par le contrat) ; tout autre statut amont, une panne réseau ou un corps inexploitable devient 502 (profil Core inexploitable : `The CORE_API answer is invalid.`), et une URL amont manquante ou invalide renvoie 503. Les corps et messages amont ne sont jamais relayés. Les clients ont un délai de 10 secondes et rejouent une fois une lecture idempotente sur une panne transitoire.

Les en-têtes de sécurité viennent de la lib (`securityHeaders`, puis `apiOnlyHeaders()` : CSP `default-src 'none'`, `nosniff`, CORP `same-origin` partout sauf `/docs`).

Toutes les réponses d’erreur, y compris les routes inconnues (404) et les corps illisibles (400), utilisent l’enveloppe commune à tous les BFF (`@mairie360/bffs-lib`), déclarée comme `ErrorResponse` dans le contrat :

```json
{ "error": { "code": "BAD_GATEWAY", "message": "Upstream service error", "details": [] } }
```

La fenêtre de 30 jours du calendrier (`start`/`end` envoyés à Calendar API, de 00:00:00 à 23:59:59 heure de Paris convertis en UTC) commence à la date du jour en `Europe/Paris`, et non en UTC.

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

`cicd.yml` appelle `mairie360/CICD/.github/workflows/BFFs-cicd.yml@v4.4.0`, avec `cicd_version: v4.4.0`, `node_version: "24"` et `openapi_spec_path: contracts/openapi.json`. Les étapes réutilisables et les environnements GitHub déterminent les contrôles, publications et déploiements effectifs; les versions sont calculées par semantic-release (`.releaserc.json`). Un push sur `main` s’arrête après `release-dev` ; staging et prod passent par les workflows manuels `promote-staging.yml` / `promote-prod.yml` (MAIR-494).

Le Dockerfile utilise `node:24-alpine`, épinglé par digest, pour la construction et l’exécution (`development.Dockerfile` aussi); la commande de l’image est `["node", "dist/index.js"]`. Les identifiants GitHub Packages ne sont montés qu’en secrets de build (`npmrc`, `node_auth_token`) pendant `npm ci`. `development.Dockerfile` installe toutes les dépendances et lance `npm run start`.

`security_test.sh` et `performance_test.sh` testent l’image désignée par `IMAGE_REF`: en CI, `release-dev` publie l’image `dev-<sha>`, et `promote-staging.yml` lance les deux tests sur cette image avant que ce même artefact soit promu en staging puis en prod (MAIR-494). Quand `IMAGE_REF` est vide (usage local), ils construisent d’abord `bff-dashboard:local` depuis `development.Dockerfile`, ce qui demande `NODE_AUTH_TOKEN` et `./.npmrc`.

`security_test.sh` lance la stack OWASP ZAP de `docker-compose-security.yml`: ZAP rejoue chaque opération de `/openapi.json` avec un JWT admin (`sub=1`, HS256) signé par `stack_secrets.sh` avec le `JWT_SECRET` aléatoire qu’il génère à chaque exécution et partage avec tous les services de la stack; `init-test.sql` crée les utilisateurs 1 (Admin) et 2 (User).

La stack ZAP porte le hook de couverture OpenAPI de `mairie360/CICD` (`tests/zap/zap_hooks.py`), extrait dans `cicd-repo/` par les jobs CI et cloné au même endroit par `security_test.sh` / `performance_test.sh` au `cicd_version` épinglé (`CICD_VERSION` le remplace). Après le scan, il échoue si une opération du contrat n’a jamais été atteinte, ou si une opération qui exige `bearerAuth` n’a reçu que des 401/403. Les opérations publiques (`/health`, `/check_apis`) déclarent `security: []` dans leur `registerPath` ; une nouvelle route est authentifiée par défaut. `load-test.js` contient un handler par opération de `contracts/openapi.json` via le module partagé `tests/k6/coverage.js` : k6 s’arrête à l’init s’il en manque un et échoue sur le seuil `operations_uncovered` si un handler n’envoie pas de requête, donc **ajouter une route implique d’ajouter son handler dans `load-test.js`**. Les trois opérations sont des lectures : le scénario `reads` exécute tous les handlers en agents aléatoires du seed de volume de Project_API (`init-perf-project.sql`, avec `init-perf-calendar.sql`) et porte la gate ; `bootstrap_rush` envoie `GET /dashboard/bootstrap` à débit fixe. Chaque opération a un seuil `p(95)` par famille : 50 ms pour `/health`, 200 ms pour `/check_apis`, 1000 ms pour `/dashboard/bootstrap` ; chaque check doit passer (le tableau de bord de l’agent, toutes sources disponibles), sans requête en échec ni itération abandonnée. `K6_PROFILE` vaut `ci` (par défaut) ou `stress`.

Avant un lancement Docker, vérifier les variables de service, les secrets de build et les réseaux dans les fichiers du dépôt. Une CI verte valide ses jobs; elle ne prouve pas la disponibilité des services métier dans un environnement distant.

## Journaux

Chaque journal est un objet JSON par ligne sur la sortie standard (MAIR-531, `createLogger` de `@mairie360/bffs-lib`, `src/logger.ts`), au format des APIs avec `LOG_FORMAT=json` : `timestamp`, `level`, `target` (`bff-dashboard`), `message`, puis les champs.

- Une ligne `request completed` par requête (`requestLogger`, premier middleware de `src/app.ts`) : `request_id`, `method`, `path` (la route reconnue, par exemple `/users/:userId` ; jamais la query string), `status`, `duration_ms`. Les 5xx sont écrites en `ERROR` ; `/health` n'est pas journalisé.
- `request_id` reprend l'en-tête `X-Request-Id` quand l'appelant en envoie un bien formé, sinon il est généré ; il est renvoyé dans `X-Request-Id` et répété sur chaque ligne de la requête (`request failed`, `upstream unreachable`...), une seule recherche les retrouve toutes.
- `request failed` (5xx) et `upstream unreachable` (`/check_apis`) portent `error` = `describeError(error)` : type, statut, méthode et chemin de l'appel amont, message masqué. Jamais d'en-tête, de jeton, de corps ni de donnée personnelle (MAIR-290).
- `LOG_LEVEL` (`debug`, `info`, `warn`, `error` ; `info` par défaut) filtre les lignes.
- `LOG_FORMAT` (`json` ou `text`) : non défini, les lignes sont du texte coloré quand stdout est un terminal (`npm run start`), du JSON sinon (conteneurs, tests). `NO_COLOR` / `FORCE_COLOR` règlent les couleurs (MAIR-555).

## Diagnostic

Examiner `sources.projects`, `sources.tasks` et `sources.calendar` avant d’interpréter une liste vide. Un compteur `null` signifie une donnée indisponible. Tester la même session dans les BFF métier pour comprendre une différence de visibilité.

## Repères dans le dépôt

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

Compléments historiques: [CONTRACT.md](../../CONTRACT.md). Les besoins proposés doivent rester distincts du comportement effectivement implémenté.
