# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "updated": {"dev": "2026-10-20 16:36 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `67de8ac` | — |
| dev | — | `3d74a6a` | 2026-10-20 16:36 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés
- Le BFF exporte ses traces (span serveur nommé d'après la route, spans des handlers, appels aux APIs amont avec `traceparent`) et ses métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT`, sous le nom de service `bff-dashboard`. Sans cette variable, ou avec `OTEL_SDK_DISABLED=true`, la télémétrie est désactivée. `OTEL_SERVICE_NAME` et `OTEL_RESOURCE_ATTRIBUTES` complètent la configuration. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du BFF : aucune URL, query string, en-tête, identifiant ni IP. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` répondait 502 quand la Core API renvoyait un 429 (limite de débit atteinte) sur `/user/me`. Il répond désormais 429, avec l'en-tête `Retry-After` de la Core API et le code d'erreur `TOO_MANY_REQUESTS`. Le contrat `contracts/openapi.json` déclare cette réponse 429. Cela vient de la montée de `@mairie360/bffs-lib` de 2.2.0 à 2.5.0. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI des APIs alignés sur leurs versions prod, sans changement de code :
  - `@mairie360/bff-dashboard-openapi` 2.0.0, `@mairie360/calendar-api-openapi` 1.1.0, `@mairie360/core-api-openapi` 2.1.0, `@mairie360/project-api-openapi` 1.1.0 ;
  - fixtures de test et images Docker des stacks performance/sécurité mises à jour. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- CI : 4 montées du workflow `mairie360/CICD` de v4.2.1 à v4.3.2, et transmission des secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` pour l'étape de journal des releases. (MAIR-571, [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#99](https://github.com/mairie360/BFF_Dashboard/pull/99), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le BFF exporte ses traces (span serveur nommé d'après la route, spans des handlers, appels aux APIs amont avec `traceparent`) et ses métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT`, sous le nom de service `bff-dashboard`. Sans cette variable, ou avec `OTEL_SDK_DISABLED=true`, la télémétrie est désactivée. `OTEL_SERVICE_NAME` et `OTEL_RESOURCE_ATTRIBUTES` complètent la configuration. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du BFF : aucune URL, query string, en-tête, identifiant ni IP. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` répondait 502 quand la Core API renvoyait un 429 (limite de débit atteinte) sur `/user/me`. Il répond désormais 429, avec l'en-tête `Retry-After` de la Core API et le code d'erreur `TOO_MANY_REQUESTS`. Le contrat `contracts/openapi.json` déclare cette réponse 429. Cela vient de la montée de `@mairie360/bffs-lib` de 2.2.0 à 2.5.0. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI des APIs alignés sur leurs versions prod, sans changement de code :
  - `@mairie360/bff-dashboard-openapi` 2.0.0, `@mairie360/calendar-api-openapi` 1.1.0, `@mairie360/core-api-openapi` 2.1.0, `@mairie360/project-api-openapi` 1.1.0 ;
  - fixtures de test et images Docker des stacks performance/sécurité mises à jour. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- CI : 4 montées du workflow `mairie360/CICD` de v4.2.1 à v4.3.2, et transmission des secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` pour l'étape de journal des releases. (MAIR-571, [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#99](https://github.com/mairie360/BFF_Dashboard/pull/99), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
