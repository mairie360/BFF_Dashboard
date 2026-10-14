import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { JsonSchema, OpenApiContract } from './support/openapi-contract';
import { loadOrvalContract, resolveOrvalPackage } from './support/orval-contract';
import {
  calendarApiUrls, calendarResult, coreApiUrls, coreMe, eventView, projectApiUrls, projectListItem, projectsResult, taskListItem,
  taskListResult,
} from './support/upstream-fixtures';

// The API contracts (and the last published dashboard contract) are rebuilt from the installed @mairie360/*-openapi
// packages: bumping the version in package.json is enough to test the dashboard against the new contract.

const PACKAGES = [
  '@mairie360/core-api-openapi',
  '@mairie360/project-api-openapi',
  '@mairie360/calendar-api-openapi',
  '@mairie360/bff-dashboard-openapi',
] as const;

const core = loadOrvalContract('@mairie360/core-api-openapi');
const project = loadOrvalContract('@mairie360/project-api-openapi');
const calendar = loadOrvalContract('@mairie360/calendar-api-openapi');
const packageJson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as Record<string, Record<string, string>>;

// API operations actually consumed by /dashboard/bootstrap and /check_apis, addressed through the URL helpers of the
// generated clients.
const CONSUMED = [
  { contract: core, operationId: 'getMe', method: 'get', url: coreApiUrls.getGetMeUrl() },
  { contract: core, operationId: 'health', method: 'get', url: coreApiUrls.getHealthUrl() },
  { contract: project, operationId: 'getProjects', method: 'get', url: projectApiUrls.getGetProjectsUrl({ limit: 6 }) },
  { contract: project, operationId: 'getTasks', method: 'get', url: projectApiUrls.getGetTasksUrl({ limit: 8, assigned_to: 2 }) },
  { contract: project, operationId: 'health', method: 'get', url: projectApiUrls.getHealthUrl() },
  { contract: calendar, operationId: 'getCalendar', method: 'get', url: calendarApiUrls.getGetCalendarUrl({ start: '2026-09-01T00:00:00Z', end: '2026-09-30T00:00:00Z' }) },
  { contract: calendar, operationId: 'health', method: 'get', url: calendarApiUrls.getHealthUrl() },
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
    expect(resolveOrvalPackage(name).version).toBe(packageJson.devDependencies[name]);
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

  test('MAIR-525: the dashboard depends on no other BFF contract (its own published one aside)', () => {
    const all = { ...packageJson.dependencies, ...packageJson.devDependencies };
    expect(Object.keys(all).filter((name) => name.startsWith('@mairie360/bff-') && name !== '@mairie360/bff-dashboard-openapi')).toEqual([]);
  });
});

describe('upstream fixtures conform to the upstream contracts', () => {
  test.each([
    ['Core getMe 200', core, coreApiUrls.getGetMeUrl(), coreMe()],
    ['Project getProjects 200', project, projectApiUrls.getGetProjectsUrl(), projectsResult([projectListItem(1, { tasks_total: 3, tasks_completed: 1 })], 12)],
    ['Project getTasks 200', project, projectApiUrls.getGetTasksUrl(), taskListResult([taskListItem(1), taskListItem(2, { project_id: 3, assigned_to: 2 })], 14)],
    ['Calendar getCalendar 200', calendar, calendarApiUrls.getGetCalendarUrl({ start: '', end: '' }), calendarResult([eventView(1), eventView(2, { location: 'Mairie' })])],
  ] as const)('%s', (_name, contract, url, body) => {
    expect(contract.validate(responseSchema(contract, 'get', url, 200), JSON.parse(JSON.stringify(body)))).toEqual([]);
  });
});

describe('contract validator', () => {
  test('reports missing required properties, wrong enums and wrong types', () => {
    const schema = responseSchema(project, 'get', projectApiUrls.getGetTasksUrl(), 200);
    const invalid = { tasks: [{ ...taskListItem(1), status: 'Done', due_date: 20261001 }], total: 1 } as { tasks: Array<Record<string, unknown>>; total: number };
    delete invalid.tasks[0].title;
    expect(project.validate(schema, invalid)).toEqual(expect.arrayContaining([
      expect.stringContaining('$.tasks[0].title: propriété requise manquante'),
      expect.stringContaining('$.tasks[0].status: valeur "Done" hors enum'),
      expect.stringContaining('$.tasks[0].due_date: type string|null attendu'),
    ]));
  });

  test('validates path parameters and refuses operations absent from the contract', () => {
    expect(project.validateRequest('GET', new URL('http://api/api/v1/projects/abc/tasks/')).errors)
      .toEqual([expect.stringContaining('path.projectId: type number attendu')]);
    expect(calendar.validateRequest('DELETE', new URL('http://api/api/v1/calendar')).errors)
      .toEqual([expect.stringContaining(`n'existe pas dans le contrat ${calendar.title}`)]);
  });
});
