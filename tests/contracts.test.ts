import request from 'supertest';
import { readFileSync } from 'node:fs';
import app from '../src/app';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { fetchMock.mockReset(); });
afterAll(() => { fetchMock.mockRestore(); });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('runtime and exported routes/data have the same OpenAPI document', async () => {
  const expected = JSON.parse(readFileSync('contracts/openapi.json', 'utf8'));
  for (const path of ['/openapi.json', '/swagger.json']) {
    const result = await request(app).get(path);
    expect(result.status).toBe(200);
    expect(result.body).toEqual(expected);
  }
});

test('bootstrap rejects a missing session before contacting upstream services', async () => {
  const result = await request(app).get('/dashboard/bootstrap');
  expect(result.status).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();
});

beforeEach(() => { process.env.USER_BFF_URL = 'http://user.example'; process.env.PROJECT_BFF_URL = 'http://project.example'; process.env.CALENDAR_BFF_URL = 'http://calendar.example'; });
test('dashboard uses the same project, task and event identifiers as their owning BFFs', async () => {
  const project = { id: 'project-42', title: 'Budget', progress: 50, status: 'in-progress', dueDate: '2026-12-01' };
  const task = { id: 'task-2', title: 'Validation', dueDate: '2026-11-01', priority: 'high', completed: false };
  fetchMock.mockResolvedValueOnce(response({ user: { first_name: 'Alice' } }))
    .mockResolvedValueOnce(response({ projects: [project], summary: { totalProjects: 17 } }))
    .mockResolvedValueOnce(response({ events: [{ id: 9, title: 'Conseil', date: '2026-09-08', startTime: '09:00' }] }))
    .mockResolvedValueOnce(response({ taskItems: [task] }));
  const result = await request(app).get('/dashboard/bootstrap').set('Authorization', 'Bearer test-session');
  expect(result.status).toBe(200); expect(result.body.projects).toEqual([project]); expect(result.body.tasks).toEqual([{ ...task, projectId: project.id }]); expect(result.body.events[0].id).toBe(9); expect(result.body.metrics.totalProjects).toBe(17);
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toContain('http://project.example/projects/project-42');
});
test('failed sources stay unavailable without invented counters', async () => {
  fetchMock.mockResolvedValueOnce(response({ user: { first_name: 'Alice' } })).mockResolvedValue(response({}, 503));
  const result = await request(app).get('/dashboard/bootstrap').set('Authorization', 'Bearer test-session');
  expect(result.status).toBe(200); expect(result.body.metrics.totalProjects).toBeNull(); expect(result.body.projects).toEqual([]); expect(result.body.sources).toEqual({ projects: 'unavailable', tasks: 'unavailable', calendar: 'unavailable' });
});
