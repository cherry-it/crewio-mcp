import { commentableCommentsPath, endpoints, type CommentableType } from "./endpoints.js";

export interface AuthContext {
  token: string;
  workspaceId: string;
}

export class CrewioApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Crewio API error ${status}`);
  }
}

export function createCrewioClient(baseUrl: string, auth: AuthContext) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${auth.token}`,
        "X-Workspace-Id": auth.workspaceId,
        ...(options.headers as Record<string, string>),
      },
    });

    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new CrewioApiError(res.status, json);
    }

    return json as T;
  }

  return {
    // ─── Deals ──────────────────────────────────────────────────────────────

    deals: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.deals.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.deals.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.deals.create, {
          method: "POST",
          body: JSON.stringify({ deal: attrs }),
        });
      },
      update(id: number, attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.deals.update(id), {
          method: "PATCH",
          body: JSON.stringify({ deal: attrs }),
        });
      },
      feedEvents(id: number, params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.deals.feedEvents(id)}${qs}`);
      },
    },

    // ─── Contacts ───────────────────────────────────────────────────────────

    contacts: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.contacts.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.contacts.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.contacts.create, {
          method: "POST",
          body: JSON.stringify({ contact: attrs }),
        });
      },
      update(id: number, attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.contacts.update(id), {
          method: "PATCH",
          body: JSON.stringify({ contact: attrs }),
        });
      },
      feedEvents(id: number, params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.contacts.feedEvents(id)}${qs}`);
      },
    },

    // ─── Companies ──────────────────────────────────────────────────────────

    companies: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.companies.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.companies.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.companies.create, {
          method: "POST",
          body: JSON.stringify({ company: attrs }),
        });
      },
      update(id: number, attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.companies.update(id), {
          method: "PATCH",
          body: JSON.stringify({ company: attrs }),
        });
      },
      feedEvents(id: number, params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.companies.feedEvents(id)}${qs}`);
      },
    },

    // ─── Comments (nested under deal/contact/company) ───────────────────────

    comments: {
      list(
        commentableType: CommentableType,
        commentableId: number,
        params?: Record<string, string>,
      ) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${commentableCommentsPath(commentableType, commentableId)}${qs}`);
      },
      create(commentableType: CommentableType, commentableId: number, body: string) {
        return request<unknown>(commentableCommentsPath(commentableType, commentableId), {
          method: "POST",
          body: JSON.stringify({ comment: { body } }),
        });
      },
    },

    // ─── Activity feed ───────────────────────────────────────────────────────

    feed: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.feed.list}${qs}`);
      },
    },

    // ─── Pipelines ──────────────────────────────────────────────────────────

    pipelines: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.pipelines.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.pipelines.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.pipelines.create, {
          method: "POST",
          body: JSON.stringify({ pipeline: attrs }),
        });
      },
      update(id: number, attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.pipelines.update(id), {
          method: "PATCH",
          body: JSON.stringify({ pipeline: attrs }),
        });
      },
    },

    // ─── Teams ──────────────────────────────────────────────────────────────

    teams: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.teams.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.teams.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.teams.create, {
          method: "POST",
          body: JSON.stringify({ team: attrs }),
        });
      },
      update(id: number, attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.teams.update(id), {
          method: "PATCH",
          body: JSON.stringify({ team: attrs }),
        });
      },
      addMember(id: number, userId: number) {
        return request<unknown>(endpoints.teams.addMember(id), {
          method: "POST",
          body: JSON.stringify({ user_id: userId }),
        });
      },
      removeMember(id: number, userId: number) {
        return request<unknown>(endpoints.teams.removeMember(id, userId), {
          method: "DELETE",
        });
      },
    },

    // ─── Groups ─────────────────────────────────────────────────────────────

    groups: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.groups.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.groups.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.groups.create, {
          method: "POST",
          body: JSON.stringify({ group: attrs }),
        });
      },
      update(id: number, attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.groups.update(id), {
          method: "PATCH",
          body: JSON.stringify({ group: attrs }),
        });
      },
      addMember(id: number, userId: number) {
        return request<unknown>(endpoints.groups.addMember(id), {
          method: "POST",
          body: JSON.stringify({ user_id: userId }),
        });
      },
      removeMember(id: number, userId: number) {
        return request<unknown>(endpoints.groups.removeMember(id, userId), {
          method: "DELETE",
        });
      },
    },

    // ─── Workspace invitations ───────────────────────────────────────────────

    invitations: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.invitations.list}${qs}`);
      },
      create(attrs: Record<string, unknown>) {
        return request<unknown>(endpoints.invitations.create, {
          method: "POST",
          body: JSON.stringify({ invitation: attrs }),
        });
      },
      cancel(id: number) {
        return request<unknown>(endpoints.invitations.cancel(id), {
          method: "DELETE",
        });
      },
    },

    // ─── Workspace members ───────────────────────────────────────────────────

    members: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.members.list}${qs}`);
      },
      get(id: number) {
        return request<unknown>(endpoints.members.get(id));
      },
      update(id: number, role: string) {
        return request<unknown>(endpoints.members.update(id), {
          method: "PATCH",
          body: JSON.stringify({ member: { role } }),
        });
      },
    },

    // ─── Notifications (current user + workspace) ────────────────────────────

    notifications: {
      list(params?: Record<string, string>) {
        const qs = params ? `?${new URLSearchParams(params)}` : "";
        return request<unknown>(`${endpoints.notifications.list}${qs}`);
      },
      unreadCount() {
        return request<unknown>(endpoints.notifications.unreadCount);
      },
      markRead(id: number) {
        return request<unknown>(endpoints.notifications.markRead(id), {
          method: "PATCH",
        });
      },
      markAllRead() {
        return request<unknown>(endpoints.notifications.markAllRead, {
          method: "PATCH",
        });
      },
    },

    // ─── Search ─────────────────────────────────────────────────────────────

    search(query: string) {
      return request<unknown>(`${endpoints.search}?q=${encodeURIComponent(query)}`);
    },
  };
}

export type CrewioClient = ReturnType<typeof createCrewioClient>;
