import { getBffCalendar } from '@mairie360/bff-calendar-openapi/endpoints/bffCalendar';
import {
  type CalendarBootstrapResponse,
  CalendarBootstrapResponseAssigneeScope,
  type CalendarEvent,
  CalendarEventApprovalStatus,
  CalendarEventCategory,
} from '@mairie360/bff-calendar-openapi/model';
import { getBffProject } from '@mairie360/bff-project-openapi/endpoints/bffProject';
import {
  type ApiError as ProjectBffError,
  type Person,
  type ProjectDetailsResponse,
  type ProjectListItem,
  ProjectListItemPriority,
  ProjectListItemStatus,
  type ProjectsPageResponse,
  ProjectsPageResponseAccessRole,
  ProjectsPageResponseAccessScope,
  ProjectsPageResponseKanbanColumnsItemStatus,
  ProjectsPageResponsePageDefaultView,
  ProjectsPageResponsePageViewsItemValue,
  type ProjectTask,
  ProjectTaskPriority,
  ProjectTaskStatus,
} from '@mairie360/bff-project-openapi/model';
import { getBffUser } from '@mairie360/bff-user-openapi/endpoints/bffUser';
import type { SessionResponse, SessionResponseUser } from '@mairie360/bff-user-openapi/model';

// Jeux de données typés par les modèles des paquets @mairie360/bff-*-openapi installés : un champ ajouté, retiré ou
// renommé par un contrat amont fait échouer la compilation des tests. Les valeurs sont en plus validées à l'exécution
// contre les contrats reconstruits (upstream-contracts.test.ts, mocks HTTP). Les champs non lus par le dashboard sont
// présents parce que les modèles les exigent : ils doivent être ignorés.

/** Chemins des opérations amont, tels que les construisent les clients générés (helpers `get*Url`). */
export const userBffUrls = getBffUser();
export const projectBffUrls = getBffProject();
export const calendarBffUrls = getBffCalendar();

export const person = (id: string, name = `Agent ${id}`): Person => ({ id, name, avatarUrl: null });

export function sessionResponse(user: Partial<SessionResponseUser> = {}): SessionResponse {
  return {
    user: { id: 2, first_name: 'Alice', last_name: 'Martin', email: 'alice.martin@mairie.test', phone: null, status: 'active', role: 'User', ...user },
    groups: [{ id: 1, name: 'Service urbanisme', owner_id: 1, description: null }],
    roles: [{ id: 3, name: 'User' }],
  };
}

export function projectListItem(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'project-1',
    title: 'Rénovation de la médiathèque',
    description: 'Travaux de mise aux normes',
    status: ProjectListItemStatus['in-progress'],
    statusLabel: 'En cours',
    priority: ProjectListItemPriority.high,
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

export function projectsPageResponse(projects: ProjectListItem[], totalProjects = projects.length): ProjectsPageResponse {
  return {
    access: {
      role: ProjectsPageResponseAccessRole.User,
      scope: ProjectsPageResponseAccessScope.assigned,
      canCreateProject: false,
      canManageProjects: false,
      canManageTasks: false,
      canUpdateAssignedTaskStatus: true,
      canCommentTasks: true,
    },
    page: {
      title: 'Projets',
      subtitle: 'Suivi des projets',
      defaultView: ProjectsPageResponsePageDefaultView.grid,
      views: [{ value: ProjectsPageResponsePageViewsItemValue.grid, label: 'Grille' }],
    },
    filters: { search: null, status: 'all', priority: 'all', statuses: [{ label: 'Tous', value: 'all' }], priorities: [{ label: 'Toutes', value: 'all' }] },
    options: { members: [{ label: 'Alice Martin', value: 'user-2', name: 'Alice Martin', avatarUrl: null }], labels: [{ label: 'Travaux', value: 'travaux' }] },
    summary: { totalProjects, projectsByStatus: { 'in-progress': projects.length }, projectsByPriority: { high: projects.length } },
    kanban: {
      columns: [{
        status: ProjectsPageResponseKanbanColumnsItemStatus['in-progress'],
        label: 'En cours',
        projectIds: projects.map((project) => project.id),
        count: projects.length,
      }],
    },
    projects,
    pagination: { page: 1, limit: 6, total: totalProjects, hasNextPage: totalProjects > projects.length },
  };
}

export function taskItem(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: 'task-1',
    title: 'Valider le devis',
    status: ProjectTaskStatus.todo,
    statusLabel: 'À faire',
    responsible: person('user-2', 'Alice Martin'),
    assignees: [],
    priority: ProjectTaskPriority.medium,
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

export function projectDetailsResponse(project: ProjectListItem, taskItems: ProjectTask[]): ProjectDetailsResponse {
  return { project, taskItems };
}

/** Corps d'erreur de BFF Project (ApiError de son contrat). */
export function projectApiError(code: string, message: string): ProjectBffError {
  return { error: { code, message, details: [] } };
}

export function calendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 1,
    title: 'Conseil municipal',
    date: '2026-09-20',
    endDate: '2026-09-20',
    category: CalendarEventCategory.meeting,
    service: 'direction',
    startTime: '18:00',
    endTime: '20:00',
    location: 'Salle du conseil',
    assigneeIds: [2],
    approvalStatus: CalendarEventApprovalStatus.approved,
    canEdit: false,
    ...overrides,
  };
}

export function calendarBootstrapResponse(events: CalendarEvent[]): CalendarBootstrapResponse {
  return {
    events,
    assignees: [{ id: 2, name: 'Alice Martin', email: 'alice.martin@mairie.test' }],
    categories: [{ label: 'Réunion', value: CalendarEventCategory.meeting }],
    services: [{ label: 'Direction générale', value: 'direction' }],
    currentUser: { id: 2, name: 'Alice Martin', email: 'alice.martin@mairie.test', groupIds: [1] },
    assigneeScope: CalendarBootstrapResponseAssigneeScope.self,
  };
}
