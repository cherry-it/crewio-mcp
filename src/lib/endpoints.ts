export const endpoints = {
  deals: {
    list: "/api/v1/deals",
    get: (id: number) => `/api/v1/deals/${id}`,
    create: "/api/v1/deals",
    update: (id: number) => `/api/v1/deals/${id}`,
  },
  contacts: {
    list: "/api/v1/contacts",
    get: (id: number) => `/api/v1/contacts/${id}`,
    create: "/api/v1/contacts",
    update: (id: number) => `/api/v1/contacts/${id}`,
  },
  companies: {
    list: "/api/v1/companies",
    get: (id: number) => `/api/v1/companies/${id}`,
    create: "/api/v1/companies",
    update: (id: number) => `/api/v1/companies/${id}`,
  },
  comments: {
    list: "/api/v1/comments",
    create: "/api/v1/comments",
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
  search: "/api/v1/search",
} as const;
