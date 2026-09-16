import path from 'node:path';
import request from 'supertest';
import app from '../src/app';
import { ContractMockServer, unreachableUrl } from './support/contract-mock-server';
import { OpenApiContract } from './support/openapi-contract';
import { loadOrvalContract } from './support/orval-contract';
import {
  calendarBootstrapResponse, calendarEvent, projectApiError, projectDetailsResponse, projectListItem,
  projectsPageResponse, sessionResponse, taskItem, type ProjectItem, type TaskItem,
} from './support/upstream-fixtures';

// /dashboard/bootstrap testé contre de vrais serveurs HTTP simulant BFF User, BFF Project et
// BFF Calendar. Leurs contrats sont reconstruits depuis les paquets @mairie360/bff-*-openapi installés
// (versions épinglées dans package.json) : chaque mock refuse les routes et paramètres absents du
// contrat amont et valide ses réponses de succès. Les erreurs ne sont pas typées par orval : toute
// réponse d'erreur simulée est marquée `outOfContract`.

const userBff = new ContractMockServer('USER_BFF', loadOrvalContract('@mairie360/bff-user-openapi'));
const projectBff = new ContractMockServer('PROJECT_BFF', loadOrvalContract('@mairie360/bff-project-openapi'));
const calendarBff = new ContractMockServer('CALENDAR_BFF', loadOrvalContract('@mairie360/bff-calendar-openapi'));
const mocks = [userBff, projectBff, calendarBff];
// Contrat courant du dashboard (statuts documentés) et dernier contrat publié, consommé par les clients.
const dashboardContract = OpenApiContract.load(path.join(__dirname, '..', 'contracts', 'openapi.json'));
const publishedDashboardContract = loadOrvalContract('@mairie360/bff-dashboard-openapi');

const SESSION = 'Bearer contract-session-token';
const DAY_MS = 86_400_000;

beforeAll(async () => { await Promise.all(mocks.map((mock) => mock.start())); });
afterAll(async () => { await Promise.all(mocks.map((mock) => mock.stop())); });
beforeEach(() => {
  for (const mock of mocks) {
    mock.reset();
    process.env[`${mock.service}_URL`] = mock.url;
    delete process.env[`${mock.service}_PORT`];
  }
});
afterEach(() => {
  expect(mocks.flatMap((mock) => mock.violations)).toEqual([]);
});

type Scenario = { projects?: ProjectItem[]; totalProjects?: number; tasks?: Record<string, TaskItem[]>; events?: unknown[] };
function mockUpstreams({ projects = [], totalProjects, tasks = {}, events = [] }: Scenario = {}) {
  userBff.on('get', '/me', { body: sessionResponse() });
  projectBff.on('get', '/projects-page', { body: projectsPageResponse(projects, totalProjects) });
  projectBff.on('get', '/projects/{projectId}', ({ pathParams }) => {
    const project = projects.find((candidate) => candidate.id === pathParams.projectId);
    return project
      ? { body: projectDetailsResponse(project, tasks[project.id] ?? []) }
      : { status: 404, body: projectApiError('NOT_FOUND', 'Projet introuvable'), outOfContract: true };
  });
  calendarBff.on('get', '/calendar/bootstrap', { body: calendarBootstrapResponse(events) });
}

const bootstrap = (authorization: string | null = SESSION) => {
  const call = request(app).get('/dashboard/bootstrap');
  return authorization === null ? call : call.set('Authorization', authorization);
};

function expectDashboardContract(response: request.Response) {
  const match = dashboardContract.match('get', '/dashboard/bootstrap')!;
  const { documented, schema } = dashboardContract.responseSchema(match, response.status);
  expect({ status: response.status, documented }).toEqual({ status: response.status, documented: true });
  if (schema) expect(dashboardContract.validate(schema, response.body)).toEqual([]);
  if (response.status >= 200 && response.status < 300) {
    const published = publishedDashboardContract.responseSchema(publishedDashboardContract.match('get', '/dashboard/bootstrap')!, response.status);
    expect(publishedDashboardContract.validate(published.schema!, response.body)).toEqual([]);
  }
}

const upstreamCalls = () => mocks.reduce((total, mock) => total + mock.requests.length, 0);

describe('GET /dashboard/bootstrap with contract-driven upstream mocks', () => {
  describe('nominal aggregation', () => {
    test('maps contract-valid upstream payloads to a response valid against the dashboard contract', async () => {
      const budget = projectListItem({ id: 'project-42', title: 'Budget participatif', progress: 50, status: 'review', dueDate: '2026-12-01' });
      const open = taskItem({ id: 'task-2', title: 'Validation', dueDate: '2026-11-01', priority: 'high', completed: false });
      const done = taskItem({ id: 'task-3', completed: true });
      mockUpstreams({
        projects: [budget], totalProjects: 17, tasks: { [budget.id]: [open, done] },
        events: [calendarEvent({ id: 9, title: 'Conseil', date: '2026-09-18', startTime: '09:00', location: 'Mairie' })],
      });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      // Les champs amont hors contrat dashboard (labels, permissions, pagination…) sont retirés.
      expect(response.body).toEqual({
        userFirstName: 'Alice',
        projects: [{ id: 'project-42', title: 'Budget participatif', progress: 50, status: 'review', dueDate: '2026-12-01' }],
        tasks: [{ id: 'task-2', title: 'Validation', dueDate: '2026-11-01', priority: 'high', completed: false, projectId: 'project-42' }],
        events: [{ id: 9, title: 'Conseil', date: '2026-09-18', startTime: '09:00', location: 'Mairie' }],
        metrics: { totalProjects: 17 },
        sources: { projects: 'available', tasks: 'available', calendar: 'available' },
      });
      expect(response.headers['cache-control']).toBe('no-store');
    });

    test('calls only operations declared in the upstream contracts and forwards the session token', async () => {
      const project = projectListItem({ id: 'project-1' });
      mockUpstreams({ projects: [project] });

      await bootstrap();

      expect(userBff.requests.map((call) => call.template)).toEqual(['/me']);
      expect(projectBff.requests.map((call) => call.template).sort()).toEqual(['/projects-page', '/projects/{projectId}']);
      expect(calendarBff.requests.map((call) => call.template)).toEqual(['/calendar/bootstrap']);
      for (const call of mocks.flatMap((mock) => mock.requests)) {
        expect(call.method).toBe('GET');
        expect(call.headers.authorization).toBe(SESSION);
        expect(call.headers.accept).toBe('application/json');
      }

      const [page] = projectBff.calls('/projects-page');
      expect(Object.fromEntries(page.url.searchParams)).toEqual({ page: '1', limit: '6' });
      expect(page.undeclaredQuery).toEqual([]);

      const [calendar] = calendarBff.calls('/calendar/bootstrap');
      const from = calendar.url.searchParams.get('from')!;
      const to = calendar.url.searchParams.get('to')!;
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(to) - Date.parse(from)).toBe(30 * DAY_MS);
      // BFF Calendar lit from/to, mais @mairie360/bff-calendar-openapi@0.3.0 ne les déclare pas encore (corrigé
      // dans BFF_Calendar). Dès que le paquet installé les déclare, le mock valide aussi leur format.
      const declared = (calendarBff.contract.match('get', '/calendar/bootstrap')!.operation.parameters ?? []).map((parameter) => parameter.name);
      expect(calendar.undeclaredQuery).toEqual(['from', 'to'].filter((name) => !declared.includes(name)));
    });

    test('requests project details with the identifier encoded as the contract path parameter', async () => {
      const project = projectListItem({ id: 'projet 7/2026' });
      mockUpstreams({ projects: [project], tasks: { [project.id]: [taskItem({ id: 'task-9' })] } });

      const response = await bootstrap();

      const [details] = projectBff.calls('/projects/{projectId}');
      expect(details.url.pathname).toBe('/projects/projet%207%2F2026');
      expect(details.pathParams).toEqual({ projectId: 'projet 7/2026' });
      expect(response.body.tasks).toEqual([expect.objectContaining({ id: 'task-9', projectId: 'projet 7/2026' })]);
    });

    test('keeps unfinished tasks only, in project order, capped at 8 and tagged with their project', async () => {
      const projects = ['p1', 'p2', 'p3'].map((id) => projectListItem({ id }));
      const tasksFor = (projectId: string, count: number) => Array.from({ length: count }, (_, index) =>
        taskItem({ id: `${projectId}-t${index}`, completed: index % 2 === 1 }));
      mockUpstreams({ projects, tasks: { p1: tasksFor('p1', 6), p2: tasksFor('p2', 6), p3: tasksFor('p3', 6) } });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(projectBff.calls('/projects/{projectId}')).toHaveLength(3);
      expect(response.body.tasks.map((task: { id: string; projectId: string }) => `${task.projectId}:${task.id}`)).toEqual([
        'p1:p1-t0', 'p1:p1-t2', 'p1:p1-t4', 'p2:p2-t0', 'p2:p2-t2', 'p2:p2-t4', 'p3:p3-t0', 'p3:p3-t2',
      ]);
      expect(response.body.tasks.every((task: { completed: boolean }) => !task.completed)).toBe(true);
    });

    test('sorts events by date then start time, caps them at 6 and keeps string or numeric ids', async () => {
      const events = [
        calendarEvent({ id: 'late', date: '2026-09-25', startTime: '14:00' }),
        calendarEvent({ id: 1, date: '2026-09-20', startTime: '18:00' }),
        calendarEvent({ id: 'all-day', date: '2026-09-20', startTime: undefined }),
        calendarEvent({ id: 2, date: '2026-09-20', startTime: '08:30' }),
        calendarEvent({ id: 'next-week', date: '2026-10-01', startTime: '10:00' }),
        calendarEvent({ id: 3, date: '2026-09-22', startTime: '09:00' }),
        calendarEvent({ id: 'last', date: '2026-10-10', startTime: '09:00' }),
      ].map((event) => JSON.parse(JSON.stringify(event)) as unknown);
      mockUpstreams({ events });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.events.map((event: { id: string | number }) => event.id)).toEqual(['all-day', 2, 1, 3, 'late', 'next-week']);
      expect(response.body.sources.calendar).toBe('available');
    });

    test('sorts DD-MM-YYYY and YYYY-MM-DD dates chronologically, both accepted by the Calendar contract', async () => {
      mockUpstreams({ events: [
        calendarEvent({ id: 'dec', date: '01-12-2026', startTime: '09:00' }),
        calendarEvent({ id: 'oct', date: '2026-10-15', startTime: '09:00' }),
        calendarEvent({ id: 'sep', date: '30-09-2026', startTime: '09:00' }),
      ] });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expect(response.body.events.map((event: { id: string; date: string }) => [event.id, event.date])).toEqual([
        ['sep', '30-09-2026'], ['oct', '2026-10-15'], ['dec', '01-12-2026'],
      ]);
    });

    test('an empty project page yields available sections without fetching project details', async () => {
      mockUpstreams({ projects: [], totalProjects: 0 });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(projectBff.calls('/projects/{projectId}')).toHaveLength(0);
      expect(response.body).toMatchObject({ projects: [], tasks: [], events: [], metrics: { totalProjects: 0 } });
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'available', calendar: 'available' });
    });
  });

  describe('session and upstream configuration', () => {
    test.each([
      ['no Authorization header', null],
      ['a non Bearer scheme', 'Basic dXNlcjpwYXNz'],
      ['an empty Bearer token', 'Bearer '],
    ])('rejects %s with 401 before calling any upstream', async (_label, authorization) => {
      mockUpstreams();

      const response = await bootstrap(authorization);

      expect(response.status).toBe(401);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'Session invalide.' } });
      expect(upstreamCalls()).toBe(0);
    });

    test('propagates a 401 from BFF User /me without calling the other BFFs', async () => {
      mockUpstreams();
      userBff.on('get', '/me', { status: 401, body: { message: 'Invalid or missing session token' }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(401);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'Le service USER_BFF a répondu 401.' } });
      expect(projectBff.requests).toHaveLength(0);
      expect(calendarBff.requests).toHaveLength(0);
    });

    test.each([
      ['BFF Project', () => projectBff.on('get', '/projects-page', { status: 401, body: { error: { message: 'Session invalide' } }, outOfContract: true }), 'PROJECT_BFF'],
      ['BFF Calendar', () => calendarBff.on('get', '/calendar/bootstrap', { status: 401, body: { code: 'UNAUTHORIZED', message: 'Session invalide.' }, outOfContract: true }), 'CALENDAR_BFF'],
    ])('propagates a 401 from %s even when the other sources succeed', async (_label, override, service) => {
      mockUpstreams({ projects: [projectListItem()] });
      override();

      const response = await bootstrap();

      expect(response.status).toBe(401);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: `Le service ${service} a répondu 401.` } });
    });

    test('returns 502 when BFF User is unreachable', async () => {
      mockUpstreams();
      process.env.USER_BFF_URL = await unreachableUrl();

      const response = await bootstrap();

      expect(response.status).toBe(502);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'Le service USER_BFF est indisponible.' } });
      expect(upstreamCalls()).toBe(0);
    });

    test('returns 502 when BFF User answers a body that is not JSON', async () => {
      mockUpstreams();
      userBff.on('get', '/me', { raw: '<html>proxy error</html>', outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(502);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'La réponse de USER_BFF est invalide.' } });
    });

    test('maps a BFF User server error to 502', async () => {
      mockUpstreams();
      userBff.on('get', '/me', { status: 500, body: { error: 'boom' }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(502);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'Le service USER_BFF a répondu 500.' } });
      expect(projectBff.requests).toHaveLength(0);
    });

    test('returns 503 when BFF User is not configured', async () => {
      mockUpstreams();
      delete process.env.USER_BFF_URL;

      const response = await bootstrap();

      expect(response.status).toBe(503);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'Le service USER_BFF n’est pas configuré.' } });
      expect(upstreamCalls()).toBe(0);
    });

    test('builds upstream URLs from a scheme-less host and the *_PORT variables', async () => {
      mockUpstreams();
      for (const mock of mocks) {
        const url = new URL(mock.url);
        process.env[`${mock.service}_URL`] = url.hostname;
        process.env[`${mock.service}_PORT`] = url.port;
      }

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expect(mocks.map((mock) => mock.requests.length)).toEqual([1, 1, 1]);
    });
  });

  describe('degraded sources', () => {
    test('a 500 from BFF Project /projects-page marks projects and tasks unavailable', async () => {
      mockUpstreams({ events: [calendarEvent()] });
      projectBff.on('get', '/projects-page', { status: 500, body: projectApiError('INTERNAL_ERROR', 'Erreur serveur'), outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body).toMatchObject({ projects: [], tasks: [], metrics: { totalProjects: null } });
      expect(response.body.events).toHaveLength(1);
      expect(response.body.sources).toEqual({ projects: 'unavailable', tasks: 'unavailable', calendar: 'available' });
      expect(projectBff.calls('/projects/{projectId}')).toHaveLength(0);
    });

    test.each([
      [500, { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur interne du serveur.' }],
      [502, { code: 'BAD_GATEWAY', message: 'Le service Calendar est indisponible.' }],
    ])('a %i from BFF Calendar /calendar/bootstrap marks only the calendar unavailable', async (status, body) => {
      const project = projectListItem();
      mockUpstreams({ projects: [project], tasks: { [project.id]: [taskItem()] } });
      calendarBff.on('get', '/calendar/bootstrap', { status, body, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.events).toEqual([]);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'available', calendar: 'unavailable' });
    });

    test('an unreachable BFF Calendar degrades the calendar section instead of failing', async () => {
      mockUpstreams({ projects: [projectListItem()] });
      process.env.CALENDAR_BFF_URL = await unreachableUrl();

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'available', calendar: 'unavailable' });
    });

    test('a 404 on one project detail keeps the other tasks but marks tasks unavailable', async () => {
      const kept = projectListItem({ id: 'kept' });
      const missing = projectListItem({ id: 'missing' });
      mockUpstreams({ projects: [kept, missing], tasks: { kept: [taskItem({ id: 'task-kept' })] } });
      projectBff.on('get', '/projects/{projectId}', ({ pathParams }) => pathParams.projectId === 'kept'
        ? { body: projectDetailsResponse(kept, [taskItem({ id: 'task-kept' })]) }
        : { status: 404, body: projectApiError('NOT_FOUND', 'Projet introuvable'), outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.projects.map((project: { id: string }) => project.id)).toEqual(['kept', 'missing']);
      expect(response.body.tasks).toEqual([expect.objectContaining({ id: 'task-kept', projectId: 'kept' })]);
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'unavailable', calendar: 'available' });
    });

    test('propagates a 401 from a BFF Project detail like the initial calls', async () => {
      const project = projectListItem();
      mockUpstreams({ projects: [project] });
      projectBff.on('get', '/projects/{projectId}', { status: 401, body: { error: { message: 'Session invalide' } }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(401);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { message: 'Le service PROJECT_BFF a répondu 401.' } });
    });

    test('a payload rejected by the dashboard parser degrades the section without inventing data', async () => {
      mockUpstreams();
      projectBff.on('get', '/projects-page', { body: { projects: [{ id: 42 }] }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body).toMatchObject({ projects: [], tasks: [], metrics: { totalProjects: null } });
      expect(response.body.sources).toEqual({ projects: 'unavailable', tasks: 'unavailable', calendar: 'available' });
    });

    test('skips a contract-valid calendar event without id but keeps the calendar available', async () => {
      // CalendarEvent.id est optionnel dans le contrat BFF Calendar, mais le dashboard l'expose comme requis.
      const withoutId: Record<string, unknown> = calendarEvent({ title: 'Sans identifiant' });
      delete withoutId.id;
      mockUpstreams({ events: [calendarEvent({ id: 1 }), withoutId] });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.events.map((event: { id: number }) => event.id)).toEqual([1]);
      expect(response.body.sources.calendar).toBe('available');
    });

    test('a calendar payload whose events field is not a list marks the calendar unavailable', async () => {
      mockUpstreams();
      calendarBff.on('get', '/calendar/bootstrap', { body: { events: 'none' }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.sources.calendar).toBe('unavailable');
    });
  });
});
