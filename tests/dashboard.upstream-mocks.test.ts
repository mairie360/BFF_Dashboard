import path from 'node:path';
import request from 'supertest';
import app from '../src/app';
import { ContractMockServer, unreachableUrl, type MockReply } from './support/contract-mock-server';
import { OpenApiContract } from './support/openapi-contract';
import { loadOrvalContract } from './support/orval-contract';
import type { EventView } from '@mairie360/calendar-api-openapi/model';
import type { ProjectListItemView, TaskListItemView } from '@mairie360/project-api-openapi/model';
import {
  calendarApiUrls, calendarResult, coreApiUrls, coreMe, eventView, projectApiUrls, projectListItem, projectsResult, sessionToken,
  taskListItem, taskListResult,
} from './support/upstream-fixtures';

// /dashboard/bootstrap tested against real HTTP servers simulating Core API, Project API and Calendar API: the
// dashboard reads the APIs, never another BFF (MAIR-525). Their contracts are rebuilt from the installed
// @mairie360/*-api-openapi packages (versions pinned in package.json): each mock refuses the routes and parameters
// absent from the upstream contract and validates its success answers. Errors are not typed by orval: every
// simulated error answer is marked `outOfContract`. Simulated bodies are typed by the generated models and the
// expected paths come from the URL helpers of the generated clients.

const coreApi = new ContractMockServer('CORE_API', loadOrvalContract('@mairie360/core-api-openapi'));
const projectApi = new ContractMockServer('PROJECT_API', loadOrvalContract('@mairie360/project-api-openapi'));
const calendarApi = new ContractMockServer('CALENDAR_API', loadOrvalContract('@mairie360/calendar-api-openapi'));
const mocks = [coreApi, projectApi, calendarApi];
// Templates of the upstream contracts (mock keys); the concrete expected paths come from the URL helpers.
const CORE = { me: '/api/v1/user/me/' } as const;
const PROJECT = { projects: '/api/v1/projects/', tasks: '/api/v1/tasks/' } as const;
const CALENDAR = { calendar: '/api/v1/calendar' } as const;
// Current dashboard contract (documented statuses) and last published contract, used by the clients.
const dashboardContract = OpenApiContract.load(path.join(__dirname, '..', 'contracts', 'openapi.json'));
const publishedDashboardContract = loadOrvalContract('@mairie360/bff-dashboard-openapi');

// Session of user 2 signed with the test secret: verified by the BFF, forwarded unchanged upstream. It predates the
// `role` claim, so the roles come from Core's profile (read anyway for the first name).
const TOKEN = sessionToken(2);
const SESSION = `Bearer ${TOKEN}`;
const withClaims = (claims: object) => `Bearer ${sessionToken(2, undefined, undefined, claims)}`;
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

type Scenario = {
  projects?: ProjectListItemView[]; totalProjects?: number; tasks?: TaskListItemView[]; events?: EventView[];
  roles?: string[]; delayMs?: number;
};
function mockUpstreams({ projects = [], totalProjects, tasks = [], events = [], roles = ['User'], delayMs }: Scenario = {}) {
  coreApi.on('get', CORE.me, { body: coreMe({ roles, role: roles[0] ?? '' }), delayMs });
  projectApi.on('get', PROJECT.projects, { body: projectsResult(projects, totalProjects), delayMs });
  // Like Project API: the active tasks of every visible project (`tasks` holds those), `assigned_to` and `limit`.
  projectApi.on('get', PROJECT.tasks, ({ url }) => {
    const assignedTo = url.searchParams.get('assigned_to');
    const matching = tasks.filter((task) => assignedTo === null || task.assigned_to === Number(assignedTo));
    return { body: taskListResult(matching.slice(0, Number(url.searchParams.get('limit') ?? 100)), matching.length), delayMs };
  });
  calendarApi.on('get', CALENDAR.calendar, { body: calendarResult(events), delayMs });
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
const textError = (status: number, raw = 'upstream detail'): MockReply => ({ status, raw, contentType: 'text/plain', outOfContract: true });

describe('GET /dashboard/bootstrap with contract-driven API mocks', () => {
  describe('nominal aggregation', () => {
    test('maps contract-valid API payloads to a response valid against the dashboard contract', async () => {
      const budget = projectListItem(42, { name: 'Budget participatif', status: 'Suspended', tasks_total: 4, tasks_completed: 2, due_date: '2026-12-01T00:00:00Z' });
      mockUpstreams({
        projects: [budget], totalProjects: 17,
        tasks: [taskListItem(2, { project_id: 7, project_name: 'Voirie', title: 'Validation', due_date: '2026-11-01T00:00:00Z', priority: 'Urgent', assigned_to: 2 })],
        // 07:00Z is 09:00 in Paris (CEST).
        events: [eventView(9, { name: 'Conseil', start: '2026-09-18T07:00:00Z', location: 'Mairie' })],
      });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body).toEqual({
        userFirstName: 'Alice',
        projects: [{ id: 'project-42', title: 'Budget participatif', progress: 50, status: 'review', dueDate: '2026-12-01T00:00:00Z' }],
        // A task of a project beyond the shown ones keeps its own project.
        tasks: [{ id: 'task-2', title: 'Validation', dueDate: '2026-11-01T00:00:00Z', priority: 'high', completed: false, projectId: 'project-7' }],
        events: [{ id: 9, title: 'Conseil', date: '2026-09-18', startTime: '09:00', location: 'Mairie' }],
        metrics: { totalProjects: 17 },
        sources: { projects: 'available', tasks: 'available', calendar: 'available' },
      });
      expect(response.headers['cache-control']).toBe('no-store');
    });

    test('MAIR-525: calls only API operations, never another BFF, and forwards the session token', async () => {
      const project = projectListItem(1);
      mockUpstreams({ projects: [project] });

      await bootstrap();

      expect(coreApi.requests.map((call) => call.url.pathname)).toEqual([coreApiUrls.getGetMeUrl()]);
      expect(projectApi.requests.map((call) => call.url.pathname).sort())
        .toEqual([projectApiUrls.getGetProjectsUrl(), projectApiUrls.getGetTasksUrl()].sort());
      expect(calendarApi.requests.map((call) => call.url.pathname)).toEqual([calendarApiUrls.getGetCalendarUrl({ start: '', end: '' }).split('?')[0]]);
      for (const call of mocks.flatMap((mock) => mock.requests)) {
        expect(call.method).toBe('GET');
        expect(call.headers.authorization).toBe(SESSION);
        expect(call.headers.accept).toBe('application/json');
        expect(call.undeclaredQuery).toEqual([]);
      }

      const [page] = projectApi.calls(PROJECT.projects);
      expect(page.url.searchParams.get('limit')).toBe('6');
      // MAIR-557: the caller's first 8 active tasks; no status filter, so Project API leaves the completed ones out.
      const [tasks] = projectApi.calls(PROJECT.tasks);
      expect(Object.fromEntries(tasks.url.searchParams)).toEqual({ limit: '8', assigned_to: '2' });
      const [calendar] = calendarApi.calls(CALENDAR.calendar);
      const start = Date.parse(calendar.url.searchParams.get('start')!);
      const end = Date.parse(calendar.url.searchParams.get('end')!);
      // From 00:00:00 of today to 23:59:59 of today + 30, Paris time (a DST change shifts it by one hour).
      expect(Math.abs(end - start - (31 * DAY_MS - 1000))).toBeLessThanOrEqual(3_600_000);
    });

    test('MAIR-525/MAIR-557: the profile, the projects, the tasks and the events start in one parallel wave', async () => {
      mockUpstreams({ projects: [projectListItem(1)] });
      // Each answer takes 80 ms: calls chained one after the other would arrive at least 80 ms apart.
      const arrivals: number[] = [];
      const slow = (body: unknown): MockReply => { arrivals.push(Date.now()); return { body, delayMs: 80 }; };
      coreApi.on('get', CORE.me, () => slow(coreMe()));
      projectApi.on('get', PROJECT.projects, () => slow(projectsResult([projectListItem(1)])));
      projectApi.on('get', PROJECT.tasks, () => slow(taskListResult([])));
      calendarApi.on('get', CALENDAR.calendar, () => slow(calendarResult([])));

      // The role is in the token (MAIR-529): the tasks do not wait for Core's profile.
      const response = await bootstrap(withClaims({ role: 'User' }));

      expect(response.status).toBe(200);
      expect(arrivals).toHaveLength(4);
      expect(Math.max(...arrivals) - Math.min(...arrivals)).toBeLessThan(60);
    });

    test('MAIR-557: a token without the role claim reads the tasks once Core gave the roles', async () => {
      mockUpstreams({ roles: ['Responsable'], tasks: [taskListItem(1, { assigned_to: 3 })] });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      const [tasks] = projectApi.calls(PROJECT.tasks);
      expect(tasks.url.searchParams.has('assigned_to')).toBe(false);
      expect(response.body.tasks.map((task: { id: string }) => task.id)).toEqual(['task-1']);
    });

    test('MAIR-557: the number of API calls stays the same for 1, 6 and 100 visible projects', async () => {
      const count = async (visible: number) => {
        for (const mock of mocks) mock.reset();
        // Project API serves the first 6 (limit) and counts every visible project; each has 3 tasks of the caller.
        mockUpstreams({
          projects: Array.from({ length: Math.min(visible, 6) }, (_, i) => projectListItem(i + 1)), totalProjects: visible,
          tasks: Array.from({ length: visible * 3 }, (_, i) => taskListItem(i + 1, { project_id: Math.floor(i / 3) + 1, assigned_to: 2 })),
        });
        const response = await bootstrap();
        expect(response.body.metrics.totalProjects).toBe(visible);
        expect(response.body.tasks).toHaveLength(Math.min(visible * 3, 8));
        return upstreamCalls();
      };

      // Profile, projects, tasks and events: one call each, whatever the number of projects.
      expect(await count(1)).toBe(4);
      expect(await count(6)).toBe(4);
      expect(await count(100)).toBe(4);
    });

    test.each([
      // 00:30 in Paris (CEST, UTC+2) is still 22:30 the day before in UTC.
      ['summer time', '2026-03-31T22:30:00Z', '2026-03-31T22:00:00Z', '2026-05-01T21:59:59Z'],
      // 00:15 in Paris (CET, UTC+1) is still 23:15 the day before in UTC, across a year boundary.
      ['winter time', '2026-12-31T23:15:00Z', '2026-12-31T23:00:00Z', '2027-01-31T22:59:59Z'],
    ])('asks Calendar API for the next 30 days of the Europe/Paris calendar (%s)', async (_label, now, start, end) => {
      // Only Date is faked: the HTTP servers and supertest keep the real timers.
      jest.useFakeTimers({
        now: new Date(now),
        doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'hrtime', 'performance'],
      });
      try {
        mockUpstreams();

        const response = await bootstrap();

        expect(response.status).toBe(200);
        const [calendar] = calendarApi.calls(CALENDAR.calendar);
        expect({ start: calendar.url.searchParams.get('start'), end: calendar.url.searchParams.get('end') }).toEqual({ start, end });
      } finally {
        jest.useRealTimers();
      }
    });

    test('MAIR-557: shows the tasks in the order of Project API (soonest due first), capped at 8, tagged with their project', async () => {
      const tasks = Array.from({ length: 10 }, (_, index) =>
        taskListItem(index + 1, { project_id: (index % 3) + 1, assigned_to: 2, due_date: index === 0 ? null : `2026-10-${String(index + 10)}T00:00:00Z` }));
      mockUpstreams({ projects: [projectListItem(1)], tasks });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(projectApi.calls(PROJECT.tasks)).toHaveLength(1);
      expect(response.body.tasks.map((task: { id: string; projectId: string }) => `${task.projectId}:${task.id}`)).toEqual([
        'project-1:task-1', 'project-2:task-2', 'project-3:task-3', 'project-1:task-4', 'project-2:task-5', 'project-3:task-6',
        'project-1:task-7', 'project-2:task-8',
      ]);
    });

    test.each([
      ['an agent (roles from Core)', SESSION, ['User'], ['task-1']],
      ['a Responsable (roles from Core)', SESSION, ['Responsable'], ['task-1', 'task-2', 'task-3']],
      ['an admin (role in the token, MAIR-529)', withClaims({ role: 'admin' }), ['User'], ['task-1', 'task-2', 'task-3']],
      ['an agent (role in the token) whom Core calls admin', withClaims({ role: 'User' }), ['admin'], ['task-1']],
      ['an agent (empty role in the token, roles from Core)', withClaims({ role: '' }), ['User'], ['task-1']],
      ['an agent whose token only has a `roles` claim (ignored)', withClaims({ roles: ['admin'] }), ['User'], ['task-1']],
    ])('shows %s the tasks BFF Project would show them', async (_label, authorization, coreRoles, expected) => {
      const project = projectListItem(1);
      mockUpstreams({
        projects: [project], roles: coreRoles,
        tasks: [taskListItem(1, { assigned_to: 2 }), taskListItem(2, { assigned_to: 3 }), taskListItem(3)],
      });

      const response = await bootstrap(authorization);

      expect(response.status).toBe(200);
      expect(response.body.tasks.map((task: { id: string }) => task.id)).toEqual(expected);
    });

    test('sorts events by Paris date then start time, caps them at 6', async () => {
      const events = [
        eventView(1, { start: '2026-09-25T12:00:00Z' }),
        eventView(2, { start: '2026-09-20T16:00:00Z' }),
        eventView(3, { start: '2026-09-19T22:30:00Z' }), // 00:30 on Sept 20 in Paris
        eventView(4, { start: '2026-09-20T06:30:00Z' }),
        eventView(5, { start: '2026-10-01T08:00:00Z' }),
        eventView(6, { start: '2026-09-22T07:00:00Z' }),
        eventView(7, { start: '2026-10-10T07:00:00Z' }),
      ];
      mockUpstreams({ events });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.events.map((event: { id: number }) => event.id)).toEqual([3, 4, 2, 6, 1, 5]);
      expect(response.body.events[0]).toMatchObject({ date: '2026-09-20', startTime: '00:30' });
    });

    test('an empty project page and no task yield available empty sections', async () => {
      mockUpstreams({ projects: [], totalProjects: 0 });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
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
      expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Invalid session.', details: [] } });
      expect(upstreamCalls()).toBe(0);
    });

    test.each([
      ['an accessToken cookie', { Cookie: `accessToken=${TOKEN}` }],
      ['a session cookie', { Cookie: `session=${TOKEN}` }],
      ['an x-session-token header', { 'x-session-token': TOKEN }],
    ])('ignores %s: only the Bearer header is a session (401, no upstream call, not cached)', async (_label, headers) => {
      mockUpstreams();

      const response = await request(app).get('/dashboard/bootstrap').set(headers);

      expect(response.status).toBe(401);
      expectDashboardContract(response);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(upstreamCalls()).toBe(0);
    });

    test('refuses an unknown /dashboard path without a session with 401 before routing', async () => {
      const response = await request(app).get('/dashboard/unknown');

      expect(response.status).toBe(401);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(upstreamCalls()).toBe(0);
    });

    test('forwards the token normalised to `Bearer <token>` whatever the scheme case and spacing', async () => {
      mockUpstreams();

      const response = await bootstrap(`bearer   ${TOKEN}`);

      expect(response.status).toBe(200);
      const forwarded = mocks.flatMap((mock) => mock.requests).map((call) => call.headers.authorization);
      expect(forwarded.length).toBeGreaterThan(0);
      expect(new Set(forwarded)).toEqual(new Set([SESSION]));
    });

    test.each([
      ['Core API', () => coreApi.on('get', CORE.me, textError(401, 'Jeton expiré'))],
      ['Project API', () => projectApi.on('get', PROJECT.projects, textError(401, 'Jeton expiré'))],
      ['the Project API task list', () => projectApi.on('get', PROJECT.tasks, textError(401, 'Jeton expiré'))],
      ['Calendar API', () => calendarApi.on('get', CALENDAR.calendar, textError(401, 'Jeton expiré'))],
    ])('propagates a 401 from %s even when the other sources succeed', async (_label, override) => {
      mockUpstreams({ projects: [projectListItem(1)] });
      override();

      const response = await bootstrap();

      expect(response.status).toBe(401);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', details: [] } });
    });

    test('returns 502 when Core API is unreachable', async () => {
      mockUpstreams();
      process.env.CORE_API_URL = await unreachableUrl();

      const response = await bootstrap();

      expect(response.status).toBe(502);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { code: 'BAD_GATEWAY', message: 'The CORE_API service is unavailable.', details: [] } });
    });

    test.each<[string, MockReply, string]>([
      ['a body that is not JSON', { raw: '<html>proxy error</html>', outOfContract: true }, 'The CORE_API answer is invalid.'],
      ['a profile without first name', { body: { unexpected: true }, outOfContract: true }, 'The CORE_API answer is invalid.'],
      ['a server error', textError(500, 'boom'), 'Upstream service error'],
      ['an undeclared 403', textError(403, 'Upstream secret detail'), 'Upstream service error'],
      ['an undeclared 404', textError(404, 'Upstream secret detail'), 'Upstream service error'],
    ])('maps %s from Core /user/me to 502 without relaying its body', async (_label, reply, message) => {
      mockUpstreams();
      coreApi.on('get', CORE.me, reply);

      const response = await bootstrap();

      expect(response.status).toBe(502);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { code: 'BAD_GATEWAY', message, details: [] } });
      expect(JSON.stringify(response.body)).not.toMatch(/boom|secret/);
    });

    test('returns 503 when Core API is not configured', async () => {
      mockUpstreams();
      delete process.env.CORE_API_URL;

      const response = await bootstrap();

      expect(response.status).toBe(503);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: 'The CORE_API service is not configured.', details: [] } });
      expect(coreApi.requests).toHaveLength(0);
    });

    test.each([
      ['an invalid URL', { CORE_API_URL: 'http://bad host' }],
      ['an invalid port', { CORE_API_URL: 'core-api', CORE_API_PORT: '99999' }],
    ])('returns 503 when Core API has %s', async (_label, env) => {
      mockUpstreams();
      Object.assign(process.env, env);

      const response = await bootstrap();

      expect(response.status).toBe(503);
      expectDashboardContract(response);
      expect(response.body).toEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: 'The CORE_API service is misconfigured.', details: [] } });
      expect(coreApi.requests).toHaveLength(0);
    });

    test('still answers 401 first when no upstream is configured', async () => {
      for (const mock of mocks) delete process.env[`${mock.service}_URL`];

      const response = await bootstrap(null);

      expect(response.status).toBe(401);
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
      expect(mocks.map((mock) => mock.requests.length)).toEqual([1, 2, 1]);
    });
  });

  describe('degraded sources', () => {
    test('MAIR-557: a 500 from Project API /projects marks only the projects unavailable', async () => {
      mockUpstreams({ events: [eventView(1)], tasks: [taskListItem(1, { assigned_to: 2 })] });
      projectApi.on('get', PROJECT.projects, textError(500, 'Erreur serveur'));

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body).toMatchObject({ projects: [], metrics: { totalProjects: null } });
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.sources).toEqual({ projects: 'unavailable', tasks: 'available', calendar: 'available' });
    });

    test.each([500, 502])('a %i from Calendar API marks only the calendar unavailable', async (status) => {
      mockUpstreams({ projects: [projectListItem(1)], tasks: [taskListItem(1, { assigned_to: 2 })] });
      calendarApi.on('get', CALENDAR.calendar, textError(status));

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.events).toEqual([]);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'available', calendar: 'unavailable' });
    });

    test('an unreachable Calendar API degrades the calendar section instead of failing', async () => {
      mockUpstreams({ projects: [projectListItem(1)] });
      process.env.CALENDAR_API_URL = await unreachableUrl();

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'available', calendar: 'unavailable' });
    });

    test.each<[string, MockReply]>([
      ['a 500', textError(500, 'Erreur serveur')],
      ['a body without the task list', { body: { total: 3 }, outOfContract: true }],
    ])('MAIR-557: %s from Project API /tasks marks only the tasks unavailable', async (_label, reply) => {
      mockUpstreams({ projects: [projectListItem(1)], events: [eventView(1)] });
      projectApi.on('get', PROJECT.tasks, reply);

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.tasks).toEqual([]);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.sources).toEqual({ projects: 'available', tasks: 'unavailable', calendar: 'available' });
    });

    test('a payload rejected by the dashboard parser degrades the section without inventing data', async () => {
      mockUpstreams();
      projectApi.on('get', PROJECT.projects, { body: { projects: [{ id: 42 }] }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body).toMatchObject({ projects: [], tasks: [], metrics: { totalProjects: null } });
      expect(response.body.sources).toEqual({ projects: 'unavailable', tasks: 'available', calendar: 'available' });
    });

    test('skips an unusable calendar event but keeps the calendar available', async () => {
      mockUpstreams();
      calendarApi.on('get', CALENDAR.calendar, { body: { events: [eventView(1), { name: 'Sans identifiant' }] }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.events.map((event: { id: number }) => event.id)).toEqual([1]);
      expect(response.body.sources.calendar).toBe('available');
    });

    test('a calendar payload whose events field is not a list marks the calendar unavailable', async () => {
      mockUpstreams();
      calendarApi.on('get', CALENDAR.calendar, { body: { events: 'none' }, outOfContract: true });

      const response = await bootstrap();

      expect(response.status).toBe(200);
      expectDashboardContract(response);
      expect(response.body.sources.calendar).toBe('unavailable');
    });
  });
});
