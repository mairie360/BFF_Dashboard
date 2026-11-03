# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "d43fdd778df4652d38176873bcc44c14472e9c8a", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-03 14:02 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `d43fdd7` | 2026-11-03 14:02 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Changements de comportement
- Les sessions du BFF sont vérifiées avec la clé publique Ed25519 de Core (`JWT_PUBLIC_KEY`, EdDSA, `kid`, `iss`, `aud`) au lieu du secret HS256 partagé. Un jeton HS256 reçoit un 401 avant tout appel amont, sauf si `JWT_SECRET` est encore défini (transition). Un appelant qui signait ses jetons avec l'ancien secret doit passer à des jetons signés par Core. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Au démarrage, le BFF refuse de se lancer sans `JWT_PUBLIC_KEY` valide : la variable devient obligatoire dans `.env` et dans les déploiements. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))

#### Technique
- Stacks de test (ZAP, k6, newman, marqueur RGPD) : paire de clés Ed25519 générée à chaque exécution (`stack_secrets.sh`), jetons signés par `integration_test.sh` et `performance_test.sh`, images Core, Project et Calendar épinglées en `dev-<sha>`, nouveaux tests `tests/mair-680-eddsa-session.test.ts` et `token-refusals.test.ts` mis à jour. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Workflows CI et promotion appelant mairie360/CICD v5.2.2, avec `ANTHROPIC_WORKSPACE_ID` transmis, et garde `tests/mair-771-cicd-version.test.ts`. (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- Images Docker et actions GitHub épinglées par digest, mises à jour Renovate ; `zod` passe en 4.6.7. (sans clé Jira, [#118](https://github.com/mairie360/BFF_Dashboard/pull/118) ; [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Workflow `gdpr-pr.yml` qui vérifie la checklist RGPD de chaque PR (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) ; test du marqueur RGPD dans les logs avec `docker-compose-gdpr-marker.yml` et `gdpr_marker_test.sh`, plus un test unitaire de non-fuite (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)).
- Node.js 24.22.1 pour la CI et les images Dockerfile ; `development.Dockerfile` tourne désormais sous l'utilisateur `node`. (sans clé Jira, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Tests d'intégration newman sur le vrai stack (`integration_test.sh`, `docker-compose-integration.yml`, `tests/postman/`), porte `integration_tests` de la promotion staging. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation mise à jour sur les versions CICD (v4.4.3, puis v5.2.2). (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les sessions du BFF sont vérifiées avec la clé publique Ed25519 de Core (`JWT_PUBLIC_KEY`, EdDSA, `kid`, `iss`, `aud`) au lieu du secret HS256 partagé. Un jeton HS256 reçoit un 401 avant tout appel amont, sauf si `JWT_SECRET` est encore défini (transition). Un appelant qui signait ses jetons avec l'ancien secret doit passer à des jetons signés par Core. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Au démarrage, le BFF refuse de se lancer sans `JWT_PUBLIC_KEY` valide : la variable devient obligatoire dans `.env` et dans les déploiements. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))

#### Technique
- Stacks de test (ZAP, k6, newman, marqueur RGPD) : paire de clés Ed25519 générée à chaque exécution (`stack_secrets.sh`), jetons signés par `integration_test.sh` et `performance_test.sh`, images Core, Project et Calendar épinglées en `dev-<sha>`, nouveaux tests `tests/mair-680-eddsa-session.test.ts` et `token-refusals.test.ts` mis à jour. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Workflows CI et promotion appelant mairie360/CICD v5.2.2, avec `ANTHROPIC_WORKSPACE_ID` transmis, et garde `tests/mair-771-cicd-version.test.ts`. (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- Images Docker et actions GitHub épinglées par digest, mises à jour Renovate ; `zod` passe en 4.6.7. (sans clé Jira, [#118](https://github.com/mairie360/BFF_Dashboard/pull/118) ; [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Workflow `gdpr-pr.yml` qui vérifie la checklist RGPD de chaque PR (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) ; test du marqueur RGPD dans les logs avec `docker-compose-gdpr-marker.yml` et `gdpr_marker_test.sh`, plus un test unitaire de non-fuite (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)).
- Node.js 24.22.1 pour la CI et les images Dockerfile ; `development.Dockerfile` tourne désormais sous l'utilisateur `node`. (sans clé Jira, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Tests d'intégration newman sur le vrai stack (`integration_test.sh`, `docker-compose-integration.yml`, `tests/postman/`), porte `integration_tests` de la promotion staging. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation mise à jour sur les versions CICD (v4.4.3, puis v5.2.2). (MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-03 14:02 UTC | dev | — | `d43fdd7` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41648181805) |
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
