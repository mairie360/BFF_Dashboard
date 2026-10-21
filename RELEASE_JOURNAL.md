# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "7e4a90cb9ff0d347288895bf85ca877ad8964b98", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-10-21 09:49 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `7e4a90c` | 2026-10-21 09:49 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés
- Le BFF exporte ses traces et ses métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT`. Sans cette variable, la télémétrie reste désactivée. Seuls la méthode, le statut, la route paramétrée et l'hôte de l'upstream sortent du service : aucune URL, query string, en-tête, identifiant ni IP. Les variables `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES` et `OTEL_SDK_DISABLED` sont documentées. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` répond `429` avec l'en-tête `Retry-After` lorsque la Core API renvoie une limitation de débit, au lieu d'un `502`. La route déclare désormais ce `429` dans `contracts/openapi.json`. Les appelants qui traitaient le `502` comme « profil indisponible » doivent aussi gérer le `429`. Le passage de `@mairie360/bffs-lib` à `2.5.0` rend ce comportement possible. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Le workflow `cicd.yml` ne se déclenche sur `push` que pour `main` ; les tags poussés par l'app de release ne relancent plus le pipeline. (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- Les stacks Docker de sécurité et de performance utilisent les versions prod des images : `core-api` 2.2.0, `project-api` 1.2.0, `calendar-api` 1.2.0, base et Liquibase 3.3.0. (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- Les dépendances `@mairie360/*-openapi` passent aux versions prod (`core-api` 2.2.0, `project-api` 1.2.0, `calendar-api` 1.2.0). Les fixtures de tests sont alignées sur les contrats prod. (MAIR-612 [#107](https://github.com/mairie360/BFF_Dashboard/pull/107), MAIR-568 [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- Promotion manuelle vers staging et prod via `promote-staging.yml` et `promote-prod.yml` ; un push sur `main` s'arrête après `release-dev`. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))
- `follow-redirects` passe en 1.16.1 dans le lockfile pour corriger deux advisories `npm audit` (high). (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))
- Le workflow transmet `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` au CICD pour le journal des releases. (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))
- `mairie360/CICD` passe de v4.2.1 à v4.4.3 au fil de quatre PR Renovate et de MAIR-612 ; `renovate.json` couvre les trois workflows. (PR [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102))
- Tests et documentation : la télémétrie n'exporte rien en test, un test vérifie que chaque route déclarant un `502` déclare aussi le `429`, et la documentation FR/EN est mise à jour.

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Documentation seulement : `docs/en/technical.md` et `docs/fr/technical.md` référencent `mairie360/CICD` en v4.4.3 au lieu de v4.4.0. Aucun effet fonctionnel. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Le BFF exporte ses traces et ses métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT`. Sans cette variable, la télémétrie reste désactivée. Seuls la méthode, le statut, la route paramétrée et l'hôte de l'upstream sortent du service : aucune URL, query string, en-tête, identifiant ni IP. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` répond `429` avec l'en-tête `Retry-After` lorsque la Core API renvoie une limitation de débit, au lieu d'un `502`. Les appelants qui traitaient le `502` comme « profil indisponible » doivent aussi gérer le `429`. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Le workflow `cicd.yml` ne se déclenche sur `push` que pour `main` ; les tags poussés par l'app de release ne relancent plus le pipeline. (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- Les stacks Docker de sécurité et de performance utilisent les versions prod des images (`core-api` 2.2.0, `project-api` 1.2.0, `calendar-api` 1.2.0, base et Liquibase 3.3.0). (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- Les contrats `@mairie360/*-openapi` passent aux versions prod ; `bffs-lib` passe à `2.5.0`. (MAIR-612 [#107](https://github.com/mairie360/BFF_Dashboard/pull/107), MAIR-568 [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- Promotion manuelle vers staging et prod via `promote-staging.yml` et `promote-prod.yml` ; un push sur `main` s'arrête après `release-dev`. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))
- `follow-redirects` passe en 1.16.1 dans le lockfile pour corriger deux advisories `npm audit`. (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104))
- Le workflow transmet `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` au CICD pour le journal des releases. (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))
- `mairie360/CICD` passe de v4.2.1 à v4.4.3 au fil des PR Renovate et de MAIR-612 ; `renovate.json` couvre les trois workflows. (PR [#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102))
- Tests et documentation : un test vérifie que chaque route déclarant un `502` déclare aussi le `429`, et la documentation FR/EN est mise à jour.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 09:49 UTC | dev | — | `7e4a90c` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39579412866) |
| 2026-10-21 09:45 UTC | staging | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39578143013) |
| 2026-10-21 09:34 UTC | dev | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39577526928) |
| 2026-10-21 01:36 UTC | dev | — | `cf67a34` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39528005161) |
| 2026-10-20 17:55 UTC | staging | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
