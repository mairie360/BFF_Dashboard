# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "565e94469db131a6f8600b0e62e9723370474d67", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-01 12:42 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `565e944` | 2026-11-01 12:42 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Technique
- Aucun changement fonctionnel pour les agents ni pour les appelants du BFF : les modifications touchent la CI, les tests, les dépendances et la documentation.
- Test de non-régression RGPD (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)) : un test unitaire vérifie qu'une erreur amont relayée en 502 ne laisse dans stdout, stderr ou `console.*` ni le token, ni la query string, ni le corps de réponse amont. Une stack de test des logs (`gdpr-marker.yaml`, `docker-compose-gdpr-marker.yml`, `gdpr_marker_test.sh`) est ajoutée. Le diff est tronqué, donc le détail de cette stack reste à confirmer. `src/` n'est pas modifié, bffs-lib 2.5.0 étant déjà sur main.
- Checklist RGPD sur chaque PR (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) : workflow `gdpr-pr.yml` qui exécute le check « GDPR checklist », et mise à jour de `zod` de 4.6.5 à 4.6.7 dans `package.json`.
- Runtime Node.js patché (correctifs de sécurité d'octobre 2026, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113)) : images `node:24.22.1-alpine` épinglées par digest dans `Dockerfile` et `development.Dockerfile`, CI `contracts.yml` et `cicd.yml` en Node 24.22.1. Le conteneur de développement tourne désormais sous l'utilisateur `node`.
- Tests d'intégration sur stack réelle (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112)) : `integration_test.sh` avec newman sur `tests/postman/`, porte `integration_tests` de la promotion staging, et `cicd` / `promote-*` passés en `v4.5.0`.
- Documentation mise à jour (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109)) : référence à `mairie360/CICD` v4.4.3 au lieu de v4.4.0 dans `docs/en` et `docs/fr`.

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Aucun changement fonctionnel pour les agents ni pour les appelants du BFF : les modifications touchent la CI, les tests, les dépendances et la documentation.
- Test de non-régression RGPD (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)) : un test unitaire vérifie qu'une erreur amont relayée en 502 ne laisse dans stdout, stderr ou `console.*` ni le token, ni la query string, ni le corps de réponse amont. Une stack de test des logs (`gdpr-marker.yaml`, `docker-compose-gdpr-marker.yml`, `gdpr_marker_test.sh`) est ajoutée. Le diff est tronqué, donc le détail de cette stack reste à confirmer. `src/` n'est pas modifié, bffs-lib 2.5.0 étant déjà sur main.
- Checklist RGPD sur chaque PR (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) : workflow `gdpr-pr.yml` qui exécute le check « GDPR checklist », et mise à jour de `zod` de 4.6.5 à 4.6.7 dans `package.json`.
- Runtime Node.js patché (correctifs de sécurité d'octobre 2026, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113)) : images `node:24.22.1-alpine` épinglées par digest dans `Dockerfile` et `development.Dockerfile`, CI `contracts.yml` et `cicd.yml` en Node 24.22.1. Le conteneur de développement tourne désormais sous l'utilisateur `node`.
- Tests d'intégration sur stack réelle (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112)) : `integration_test.sh` avec newman sur `tests/postman/`, porte `integration_tests` de la promotion staging, et `cicd` / `promote-*` passés en `v4.5.0`.
- Documentation mise à jour (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109)) : référence à `mairie360/CICD` v4.4.3 au lieu de v4.4.0 dans `docs/en` et `docs/fr`.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-01 12:42 UTC | dev | — | `565e944` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41307558602) |
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
