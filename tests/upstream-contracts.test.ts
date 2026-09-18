import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { JsonSchema, OpenApiContract } from './support/openapi-contract';
import type { ProjectListItem } from '@mairie360/bff-project-openapi/model';
import { loadOrvalContract, resolveOrvalPackage } from './support/orval-contract';
import {
  calendarBffUrls, calendarBootstrapResponse, calendarEvent, projectBffUrls, projectDetailsResponse, projectListItem,
  projectsPageResponse, sessionResponse, taskItem, userBffUrls,
} from './support/upstream-fixtures';

// Les contrats des BFF amont (et le dernier contrat publié du dashboard) sont reconstruits depuis les
// paquets @mairie360/bff-*-openapi installés : monter la version dans package.json suffit à tester le
// dashboard contre le nouveau contrat.

const PACKAGES = [
  '@mairie360/bff-user-openapi',
  '@mairie360/bff-project-openapi',
  '@mairie360/bff-calendar-openapi',
  '@mairie360/bff-dashboard-openapi',
] as const;

const user = loadOrvalContract('@mairie360/bff-user-openapi');
const project = loadOrvalContract('@mairie360/bff-project-openapi');
const calendar = loadOrvalContract('@mairie360/bff-calendar-openapi');

// Opérations amont réellement consommées par /dashboard/bootstrap (src/routes/dashboard.ts), adressées par les
// helpers d'URL des clients générés.
const CONSUMED = [
  { contract: user, operationId: 'getMe', method: 'get', url: userBffUrls.getGetMeUrl() },
  { contract: project, operationId: 'getProjectsPage', method: 'get', url: projectBffUrls.getGetProjectsPageUrl({ page: 1, limit: 6 }) },
  { contract: project, operationId: 'getProjectsProjectId', method: 'get', url: projectBffUrls.getGetProjectsProjectIdUrl('project-1') },
  { contract: calendar, operationId: 'getCalendarBootstrap', method: 'get', url: calendarBffUrls.getGetCalendarBootstrapUrl() },
] as const;

function responseSchema(contract: OpenApiContract, method: string, url: string, status: number): JsonSchema {
  const match = contract.match(method, new URL(url, 'http://upstream').pathname);
  if (!match) throw new Error(`${method} ${url} absent de ${contract.title}`);
  const { schema } = contract.responseSchema(match, status);
  if (!schema) throw new Error(`Pas de schéma JSON pour ${status} ${method} ${url}`);
  return schema;
}

describe('upstream contracts from the installed @mairie360 OpenAPI packages', () => {
  test.each(PACKAGES)('%s is the version pinned in package.json', (name) => {
    const { devDependencies } = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as { devDependencies: Record<string, string> };
    expect(resolveOrvalPackage(name).version).toBe(devDependencies[name]);
  });

  test.each(CONSUMED)('$contract.title routes $method $url to $operationId', ({ contract, operationId, method, url }) => {
    const { match, errors } = contract.validateRequest(method, new URL(url, 'http://upstream'));
    expect(errors).toEqual([]);
    expect((match?.operation as { operationId?: string } | undefined)?.operationId).toBe(operationId);
  });

  test('the published dashboard contract still describes /dashboard/bootstrap', () => {
    const published = loadOrvalContract('@mairie360/bff-dashboard-openapi');
    expect(published.match('GET', '/dashboard/bootstrap')?.operation).toMatchObject({ operationId: 'getDashboardBootstrap' });
  });
});

describe('upstream fixtures conform to the upstream contracts', () => {
  const task = taskItem();
  const item = projectListItem();
  test.each([
    ['BFF User getMe 200', user, userBffUrls.getGetMeUrl(), sessionResponse()],
    ['BFF Project getProjectsPage 200', project, projectBffUrls.getGetProjectsPageUrl(), projectsPageResponse([item], 12)],
    ['BFF Project getProjectsProjectId 200', project, projectBffUrls.getGetProjectsProjectIdUrl(item.id), projectDetailsResponse(item, [task, taskItem({ id: 'task-2', completed: true })])],
    ['BFF Calendar getCalendarBootstrap 200', calendar, calendarBffUrls.getGetCalendarBootstrapUrl(), calendarBootstrapResponse([calendarEvent(), calendarEvent({ id: 'evt-2' })])],
  ] as const)('%s', (_name, contract, url, body) => {
    expect(contract.validate(responseSchema(contract, 'get', url, 200), body)).toEqual([]);
  });
});

describe('contract validator', () => {
  test('reports missing required properties, wrong enums and wrong types', () => {
    const schema = responseSchema(project, 'get', projectBffUrls.getGetProjectsProjectIdUrl('project-1'), 200);
    const invalid = structuredClone(projectDetailsResponse({ ...projectListItem({ progress: 150 }), status: 'archived' as ProjectListItem['status'] }, [taskItem()])) as {
      project: Record<string, unknown>; taskItems: Array<Record<string, unknown>>;
    };
    delete invalid.project.dueDate;
    invalid.taskItems[0].completed = 'no';
    expect(project.validate(schema, invalid)).toEqual(expect.arrayContaining([
      expect.stringContaining('$.project.dueDate: propriété requise manquante'),
      expect.stringContaining('$.project.status: valeur "archived" hors enum'),
      expect.stringContaining('$.project.progress: 150 > maximum 100'),
      expect.stringContaining('$.taskItems[0].completed: type boolean attendu'),
    ]));
  });

  test('resolves $ref, unions and JSDoc patterns', () => {
    const schema = responseSchema(calendar, 'get', calendarBffUrls.getGetCalendarBootstrapUrl(), 200);
    const errors = calendar.validate(schema, calendarBootstrapResponse([{ ...calendarEvent(), id: true as unknown as number, startTime: '9h' }]));
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('$.events[0].id: type string|number attendu'),
      expect.stringContaining('$.events[0].startTime: "9h" ne respecte pas'),
    ]));
  });

  test('matches literal paths before templated ones and validates parameters', () => {
    expect(project.match('GET', projectBffUrls.getGetProjectsPageUrl())?.template).toBe('/projects-page');
    expect(project.match('GET', projectBffUrls.getGetProjectsProjectIdUrl(encodeURIComponent('a/b')))).toMatchObject({ template: '/projects/{projectId}', pathParams: { projectId: 'a/b' } });
    expect(project.validateRequest('GET', new URL('http://bff/projects-page?page=x')).errors)
      .toEqual([expect.stringContaining('query.page: type number|null attendu')]);
    expect(project.validateRequest('DELETE', new URL(projectBffUrls.getGetProjectsPageUrl(), 'http://bff')).errors)
      .toEqual([expect.stringContaining(`n'existe pas dans le contrat ${project.title}`)]);
  });
});
