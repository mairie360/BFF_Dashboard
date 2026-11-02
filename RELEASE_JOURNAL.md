# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "7d277f055a3a874c197e35c8e6fea24c28653f25", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-02 18:11 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `7d277f0` | 2026-11-02 18:11 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Technique
- Dépendances et images épinglées : images Docker et actions GitHub figées par digest ([#118](https://github.com/mairie360/BFF_Dashboard/pull/118)), Node.js passé en 24.22.1 pour la CI et les Dockerfiles ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113)), `zod` passé en 4.6.7 ([#65](https://github.com/mairie360/BFF_Dashboard/pull/65)).
- Tests et garde-fous : test d'intégration newman sur la vraie stack, qui bloque la promotion staging (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112)) ; test du marqueur RGPD dans les logs (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)) ; workflow de checklist RGPD sur les PR (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) ; workflows de CI et de promotion passés à CICD v4.5.0 ([#112](https://github.com/mairie360/BFF_Dashboard/pull/112)).
- Le conteneur `development.Dockerfile` tourne désormais sous l'utilisateur `node` ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113)).
- Documentation mise à jour en français et en anglais : versions de CI et de Docker, tests d'intégration, version CICD ([#109](https://github.com/mairie360/BFF_Dashboard/pull/109), [#112](https://github.com/mairie360/BFF_Dashboard/pull/112), [#113](https://github.com/mairie360/BFF_Dashboard/pull/113)).

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Dépendances et images épinglées : images Docker et actions GitHub figées par digest ([#118](https://github.com/mairie360/BFF_Dashboard/pull/118)), Node.js passé en 24.22.1 pour la CI et les Dockerfiles ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113)), `zod` passé en 4.6.7 ([#65](https://github.com/mairie360/BFF_Dashboard/pull/65)).
- Tests et garde-fous : test d'intégration newman sur la vraie stack, qui bloque la promotion staging (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112)) ; test du marqueur RGPD dans les logs (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)) ; workflow de checklist RGPD sur les PR (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) ; workflows de CI et de promotion passés à CICD v4.5.0 ([#112](https://github.com/mairie360/BFF_Dashboard/pull/112)).
- Le conteneur `development.Dockerfile` tourne désormais sous l'utilisateur `node` ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113)).
- Documentation mise à jour en français et en anglais : versions de CI et de Docker, tests d'intégration, version CICD ([#109](https://github.com/mairie360/BFF_Dashboard/pull/109), [#112](https://github.com/mairie360/BFF_Dashboard/pull/112), [#113](https://github.com/mairie360/BFF_Dashboard/pull/113)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
