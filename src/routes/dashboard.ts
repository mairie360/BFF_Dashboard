import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import {
  HttpError, PROJECT_TASK_MANAGER_ROLES, asCaller, callUpstream, hasRole, parisDateWindow, sessionRole, sessionUserId, utcToWallClock,
  wallClockToUtc,
} from '@mairie360/bffs-lib';
import { ErrorSchema, registry } from '../openapi-registry';
import { calendarApi, coreApi, projectApi } from '../clients/upstreams';

const router = Router();
const Project = z.object({
  id: z.string(), title: z.string(), progress: z.number(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']), dueDate: z.string(),
});
const Task = z.object({ id: z.string(), title: z.string(), dueDate: z.string(), priority: z.enum(['high', 'medium', 'low']), completed: z.boolean() });
const Event = z.object({ id: z.union([z.string(), z.number()]), title: z.string(), date: z.string(), startTime: z.string().optional(), location: z.string().optional() });
const Availability = z.enum(['available', 'unavailable']);
const eventSortKey = (event: z.infer<typeof Event>) => `${event.date}T${event.startTime ?? '00:00'}`;
export const DashboardBootstrapSchema = registry.register('DashboardBootstrap', z.object({
  userFirstName: z.string(), projects: z.array(Project), tasks: z.array(Task.extend({ projectId: z.string() })),
  events: z.array(Event), metrics: z.object({ totalProjects: z.number().nullable() }),
  sources: z.object({ projects: Availability, tasks: Availability, calendar: Availability }),
}));

// What the dashboard reads from each API answer. A body that does not match (including a non-JSON body, which axios
// keeps as a string) is a ZodError, which the lib's callUpstream turns into a 502 `The <SERVICE> answer is invalid.`
const CoreMe = z.object({ first_name: z.string(), roles: z.array(z.string()).optional(), role: z.string().optional() });
const ProjectsPage = z.object({
  projects: z.array(z.object({
    id: z.number(), name: z.string(), status: z.string(), tasks_total: z.number(), tasks_completed: z.number(),
    due_date: z.string().nullish(),
  })),
  total: z.number(),
});
const ProjectTasks = z.object({
  tasks: z.array(z.object({
    id: z.number(), title: z.string(), status: z.string(), priority: z.string(), due_date: z.string().nullish(),
    assigned_to: z.number().nullish(),
  })),
});
const CalendarPage = z.object({ events: z.array(z.unknown()) });
const CalendarEvent = z.object({ id: z.number(), name: z.string(), start: z.string(), location: z.string().nullish() });
// Only a refused session is relayed (the one upstream status the contract declares); anything else is a 502.
// Idempotent reads: retried once on a transient failure.
const READ = { declared: [401], retry: true } as const;
/** Projects shown, and tasks of theirs read (Project API has no list of the caller's tasks yet, see MAIR-524). */
const PROJECTS_SHOWN = 6;
const TASKS_SHOWN = 8;
const EVENTS_SHOWN = 6;

// Same vocabulary as BFF_Project (src/routes/Project/project_helpers.ts), so both pages show the same words.
const PROJECT_STATUS: Record<string, z.infer<typeof Project>['status']> = { Active: 'in-progress', Suspended: 'review', Completed: 'done', Error: 'todo' };
const TASK_PRIORITY: Record<string, z.infer<typeof Task>['priority']> = { Low: 'low', Medium: 'medium', High: 'high', Urgent: 'high', Error: 'medium' };
const projectPublicId = (id: number) => `project-${id}`;

registry.registerPath({ method: 'get', path: '/dashboard/bootstrap', responses: {
  200: { description: 'Data read from Core API, Project API and Calendar API in one parallel wave, within the session scope', content: { 'application/json': { schema: DashboardBootstrapSchema } } },
  401: { description: 'Missing or invalid session, or session refused by an upstream API', content: { 'application/json': { schema: ErrorSchema } } },
  502: { description: 'User profile unavailable: Core API unreachable, failed or answered an invalid body', content: { 'application/json': { schema: ErrorSchema } } },
  503: { description: 'An upstream API is not configured', content: { 'application/json': { schema: ErrorSchema } } },
} });

/** The first projects visible to the caller, then the tasks of each of them, read together. */
async function readProjectsAndTasks(req: Request) {
  const page = await callUpstream('PROJECT_API', async () => ProjectsPage.parse(
    (await projectApi.getProjects({ limit: PROJECTS_SHOWN }, asCaller('PROJECT_API', req))).data), READ);
  // At most PROJECTS_SHOWN lists, read together.
  const tasks = await Promise.allSettled(page.projects.map((project) => callUpstream('PROJECT_API', async () => ProjectTasks.parse(
    (await projectApi.getProjectTasks(project.id, { limit: 500 }, asCaller('PROJECT_API', req))).data), READ)));
  return { page, tasks };
}

/** The caller's events of the next 30 days on the Europe/Paris calendar. */
async function readEvents(req: Request) {
  // Between 00:00 and 02:00 in Paris, the UTC day is still the day before.
  const { from, to } = parisDateWindow(30);
  const params = { start: wallClockToUtc(from, '00:00:00'), end: wallClockToUtc(to, '23:59:59') };
  return callUpstream('CALENDAR_API', async () => CalendarPage.parse(
    (await calendarApi.getCalendar(params, asCaller('CALENDAR_API', req))).data), READ);
}

router.get('/bootstrap', async (req, res) => {
  // One wave (MAIR-525): the profile, the projects (each followed at once by its tasks) and the events start
  // together, from the APIs; no other BFF is called. A refused session (401) from any call fails the whole answer.
  const [meResult, projectsResult, calendarResult] = await Promise.allSettled([
    callUpstream('CORE_API', async () => CoreMe.parse((await coreApi.getMe(asCaller('CORE_API', req))).data), READ),
    readProjectsAndTasks(req),
    readEvents(req),
  ]);
  const taskResults = projectsResult.status === 'fulfilled' ? projectsResult.value.tasks : [];
  for (const result of [projectsResult, calendarResult, ...taskResults]) {
    if (result.status === 'rejected' && result.reason instanceof HttpError && result.reason.status === 401) throw result.reason;
  }
  // The profile is required: its failure is the answer.
  if (meResult.status === 'rejected') throw meResult.reason;
  const me = meResult.value;

  // The role comes from the verified token (MAIR-529), or from Core's profile for a token without it.
  const tokenRole = sessionRole(req);
  const roles = tokenRole !== undefined ? [tokenRole] : me.roles ?? (me.role ? [me.role] : []);
  // BFF_Project's rule: Admin, Maire and Responsable see every task of a visible project, others their own.
  const seesEveryTask = hasRole(roles, ...PROJECT_TASK_MANAGER_ROLES);
  const userId = sessionUserId(req);

  const page = projectsResult.status === 'fulfilled' ? projectsResult.value.page : undefined;
  const projects = (page?.projects ?? []).map((project) => ({
    id: projectPublicId(project.id),
    title: project.name,
    progress: project.tasks_total > 0 ? Math.round((project.tasks_completed / project.tasks_total) * 100) : 0,
    status: PROJECT_STATUS[project.status] ?? 'todo',
    dueDate: project.due_date ?? new Date().toISOString(),
  }));
  const tasks = (page?.projects ?? []).flatMap((project, index) => {
    const result = taskResults[index];
    if (result?.status !== 'fulfilled') return [];
    return result.value.tasks
      .filter((task) => task.status !== 'Completed' && (seesEveryTask || task.assigned_to === userId))
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        dueDate: task.due_date ?? new Date().toISOString(),
        priority: TASK_PRIORITY[task.priority] ?? 'medium',
        completed: false,
        projectId: projectPublicId(project.id),
      }));
  });
  // Unusable events are skipped one by one; the wall clock is the Europe/Paris one, like BFF Calendar shows it.
  const events = calendarResult.status === 'fulfilled'
    ? calendarResult.value.events.flatMap((raw) => {
      const parsed = CalendarEvent.safeParse(raw);
      if (!parsed.success) return [];
      const event = parsed.data;
      const start = utcToWallClock(event.start);
      return [{ id: event.id, title: event.name, date: start.date, startTime: start.time, ...(event.location ? { location: event.location } : {}) }];
    })
    : [];

  return res.json(DashboardBootstrapSchema.parse({
    userFirstName: me.first_name,
    projects,
    tasks: tasks.slice(0, TASKS_SHOWN),
    events: events.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))).slice(0, EVENTS_SHOWN),
    metrics: { totalProjects: page ? page.total : null },
    sources: {
      projects: page ? 'available' : 'unavailable',
      tasks: page && taskResults.every((result) => result.status === 'fulfilled') ? 'available' : 'unavailable',
      calendar: calendarResult.status === 'fulfilled' ? 'available' : 'unavailable',
    },
  }));
});
export default router;
