# Contrat BFF / web service

Web services associés : **Dashboard_Web_Service**. Le document [OpenAPI](contracts/openapi.json), les [types TypeScript](contracts/bff.d.ts), `/openapi.json` et `/swagger.json` proviennent tous de `src/openapi.ts`, qui importe les routes montées par l’application.

## Routes implémentées

Les chemins sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Les chemins `/api/auth/*` restent des adaptateurs de session vers BFF User ; les pages Next.js sont distinctes des routes de données.

| Méthode | Route | Réponse / schéma |
| --- | --- | --- |
| GET | `/health` | 200 OK |
| GET | `/check_apis` | 200 Services disponibles |
| GET | `/dashboard/bootstrap` | 200 DashboardBootstrap |

## Mise à jour et validation

Après une modification des routes ou schémas, exécuter `npm run contracts:generate`, puis synchroniser chaque web service associé avec `npm run contracts:sync`. `npm run contracts:check` échoue si le contrat exporté ou les types générés sont périmés. Soumettre les branches associées dans la même livraison.

Le générateur de types est fixé à `openapi-typescript@7.10.1`. Il est exécuté via npm ; aucun jeton privé ne figure dans les contrats.

## Sources

Configurer `USER_BFF_URL`, `PROJECT_BFF_URL` et `CALENDAR_BFF_URL`. Les projets, tâches et événements gardent les identifiants des BFF métier et leurs permissions. L’aperçu affiche jusqu’à six projets, leurs tâches en attente et six événements sur les 30 prochains jours. Les sources indisponibles sont signalées ; les statistiques non disponibles (citoyens, performance, etc.) ne sont pas inventées. Les destinations front peuvent être configurées avec `NEXT_PUBLIC_PROJECT_FRONT_URL` et `NEXT_PUBLIC_CALENDAR_FRONT_URL`.
