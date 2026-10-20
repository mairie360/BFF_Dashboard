# Journal des releases — BFF_Dashboard

<!-- release-journal-state {"dev": "3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0", "prod": "67de8ac313e2e45612dca8c39f40a7c4f4b74c11", "prod_tag": "v2.0.0", "staging": "3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0", "updated": {"dev": "2026-10-20 16:36 UTC", "staging": "2026-10-20 17:55 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v2.0.0 | `67de8ac` | — |
| staging | — | `3d74a6a` | 2026-10-20 17:55 UTC |
| dev | — | `3d74a6a` | 2026-10-20 16:36 UTC |

## Ajouté sur main depuis la dernière release prod (v2.0.0)

#### Nouveautés
- Le BFF exporte en OTLP ses traces et ses métriques HTTP vers `OTEL_EXPORTER_OTLP_ENDPOINT` (service `bff-dashboard`). Les traces couvrent le span serveur nommé d'après la route, les handlers et les appels amont, qui portent `traceparent`. Sans cette variable, rien n'est exporté. `OTEL_SERVICE_NAME` et `OTEL_RESOURCE_ATTRIBUTES` permettent de surcharger le nom du service et d'ajouter des attributs, et `OTEL_SDK_DISABLED=true` désactive la télémétrie. Seuls sortent la méthode, le statut, la route paramétrée et l'hôte amont : jamais d'URL, de query string, d'en-tête, d'identifiant ni d'IP. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` répond désormais `429` quand la Core API atteint sa limite de débit, au lieu de `502`. La réponse porte l'en-tête `Retry-After` relayé depuis l'amont et le code d'erreur `TOO_MANY_REQUESTS`. Ce comportement vient de la montée de `@mairie360/bffs-lib` `2.2.0` → `2.5.0`. Le contrat `contracts/openapi.json` déclare ce `429`. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI amont alignés sur leurs versions prod (`@mairie360/bff-dashboard-openapi` 2.0.0, `@mairie360/core-api-openapi` 2.1.0, `@mairie360/project-api-openapi` 1.1.0, `@mairie360/calendar-api-openapi` 1.1.0). Les fixtures de test et les images des stacks perf/sécurité sont mises à jour en conséquence. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- Quatre mises à jour du workflow `mairie360/CICD`, de `v4.2.1` à `v4.3.2` ([#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102)). Les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis à l'étape de journal des releases. (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Le BFF exporte en OTLP ses traces et ses métriques HTTP vers `OTEL_EXPORTER_OTLP_ENDPOINT` (service `bff-dashboard`). Les traces couvrent le span serveur nommé d'après la route, les handlers et les appels amont, qui portent `traceparent`. Sans cette variable, rien n'est exporté. `OTEL_SERVICE_NAME` et `OTEL_RESOURCE_ATTRIBUTES` permettent de surcharger le nom du service et d'ajouter des attributs, et `OTEL_SDK_DISABLED=true` désactive la télémétrie. Seuls sortent la méthode, le statut, la route paramétrée et l'hôte amont : jamais d'URL, de query string, d'en-tête, d'identifiant ni d'IP. (MAIR-504, [#67](https://github.com/mairie360/BFF_Dashboard/pull/67))

#### Changements de comportement
- `GET /dashboard/bootstrap` répond désormais `429` quand la Core API atteint sa limite de débit, au lieu de `502`. La réponse porte l'en-tête `Retry-After` relayé depuis l'amont et le code d'erreur `TOO_MANY_REQUESTS`. Ce comportement vient de la montée de `@mairie360/bffs-lib` `2.2.0` → `2.5.0`. Le contrat `contracts/openapi.json` déclare ce `429`. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))

#### Technique
- Contrats OpenAPI amont alignés sur leurs versions prod (`@mairie360/bff-dashboard-openapi` 2.0.0, `@mairie360/core-api-openapi` 2.1.0, `@mairie360/project-api-openapi` 1.1.0, `@mairie360/calendar-api-openapi` 1.1.0). Les fixtures de test et les images des stacks perf/sécurité sont mises à jour en conséquence. (MAIR-568, [#96](https://github.com/mairie360/BFF_Dashboard/pull/96))
- Quatre mises à jour du workflow `mairie360/CICD`, de `v4.2.1` à `v4.3.2` ([#97](https://github.com/mairie360/BFF_Dashboard/pull/97), [#100](https://github.com/mairie360/BFF_Dashboard/pull/100), [#101](https://github.com/mairie360/BFF_Dashboard/pull/101), [#102](https://github.com/mairie360/BFF_Dashboard/pull/102)). Les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis à l'étape de journal des releases. (MAIR-571, [#99](https://github.com/mairie360/BFF_Dashboard/pull/99))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 17:55 UTC | staging | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-20 16:36 UTC | dev | — | `3d74a6a` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39458451396) |
| 2026-10-19 20:12 UTC | dev | — | `51b0f32` | [run](https://github.com/mairie360/BFF_Dashboard/actions/runs/39316504299) |
<!-- release-journal-history:end -->
