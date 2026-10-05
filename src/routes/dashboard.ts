import { Router } from 'express';
import { z } from 'zod';
import { HttpError, asCaller, callUpstream, parisDateWindow } from '@mairie360/bffs-lib';
import { ErrorSchema, registry } from '../openapi-registry';
import { calendarBff, projectBff, userBff } from '../clients/upstreams';

const router = Router();
const Project = z.object({
  id: z.string(), title: z.string(), progress: z.number(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']), dueDate: z.string(),
});
const Task = z.object({ id: z.string(), title: z.string(), dueDate: z.string(), priority: z.enum(['high', 'medium', 'low']), completed: z.boolean() });
const Event = z.object({ id: z.union([z.string(), z.number()]), title: z.string(), date: z.string(), startTime: z.string().optional(), location: z.string().optional() });
const Availability = z.enum(['available', 'unavailable']);
// BFF Calendar accepts YYYY-MM-DD or DD-MM-YYYY: sort key normalised to YYYY-MM-DD.
const eventSortKey = (event: z.infer<typeof Event>) => `${event.date.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1')}T${event.startTime ?? '00:00'}`;
export const DashboardBootstrapSchema = registry.register('DashboardBootstrap', z.object({
  userFirstName: z.string(), projects: z.array(Project), tasks: z.array(Task.extend({ projectId: z.string() })),
  events: z.array(Event), metrics: z.object({ totalProjects: z.number().nullable() }),
  sources: z.object({ projects: Availability, tasks: Availability, calendar: Availability }),
}));
// What the dashboard reads from each upstream answer. A body that does not match (including a non-JSON
// body, which axios keeps as a string) is a ZodError, which the lib's callUpstream turns into a 502
// `The <SERVICE> answer is invalid.`
const Me = z.object({ user: z.object({ first_name: z.string() }) });
const ProjectsPage = z.object({ projects: z.array(Project), summary: z.object({ totalProjects: z.number() }) });
const ProjectDetails = z.object({ taskItems: z.array(Task) });
const CalendarBootstrap = z.object({ events: z.array(z.unknown()) });
// Only a refused session is relayed (the one upstream status the contract declares); anything else is a 502.
const DECLARED = { declared: [401] } as const;

registry.registerPath({ method: 'get', path: '/dashboard/bootstrap', responses: {
  200: { description: 'Data from the same BFFs as the business pages, within the session scope', content: { 'application/json': { schema: DashboardBootstrapSchema } } },
  401: { description: 'Missing or invalid session, or session refused by an upstream BFF', content: { 'application/json': { schema: ErrorSchema } } },
  502: { description: 'User context unavailable: BFF User unreachable, failed or answered an invalid body', content: { 'application/json': { schema: ErrorSchema } } },
  503: { description: 'An upstream BFF is not configured', content: { 'application/json': { schema: ErrorSchema } } },
} });
router.get('/bootstrap', async (req, res) => {
  // A refused session (401) from any upstream call fails the whole answer, like the identity call.
  const rethrowRefusedSession = (results: PromiseSettledResult<unknown>[]) => {
    for (const result of results) {
      if (result.status === 'rejected' && result.reason instanceof HttpError && result.reason.status === 401) throw result.reason;
    }
  };
  const me = await callUpstream('USER_BFF', async () => Me.parse((await userBff.getMe(asCaller('USER_BFF', req))).data), DECLARED);
  // Next 30 days on the Europe/Paris calendar: between 00:00 and 02:00 in Paris, the UTC day is still the day before.
  const { from, to } = parisDateWindow(30);
  const [projectsResult, calendarResult] = await Promise.allSettled([
    callUpstream('PROJECT_BFF', async () => ProjectsPage.parse(
      (await projectBff.getProjectsPage({ page: 1, limit: 6 }, asCaller('PROJECT_BFF', req))).data), DECLARED),
    // BFF Calendar reads from and to, but its published contract does not declare them yet.
    callUpstream('CALENDAR_BFF', async () => CalendarBootstrap.parse(
      (await calendarBff.getCalendarBootstrap({ ...asCaller('CALENDAR_BFF', req), params: { from, to } })).data), DECLARED),
  ]);
  rethrowRefusedSession([projectsResult, calendarResult]);
  const projectsPage = projectsResult.status === 'fulfilled' ? projectsResult.value : undefined;
  const projects = projectsPage?.projects ?? [];
  const taskResults = await Promise.allSettled(projects.map(async (project) => {
    // The generated client inserts the path parameter as is: the identifier is encoded here.
    const details = await callUpstream('PROJECT_BFF', async () => ProjectDetails.parse(
      (await projectBff.getProjectsProjectId(encodeURIComponent(project.id), asCaller('PROJECT_BFF', req))).data), DECLARED);
    return details.taskItems.filter((task) => !task.completed).map((task) => ({ ...task, projectId: project.id }));
  }));
  // As for the initial calls, a session refused on a project detail is propagated.
  rethrowRefusedSession(taskResults);
  // Unusable events (e.g. without id, optional in the Calendar contract) are skipped one by one.
  const events = calendarResult.status === 'fulfilled'
    ? calendarResult.value.events.flatMap((event) => { const parsed = Event.safeParse(event); return parsed.success ? [parsed.data] : []; })
    : [];
  return res.json(DashboardBootstrapSchema.parse({
    userFirstName: me.user.first_name,
    projects,
    tasks: taskResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []).slice(0, 8),
    events: events.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))).slice(0, 6),
    metrics: { totalProjects: projectsPage ? projectsPage.summary.totalProjects : null },
    sources: {
      projects: projectsPage ? 'available' : 'unavailable',
      tasks: projectsPage && taskResults.every((result) => result.status === 'fulfilled') ? 'available' : 'unavailable',
      calendar: calendarResult.status === 'fulfilled' ? 'available' : 'unavailable',
    },
  }));
});
export default router;
