# BFF_Dashboard — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Provide an overview of municipal work using the same sources as the business pages. The BFF aggregates the session, projects, tasks and events into a consistent overview.

## Audience and value

Staff and managers who need quick access to current work and upcoming events.

Business domain: Dashboard.

## Available capabilities

- Personalized welcome using the first name supplied by Core API.
- Overview of six projects, up to eight unfinished tasks and six events within the next 30 days (Europe/Paris calendar).
- Explicit source-availability indicators and a nullable project count.

## Typical workflow

1. Load `/dashboard/bootstrap` with the session.
2. Inspect available projects, tasks and events.
3. Open the relevant business module to continue an action.

## Role within Mairie360

Associated repositories: [Dashboard_Web_Service](https://github.com/mairie360/Dashboard_Web_Service).

This repository contains the BFF server and its contract. Associated web services own the screens; the BFF adapts data and server rules needed by those screens.

## Data and current state

The dashboard reads the APIs, never another BFF (MAIR-525), in one parallel wave: Core API `GET /api/v1/user/me/` supplies the first name (and the roles of a token without the `role` claim), Project API `GET /api/v1/projects/?limit=6` the first projects and their total, each followed at once by its tasks (`GET /api/v1/projects/{id}/tasks/`, at most 6 lists until Project API offers the caller's tasks in one call), and Calendar API `GET /api/v1/calendar` the events of the next 30 days. Tasks follow BFF Project's visibility: Admin, Maire and Responsable see every task of a visible project, other roles only theirs; the role comes from the verified token. The BFF has no database of its own and no business mutations.

## Scope and limitations

The overview is limited and does not replace complete module listings. Unavailable sources are flagged and missing metrics remain null or absent. Reports and population or performance metrics are not supplied by this contract.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
