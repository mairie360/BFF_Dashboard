# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "47e22c87aa7176b908f6547d2e98329054d12e97", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-01 12:40 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `47e22c8` | 2026-11-01 12:40 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Changements de comportement
- L'image de développement `development.Dockerfile` s'exécute désormais avec l'utilisateur `node` (`USER node`), et `/app` lui appartient (`chown -R`) : le conteneur de dev ne tourne plus en root. (dba4d48, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))

#### Technique
- Node.js passe en 24.22.1 : images Docker de build et d'exécution épinglées par digest sur `node:24.22.1-alpine`, `contracts.yml` et `cicd.yml` en Node 24.22.1 (correctif de sécurité Node.js). (dba4d48, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Nouveau workflow `gdpr-pr.yml` sur chaque pull request : le check « GDPR checklist » échoue si la section « Personal data » n'est pas renseignée, ou si « Yes » n'est pas accompagné de l'inventaire. Il est pinné sur une branche de mairie360/CICD, à repasser sur le tag de release une fois #148 publiée. (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Mise à jour de `zod` de 4.6.5 à 4.6.7 dans `package.json`, et regex Renovate de `cicd_version` étendue à `gdpr-pr.yml`. (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Tests d'intégration newman sur la vraie stack (`docker-compose-integration.yml`, `integration_test.sh`, `tests/postman/`, test jest de garde) et gate `integration_tests` de `promote-staging.yml`, qui bloque la promotion en cas d'échec. Les workflows `cicd`, `promote-staging` et `promote-prod` passent de mairie360/CICD v4.4.3 à v4.5.0. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation mise à jour : référence à la version CI/CD `v4.4.3` au lieu de `v4.4.0` dans les docs FR et EN, et CLAUDE.md décrit les tests d'intégration. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'image de développement `development.Dockerfile` s'exécute désormais avec l'utilisateur `node` (`USER node`), et `/app` lui appartient (`chown -R`) : le conteneur de dev ne tourne plus en root. (dba4d48, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))

#### Technique
- Node.js passe en 24.22.1 : images Docker de build et d'exécution épinglées par digest sur `node:24.22.1-alpine`, `contracts.yml` et `cicd.yml` en Node 24.22.1 (correctif de sécurité Node.js). (dba4d48, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Nouveau workflow `gdpr-pr.yml` sur chaque pull request : le check « GDPR checklist » échoue si la section « Personal data » n'est pas renseignée, ou si « Yes » n'est pas accompagné de l'inventaire. Il est pinné sur une branche de mairie360/CICD, à repasser sur le tag de release une fois #148 publiée. (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Mise à jour de `zod` de 4.6.5 à 4.6.7 dans `package.json`, et regex Renovate de `cicd_version` étendue à `gdpr-pr.yml`. (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Tests d'intégration newman sur la vraie stack (`docker-compose-integration.yml`, `integration_test.sh`, `tests/postman/`, test jest de garde) et gate `integration_tests` de `promote-staging.yml`, qui bloque la promotion en cas d'échec. Les workflows `cicd`, `promote-staging` et `promote-prod` passent de mairie360/CICD v4.4.3 à v4.5.0. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation mise à jour : référence à la version CI/CD `v4.4.3` au lieu de `v4.4.0` dans les docs FR et EN, et CLAUDE.md décrit les tests d'intégration. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-01 12:40 UTC | dev | — | `47e22c8` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41307304355) |
| 2026-10-23 12:15 UTC | dev | — | `dba4d48` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39951493724) |
| 2026-10-22 09:08 UTC | dev | — | `afdfff6` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39752694080) |
| 2026-10-21 10:10 UTC | prod | v2.1.0 | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39579622609) |
| 2026-10-21 09:49 UTC | dev | — | `7e4a90c` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39579412866) |
| 2026-10-21 09:45 UTC | staging | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39578143013) |
| 2026-10-21 09:34 UTC | dev | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39577526928) |
| 2026-10-21 01:36 UTC | dev | — | `cf67a34` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39528005161) |
| 2026-10-20 17:55 UTC | staging | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
