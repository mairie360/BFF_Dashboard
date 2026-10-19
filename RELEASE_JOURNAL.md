# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "51b0f3200f958d32b34399c30af7de24abbe979b", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "updated": {"dev": "2026-10-19 20:12 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `67de8ac` | — |
| dev | — | `51b0f32` | 2026-10-19 20:12 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés
- Télémétrie OpenTelemetry : le BFF exporte en OTLP ses traces (span serveur nommé d'après la route, spans des handlers, appels aux APIs amont portant `traceparent`) et ses métriques HTTP vers `OTEL_EXPORTER_OTLP_ENDPOINT`. La télémétrie est désactivée si la variable n'est pas définie ou si `OTEL_SDK_DISABLED=true`. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du BFF : aucune URL, query string, en-tête, identifiant ou IP. Le nom de service vaut `bff-dashboard` par défaut et se surcharge avec `OTEL_SERVICE_NAME`. `OTEL_RESOURCE_ATTRIBUTES` ajoute des attributs comme `service.version` ou `deployment.environment.name`. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Corrections
- `GET /dashboard/bootstrap` : quand la Core API répond 429 (limite de débit atteinte), le BFF renvoyait un 502. Il répond maintenant 429, avec l'en-tête `Retry-After` relayé et le code d'erreur `TOO_MANY_REQUESTS`. Le contrat OpenAPI (`contracts/openapi.json`) déclare cette réponse 429. Ce changement vient du passage de `@mairie360/bffs-lib` de 2.2.0 à 2.5.0. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI alignés sur leurs versions prod : `@mairie360/bff-dashboard-openapi` 2.0.0, `@mairie360/calendar-api-openapi` 1.1.0, `@mairie360/core-api-openapi` 2.1.0, `@mairie360/project-api-openapi` 1.1.0. Le même commit met à jour les fixtures de test et les images des stacks Docker de performance et de sécurité. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- CI : workflow `mairie360/CICD` passé de v4.2.1 à v4.3.1 en trois mises à jour Renovate, et transmission des secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` à l'étape du journal des releases. (MAIR-571, [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Télémétrie OpenTelemetry : le BFF exporte en OTLP ses traces (span serveur nommé d'après la route, spans des handlers, appels aux APIs amont portant `traceparent`) et ses métriques HTTP vers `OTEL_EXPORTER_OTLP_ENDPOINT`. La télémétrie est désactivée si la variable n'est pas définie ou si `OTEL_SDK_DISABLED=true`. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du BFF : aucune URL, query string, en-tête, identifiant ou IP. Le nom de service vaut `bff-dashboard` par défaut et se surcharge avec `OTEL_SERVICE_NAME`. `OTEL_RESOURCE_ATTRIBUTES` ajoute des attributs comme `service.version` ou `deployment.environment.name`. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Corrections
- `GET /dashboard/bootstrap` : quand la Core API répond 429 (limite de débit atteinte), le BFF renvoyait un 502. Il répond maintenant 429, avec l'en-tête `Retry-After` relayé et le code d'erreur `TOO_MANY_REQUESTS`. Le contrat OpenAPI (`contracts/openapi.json`) déclare cette réponse 429. Ce changement vient du passage de `@mairie360/bffs-lib` de 2.2.0 à 2.5.0. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI alignés sur leurs versions prod : `@mairie360/bff-dashboard-openapi` 2.0.0, `@mairie360/calendar-api-openapi` 1.1.0, `@mairie360/core-api-openapi` 2.1.0, `@mairie360/project-api-openapi` 1.1.0. Le même commit met à jour les fixtures de test et les images des stacks Docker de performance et de sécurité. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- CI : workflow `mairie360/CICD` passé de v4.2.1 à v4.3.1 en trois mises à jour Renovate, et transmission des secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` à l'étape du journal des releases. (MAIR-571, [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
