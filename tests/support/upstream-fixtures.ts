import { createHmac } from 'node:crypto';
import { getCalendarAPIMairie360 } from '@mairie360/calendar-api-openapi/endpoints/calendarAPIMairie360';
import { EventCategory, EventVisibility, type EventView, type GetCalendarResultView } from '@mairie360/calendar-api-openapi/model';
import { getCoreAPIMairie360 } from '@mairie360/core-api-openapi/endpoints/coreAPIMairie360';
import type { GetMeResponseView } from '@mairie360/core-api-openapi/model';
import { getProjectAPIMairie360 } from '@mairie360/project-api-openapi/endpoints/projectAPIMairie360';
import {
  type GetProjectsResultView,
  type GetTasksListResultView,
  type ProjectListItemView,
  ProjectStatus,
  type TaskListItemView,
  TaskPriority,
  TaskStatus,
} from '@mairie360/project-api-openapi/model';

// Upstream bodies typed by the models of the installed @mairie360/*-api-openapi packages: a field added, removed or
// renamed by an API contract breaks the compilation of the tests. They are also validated at run time against the
// rebuilt contracts (upstream-contracts.test.ts, HTTP mocks). Fields the dashboard does not read are present because
// the models require them: they must be ignored. MAIR-525: the dashboard reads the APIs, never another BFF.

/** Paths of the upstream operations, as the generated clients build them (`get*Url` helpers). */
export const coreApiUrls = getCoreAPIMairie360();
export const projectApiUrls = getProjectAPIMairie360();
export const calendarApiUrls = getCalendarAPIMairie360();

/** Body of Core `GET /api/v1/user/me/` for user 2 (Alice). */
export function coreMe(fields: Partial<GetMeResponseView> = {}): GetMeResponseView {
  return {
    first_name: 'Alice', last_name: 'Martin', email: 'alice.martin@mairie.test', phone: null, status: 'active',
    role: 'User', roles: ['User'], groups: [{ id: 1, name: 'Service urbanisme', owner_id: 1, description: null }],
    ...fields,
  };
}

/** A project of `GET /api/v1/projects/` with the aggregates of its tasks. */
export function projectListItem(id: number, overrides: Partial<ProjectListItemView> = {}): ProjectListItemView {
  return {
    id, name: `Projet ${id}`, description: `Description du projet ${id}`, status: ProjectStatus.Active,
    tasks_total: 0, tasks_completed: 0, priority: TaskPriority.Medium, due_date: null, members: [], members_total: 0,
    ...overrides,
  };
}

/** A page of `GET /api/v1/projects/`; `total` counts every visible project, beyond the page. */
export function projectsResult(projects: ProjectListItemView[], total = projects.length): GetProjectsResultView {
  return {
    projects,
    total,
    summary: {
      by_status: { todo: 0, active: projects.length, review: 0, suspended: 0, completed: 0, other: 0 },
      by_priority: { low: 0, medium: projects.length, high: 0 },
    },
  };
}

/** A task of `GET /api/v1/tasks/` (MAIR-524): the fields of a project's task and its project. */
export function taskListItem(id: number, overrides: Partial<TaskListItemView> = {}): TaskListItemView {
  return {
    id, project_id: 1, project_name: 'Projet 1', title: `Tâche ${id}`, description: '', status: TaskStatus.Todo,
    priority: TaskPriority.Medium, due_date: '2026-10-01T00:00:00Z', assigned_to: null, archived_at: null, fields: [], ...overrides,
  };
}

/** A page of `GET /api/v1/tasks/`; `total` counts every matching task, beyond the page. */
export const taskListResult = (tasks: TaskListItemView[], total = tasks.length): GetTasksListResultView => ({ tasks, total });

/**
 * An event of `GET /api/v1/calendar`. `start` / `end` are UTC instants. Since MAIR-524 the list carries the members
 * of each event; the dashboard does not read them.
 */
export function eventView(id: number, overrides: Partial<EventView> = {}): EventView {
  return {
    id, name: `Événement ${id}`, start: '2026-09-20T16:00:00Z', end: '2026-09-20T18:00:00Z',
    category: EventCategory.meeting, visibility: EventVisibility.Public, is_member: true, location: null, service: null,
    recurrence: null, members: [], ...overrides,
  };
}

export const calendarResult = (events: EventView[]): GetCalendarResultView => ({ events });

// --- Session ---

/** Secret of the tests (tests/support/env.ts): the BFF verifies the session tokens with it (bffs-lib requireSession). */
export const JWT_SECRET = 'dashboard-contract-test-secret';

/**
 * HS256 session token of `sub` signed with `secret` (fixed expiry, so a token is the same in every call). `claims`
 * adds claims, such as the `role` Core signs (MAIR-529); without it the token predates that claim.
 */
export function sessionToken(sub: string | number, secret = JWT_SECRET, exp = 4_102_444_800, claims: object = {}): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: String(sub), exp, ...claims })}`;
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`;
}
