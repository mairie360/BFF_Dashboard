# BFF_Dashboard — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Donner une vue d’ensemble du travail municipal à partir des mêmes sources que les pages métier. Le BFF agrège la session, les projets, les tâches et les événements pour construire un aperçu cohérent.

## Public et utilité

Les agents et responsables souhaitant accéder rapidement aux travaux en cours et aux prochains événements.

Domaine fonctionnel: Tableau de bord.

## Fonctions disponibles

- Accueil personnalisé à partir du prénom fourni par Core API.
- Aperçu de six projets, de huit tâches non terminées au maximum et de six événements sur les 30 prochains jours (calendrier Europe/Paris).
- Indicateurs explicites de disponibilité des sources et compteur de projets nullable.

## Parcours type

1. Charger `/dashboard/bootstrap` avec la session.
2. Consulter les projets, tâches et événements disponibles.
3. Ouvrir le module métier concerné pour poursuivre une action.

## Place dans Mairie360

Dépôts associés: [Dashboard_Web_Service](https://github.com/mairie360/Dashboard_Web_Service).

Ce dépôt contient le serveur BFF et son contrat. Les web services associés portent les écrans; le BFF adapte les données et les règles serveur nécessaires à ces écrans.

## Données et état actuel

Le dashboard lit les API, jamais un autre BFF (MAIR-525), en une seule vague parallèle : Core API `GET /api/v1/user/me/` fournit le prénom (et les rôles d’un jeton sans claim `role`), Project API `GET /api/v1/projects/?limit=6` les premiers projets et leur total, Project API `GET /api/v1/tasks/?limit=8` les premières tâches actives de tous les projets visibles, échéance la plus proche d’abord, en un seul appel (MAIR-557), et Calendar API `GET /api/v1/calendar` les événements des 30 prochains jours. Les tâches suivent la visibilité de BFF Project : Admin, Maire et Responsable voient toutes les tâches actives des projets visibles, les autres rôles seulement les leurs (`assigned_to`) ; le rôle vient du jeton vérifié. Le BFF ne dispose pas de base propre ni de mutations métier.

## Périmètre et limites

L’aperçu est limité et ne remplace pas les listes complètes des modules. Une source indisponible est signalée et les statistiques absentes restent nulles ou non affichées. Les rapports et mesures de population ou de performance ne sont pas fournis par ce contrat.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
