# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "afdfff6391ee1dc9baaab510adaba6cd849dbe6e", "prod": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod_tag": "v2.1.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-10-22 09:08 UTC", "prod": "2026-10-21 10:10 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.1.0 | `d1bb5cf` | 2026-10-21 10:10 UTC |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `afdfff6` | 2026-10-22 09:08 UTC |

## Ajouté sur main depuis la dernière release prod (v2.1.0)

#### Technique
- Aucun changement fonctionnel visible : le diff ne touche ni route, ni réponse, ni règle métier du BFF Dashboard.
- Suite de tests d'intégration sur stack réelle (MAIR-262) : `integration_test.sh` lance `docker-compose-integration.yml` (Core, Project et Calendar API publiées, base seedée, Redis) et rejoue `tests/postman/collection.json` avec newman contre le BFF. Une garde jest vérifie la collection. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Gate `integration_tests` ajouté à la promotion staging, actif une fois la release CICD épinglée. `mairie360/CICD` passe de v4.4.3 à v4.5.0 dans `cicd.yml`, `promote-staging.yml` et `promote-prod.yml`. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation : doc technique FR/EN et `CLAUDE.md` mis à jour, `newman-reports/` ajouté au `.gitignore`. Références CICD corrigées de v4.4.0 à v4.4.3 dans la doc technique. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112) ; MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Aucun changement fonctionnel visible : le diff ne touche ni route, ni réponse, ni règle métier du BFF Dashboard.
- Suite de tests d'intégration sur stack réelle (MAIR-262) : `integration_test.sh` lance `docker-compose-integration.yml` (Core, Project et Calendar API publiées, base seedée, Redis) et rejoue `tests/postman/collection.json` avec newman contre le BFF. Une garde jest vérifie la collection. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Gate `integration_tests` ajouté à la promotion staging, actif une fois la release CICD épinglée. `mairie360/CICD` passe de v4.4.3 à v4.5.0 dans `cicd.yml`, `promote-staging.yml` et `promote-prod.yml`. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112))
- Documentation : doc technique FR/EN et `CLAUDE.md` mis à jour, `newman-reports/` ajouté au `.gitignore`. Références CICD corrigées de v4.4.0 à v4.4.3 dans la doc technique. (MAIR-262, [#112](https://github.com/mairie360/BFF_Dashboard/pull/112) ; MAIR-612, [#109](https://github.com/mairie360/BFF_Dashboard/pull/109))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
