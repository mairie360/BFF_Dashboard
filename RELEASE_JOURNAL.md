# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "ffa2b2eaff32b31a2166e02de18d03a4519712ed", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-04 18:18 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `ffa2b2e` | 2026-11-04 18:18 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Changements de comportement
- Les jetons de session sont vérifiés avec la clé publique Ed25519 de Core (`JWT_PUBLIC_KEY`, EdDSA, `kid`, `iss`, `aud`) au lieu du secret HS256 partagé avec les autres services. Un jeton HS256 reçoit désormais un 401 avant tout appel amont ; le HS256 n'est accepté que tant que `JWT_SECRET` est défini (transition). Le démarrage échoue sans `JWT_PUBLIC_KEY` valide. Les appelants doivent présenter des jetons émis par Core. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124), [#125](https://github.com/mairie360/BFF_Dashboard/pull/125))

#### Technique
- Montée de version de la CI : `cicd.yml`, `gdpr-pr.yml`, `promote-staging.yml` et `promote-prod.yml` appellent mairie360/CICD en v5.2.2 (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121)), puis en v5.3.1 (MAIR-497, [#123](https://github.com/mairie360/BFF_Dashboard/pull/123)).
- Simulation d'usage RGPD avant prod (MAIR-497, [#123](https://github.com/mairie360/BFF_Dashboard/pull/123)) : ajout de `gdpr-simulation.yaml`, `docker-compose-gdpr-simulation.yml` et `gdpr_simulation_test.sh` ; la PR dépend de Database#222. Le diff de `gdpr-simulation.yaml` est tronqué, le détail des scénarios n'est pas vérifiable ici.
- Checklist RGPD sur chaque pull request (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) : workflow `gdpr-pr.yml`.
- Test du marqueur de logs RGPD (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)) : `gdpr-marker.yaml`, `docker-compose-gdpr-marker.yml`, `gdpr_marker_test.sh` et un test unitaire sur les logs d'erreur de l'amont (diff tronqué).
- Tests d'intégration sur stack réelle (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112)) : `docker-compose-integration.yml`, `integration_test.sh` et la collection Postman rejouée par newman.
- Stacks de test MAIR-680 : clé Ed25519 par run, contrôle de la paire dans `stack_secrets.sh`, jetons k6 dans un répertoire en mode 700.
- Dépendances et images : `zod` passe de 4.6.5 à 4.6.7 ; images épinglées par digest (Renovate, [#118](https://github.com/mairie360/BFF_Dashboard/pull/118)) ; Node.js 24.22.1 pour la CI et les images Docker (correctif de sécurité, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113)). `development.Dockerfile` s'exécute désormais sous l'utilisateur `node`, sans effet sur la production.
- Documentation mise à jour (CLAUDE.md, docs en/fr) pour les versions CI et l'authentification.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les jetons de session sont vérifiés avec la clé publique Ed25519 de Core (`JWT_PUBLIC_KEY`, EdDSA, `kid`, `iss`, `aud`) au lieu du secret HS256 partagé avec les autres services. Un jeton HS256 reçoit désormais un 401 avant tout appel amont ; le HS256 n'est accepté que tant que `JWT_SECRET` est défini (transition). Le démarrage échoue sans `JWT_PUBLIC_KEY` valide. Les appelants doivent présenter des jetons émis par Core. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124), [#125](https://github.com/mairie360/BFF_Dashboard/pull/125))

#### Technique
- Montée de version de la CI : `cicd.yml`, `gdpr-pr.yml`, `promote-staging.yml` et `promote-prod.yml` appellent mairie360/CICD en v5.2.2 (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121)), puis en v5.3.1 (MAIR-497, [#123](https://github.com/mairie360/BFF_Dashboard/pull/123)).
- Simulation d'usage RGPD avant prod (MAIR-497, [#123](https://github.com/mairie360/BFF_Dashboard/pull/123)) : ajout de `gdpr-simulation.yaml`, `docker-compose-gdpr-simulation.yml` et `gdpr_simulation_test.sh` ; la PR dépend de Database#222. Le diff de `gdpr-simulation.yaml` est tronqué, le détail des scénarios n'est pas vérifiable ici.
- Checklist RGPD sur chaque pull request (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65)) : workflow `gdpr-pr.yml`.
- Test du marqueur de logs RGPD (MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62)) : `gdpr-marker.yaml`, `docker-compose-gdpr-marker.yml`, `gdpr_marker_test.sh` et un test unitaire sur les logs d'erreur de l'amont (diff tronqué).
- Tests d'intégration sur stack réelle (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112)) : `docker-compose-integration.yml`, `integration_test.sh` et la collection Postman rejouée par newman.
- Stacks de test MAIR-680 : clé Ed25519 par run, contrôle de la paire dans `stack_secrets.sh`, jetons k6 dans un répertoire en mode 700.
- Dépendances et images : `zod` passe de 4.6.5 à 4.6.7 ; images épinglées par digest (Renovate, [#118](https://github.com/mairie360/BFF_Dashboard/pull/118)) ; Node.js 24.22.1 pour la CI et les images Docker (correctif de sécurité, [#113](https://github.com/mairie360/BFF_Dashboard/pull/113)). `development.Dockerfile` s'exécute désormais sous l'utilisateur `node`, sans effet sur la production.
- Documentation mise à jour (CLAUDE.md, docs en/fr) pour les versions CI et l'authentification.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
