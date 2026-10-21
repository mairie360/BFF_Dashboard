# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "d1bb5cf95a3b359f129f65f705fbcdea68bd337e", "updated": {"dev": "2026-10-21 09:34 UTC", "staging": "2026-10-21 09:45 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `d1bb5cf` | 2026-10-21 09:45 UTC |
| dev | — | `d1bb5cf` | 2026-10-21 09:34 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés

- Les BFFs envoient désormais des traces et des métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT`. Sans cette variable, la télémétrie reste désactivée. Seuls la méthode, le statut, la route paramétrée et l'hôte de l'upstream quittent le BFF. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))
- `GET /dashboard/bootstrap` documente une réponse `429` (limite de débit de l'API Core atteinte) avec l'en-tête `Retry-After` en secondes. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Changements de comportement

- `GET /dashboard/bootstrap` répond `429` avec `Retry-After` lorsque l'API Core renvoie une limite de débit, au lieu de `502`. Un appelant qui traite `502` comme « profil indisponible » doit aussi gérer `429`. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique

- Dépendances : `@mairie360/bffs-lib` 2.2.0 → 2.5.0, contrats `@mairie360/*-openapi` alignés sur leurs versions prod, `follow-redirects` 1.16.1 dans le lockfile, images de test (core-api 2.2.0, project-api 1.2.0, calendar-api 1.2.0, database 3.3.0). ([#96](https://github.com/mairie360/BFF_Dashboard/pull/96), [#104](https://github.com/mairie360/BFF_Dashboard/pull/104), [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- CI : mairie360/CICD passe de v4.2.1 à v4.4.3 (Renovate). Un push sur `main` ne lance que `release-dev`, staging et prod passent par les workflows manuels `promote-staging.yml` / `promote-prod.yml` (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104)). Les secrets de release sont transmis au workflow (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99)), et le tag prod est poussé avec la release app (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107)).

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés

- Les BFFs envoient désormais des traces et des métriques HTTP en OTLP vers `OTEL_EXPORTER_OTLP_ENDPOINT`. Sans cette variable, la télémétrie reste désactivée. Seuls la méthode, le statut, la route paramétrée et l'hôte de l'upstream quittent le BFF. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))
- `GET /dashboard/bootstrap` documente une réponse `429` (limite de débit de l'API Core atteinte) avec l'en-tête `Retry-After` en secondes. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Changements de comportement

- `GET /dashboard/bootstrap` répond `429` avec `Retry-After` lorsque l'API Core renvoie une limite de débit, au lieu de `502`. Un appelant qui traite `502` comme « profil indisponible » doit aussi gérer `429`. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique

- Dépendances : `@mairie360/bffs-lib` 2.2.0 → 2.5.0, contrats `@mairie360/*-openapi` alignés sur leurs versions prod, `follow-redirects` 1.16.1 dans le lockfile, images de test (core-api 2.2.0, project-api 1.2.0, calendar-api 1.2.0, database 3.3.0). ([#96](https://github.com/mairie360/BFF_Dashboard/pull/96), [#104](https://github.com/mairie360/BFF_Dashboard/pull/104), [#107](https://github.com/mairie360/BFF_Dashboard/pull/107))
- CI : mairie360/CICD passe de v4.2.1 à v4.4.3 (Renovate). Un push sur `main` ne lance que `release-dev`, staging et prod passent par les workflows manuels `promote-staging.yml` / `promote-prod.yml` (MAIR-494, [#104](https://github.com/mairie360/BFF_Dashboard/pull/104)). Les secrets de release sont transmis au workflow (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99)), et le tag prod est poussé avec la release app (MAIR-612, [#107](https://github.com/mairie360/BFF_Dashboard/pull/107)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 09:45 UTC | staging | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39578143013) |
| 2026-10-21 09:34 UTC | dev | — | `d1bb5cf` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39577526928) |
| 2026-10-21 01:36 UTC | dev | — | `cf67a34` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39528005161) |
| 2026-10-20 17:55 UTC | staging | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
