# BFF_Dashboard — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Donner une vue d’ensemble du travail municipal à partir des mêmes sources que les pages métier. Le BFF agrège la session, les projets, les tâches et les événements pour construire un aperçu cohérent.

## Public et utilité

Les agents et responsables souhaitant accéder rapidement aux travaux en cours et aux prochains événements.

Domaine fonctionnel: Tableau de bord.

## Fonctions disponibles

- Accueil personnalisé à partir du prénom fourni par BFF User.
- Aperçu de six projets, de huit tâches non terminées au maximum et de six événements sur les 30 prochains jours.
- Indicateurs explicites de disponibilité des sources et compteur de projets nullable.

## Parcours type

1. Charger `/dashboard/bootstrap` avec la session.
2. Consulter les projets, tâches et événements disponibles.
3. Ouvrir le module métier concerné pour poursuivre une action.

## Place dans Mairie360

Dépôts associés: [Dashboard_Web_Service](https://github.com/mairie360/Dashboard_Web_Service).

Ce dépôt contient le serveur BFF et son contrat. Les web services associés portent les écrans; le BFF adapte les données et les règles serveur nécessaires à ces écrans.

## Données et état actuel

BFF User `/me` fournit l’identité. BFF Project fournit `/projects-page?page=1&limit=6` puis les détails de chaque projet pour les tâches. BFF Calendar fournit le bootstrap de la période. Le BFF ne dispose pas de base propre ni de mutations métier.

## Périmètre et limites

L’aperçu est limité et ne remplace pas les listes complètes des modules. Une source indisponible est signalée et les statistiques absentes restent nulles ou non affichées. Les rapports et mesures de population ou de performance ne sont pas fournis par ce contrat.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
