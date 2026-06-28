export const endpoints = {
  deals: {
    list: "/api/v1/deals",
    get: (id: number) => `/api/v1/deals/${id}`,
    update: (id: number) => `/api/v1/deals/${id}`,
    move: (id: number) => `/api/v1/deals/${id}/move`,
    discard: (id: number) => `/api/v1/deals/${id}/discard`,
    restore: (id: number) => `/api/v1/deals/${id}/restore`,
    destroy: (id: number) => `/api/v1/deals/${id}`,
    bulkDiscard: "/api/v1/deals/bulk_discard",
    bulkDestroy: "/api/v1/deals/bulk_destroy",
    bulkMove: "/api/v1/deals/bulk_move",
    bulkUpdateStatus: "/api/v1/deals/bulk_update_status",
    feedEvents: (id: number) => `/api/v1/deals/${id}/feed_events`,
    comments: (id: number) => `/api/v1/deals/${id}/comments`,
  },
  contacts: {
    list: "/api/v1/contacts",
    get: (id: number) => `/api/v1/contacts/${id}`,
    create: "/api/v1/contacts",
    update: (id: number) => `/api/v1/contacts/${id}`,
    discard: (id: number) => `/api/v1/contacts/${id}/discard`,
    restore: (id: number) => `/api/v1/contacts/${id}/restore`,
    destroy: (id: number) => `/api/v1/contacts/${id}`,
    bulkDiscard: "/api/v1/contacts/bulk_discard",
    bulkDestroy: "/api/v1/contacts/bulk_destroy",
    feedEvents: (id: number) => `/api/v1/contacts/${id}/feed_events`,
    comments: (id: number) => `/api/v1/contacts/${id}/comments`,
    companies: (contactId: number) => `/api/v1/contacts/${contactId}/companies`,
    companyLink: (contactId: number, linkId: number) =>
      `/api/v1/contacts/${contactId}/companies/${linkId}`,
  },
  companies: {
    list: "/api/v1/companies",
    get: (id: number) => `/api/v1/companies/${id}`,
    create: "/api/v1/companies",
    update: (id: number) => `/api/v1/companies/${id}`,
    discard: (id: number) => `/api/v1/companies/${id}/discard`,
    restore: (id: number) => `/api/v1/companies/${id}/restore`,
    destroy: (id: number) => `/api/v1/companies/${id}`,
    bulkDiscard: "/api/v1/companies/bulk_discard",
    bulkDestroy: "/api/v1/companies/bulk_destroy",
    feedEvents: (id: number) => `/api/v1/companies/${id}/feed_events`,
    comments: (id: number) => `/api/v1/companies/${id}/comments`,
  },
  pipelines: {
    list: "/api/v1/pipelines",
    get: (id: number) => `/api/v1/pipelines/${id}`,
    create: "/api/v1/pipelines",
    update: (id: number) => `/api/v1/pipelines/${id}`,
    discard: (id: number) => `/api/v1/pipelines/${id}/discard`,
    restore: (id: number) => `/api/v1/pipelines/${id}/restore`,
    destroy: (id: number) => `/api/v1/pipelines/${id}`,
    createDeal: (pipelineId: number) => `/api/v1/pipelines/${pipelineId}/deals`,
    stages: (pipelineId: number) => `/api/v1/pipelines/${pipelineId}/stages`,
    stage: (pipelineId: number, stageId: number) =>
      `/api/v1/pipelines/${pipelineId}/stages/${stageId}`,
    stageDiscard: (pipelineId: number, stageId: number) =>
      `/api/v1/pipelines/${pipelineId}/stages/${stageId}/discard`,
    stageRestore: (pipelineId: number, stageId: number) =>
      `/api/v1/pipelines/${pipelineId}/stages/${stageId}/restore`,
  },
  teams: {
    list: "/api/v1/teams",
    get: (id: number) => `/api/v1/teams/${id}`,
    create: "/api/v1/teams",
    update: (id: number) => `/api/v1/teams/${id}`,
    discard: (id: number) => `/api/v1/teams/${id}/discard`,
    restore: (id: number) => `/api/v1/teams/${id}/restore`,
    addMember: (id: number) => `/api/v1/teams/${id}/members`,
    removeMember: (id: number, userId: number) => `/api/v1/teams/${id}/members/${userId}`,
  },
  groups: {
    list: "/api/v1/groups",
    get: (id: number) => `/api/v1/groups/${id}`,
    create: "/api/v1/groups",
    update: (id: number) => `/api/v1/groups/${id}`,
    discard: (id: number) => `/api/v1/groups/${id}/discard`,
    restore: (id: number) => `/api/v1/groups/${id}/restore`,
    addMember: (id: number) => `/api/v1/groups/${id}/members`,
    removeMember: (id: number, userId: number) => `/api/v1/groups/${id}/members/${userId}`,
  },
  members: {
    list: "/api/v1/members",
    get: (id: number) => `/api/v1/members/${id}`,
    update: (id: number) => `/api/v1/members/${id}`,
  },
  invitations: {
    list: "/api/v1/invitations",
    create: "/api/v1/invitations",
    cancel: (id: number) => `/api/v1/invitations/${id}`,
  },
  feed: {
    list: "/api/v1/feed",
    byActor: (actorId: number) => `/api/v1/feed/${actorId}`,
  },
  notifications: {
    list: "/api/v1/notifications",
    unreadCount: "/api/v1/notifications/unread_count",
    markRead: (id: number) => `/api/v1/notifications/${id}/read`,
    markAllRead: "/api/v1/notifications/read_all",
  },
  search: "/api/v1/search",
  me: "/api/v1/me",
  workspaces: {
    list: "/api/v1/workspaces",
    get: (id: number) => `/api/v1/workspaces/${id}`,
  },
  customFieldDefinitions: {
    list: "/api/v1/custom_field_definitions",
    get: (id: number) => `/api/v1/custom_field_definitions/${id}`,
    create: "/api/v1/custom_field_definitions",
    update: (id: number) => `/api/v1/custom_field_definitions/${id}`,
    destroy: (id: number) => `/api/v1/custom_field_definitions/${id}`,
  },
  comments: {
    update: (id: number) => `/api/v1/comments/${id}`,
    destroy: (id: number) => `/api/v1/comments/${id}`,
    discard: (id: number) => `/api/v1/comments/${id}/discard`,
    restore: (id: number) => `/api/v1/comments/${id}/restore`,
    reactions: (id: number) => `/api/v1/comments/${id}/reactions`,
    reaction: (commentId: number, reactionId: number) =>
      `/api/v1/comments/${commentId}/reactions/${reactionId}`,
  },
  calendar: "/api/v1/calendar",
  recycleBin: "/api/v1/recycle-bin",
  reports: {
    deals: (type: string) => `/api/v1/reports/deals/${type}`,
  },
} as const;

const COMMENTABLE_PATHS = {
  Deal: "deals",
  Contact: "contacts",
  Company: "companies",
} as const;

export type CommentableType = keyof typeof COMMENTABLE_PATHS;

export function commentableCommentsPath(type: CommentableType, id: number): string {
  const segment = COMMENTABLE_PATHS[type];
  return `/api/v1/${segment}/${id}/comments`;
}

export function queryString(params?: Record<string, string | string[]>): string {
  if (!params || Object.keys(params).length === 0) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      const arrayKey = key.endsWith("[]") ? key : `${key}[]`;
      for (const entry of value) {
        search.append(arrayKey, entry);
      }
    } else {
      search.set(key, value);
    }
  }
  return `?${search}`;
}
