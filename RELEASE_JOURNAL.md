# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "dba4d48b3a27529708cff8e99f7a2b497d9ccdc6", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-10-23 12:15 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `dba4d48` | 2026-10-23 12:15 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Changements de comportement

- Le conteneur de développement (`development.Dockerfile`) s'exécute désormais avec l'utilisateur `node` au lieu de root, et `/app` lui appartient. (sans clé Jira, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))

#### Technique

- Runtime Node.js passé à 24.22.1 (correctifs de sécurité d'octobre 2026) : images `node:24.22.1-alpine` épinglées par digest dans `Dockerfile` et `development.Dockerfile`, et `node_version` des jobs `contracts.yml` et `cicd.yml` mis à jour. ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Tests d'intégration MAIR-262 (`docker-compose-integration.yml`, `integration_test.sh`, collection Postman rejouée par newman, test jest de garde) ; la promotion staging est bloquée en cas d'échec de la porte `integration_tests`. Aucun changement de code applicatif visible dans le diff, qui est tronqué. Pin de `mairie360/CICD` passé de v4.4.3 à v4.5.0 dans `cicd.yml` et les workflows de promotion. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation : référence à `mairie360/CICD` corrigée de v4.4.0 à v4.4.3 dans `docs/en/technical.md` et `docs/fr/technical.md`. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement

- Le conteneur de développement (`development.Dockerfile`) s'exécute désormais avec l'utilisateur `node` au lieu de root, et `/app` lui appartient. (sans clé Jira, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))

#### Technique

- Runtime Node.js passé à 24.22.1 (correctifs de sécurité d'octobre 2026) : images `node:24.22.1-alpine` épinglées par digest dans `Dockerfile` et `development.Dockerfile`, et `node_version` des jobs `contracts.yml` et `cicd.yml` mis à jour. ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Tests d'intégration MAIR-262 (`docker-compose-integration.yml`, `integration_test.sh`, collection Postman rejouée par newman, test jest de garde) ; la promotion staging est bloquée en cas d'échec de la porte `integration_tests`. Aucun changement de code applicatif visible dans le diff, qui est tronqué. Pin de `mairie360/CICD` passé de v4.4.3 à v4.5.0 dans `cicd.yml` et les workflows de promotion. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation : référence à `mairie360/CICD` corrigée de v4.4.0 à v4.4.3 dans `docs/en/technical.md` et `docs/fr/technical.md`. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
