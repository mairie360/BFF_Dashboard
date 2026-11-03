# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "43cad33e2e8ddda3544fb2c1f4ac8e64a7b80faf", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-03 00:01 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `43cad33` | 2026-11-03 00:01 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Changements de comportement
- Le conteneur de développement (`development.Dockerfile`) tourne désormais avec l'utilisateur `node` (`chown -R node:node /app` puis `USER node`) au lieu de root. Les fichiers écrits par le conteneur dans `/app` doivent appartenir à `node`. (#113, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))

#### Technique
- Les workflows `cicd.yml`, `promote-staging.yml` et `promote-prod.yml` appellent mairie360/CICD en `v5.2.2` (au lieu de `v4.5.0`), et `ANTHROPIC_WORKSPACE_ID` est transmis au workflow réutilisable. Un test jest (`tests/mair-771-cicd-version.test.ts`) vérifie que les workflows pointent la même version, ≥ v4.12.0. (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- Nouveau workflow `gdpr-pr.yml` : un check « GDPR checklist » sur chaque pull request contrôle la section « Personal data » de la description (CICD `v4.12.1`). (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Gate d'intégration newman (`integration_test.sh`, `docker-compose-integration.yml`, `tests/postman/`, `tests/integration-collection.test.ts`), exécutée comme gate `integration_tests` de la promotion staging ; `cicd.yml`, `promote-staging.yml` et `promote-prod.yml` passent en `v4.5.0` à ce commit. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Test du marqueur RGPD dans les journaux (`gdpr_marker_test.sh`, `gdpr-marker.yaml`, `docker-compose-gdpr-marker.yml`) et test unitaire de la règle « une erreur n'est pas journalisée avec sa valeur » ; `src/` n'est pas modifié. Le diff de la PR est tronqué au-delà de `gdpr_marker_test.sh`. (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62))
- Épinglage des dépendances (Renovate) : `actions/checkout` et `actions/setup-node` épinglés par SHA dans `contracts.yml`, images Docker des stacks `docker-compose-*.yml` épinglées par digest (postgres, redis, curl, k6, node, newman, zap), `zod` passe de 4.6.5 à 4.6.7, et `renovate.json` ajuste la règle `cicd_version`. (#118, [#118](https://github.com/mairie360/BFF_Dashboard/pull/118) ; #65)
- Node.js passe en `24.22.1` dans `contracts.yml`, `node_version` de `cicd.yml`, et les `Dockerfile` / `development.Dockerfile` utilisent `node:24.22.1-alpine` épinglé par digest, avec `CLAUDE.md` mis à jour. (#113, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Documentation FR/EN mise à jour : `cicd.yml` référence CICD `v4.4.3` puis le test d'intégration et la version `v5.2.2`. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Le conteneur de développement (`development.Dockerfile`) tourne désormais avec l'utilisateur `node` (`chown -R node:node /app` puis `USER node`) au lieu de root. Les fichiers écrits par le conteneur dans `/app` doivent appartenir à `node`. (#113, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))

#### Technique
- Les workflows `cicd.yml`, `promote-staging.yml` et `promote-prod.yml` appellent mairie360/CICD en `v5.2.2` (au lieu de `v4.5.0`), et `ANTHROPIC_WORKSPACE_ID` est transmis au workflow réutilisable. Un test jest (`tests/mair-771-cicd-version.test.ts`) vérifie que les workflows pointent la même version, ≥ v4.12.0. (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- Nouveau workflow `gdpr-pr.yml` : un check « GDPR checklist » sur chaque pull request contrôle la section « Personal data » de la description (CICD `v4.12.1`). (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Gate d'intégration newman (`integration_test.sh`, `docker-compose-integration.yml`, `tests/postman/`, `tests/integration-collection.test.ts`), exécutée comme gate `integration_tests` de la promotion staging ; `cicd.yml`, `promote-staging.yml` et `promote-prod.yml` passent en `v4.5.0` à ce commit. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Test du marqueur RGPD dans les journaux (`gdpr_marker_test.sh`, `gdpr-marker.yaml`, `docker-compose-gdpr-marker.yml`) et test unitaire de la règle « une erreur n'est pas journalisée avec sa valeur » ; `src/` n'est pas modifié. Le diff de la PR est tronqué au-delà de `gdpr_marker_test.sh`. (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62))
- Épinglage des dépendances (Renovate) : `actions/checkout` et `actions/setup-node` épinglés par SHA dans `contracts.yml`, images Docker des stacks `docker-compose-*.yml` épinglées par digest (postgres, redis, curl, k6, node, newman, zap), `zod` passe de 4.6.5 à 4.6.7, et `renovate.json` ajuste la règle `cicd_version`. (#118, [#118](https://github.com/mairie360/BFF_Dashboard/pull/118) ; #65)
- Node.js passe en `24.22.1` dans `contracts.yml`, `node_version` de `cicd.yml`, et les `Dockerfile` / `development.Dockerfile` utilisent `node:24.22.1-alpine` épinglé par digest, avec `CLAUDE.md` mis à jour. (#113, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Documentation FR/EN mise à jour : `cicd.yml` référence CICD `v4.4.3` puis le test d'intégration et la version `v5.2.2`. (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-03 00:01 UTC | dev | — | `43cad33` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41548518601) |
| 2026-11-02 18:11 UTC | dev | — | `7d277f0` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41495849560) |
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
