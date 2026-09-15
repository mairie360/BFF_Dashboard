// Jeux de données conformes aux contrats des BFF amont (validés dans upstream-contracts.test.ts).
// Les champs non lus par le dashboard sont volontairement présents : ils doivent être ignorés.

type Overrides<T> = Partial<T> & Record<string, unknown>;

export const person = (id: string, name = `Agent ${id}`) => ({ id, name, avatarUrl: null });

export function sessionResponse(user: Overrides<{ first_name: string }> = {}) {
  return {
    user: { id: 2, first_name: 'Alice', last_name: 'Martin', email: 'alice.martin@mairie.test', phone: null, status: 'active', role: 'User', ...user },
    groups: [{ id: 1, name: 'Service urbanisme', owner_id: 1, description: null }],
    roles: [{ id: 3, name: 'User' }],
  };
}

export type ProjectItem = ReturnType<typeof projectListItem>;
export function projectListItem(overrides: Overrides<{ id: string; title: string; status: string; progress: number; dueDate: string }> = {}) {
  return {
    id: 'project-1',
    title: 'Rénovation de la médiathèque',
    description: 'Travaux de mise aux normes',
    status: 'in-progress',
    statusLabel: 'En cours',
    priority: 'high',
    priorityLabel: 'Haute',
    responsible: person('user-2', 'Alice Martin'),
    assignees: [person('user-3')],
    labels: ['travaux'],
    progress: 40,
    dueDate: '2026-12-01',
    createdAt: '2026-01-10T08:00:00Z',
    tasks: { total: 3, completed: 1 },
    permissions: { canView: true, canEdit: false, canDuplicate: false, canDelete: false, canCreateTask: false, canAssignMembers: false, canClose: false },
    ...overrides,
  };
}

export function projectsPageResponse(projects: ProjectItem[], totalProjects = projects.length) {
  return {
    access: { role: 'User', scope: 'assigned', canCreateProject: false, canManageProjects: false, canManageTasks: false, canUpdateAssignedTaskStatus: true, canCommentTasks: true },
    page: { title: 'Projets', subtitle: 'Suivi des projets', defaultView: 'grid', views: [{ value: 'grid', label: 'Grille' }] },
    filters: { search: null, status: 'all', priority: 'all', statuses: [{ label: 'Tous', value: 'all' }], priorities: [{ label: 'Toutes', value: 'all' }] },
    options: { members: [{ label: 'Alice Martin', value: 'user-2', name: 'Alice Martin', avatarUrl: null }], labels: [{ label: 'Travaux', value: 'travaux' }] },
    summary: { totalProjects, projectsByStatus: { 'in-progress': projects.length }, projectsByPriority: { high: projects.length } },
    kanban: { columns: [{ status: 'in-progress', label: 'En cours', projectIds: projects.map((project) => project.id), count: projects.length }] },
    projects,
    pagination: { page: 1, limit: 6, total: totalProjects, hasNextPage: totalProjects > projects.length },
  };
}

export type TaskItem = ReturnType<typeof taskItem>;
export function taskItem(overrides: Overrides<{ id: string; title: string; priority: string; completed: boolean; dueDate: string }> = {}) {
  return {
    id: 'task-1',
    title: 'Valider le devis',
    status: 'todo',
    statusLabel: 'À faire',
    responsible: person('user-2', 'Alice Martin'),
    assignees: [],
    priority: 'medium',
    priorityLabel: 'Moyenne',
    labels: [],
    dueDate: '2026-10-01',
    completed: false,
    createdAt: '2026-01-11T08:00:00Z',
    updatedAt: '2026-01-12T08:00:00Z',
    permissions: { canView: true, canEdit: false, canDelete: false, canUpdateStatus: true, canComment: true },
    ...overrides,
  };
}

export function projectDetailsResponse(project: ProjectItem, taskItems: TaskItem[]) {
  return { project, taskItems };
}

export function projectApiError(code: string, message: string) {
  return { error: { code, message, details: [] } };
}

export function calendarEvent(overrides: Overrides<{ id: string | number; title: string; date: string; startTime: string; location: string }> = {}) {
  return {
    id: 1,
    title: 'Conseil municipal',
    date: '2026-09-20',
    endDate: '2026-09-20',
    category: 'meeting',
    service: 'direction',
    startTime: '18:00',
    endTime: '20:00',
    location: 'Salle du conseil',
    assigneeIds: [2],
    approvalStatus: 'approved',
    canEdit: false,
    ...overrides,
  };
}

export function calendarBootstrapResponse(events: unknown[]) {
  return {
    events,
    assignees: [{ id: 2, name: 'Alice Martin', email: 'alice.martin@mairie.test' }],
    categories: [{ label: 'Réunion', value: 'meeting' }],
    services: [{ label: 'Direction générale', value: 'direction' }],
    currentUser: { id: 2, name: 'Alice Martin', email: 'alice.martin@mairie.test', groupIds: [1] },
    assigneeScope: 'self',
  };
}
