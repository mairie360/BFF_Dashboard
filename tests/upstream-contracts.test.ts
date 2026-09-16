import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { JsonSchema, OpenApiContract } from './support/openapi-contract';
import { loadOrvalContract, resolveOrvalPackage } from './support/orval-contract';
import {
  calendarBootstrapResponse, calendarEvent, projectDetailsResponse, projectListItem,
  projectsPageResponse, sessionResponse, taskItem,
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

// Opérations amont réellement consommées par /dashboard/bootstrap (src/routes/dashboard.ts).
const CONSUMED = [
  { pkg: '@mairie360/bff-user-openapi', operationId: 'getMe', method: 'get', template: '/me' },
  { pkg: '@mairie360/bff-project-openapi', operationId: 'getProjectsPage', method: 'get', template: '/projects-page' },
  { pkg: '@mairie360/bff-project-openapi', operationId: 'getProjectsProjectId', method: 'get', template: '/projects/{projectId}' },
  { pkg: '@mairie360/bff-calendar-openapi', operationId: 'getCalendarBootstrap', method: 'get', template: '/calendar/bootstrap' },
] as const;

const user = loadOrvalContract('@mairie360/bff-user-openapi');
const project = loadOrvalContract('@mairie360/bff-project-openapi');
const calendar = loadOrvalContract('@mairie360/bff-calendar-openapi');

function responseSchema(contract: OpenApiContract, method: string, pathname: string, status: number): JsonSchema {
  const match = contract.match(method, pathname);
  if (!match) throw new Error(`${method} ${pathname} absent de ${contract.title}`);
  const { schema } = contract.responseSchema(match, status);
  if (!schema) throw new Error(`Pas de schéma JSON pour ${status} ${method} ${pathname}`);
  return schema;
}

describe('upstream contracts from the installed @mairie360 OpenAPI packages', () => {
  test.each(PACKAGES)('%s is the version pinned in package.json', (name) => {
    const { devDependencies } = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as { devDependencies: Record<string, string> };
    expect(resolveOrvalPackage(name).version).toBe(devDependencies[name]);
  });

  test.each(CONSUMED)('$pkg declares $operationId as $method $template', ({ pkg, operationId, method, template }) => {
    const operation = loadOrvalContract(pkg).document.paths[template]?.[method] as { operationId?: string } | undefined;
    expect(operation?.operationId).toBe(operationId);
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
    ['BFF User GET /me 200', user, '/me', sessionResponse()],
    ['BFF Project GET /projects-page 200', project, '/projects-page', projectsPageResponse([item], 12)],
    ['BFF Project GET /projects/{projectId} 200', project, '/projects/project-1', projectDetailsResponse(item, [task, taskItem({ id: 'task-2', completed: true })])],
    ['BFF Calendar GET /calendar/bootstrap 200', calendar, '/calendar/bootstrap', calendarBootstrapResponse([calendarEvent(), calendarEvent({ id: 'evt-2' })])],
  ] as const)('%s', (_name, contract, pathname, body) => {
    expect(contract.validate(responseSchema(contract, 'get', pathname, 200), body)).toEqual([]);
  });
});

describe('contract validator', () => {
  test('reports missing required properties, wrong enums and wrong types', () => {
    const schema = responseSchema(project, 'get', '/projects/project-1', 200);
    const invalid = structuredClone(projectDetailsResponse(projectListItem({ status: 'archived', progress: 150 }), [taskItem()])) as {
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
    const schema = responseSchema(calendar, 'get', '/calendar/bootstrap', 200);
    const errors = calendar.validate(schema, calendarBootstrapResponse([{ ...calendarEvent(), id: true, startTime: '9h' }]));
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('$.events[0].id: type string|number attendu'),
      expect.stringContaining('$.events[0].startTime: "9h" ne respecte pas'),
    ]));
  });

  test('matches literal paths before templated ones and validates parameters', () => {
    expect(project.match('GET', '/projects-page')?.template).toBe('/projects-page');
    expect(project.match('GET', '/projects/a%2Fb')).toMatchObject({ template: '/projects/{projectId}', pathParams: { projectId: 'a/b' } });
    expect(project.validateRequest('GET', new URL('http://bff/projects-page?page=x')).errors)
      .toEqual([expect.stringContaining('query.page: type number|null attendu')]);
    expect(project.validateRequest('DELETE', new URL('http://bff/projects-page')).errors)
      .toEqual([expect.stringContaining("n'existe pas dans le contrat bff_project")]);
  });
});
