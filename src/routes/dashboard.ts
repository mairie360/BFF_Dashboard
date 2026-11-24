import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import {
  HttpError, PROJECT_TASK_MANAGER_ROLES, asCaller, callUpstream, hasRole, parisDateWindow, sessionRole, sessionUserId, wallClockToUtc,
} from '@mairie360/bffs-lib';
import { ErrorSchema, registry } from '../openapi-registry';
import { calendarApi, coreApi, elearningApi, messageApi, projectApi } from '../clients/upstreams';
import { countOccurrences, nextOccurrence, parisMonth } from '../occurrences';

const router = Router();
const Project = z.object({
  id: z.string(), title: z.string(), progress: z.number(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']), dueDate: z.string(),
});
const Task = z.object({ id: z.string(), title: z.string(), dueDate: z.string(), priority: z.enum(['high', 'medium', 'low']), completed: z.boolean() });
const Event = z.object({ id: z.union([z.string(), z.number()]), title: z.string(), date: z.string(), startTime: z.string().optional(), location: z.string().optional() });
const Training = z.object({
  id: z.string(), title: z.string(), status: z.enum(['todo', 'in-progress', 'done']),
  completedModules: z.number().int(), totalModules: z.number().int(), progress: z.number(),
  dueDate: z.string().nullable().openapi({ description: 'Date the training should be completed by (YYYY-MM-DD), null when it has none' }),
});
const Availability = z.enum(['available', 'unavailable']);
const eventSortKey = (event: z.infer<typeof Event>) => `${event.date}T${event.startTime ?? '00:00'}`;
export const DashboardBootstrapSchema = registry.register('DashboardBootstrap', z.object({
  userFirstName: z.string(), projects: z.array(Project), tasks: z.array(Task.extend({ projectId: z.string() })),
  events: z.array(Event), metrics: z.object({
    totalProjects: z.number().nullable(),
    eventsThisMonth: z.number().int().nonnegative().nullable().openapi({ description: "Occurrences of the user's events starting during `eventsPeriod` (recurring events expanded), like the month view of the calendar; null when Calendar API is unavailable" }),
    eventsPeriod: z.object({
      from: z.string().openapi({ description: 'First day of the current Europe/Paris calendar month (YYYY-MM-DD)' }),
      to: z.string().openapi({ description: 'Last day of the current Europe/Paris calendar month (YYYY-MM-DD)' }),
    }).openapi({ description: 'Period counted by `eventsThisMonth`' }),
  }),
  sources: z.object({ projects: Availability, tasks: Availability, calendar: Availability, trainings: Availability, messages: Availability }),
  // MAIR-825 (Dashboard V2): additive fields only, the fields above keep their shape.
  userLastName: z.string().openapi({ description: 'Last name from Core API (empty string when it has none)' }),
  userRole: z.string().nullable().openapi({ description: "Role of the user: Core's profile, else the `role` claim of the token; null when neither has one" }),
  communeName: z.string().nullable().openapi({ description: 'Name of the municipality of the instance (`MAIRIE_NAME`), null when not configured' }),
  trainings: z.array(Training).openapi({ description: 'The first 3 trainings of the user from ELearning API: unfinished first (in progress, then to do), then done; soonest due date first inside each group, none last' }),
  unreadMessages: z.number().int().nonnegative().nullable().openapi({ description: "Unread messages of the user over their chats (Message API), for the Messagerie badge; null when Message API is unavailable (`sources.messages`)" }),
}));

// What the dashboard reads from each API answer. A body that does not match (including a non-JSON body, which axios
// keeps as a string) is a ZodError, which the lib's callUpstream turns into a 502 `The <SERVICE> answer is invalid.`
const CoreMe = z.object({
  first_name: z.string(), last_name: z.string().nullish(), roles: z.array(z.string()).optional(), role: z.string().nullish(),
});
const ProjectsPage = z.object({
  projects: z.array(z.object({
    id: z.number(), name: z.string(), status: z.string(), tasks_total: z.number(), tasks_completed: z.number(),
    due_date: z.string().nullish(),
  })),
  total: z.number(),
});
const TasksPage = z.object({
  tasks: z.array(z.object({
    id: z.number(), project_id: z.number(), title: z.string(), priority: z.string(), due_date: z.string().nullish(),
  })),
});
const CalendarPage = z.object({ events: z.array(z.unknown()) });
const CalendarEvent = z.object({
  id: z.number(), name: z.string(), start: z.string(), end: z.string(), location: z.string().nullish(),
  recurrence: z.object({
    frequency: z.string(), interval: z.number(), days_of_week: z.array(z.number()).nullish(), ends_on: z.string().nullish(),
  }).nullish(),
});
const CatalogPage = z.object({
  formations: z.array(z.object({
    id: z.number(), name: z.string(), status: z.string(), modules: z.array(z.object({ completed: z.boolean() })),
    deadline: z.string().nullish(),
  })),
});
const UnreadTotal = z.object({ unread_count: z.number().int().nonnegative() });
// Only a refused session is relayed (the one upstream status the contract declares); anything else is a 502.
// Idempotent reads: retried once on a transient failure.
const READ = { declared: [401], retry: true } as const;
const PROJECTS_SHOWN = 6;
const TASKS_SHOWN = 8;
const EVENTS_SHOWN = 6;
const TRAININGS_SHOWN = 3;

// Same vocabulary as BFF_Project (src/routes/Project/project_helpers.ts), so both pages show the same words.
const PROJECT_STATUS: Record<string, z.infer<typeof Project>['status']> = { Active: 'in-progress', Suspended: 'review', Completed: 'done', Error: 'todo' };
const TASK_PRIORITY: Record<string, z.infer<typeof Task>['priority']> = { Low: 'low', Medium: 'medium', High: 'high', Urgent: 'high', Error: 'medium' };
// ELearning API progress -> dashboard status; `Error` (a value the API cannot interpret) is left out.
const TRAINING_STATUS: Record<string, z.infer<typeof Training>['status']> = { NotStarted: 'todo', InProgress: 'in-progress', Completed: 'done' };
// Unfinished first (in progress, then to do), then done; inside each, soonest due date first (none last), then ELearning API's order (by id).
const TRAINING_ORDER: Record<z.infer<typeof Training>['status'], number> = { 'in-progress': 0, todo: 1, done: 2 };
const projectPublicId = (id: number) => `project-${id}`;
// A training deadline is a calendar date (`YYYY-MM-DD`); anything else is dropped rather than relayed (MAIR-1110).
const calendarDate = (value: string | null | undefined): string | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
};
const dueKey = (dueDate: string | null | undefined) => (dueDate ? Date.parse(dueDate) || Infinity : Infinity);

registry.registerPath({ method: 'get', path: '/dashboard/bootstrap', summary: 'Load the dashboard of the signed-in user', responses: {
  200: { description: 'Data read from Core API, Project API, Calendar API, ELearning API and Message API in one parallel wave, within the session scope', content: { 'application/json': { schema: DashboardBootstrapSchema } } },
  401: { description: 'Missing or invalid session, or session refused by an upstream API', content: { 'application/json': { schema: ErrorSchema } } },
  // bffs-lib >= 2.4.0 relays an upstream 429 with its Retry-After instead of a 502 (MAIR-562).
  429: { description: 'Core API rate limit reached: retry after the Retry-After header (seconds)', content: { 'application/json': { schema: ErrorSchema } } },
  502: { description: 'User profile unavailable: Core API unreachable, failed or answered an invalid body', content: { 'application/json': { schema: ErrorSchema } } },
  503: { description: 'An upstream API is not configured', content: { 'application/json': { schema: ErrorSchema } } },
} });

/** The first projects visible to the caller and their total. */
function readProjects(req: Request) {
  return callUpstream('PROJECT_API', async () => ProjectsPage.parse(
    (await projectApi.getProjects({ limit: PROJECTS_SHOWN }, asCaller('PROJECT_API', req))).data), READ);
}

/**
 * The first active tasks the caller sees, across every visible project, soonest due first, in one call (MAIR-557).
 * BFF_Project's rule: Admin, Maire and Responsable see every task of a visible project, others their own
 * (`assigned_to`). Without a status filter Project API lists the active tasks only (no `Completed` one).
 */
async function readTasks(req: Request, roles: Promise<string[]>) {
  const assignedTo = hasRole(await roles, ...PROJECT_TASK_MANAGER_ROLES) ? {} : { assigned_to: sessionUserId(req) };
  return callUpstream('PROJECT_API', async () => TasksPage.parse(
    (await projectApi.getTasks({ limit: TASKS_SHOWN, ...assignedTo }, asCaller('PROJECT_API', req))).data), READ);
}

/** The caller's events of `from`..`to` (Paris days). */
async function readEvents(req: Request, { from, to }: { from: string; to: string }) {
  // Between 00:00 and 02:00 in Paris, the UTC day is still the day before.
  const params = { start: wallClockToUtc(from, '00:00:00'), end: wallClockToUtc(to, '23:59:59') };
  return callUpstream('CALENDAR_API', async () => CalendarPage.parse(
    (await calendarApi.getCalendar(params, asCaller('CALENDAR_API', req))).data), READ);
}

/** The caller's trainings with their modules (one call, MAIR-825). */
function readTrainings(req: Request) {
  return callUpstream('ELEARNING_API', async () => CatalogPage.parse(
    (await elearningApi.getMyCatalog(asCaller('ELEARNING_API', req))).data), READ);
}

/** The caller's unread total over their chats (MAIR-1106), for the Messagerie badge. */
function readUnread(req: Request) {
  return callUpstream('MESSAGE_API', async () => UnreadTotal.parse(
    (await messageApi.getUnreadTotal(asCaller('MESSAGE_API', req))).data), READ);
}

/** The instance's municipality name (`MAIRIE_NAME`, the variable Core uses in its e-mails), optional. */
function communeName(): string | null {
  return process.env.MAIRIE_NAME?.trim() || null;
}

router.get('/bootstrap', async (req, res) => {
  // One wave (MAIR-525): the profile, the projects, the tasks, the events (next 30 days and current month), the trainings and the unread total start together, from the APIs; no other
  // BFF is called. A refused session (401) from any call fails the whole answer.
  const me = callUpstream('CORE_API', async () => CoreMe.parse((await coreApi.getMe(asCaller('CORE_API', req))).data), READ);
  // The role comes from the verified token (MAIR-529); only a token without it waits for Core's profile to read tasks.
  const tokenRole = sessionRole(req);
  // The next 30 days of the Europe/Paris calendar, read once so the events and their occurrences share it.
  const now = new Date();
  const window = parisDateWindow(30, now);
  // The current Europe/Paris calendar month, for the events indicator (read on its own: its failure only hides the count).
  const month = parisMonth(now);
  const roles = tokenRole !== undefined ? Promise.resolve([tokenRole]) : me.then((profile) => profile.roles ?? (profile.role ? [profile.role] : []));
  const [meResult, projectsResult, tasksResult, calendarResult, trainingsResult, unreadResult, monthResult] = await Promise.allSettled([
    me, readProjects(req), readTasks(req, roles), readEvents(req, window), readTrainings(req), readUnread(req), readEvents(req, month),
  ]);
  for (const result of [projectsResult, tasksResult, calendarResult, trainingsResult, unreadResult, monthResult]) {
    if (result.status === 'rejected' && result.reason instanceof HttpError && result.reason.status === 401) throw result.reason;
  }
  // The profile is required: its failure is the answer.
  if (meResult.status === 'rejected') throw meResult.reason;

  const page = projectsResult.status === 'fulfilled' ? projectsResult.value : undefined;
  const projects = (page?.projects ?? []).map((project) => ({
    id: projectPublicId(project.id),
    title: project.name,
    progress: project.tasks_total > 0 ? Math.round((project.tasks_completed / project.tasks_total) * 100) : 0,
    status: PROJECT_STATUS[project.status] ?? 'todo',
    dueDate: project.due_date ?? new Date().toISOString(),
  }));
  const tasks = tasksResult.status === 'fulfilled'
    // Soonest due first, tasks without due date last (MAIR-563): Project API answers in that order, kept even if not.
    ? [...tasksResult.value.tasks].sort((a, b) => dueKey(a.due_date) - dueKey(b.due_date)).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      dueDate: task.due_date ?? new Date().toISOString(),
      priority: TASK_PRIORITY[task.priority] ?? 'medium',
      completed: false,
      projectId: projectPublicId(task.project_id),
    }))
    : [];
  // Unusable events are skipped one by one; the wall clock is the Europe/Paris one, like BFF Calendar shows it. A
  // recurring event is shown at its next repetition, and an occurrence already over is left out (MAIR-563).
  const events = calendarResult.status === 'fulfilled'
    ? calendarResult.value.events.flatMap((raw) => {
      const parsed = CalendarEvent.safeParse(raw);
      if (!parsed.success) return [];
      const event = parsed.data;
      const next = nextOccurrence(event, window.to, now);
      if (!next) return [];
      return [{ id: event.id, title: event.name, date: next.date, startTime: next.time, ...(event.location ? { location: event.location } : {}) }];
    })
    : [];

  // ELearning API is optional (MAIR-825): not configured, unreachable or failing, the section is unavailable.
  const trainings = trainingsResult.status === 'fulfilled'
    ? trainingsResult.value.formations.flatMap((formation) => {
      if (!Object.prototype.hasOwnProperty.call(TRAINING_STATUS, formation.status)) return [];
      const status = TRAINING_STATUS[formation.status];
      const completedModules = formation.modules.filter((module) => module.completed).length;
      const totalModules = formation.modules.length;
      const progress = status === 'done' ? 100 : totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      const dueDate = calendarDate(formation.deadline);
      return [{ id: `training-${formation.id}`, title: formation.name, status, completedModules, totalModules, progress, dueDate }];
    }).sort((a, b) => TRAINING_ORDER[a.status] - TRAINING_ORDER[b.status] || dueKey(a.dueDate) - dueKey(b.dueDate))
    : [];
  const profile = meResult.value;
  // Unusable events (missing fields, a start or an end that is not an instant) are skipped, like in the list above.
  const eventsThisMonth = monthResult.status === 'fulfilled'
    ? monthResult.value.events.reduce<number>((total, raw) => {
      const parsed = CalendarEvent.safeParse(raw);
      if (!parsed.success || [parsed.data.start, parsed.data.end].some((instant) => Number.isNaN(Date.parse(instant)))) return total;
      return total + countOccurrences(parsed.data, month);
    }, 0)
    : null;

  return res.json(DashboardBootstrapSchema.parse({
    userFirstName: profile.first_name,
    userLastName: profile.last_name ?? '',
    // One role per user (Core MAIR-564): the profile's, else the token's; an empty string is no role.
    userRole: profile.role || tokenRole || null,
    communeName: communeName(),
    projects,
    tasks: tasks.slice(0, TASKS_SHOWN),
    events: events.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))).slice(0, EVENTS_SHOWN),
    trainings: trainings.slice(0, TRAININGS_SHOWN),
    // Message API is optional too: not configured, unreachable or failing, the badge is left out.
    unreadMessages: unreadResult.status === 'fulfilled' ? unreadResult.value.unread_count : null,
    metrics: { totalProjects: page ? page.total : null, eventsThisMonth, eventsPeriod: month },
    sources: {
      projects: page ? 'available' : 'unavailable',
      tasks: tasksResult.status === 'fulfilled' ? 'available' : 'unavailable',
      calendar: calendarResult.status === 'fulfilled' ? 'available' : 'unavailable',
      trainings: trainingsResult.status === 'fulfilled' ? 'available' : 'unavailable',
      messages: unreadResult.status === 'fulfilled' ? 'available' : 'unavailable',
    },
  }));
});
export default router;
