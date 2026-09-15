import { Router } from 'express';
import { z } from 'zod';
import { registry } from '../openapi-registry';
import { authorization, json, routeError, UpstreamError } from '../clients/upstream';

const router = Router();
const Project = z.object({
  id: z.string(), title: z.string(), progress: z.number(),
  status: z.enum(['todo', 'in-progress', 'review', 'done']), dueDate: z.string(),
});
const Task = z.object({ id: z.string(), title: z.string(), dueDate: z.string(), priority: z.enum(['high', 'medium', 'low']), completed: z.boolean() });
const Event = z.object({ id: z.union([z.string(), z.number()]), title: z.string(), date: z.string(), startTime: z.string().optional(), location: z.string().optional() });
const Availability = z.enum(['available', 'unavailable']);
// BFF Calendar accepte YYYY-MM-DD ou DD-MM-YYYY : clé de tri normalisée en YYYY-MM-DD.
const eventSortKey = (event: z.infer<typeof Event>) => `${event.date.replace(/^(\d{2})-(\d{2})-(\d{4})$/, '$3-$2-$1')}T${event.startTime ?? '00:00'}`;
export const DashboardBootstrapSchema = registry.register('DashboardBootstrap', z.object({
  userFirstName: z.string(), projects: z.array(Project), tasks: z.array(Task.extend({ projectId: z.string() })),
  events: z.array(Event), metrics: z.object({ totalProjects: z.number().nullable() }),
  sources: z.object({ projects: Availability, tasks: Availability, calendar: Availability }),
}));
registry.registerPath({ method: 'get', path: '/dashboard/bootstrap', responses: {
  200: { description: 'Données des mêmes BFF que les pages métier, dans le périmètre de la session', content: { 'application/json': { schema: DashboardBootstrapSchema } } },
  401: { description: 'Session invalide' }, 502: { description: 'Contexte utilisateur indisponible' },
  503: { description: 'Service amont non configuré' },
} });
router.get('/bootstrap', async (req, res) => {
  try {
    authorization(req);
    const user = await json<{ user: { first_name: string } }>(req, 'USER_BFF', '/me');
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const [projectsResult, calendarResult] = await Promise.allSettled([
      json<unknown>(req, 'PROJECT_BFF', '/projects-page?page=1&limit=6'),
      json<unknown>(req, 'CALENDAR_BFF', `/calendar/bootstrap?from=${from}&to=${to}`),
    ]);
    for (const result of [projectsResult, calendarResult]) {
      if (result.status === 'rejected' && result.reason instanceof UpstreamError && result.reason.status === 401) throw result.reason;
    }
    const projectsPage = projectsResult.status === 'fulfilled'
      ? z.object({ projects: z.array(Project), summary: z.object({ totalProjects: z.number() }) }).safeParse(projectsResult.value)
      : undefined;
    const calendar = calendarResult.status === 'fulfilled'
      ? z.object({ events: z.array(z.unknown()) }).safeParse(calendarResult.value)
      : undefined;
    const projects = projectsPage?.success ? projectsPage.data.projects : [];
    const taskResults = await Promise.allSettled(projects.map(async (project) => {
      const details = await json<unknown>(req, 'PROJECT_BFF', `/projects/${encodeURIComponent(project.id)}`);
      return z.object({ taskItems: z.array(Task) }).parse(details).taskItems
        .filter((task) => !task.completed).map((task) => ({ ...task, projectId: project.id }));
    }));
    // Comme pour les appels initiaux, une session refusée sur un détail de projet est propagée.
    for (const result of taskResults) {
      if (result.status === 'rejected' && result.reason instanceof UpstreamError && result.reason.status === 401) throw result.reason;
    }
    // Les événements inexploitables (ex. sans id, optionnel dans le contrat Calendar) sont ignorés un par un.
    const events = calendar?.success
      ? calendar.data.events.flatMap((event) => { const parsed = Event.safeParse(event); return parsed.success ? [parsed.data] : []; })
      : [];
    return res.json(DashboardBootstrapSchema.parse({
      userFirstName: user.user.first_name,
      projects,
      tasks: taskResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []).slice(0, 8),
      events: events.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b))).slice(0, 6),
      metrics: { totalProjects: projectsPage?.success ? projectsPage.data.summary.totalProjects : null },
      sources: {
        projects: projectsPage?.success ? 'available' : 'unavailable',
        tasks: projectsPage?.success && taskResults.every((result) => result.status === 'fulfilled') ? 'available' : 'unavailable',
        calendar: calendar?.success ? 'available' : 'unavailable',
      },
    }));
  } catch (error) { return routeError(res, error); }
});
export default router;
