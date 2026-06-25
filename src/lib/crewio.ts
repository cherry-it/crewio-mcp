import {
  commentableCommentsPath,
  endpoints,
  queryString,
  type CommentableType,
} from "./endpoints.js";

export interface AuthContext {
  token: string;
  workspaceId: string;
  /** Value sent as X-Source-Type to the Crewio API. Defaults to "mcp". */
  sourceType?: string;
}

export interface PaginationMeta {
  currentPage: string;
  totalCount: string;
  totalPages: string;
  pageLimit: string;
}

export interface CrewioResult<T> {
  body: T;
  pagination?: PaginationMeta;
}

export class CrewioApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Crewio API error ${status}`);
  }
}

/** Parses API JSON, unwrapping Alba double-encoded string payloads when present. */
export function parseApiJson(text: string): unknown {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return JSON.parse(trimmed);
    }
  }
  return parsed;
}

function extractPagination(res: Response): PaginationMeta | undefined {
  const currentPage = res.headers.get("current-page");
  if (!currentPage) return undefined;
  return {
    currentPage,
    totalCount: res.headers.get("total-count") ?? "",
    totalPages: res.headers.get("total-pages") ?? "",
    pageLimit: res.headers.get("page-limit") ?? "",
  };
}

export function createCrewioClient(baseUrl: string, auth: AuthContext) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<CrewioResult<T> | T> {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${auth.token}`,
        "X-Workspace-Id": auth.workspaceId,
        "X-Source-Type": auth.sourceType ?? "mcp",
        ...(options.headers as Record<string, string>),
      },
    });

    const text = await res.text();
    const json: unknown = text ? parseApiJson(text) : null;

    if (!res.ok) {
      throw new CrewioApiError(res.status, json);
    }

    const pagination = extractPagination(res);
    if (pagination) {
      return { body: json as T, pagination };
    }
    return json as T;
  }

  function list<T>(path: string, params?: Record<string, string | string[]>) {
    return request<T>(`${path}${queryString(params)}`);
  }

  function get<T>(path: string, params?: Record<string, string | string[]>) {
    return request<T>(`${path}${queryString(params)}`);
  }

  function post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  function patch<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  function del<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  function wrapResource(key: string, attrs: Record<string, unknown>) {
    return { [key]: attrs };
  }

  return {
    deals: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.deals.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.deals.get(id));
      },
      create(pipelineId: number, attrs: Record<string, unknown>) {
        return post<unknown>(
          endpoints.pipelines.createDeal(pipelineId),
          wrapResource("deal", attrs),
        );
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.deals.update(id), wrapResource("deal", attrs));
      },
      move(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.deals.move(id), wrapResource("deal", attrs));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.deals.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.deals.restore(id));
      },
      destroy(id: number) {
        return del<unknown>(endpoints.deals.destroy(id));
      },
      bulkDiscard(ids: number[]) {
        return patch<unknown>(endpoints.deals.bulkDiscard, { ids });
      },
      bulkDestroy(ids: number[]) {
        return del<unknown>(endpoints.deals.bulkDestroy, { ids });
      },
      bulkMove(pipelineStageId: number, ids: number[], lostReason?: string) {
        const body: Record<string, unknown> = { ids, pipeline_stage_id: pipelineStageId };
        if (lostReason) body["lost_reason"] = lostReason;
        return patch<unknown>(endpoints.deals.bulkMove, body);
      },
      bulkUpdateStatus(status: string, ids: number[], lostReason?: string) {
        const body: Record<string, unknown> = { ids, status };
        if (lostReason) body["lost_reason"] = lostReason;
        return patch<unknown>(endpoints.deals.bulkUpdateStatus, body);
      },
      feedEvents(id: number, params?: Record<string, string>) {
        return list<unknown>(endpoints.deals.feedEvents(id), params);
      },
    },

    contacts: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.contacts.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.contacts.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.contacts.create, wrapResource("contact", attrs));
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.contacts.update(id), wrapResource("contact", attrs));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.contacts.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.contacts.restore(id));
      },
      destroy(id: number) {
        return del<unknown>(endpoints.contacts.destroy(id));
      },
      bulkDiscard(ids: number[]) {
        return patch<unknown>(endpoints.contacts.bulkDiscard, { ids });
      },
      bulkDestroy(ids: number[]) {
        return del<unknown>(endpoints.contacts.bulkDestroy, { ids });
      },
      feedEvents(id: number, params?: Record<string, string>) {
        return list<unknown>(endpoints.contacts.feedEvents(id), params);
      },
      listCompanies(contactId: number) {
        return get<unknown>(endpoints.contacts.companies(contactId));
      },
      linkCompany(contactId: number, companyId: number, role?: string) {
        const attrs: Record<string, unknown> = { company_id: companyId };
        if (role) attrs["role"] = role;
        return post<unknown>(
          endpoints.contacts.companies(contactId),
          wrapResource("company_contact", attrs),
        );
      },
      updateCompanyLink(contactId: number, linkId: number, role: string) {
        return patch<unknown>(
          endpoints.contacts.companyLink(contactId, linkId),
          wrapResource("company_contact", { role }),
        );
      },
      unlinkCompany(contactId: number, linkId: number) {
        return del<unknown>(endpoints.contacts.companyLink(contactId, linkId));
      },
    },

    companies: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.companies.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.companies.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.companies.create, wrapResource("company", attrs));
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.companies.update(id), wrapResource("company", attrs));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.companies.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.companies.restore(id));
      },
      destroy(id: number) {
        return del<unknown>(endpoints.companies.destroy(id));
      },
      bulkDiscard(ids: number[]) {
        return patch<unknown>(endpoints.companies.bulkDiscard, { ids });
      },
      bulkDestroy(ids: number[]) {
        return del<unknown>(endpoints.companies.bulkDestroy, { ids });
      },
      feedEvents(id: number, params?: Record<string, string>) {
        return list<unknown>(endpoints.companies.feedEvents(id), params);
      },
    },

    comments: {
      list(
        commentableType: CommentableType,
        commentableId: number,
        params?: Record<string, string>,
      ) {
        return list<unknown>(commentableCommentsPath(commentableType, commentableId), params);
      },
      create(commentableType: CommentableType, commentableId: number, body: string) {
        return post<unknown>(
          commentableCommentsPath(commentableType, commentableId),
          wrapResource("comment", { body }),
        );
      },
      update(id: number, body: string) {
        return patch<unknown>(endpoints.comments.update(id), wrapResource("comment", { body }));
      },
      destroy(id: number) {
        return del<unknown>(endpoints.comments.destroy(id));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.comments.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.comments.restore(id));
      },
    },

    feed: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.feed.list, params);
      },
      byActor(actorId: number, params?: Record<string, string>) {
        return list<unknown>(endpoints.feed.byActor(actorId), params);
      },
    },

    pipelines: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.pipelines.list, params);
      },
      get(id: number, params?: Record<string, string>) {
        return get<unknown>(endpoints.pipelines.get(id), params);
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.pipelines.create, wrapResource("pipeline", attrs));
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.pipelines.update(id), wrapResource("pipeline", attrs));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.pipelines.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.pipelines.restore(id));
      },
      destroy(id: number) {
        return del<unknown>(endpoints.pipelines.destroy(id));
      },
      createStage(pipelineId: number, attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.pipelines.stages(pipelineId), wrapResource("stage", attrs));
      },
      updateStage(pipelineId: number, stageId: number, attrs: Record<string, unknown>) {
        return patch<unknown>(
          endpoints.pipelines.stage(pipelineId, stageId),
          wrapResource("stage", attrs),
        );
      },
      discardStage(pipelineId: number, stageId: number) {
        return patch<unknown>(endpoints.pipelines.stageDiscard(pipelineId, stageId));
      },
      restoreStage(pipelineId: number, stageId: number) {
        return patch<unknown>(endpoints.pipelines.stageRestore(pipelineId, stageId));
      },
      destroyStage(pipelineId: number, stageId: number) {
        return del<unknown>(endpoints.pipelines.stage(pipelineId, stageId));
      },
    },

    teams: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.teams.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.teams.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.teams.create, wrapResource("team", attrs));
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.teams.update(id), wrapResource("team", attrs));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.teams.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.teams.restore(id));
      },
      addMember(id: number, userId: number) {
        return post<unknown>(endpoints.teams.addMember(id), { user_id: userId });
      },
      removeMember(id: number, userId: number) {
        return del<unknown>(endpoints.teams.removeMember(id, userId));
      },
    },

    groups: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.groups.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.groups.get(id));
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.groups.create, wrapResource("group", attrs));
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(endpoints.groups.update(id), wrapResource("group", attrs));
      },
      discard(id: number) {
        return patch<unknown>(endpoints.groups.discard(id));
      },
      restore(id: number) {
        return patch<unknown>(endpoints.groups.restore(id));
      },
      addMember(id: number, userId: number) {
        return post<unknown>(endpoints.groups.addMember(id), { user_id: userId });
      },
      removeMember(id: number, userId: number) {
        return del<unknown>(endpoints.groups.removeMember(id, userId));
      },
    },

    invitations: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.invitations.list, params);
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(endpoints.invitations.create, wrapResource("invitation", attrs));
      },
      cancel(id: number) {
        return del<unknown>(endpoints.invitations.cancel(id));
      },
    },

    members: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.members.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.members.get(id));
      },
      update(id: number, role: string) {
        return patch<unknown>(endpoints.members.update(id), wrapResource("member", { role }));
      },
    },

    notifications: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.notifications.list, params);
      },
      unreadCount() {
        return get<unknown>(endpoints.notifications.unreadCount);
      },
      markRead(id: number) {
        return patch<unknown>(endpoints.notifications.markRead(id));
      },
      markAllRead() {
        return patch<unknown>(endpoints.notifications.markAllRead);
      },
    },

    search(query: string) {
      return get<unknown>(endpoints.search, { q: query });
    },

    me: {
      show() {
        return get<unknown>(endpoints.me);
      },
    },

    workspaces: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.workspaces.list, params);
      },
      get(id: number) {
        return get<unknown>(endpoints.workspaces.get(id));
      },
    },

    customFieldDefinitions: {
      list(params?: Record<string, string>) {
        return list<unknown>(endpoints.customFieldDefinitions.list, params);
      },
      create(attrs: Record<string, unknown>) {
        return post<unknown>(
          endpoints.customFieldDefinitions.create,
          wrapResource("custom_field_definition", attrs),
        );
      },
      update(id: number, attrs: Record<string, unknown>) {
        return patch<unknown>(
          endpoints.customFieldDefinitions.update(id),
          wrapResource("custom_field_definition", attrs),
        );
      },
      destroy(id: number) {
        return del<unknown>(endpoints.customFieldDefinitions.destroy(id));
      },
    },

    calendar: {
      show(from: string, to: string) {
        return get<unknown>(endpoints.calendar, { from, to });
      },
    },

    recycleBin: {
      show() {
        return get<unknown>(endpoints.recycleBin);
      },
    },

    reports: {
      deals(type: string, params?: Record<string, string | string[]>) {
        return get<unknown>(endpoints.reports.deals(type), params);
      },
    },
  };
}

export type CrewioClient = ReturnType<typeof createCrewioClient>;
