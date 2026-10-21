# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "cf67a342022308ba3871e16c4da111fe8e344bfa", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0", "updated": {"dev": "2026-10-21 01:36 UTC", "staging": "2026-10-20 17:55 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `3d74a6a` | 2026-10-20 17:55 UTC |
| dev | — | `cf67a34` | 2026-10-21 01:36 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés
- Les BFFs exportent des traces et des métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT` ; sans cette variable, la télémétrie reste désactivée. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du service, jamais une URL, une query string, un en-tête, un identifiant ni une IP. Variables ajoutées : `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_SDK_DISABLED`. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` : une réponse 429 de Core API est relayée en HTTP 429 avec l'en-tête `Retry-After` (secondes), au lieu d'une 502. Un appelant qui traite la 502 comme une indisponibilité doit aussi gérer la 429. La route est documentée dans `contracts/openapi.json`. Cela suppose la montée de `@mairie360/bffs-lib` de 2.2.0 à 2.5.0. (MAIR-562 / MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI alignés sur les versions prod : bff-dashboard-openapi 2.0.0, core-api-openapi 2.1.0, calendar-api-openapi 1.1.0, project-api-openapi 1.1.0. Fixtures de test mises à jour (`role` requis, statuts `todo` / `review`), images des stacks ZAP et k6 repointées. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- `cicd.yml` suit mairie360/CICD de v4.2.1 à v4.3.2 via Renovate (#97, #100, #101, #102). Le workflow transmet `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` pour l'étape de journal de release, qui réécrit `RELEASE_JOURNAL.md` sur main (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99)).
- Tests ajoutés : cas 429 avec `Retry-After` sur le bootstrap, et contrôle que chaque route déclarant une 502 déclare aussi la 429.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne déclenche plus que la release dev (`release-dev`) : staging ne se déploie plus automatiquement. Staging et prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml` (`gh workflow run ... -R mairie360/BFF_Dashboard`, avec `-f sha=SHA` pour un commit donné), avec approbation des environnements `Staging` / `Prod`. Staging exige une image `dev-<sha>` et un run main vert, puis lance ZAP et k6 ; prod exige `staging-<sha>`. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))

#### Technique
- `cicd.yml` épinglé sur mairie360/CICD v4.4.0. `follow-redirects` passe en 1.16.1 dans le lockfile (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c), ce qui débloque `npm audit` sur main. Renovate regroupe les trois fichiers workflows dans une seule PR. Documentation FR/EN et `CLAUDE.md` mises à jour.

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Les BFFs exportent des traces et des métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT` ; sans cette variable, la télémétrie reste désactivée. Seuls la méthode, le statut, la route paramétrée et l'hôte amont sortent du service, jamais une URL, une query string, un en-tête, un identifiant ni une IP. Variables ajoutées : `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_SDK_DISABLED`. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` : une réponse 429 de Core API est relayée en HTTP 429 avec l'en-tête `Retry-After` (secondes), au lieu d'une 502. Un appelant qui traite la 502 comme une indisponibilité doit aussi gérer la 429. La route est documentée dans `contracts/openapi.json`. Cela suppose la montée de `@mairie360/bffs-lib` de 2.2.0 à 2.5.0. (MAIR-562 / MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI alignés sur les versions prod : bff-dashboard-openapi 2.0.0, core-api-openapi 2.1.0, calendar-api-openapi 1.1.0, project-api-openapi 1.1.0. Fixtures de test mises à jour, images des stacks ZAP et k6 repointées. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- `cicd.yml` suit mairie360/CICD de v4.2.1 à v4.3.2 via Renovate (#97, #100, #101, #102). Le workflow transmet `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` pour l'étape de journal de release (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 01:36 UTC | dev | — | `cf67a34` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39528005161) |
| 2026-10-20 17:55 UTC | staging | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
