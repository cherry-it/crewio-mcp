export const endpoints = {
  deals: {
    list: "/api/v1/deals",
    get: (id: number) => `/api/v1/deals/${id}`,
    create: "/api/v1/deals",
    update: (id: number) => `/api/v1/deals/${id}`,
    feedEvents: (id: number) => `/api/v1/deals/${id}/feed_events`,
    comments: (id: number) => `/api/v1/deals/${id}/comments`,
  },
  contacts: {
    list: "/api/v1/contacts",
    get: (id: number) => `/api/v1/contacts/${id}`,
    create: "/api/v1/contacts",
    update: (id: number) => `/api/v1/contacts/${id}`,
    feedEvents: (id: number) => `/api/v1/contacts/${id}/feed_events`,
    comments: (id: number) => `/api/v1/contacts/${id}/comments`,
  },
  companies: {
    list: "/api/v1/companies",
    get: (id: number) => `/api/v1/companies/${id}`,
    create: "/api/v1/companies",
    update: (id: number) => `/api/v1/companies/${id}`,
    feedEvents: (id: number) => `/api/v1/companies/${id}/feed_events`,
    comments: (id: number) => `/api/v1/companies/${id}/comments`,
  },
  pipelines: {
    list: "/api/v1/pipelines",
    get: (id: number) => `/api/v1/pipelines/${id}`,
    create: "/api/v1/pipelines",
    update: (id: number) => `/api/v1/pipelines/${id}`,
  },
  teams: {
    list: "/api/v1/teams",
    get: (id: number) => `/api/v1/teams/${id}`,
    create: "/api/v1/teams",
    update: (id: number) => `/api/v1/teams/${id}`,
    addMember: (id: number) => `/api/v1/teams/${id}/members`,
    removeMember: (id: number, userId: number) => `/api/v1/teams/${id}/members/${userId}`,
  },
  groups: {
    list: "/api/v1/groups",
    get: (id: number) => `/api/v1/groups/${id}`,
    create: "/api/v1/groups",
    update: (id: number) => `/api/v1/groups/${id}`,
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
  },
  notifications: {
    list: "/api/v1/notifications",
    unreadCount: "/api/v1/notifications/unread_count",
    markRead: (id: number) => `/api/v1/notifications/${id}/read`,
    markAllRead: "/api/v1/notifications/read_all",
  },
  search: "/api/v1/search",
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
