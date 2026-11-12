# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "ffa2b2eaff32b31a2166e02de18d03a4519712ed", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "ffa2b2eaff32b31a2166e02de18d03a4519712ed", "updated": {"dev": "2026-11-04 18:18 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-11-12 18:58 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `ffa2b2e` | 2026-11-12 18:58 UTC |
| dev | — | `ffa2b2e` | 2026-11-04 18:18 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

- feat: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#123](https://github.com/mairie360/BFF_Dashboard/pull/123))
- fix: MAIR-680 [Audit 23/10] Toutes les APIs et BFFs : remplacer le secret JWT HS256 partagé par 12 services (A1) ([#125](https://github.com/mairie360/BFF_Dashboard/pull/125))
- fix: MAIR-680 [Audit 23/10] Toutes les APIs et BFFs : remplacer le secret JWT HS256 partagé par 12 services (A1) ([#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#121) ([#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- chore(deps): pin dependencies (#118) ([#118](https://github.com/mairie360/BFF_Dashboard/pull/118))
- fix: MAIR-290 Détecter les données personnelles dans les journaux avec un test du marqueur (#62) ([#62](https://github.com/mairie360/BFF_Dashboard/pull/62))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#65) ([#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- fix(security): patch Node.js runtime and toolchain (#113) ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- feat: MAIR-262 Tests d'intégration - Tests de fonctionnement des APIs, tests métier des BFFs et tests de régression (#112) ([#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- docs: MAIR-612 Release prod: align internal versions and deploy (#109) ([#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

- feat: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#123](https://github.com/mairie360/BFF_Dashboard/pull/123))
- fix: MAIR-680 [Audit 23/10] Toutes les APIs et BFFs : remplacer le secret JWT HS256 partagé par 12 services (A1) ([#125](https://github.com/mairie360/BFF_Dashboard/pull/125))
- fix: MAIR-680 [Audit 23/10] Toutes les APIs et BFFs : remplacer le secret JWT HS256 partagé par 12 services (A1) ([#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#121) ([#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- chore(deps): pin dependencies (#118) ([#118](https://github.com/mairie360/BFF_Dashboard/pull/118))
- fix: MAIR-290 Détecter les données personnelles dans les journaux avec un test du marqueur (#62) ([#62](https://github.com/mairie360/BFF_Dashboard/pull/62))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#65) ([#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- fix(security): patch Node.js runtime and toolchain (#113) ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- feat: MAIR-262 Tests d'intégration - Tests de fonctionnement des APIs, tests métier des BFFs et tests de régression (#112) ([#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- docs: MAIR-612 Release prod: align internal versions and deploy (#109) ([#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

> Résumé Claude indisponible pour ce passage : listes brutes des commits.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-12 18:58 UTC | staging | — | `ffa2b2e` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/43284348669) |
| 2026-11-04 18:18 UTC | dev | — | `ffa2b2e` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41883215442) |
| 2026-11-03 14:16 UTC | dev | — | `56d35d5` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/41651645538) |
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
