# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "56d35d56f817364e821d2bb8350353dd5824bee4", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-11-03 14:16 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `56d35d5` | 2026-11-03 14:16 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Changements de comportement
- Les routes `/dashboard` (dont `GET /dashboard/bootstrap`) n'acceptent plus les jetons HS256 signés avec l'ancien secret partagé : ils reçoivent un 401 avant tout appel upstream. La session est vérifiée avec la clé publique Ed25519 de Core (`JWT_PUBLIC_KEY`, EdDSA sous le `kid` de Core, `iss` et `aud`). HS256 n'est accepté que tant que `JWT_SECRET` est défini (transition). Un jeton EdDSA signé avec une autre clé reçoit aussi un 401. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Démarrage : le BFF refuse de démarrer sans `JWT_PUBLIC_KEY` ou avec une clé mal formée. Un déploiement qui ne fournit que `JWT_SECRET` ne démarre plus ; le `.env` doit désormais contenir `JWT_PUBLIC_KEY`. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Le diff de #124 est tronqué : ce comportement est déduit des tests, de la documentation et de la description de la PR.

#### Technique
- Stacks de test (intégration, sécurité, RGPD, performance) : Core reçoit `JWT_PRIVATE_KEY` ; paire Ed25519 générée à chaque run, `stack_secrets.sh` refuse une paire pré-exportée incohérente ; k6 lit des jetons EdDSA écrits dans un répertoire `mktemp -d` en mode 700 ; images des API de test épinglées sur `dev-*`. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124), [#125](https://github.com/mairie360/BFF_Dashboard/pull/125))
- Dépendances : actions et images Docker épinglées par digest (checkout, setup-node, node, postgres, redis, curl, k6, newman, ZAP), zod passé en 4.6.7, `renovate.json` couvre `gdpr-pr.yml`. ([#118](https://github.com/mairie360/BFF_Dashboard/pull/118), [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- CI : workflows passés sur CICD v5.2.2, avec `ANTHROPIC_WORKSPACE_ID` transmis ; test de garde `tests/mair-771-cicd-version.test.ts`. (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- CI : nouveau workflow `gdpr-pr.yml` qui contrôle la checklist RGPD de chaque PR (check « GDPR checklist »). (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Tests : suite d'intégration newman (`integration_test.sh`, collection Postman) ; test du marqueur RGPD (`gdpr_marker_test.sh`) ; test unitaire qui vérifie qu'une erreur upstream ne journalise ni le jeton, ni la query string, ni le corps. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112) ; MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62))
- Runtime : Node.js 24.22.1 pour Dockerfile, `development.Dockerfile` et le job contrats ; le conteneur de développement tourne désormais sous l'utilisateur `node`. ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Documentation (en/fr) mise à jour pour les versions CICD et Node. ([#109](https://github.com/mairie360/BFF_Dashboard/pull/109), [#113](https://github.com/mairie360/BFF_Dashboard/pull/113), [#121](https://github.com/mairie360/BFF_Dashboard/pull/121), [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les routes `/dashboard` (dont `GET /dashboard/bootstrap`) n'acceptent plus les jetons HS256 signés avec l'ancien secret partagé : ils reçoivent un 401 avant tout appel upstream. La session est vérifiée avec la clé publique Ed25519 de Core (`JWT_PUBLIC_KEY`, EdDSA sous le `kid` de Core, `iss` et `aud`). HS256 n'est accepté que tant que `JWT_SECRET` est défini (transition). Un jeton EdDSA signé avec une autre clé reçoit aussi un 401. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Démarrage : le BFF refuse de démarrer sans `JWT_PUBLIC_KEY` ou avec une clé mal formée. Un déploiement qui ne fournit que `JWT_SECRET` ne démarre plus ; le `.env` doit désormais contenir `JWT_PUBLIC_KEY`. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- Le diff de #124 est tronqué : ce comportement est déduit des tests, de la documentation et de la description de la PR.

#### Technique
- Stacks de test (intégration, sécurité, RGPD, performance) : Core reçoit `JWT_PRIVATE_KEY` ; paire Ed25519 générée à chaque run, `stack_secrets.sh` refuse une paire pré-exportée incohérente ; k6 lit des jetons EdDSA écrits dans un répertoire `mktemp -d` en mode 700 ; images des API de test épinglées sur `dev-*`. (MAIR-680, [#124](https://github.com/mairie360/BFF_Dashboard/pull/124), [#125](https://github.com/mairie360/BFF_Dashboard/pull/125))
- Dépendances : actions et images Docker épinglées par digest (checkout, setup-node, node, postgres, redis, curl, k6, newman, ZAP), zod passé en 4.6.7, `renovate.json` couvre `gdpr-pr.yml`. ([#118](https://github.com/mairie360/BFF_Dashboard/pull/118), [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))
- CI : workflows passés sur CICD v5.2.2, avec `ANTHROPIC_WORKSPACE_ID` transmis ; test de garde `tests/mair-771-cicd-version.test.ts`. (MAIR-771, [#121](https://github.com/mairie360/BFF_Dashboard/pull/121))
- CI : nouveau workflow `gdpr-pr.yml` qui contrôle la checklist RGPD de chaque PR (check « GDPR checklist »). (MAIR-295, [#65](https://github.com/mairie360/BFF_Dashboard/pull/65))
- Tests : suite d'intégration newman (`integration_test.sh`, collection Postman) ; test du marqueur RGPD (`gdpr_marker_test.sh`) ; test unitaire qui vérifie qu'une erreur upstream ne journalise ni le jeton, ni la query string, ni le corps. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112) ; MAIR-290, [#62](https://github.com/mairie360/BFF_Dashboard/pull/62))
- Runtime : Node.js 24.22.1 pour Dockerfile, `development.Dockerfile` et le job contrats ; le conteneur de développement tourne désormais sous l'utilisateur `node`. ([#113](https://github.com/mairie360/BFF_Dashboard/pull/113))
- Documentation (en/fr) mise à jour pour les versions CICD et Node. ([#109](https://github.com/mairie360/BFF_Dashboard/pull/109), [#113](https://github.com/mairie360/BFF_Dashboard/pull/113), [#121](https://github.com/mairie360/BFF_Dashboard/pull/121), [#124](https://github.com/mairie360/BFF_Dashboard/pull/124))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
