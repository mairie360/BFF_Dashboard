# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0", "updated": {"dev": "2026-10-21 09:34 UTC", "staging": "2026-10-20 17:55 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `3d74a6a` | 2026-10-20 17:55 UTC |
| dev | — | `d1bb5cf` | 2026-10-21 09:34 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés
- Télémétrie OpenTelemetry : traces et métriques HTTP exportées en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT` lorsque la variable est définie ; sans elle, rien n'est exporté. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du BFF. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` : quand Core API répond 429, la route répond désormais 429 avec l'en-tête `Retry-After` au lieu de 502, grâce à `@mairie360/bffs-lib` 2.5.0 (route documentée dans `contracts/openapi.json`). Les autres échecs Core restent en 502. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- Déploiement : un push sur `main` ne lance plus que `release-dev`. Staging et prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml`. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104) ; MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))

#### Technique
- Contrats OpenAPI alignés sur les versions prod (`bff-dashboard-openapi` 2.0.0, `calendar-api-openapi`, `core-api-openapi`, `project-api-openapi`), puis `calendar-api-openapi` 1.2.0, `core-api-openapi` 2.2.0 et `project-api-openapi` 1.2.0 ; fixtures de test mises à jour. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96) ; MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- CI : mairie360/CICD passe de v4.2.1 à v4.4.3 via Renovate et des PR manuelles ; les stacks de sécurité et de performance utilisent les images prod (`database` et `liquibase-migrations` 3.3.0, APIs 2.2.0 / 1.2.0 / 1.2.0). (Renovate [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102) ; [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- Journal de release : les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis au workflow CICD. (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))
- Documentation (`CLAUDE.md`, `docs/en` et `docs/fr`) mise à jour sur la promotion. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne lance plus que `release-dev` : staging et prod ne reçoivent plus rien automatiquement. La promotion se fait à la main avec `promote-staging.yml`, puis `promote-prod.yml`. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104) ; MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))

#### Technique
- Les dépendances `@mairie360/*-openapi` de développement passent aux versions prod (`calendar-api-openapi` 1.2.0, `core-api-openapi` 2.2.0, `project-api-openapi` 1.2.0), et les stacks `docker-compose` de sécurité et de performance utilisent les images prod. Aucun effet à l'exécution du service. (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- Workflows de promotion ajoutés et documentation mise à jour. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Télémétrie OpenTelemetry : traces et métriques HTTP exportées en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT` lorsque la variable est définie ; sans elle, rien n'est exporté. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du BFF. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` : quand Core API répond 429, la route répond désormais 429 avec l'en-tête `Retry-After` au lieu de 502, grâce à `@mairie360/bffs-lib` 2.5.0 (route documentée dans `contracts/openapi.json`). Les autres échecs Core restent en 502. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- CI : mairie360/CICD passe de v4.2.2 à v4.3.2 via Renovate (quatre mises à jour). (Renovate [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102))
- Les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis au workflow CICD pour le journal de release. (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))
- Contrats OpenAPI et fixtures de test alignés sur les versions prod (`bff-dashboard-openapi` 2.0.0, `calendar-api-openapi` 1.1.0, `core-api-openapi` 2.1.0, `project-api-openapi` 1.1.0) ; aucune lecture différente des données dans le code du BFF. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 09:34 UTC | dev | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39577526928) |
| 2026-10-21 01:36 UTC | dev | — | `cf67a34` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39528005161) |
| 2026-10-20 17:55 UTC | staging | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
