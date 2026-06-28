import { z } from "zod";
import type { CrewioClient } from "../../lib/crewio.js";
import {
  commentableTypeSchema,
  customFieldTypeSchema,
  customizableTypeSchema,
  dealReportTypeSchema,
  dealStatusSchema,
  pipelineStageTypeSchema,
} from "../../lib/enums.js";
import { buildListQueryParams } from "../../lib/query-params.js";

export interface ActionDefinition {
  slug: string;
  /** Owning resource slug (for grouping in describe_resource), or undefined for global actions. */
  resource?: string;
  description: string;
  params: z.ZodTypeAny;
  execute: (client: CrewioClient, params: unknown) => Promise<unknown>;
}

/** Binds a Zod schema to a typed executor, erasing the generic for storage in a flat registry. */
function defineAction<T extends z.ZodTypeAny>(def: {
  slug: string;
  resource?: string;
  description: string;
  params: T;
  execute: (client: CrewioClient, params: z.infer<T>) => Promise<unknown>;
}): ActionDefinition {
  return {
    slug: def.slug,
    resource: def.resource,
    description: def.description,
    params: def.params,
    execute: (client, raw) => def.execute(client, def.params.parse(raw)),
  };
}

const id = z.number().int().positive();
const idList = z.array(id).min(1);

const definitions: ActionDefinition[] = [
  // ─── Deal specials ──────────────────────────────────────────────────────────
  defineAction({
    slug: "move_deal",
    resource: "deal",
    description: "Move a deal to another stage and position (kanban reorder, same pipeline).",
    params: z.object({
      id,
      pipeline_stage_id: id,
      position: z.number().int().positive(),
      lost_reason: z.string().optional(),
    }),
    execute: (client, p) => {
      const attrs: Record<string, unknown> = {
        pipeline_stage_id: p.pipeline_stage_id,
        position: p.position,
      };
      if (p.lost_reason) attrs["lost_reason"] = p.lost_reason;
      return client.deals.move(p.id, attrs);
    },
  }),
  defineAction({
    slug: "bulk_discard_deals",
    resource: "deal",
    description: "Archive multiple deals by ID.",
    params: z.object({ ids: idList }),
    execute: (client, p) => client.deals.bulkDiscard(p.ids),
  }),
  defineAction({
    slug: "bulk_delete_deals",
    resource: "deal",
    description: "Permanently delete multiple deals by ID.",
    params: z.object({ ids: idList }),
    execute: (client, p) => client.deals.bulkDestroy(p.ids),
  }),
  defineAction({
    slug: "bulk_move_deals",
    resource: "deal",
    description: "Move multiple deals to a pipeline stage (appended at end).",
    params: z.object({ ids: idList, pipeline_stage_id: id, lost_reason: z.string().optional() }),
    execute: (client, p) => client.deals.bulkMove(p.pipeline_stage_id, p.ids, p.lost_reason),
  }),
  defineAction({
    slug: "bulk_update_deal_status",
    resource: "deal",
    description: "Update status for multiple deals (e.g. mark won or lost).",
    params: z.object({ ids: idList, status: dealStatusSchema, lost_reason: z.string().optional() }),
    execute: (client, p) => client.deals.bulkUpdateStatus(p.status, p.ids, p.lost_reason),
  }),
  defineAction({
    slug: "get_deal_feed",
    resource: "deal",
    description: "Get the activity feed for a single deal.",
    params: z.object({
      id,
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }),
    execute: (client, p) => client.deals.feedEvents(p.id, buildPageParams(p.page, p.limit)),
  }),
  defineAction({
    slug: "get_deal_report",
    resource: "deal",
    description:
      "Run a read-only deal analytics report (pipeline_overview, deal_funnel, win_loss_analysis, revenue_forecast, team_performance, source_attribution, deals_at_risk, sales_cycle, conversion_rate, stage_residency).",
    params: z.object({
      type: dealReportTypeSchema,
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      pipeline_id: z.array(id).optional(),
      group_by: z.string().optional(),
      page: z.number().int().positive().optional(),
      per_page: z.number().int().positive().max(100).optional(),
    }),
    execute: (client, p) => {
      const params: Record<string, string | string[]> = {};
      if (p.date_from) params["date_from"] = p.date_from;
      if (p.date_to) params["date_to"] = p.date_to;
      if (p.group_by) params["group_by"] = p.group_by;
      if (p.page) params["page"] = String(p.page);
      if (p.per_page) params["per_page"] = String(p.per_page);
      if (p.pipeline_id?.length) params["pipeline_id"] = p.pipeline_id.map(String);
      return client.reports.deals(p.type, params);
    },
  }),

  // ─── Contact specials ─────────────────────────────────────────────────────────
  defineAction({
    slug: "list_contact_companies",
    resource: "contact",
    description: "List companies linked to a contact (with role on each link).",
    params: z.object({ contact_id: id }),
    execute: (client, p) => client.contacts.listCompanies(p.contact_id),
  }),
  defineAction({
    slug: "link_contact_company",
    resource: "contact",
    description: "Link a contact to a company, optionally with a role label.",
    params: z.object({ contact_id: id, company_id: id, role: z.string().optional() }),
    execute: (client, p) => client.contacts.linkCompany(p.contact_id, p.company_id, p.role),
  }),
  defineAction({
    slug: "update_contact_company_link",
    resource: "contact",
    description: "Update the role label on a contact-company link.",
    params: z.object({ contact_id: id, link_id: id, role: z.string() }),
    execute: (client, p) => client.contacts.updateCompanyLink(p.contact_id, p.link_id, p.role),
  }),
  defineAction({
    slug: "unlink_contact_company",
    resource: "contact",
    description: "Remove a contact-company link.",
    params: z.object({ contact_id: id, link_id: id }),
    execute: (client, p) => client.contacts.unlinkCompany(p.contact_id, p.link_id),
  }),
  defineAction({
    slug: "bulk_discard_contacts",
    resource: "contact",
    description: "Archive multiple contacts by ID.",
    params: z.object({ ids: idList }),
    execute: (client, p) => client.contacts.bulkDiscard(p.ids),
  }),
  defineAction({
    slug: "bulk_delete_contacts",
    resource: "contact",
    description: "Permanently delete multiple contacts by ID.",
    params: z.object({ ids: idList }),
    execute: (client, p) => client.contacts.bulkDestroy(p.ids),
  }),
  defineAction({
    slug: "get_contact_feed",
    resource: "contact",
    description: "Get the activity feed for a single contact.",
    params: z.object({
      id,
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }),
    execute: (client, p) => client.contacts.feedEvents(p.id, buildPageParams(p.page, p.limit)),
  }),

  // ─── Company specials ─────────────────────────────────────────────────────────
  defineAction({
    slug: "bulk_discard_companies",
    resource: "company",
    description: "Archive multiple companies by ID.",
    params: z.object({ ids: idList }),
    execute: (client, p) => client.companies.bulkDiscard(p.ids),
  }),
  defineAction({
    slug: "bulk_delete_companies",
    resource: "company",
    description: "Permanently delete multiple companies by ID.",
    params: z.object({ ids: idList }),
    execute: (client, p) => client.companies.bulkDestroy(p.ids),
  }),
  defineAction({
    slug: "get_company_feed",
    resource: "company",
    description: "Get the activity feed for a single company.",
    params: z.object({
      id,
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }),
    execute: (client, p) => client.companies.feedEvents(p.id, buildPageParams(p.page, p.limit)),
  }),

  // ─── Pipeline stage specials ────────────────────────────────────────────────
  defineAction({
    slug: "get_pipeline_board",
    resource: "pipeline",
    description: "Get the full kanban board for a pipeline (stages with their deals).",
    params: z.object({ id, q: z.string().optional() }),
    execute: (client, p) => {
      const params: Record<string, string> = { include_deals: "true" };
      if (p.q) params["q"] = p.q;
      return client.pipelines.get(p.id, params);
    },
  }),
  defineAction({
    slug: "create_pipeline_stage",
    resource: "pipeline",
    description: "Create a new stage in a pipeline.",
    params: z.object({
      pipeline_id: id,
      name: z.string().min(1),
      color: z.string().optional(),
      position: z.number().int().positive().optional(),
      stage_type: pipelineStageTypeSchema.optional(),
    }),
    execute: (client, p) => {
      const { pipeline_id, ...attrs } = p;
      return client.pipelines.createStage(pipeline_id, attrs);
    },
  }),
  defineAction({
    slug: "update_pipeline_stage",
    resource: "pipeline",
    description: "Update a pipeline stage.",
    params: z.object({
      pipeline_id: id,
      stage_id: id,
      name: z.string().min(1).optional(),
      color: z.string().optional(),
      position: z.number().int().positive().optional(),
      stage_type: pipelineStageTypeSchema.optional(),
    }),
    execute: (client, p) => {
      const { pipeline_id, stage_id, ...attrs } = p;
      return client.pipelines.updateStage(pipeline_id, stage_id, attrs);
    },
  }),
  defineAction({
    slug: "discard_pipeline_stage",
    resource: "pipeline",
    description: "Archive a pipeline stage and its deals.",
    params: z.object({ pipeline_id: id, stage_id: id }),
    execute: (client, p) => client.pipelines.discardStage(p.pipeline_id, p.stage_id),
  }),
  defineAction({
    slug: "restore_pipeline_stage",
    resource: "pipeline",
    description: "Restore an archived pipeline stage.",
    params: z.object({ pipeline_id: id, stage_id: id }),
    execute: (client, p) => client.pipelines.restoreStage(p.pipeline_id, p.stage_id),
  }),
  defineAction({
    slug: "delete_pipeline_stage",
    resource: "pipeline",
    description: "Permanently delete a pipeline stage.",
    params: z.object({ pipeline_id: id, stage_id: id }),
    execute: (client, p) => client.pipelines.destroyStage(p.pipeline_id, p.stage_id),
  }),

  // ─── Team / group membership ────────────────────────────────────────────────
  defineAction({
    slug: "add_team_member",
    resource: "team",
    description: "Add a workspace member to a team.",
    params: z.object({ team_id: id, user_id: id }),
    execute: (client, p) => client.teams.addMember(p.team_id, p.user_id),
  }),
  defineAction({
    slug: "remove_team_member",
    resource: "team",
    description: "Remove a member from a team.",
    params: z.object({ team_id: id, user_id: id }),
    execute: (client, p) => client.teams.removeMember(p.team_id, p.user_id),
  }),
  defineAction({
    slug: "add_group_member",
    resource: "group",
    description: "Add a workspace member to a group.",
    params: z.object({ group_id: id, user_id: id }),
    execute: (client, p) => client.groups.addMember(p.group_id, p.user_id),
  }),
  defineAction({
    slug: "remove_group_member",
    resource: "group",
    description: "Remove a member from a group.",
    params: z.object({ group_id: id, user_id: id }),
    execute: (client, p) => client.groups.removeMember(p.group_id, p.user_id),
  }),

  // ─── Comments ─────────────────────────────────────────────────────────────────
  defineAction({
    slug: "list_comments",
    resource: "comment",
    description: "List comments on a deal, contact, or company.",
    params: z.object({
      commentable_type: commentableTypeSchema,
      commentable_id: id,
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }),
    execute: (client, p) =>
      client.comments.list(p.commentable_type, p.commentable_id, buildPageParams(p.page, p.limit)),
  }),
  defineAction({
    slug: "create_comment",
    resource: "comment",
    description:
      "Post a comment on a deal, contact, or company. To @-mention a user/team/group, " +
      "embed an HTML node in body — plain '@Name' text is NOT a mention and notifies no one. " +
      'Format: <span data-type="mention" data-mentionable-type="user|team|group" ' +
      'data-id="<id>" data-label="<Name>">@<Name></span>. ' +
      "The id must be the member's user_id from search results (NOT the membership id) for users, " +
      'or the team/group id. Example body: \'Hey <span data-type="mention" ' +
      'data-mentionable-type="user" data-id="42" data-label="Alice Park">@Alice Park</span> ping\'.',
    params: z.object({
      body: z
        .string()
        .min(1)
        .describe(
          "Comment text. May contain HTML. Mentions must be " +
            '<span data-type="mention" data-mentionable-type="user|team|group" data-id="<id>" ' +
            'data-label="<Name>">@<Name></span> nodes; plain @Name text does not notify anyone.',
        ),
      commentable_type: commentableTypeSchema,
      commentable_id: id,
    }),
    execute: (client, p) => client.comments.create(p.commentable_type, p.commentable_id, p.body),
  }),
  defineAction({
    slug: "update_comment",
    resource: "comment",
    description:
      "Update a comment body. Same mention rules as create_comment: @-mentions must be HTML " +
      '<span data-type="mention" data-mentionable-type="user|team|group" data-id="<id>" ' +
      'data-label="<Name>">@<Name></span> nodes (user_id for users), not plain @Name text.',
    params: z.object({ id, body: z.string().min(1) }),
    execute: (client, p) => client.comments.update(p.id, p.body),
  }),
  defineAction({
    slug: "delete_comment",
    resource: "comment",
    description: "Permanently delete a comment.",
    params: z.object({ id }),
    execute: (client, p) => client.comments.destroy(p.id),
  }),
  defineAction({
    slug: "discard_comment",
    resource: "comment",
    description: "Archive (soft delete) a comment.",
    params: z.object({ id }),
    execute: (client, p) => client.comments.discard(p.id),
  }),
  defineAction({
    slug: "restore_comment",
    resource: "comment",
    description: "Restore an archived comment.",
    params: z.object({ id }),
    execute: (client, p) => client.comments.restore(p.id),
  }),

  // ─── Reactions ────────────────────────────────────────────────────────────────
  defineAction({
    slug: "create_reaction",
    resource: "reaction",
    description:
      "Add an emoji reaction to a comment. Idempotent — repeating the same emoji " +
      "returns the existing reaction instead of creating a duplicate.",
    params: z.object({
      comment_id: id,
      emoji: z.string().min(1).describe("Emoji to react with (e.g. 👍, 🎉, 💪)"),
    }),
    execute: (client, p) => client.reactions.create(p.comment_id, p.emoji),
  }),
  defineAction({
    slug: "remove_reaction",
    resource: "reaction",
    description:
      "Remove your emoji reaction from a comment. Only the reaction author can remove it.",
    params: z.object({
      comment_id: id,
      reaction_id: id,
    }),
    execute: (client, p) => client.reactions.destroy(p.comment_id, p.reaction_id),
  }),

  // ─── Custom field definitions ──────────────────────────────────────────────────
  defineAction({
    slug: "create_custom_field_definition",
    resource: "custom_field_definition",
    description: "Create a custom field definition for Deal, Contact, or Company.",
    params: z.object({
      name: z.string().min(1),
      field_type: customFieldTypeSchema,
      customizable_type: customizableTypeSchema,
      required: z.boolean().optional(),
      position: z.number().int().optional(),
      placeholder: z.string().optional(),
      options: z.array(z.string()).optional(),
    }),
    execute: (client, p) => client.customFieldDefinitions.create(p),
  }),

  // ─── Notifications ──────────────────────────────────────────────────────────────
  defineAction({
    slug: "get_unread_notification_count",
    resource: "notification",
    description: "Count unread notifications for the authenticated user.",
    params: z.object({}),
    execute: (client) => client.notifications.unreadCount(),
  }),
  defineAction({
    slug: "mark_notification_read",
    resource: "notification",
    description: "Mark a single notification as read.",
    params: z.object({ id }),
    execute: (client, p) => client.notifications.markRead(p.id),
  }),
  defineAction({
    slug: "mark_all_notifications_read",
    resource: "notification",
    description: "Mark all notifications as read.",
    params: z.object({}),
    execute: (client) => client.notifications.markAllRead(),
  }),

  // ─── Feed scoped ────────────────────────────────────────────────────────────────
  defineAction({
    slug: "feed_by_actor",
    resource: "feed",
    description: "List feed events performed by a specific user (actor ID).",
    params: z.object({
      actor_id: id,
      trackable_type: commentableTypeSchema.optional(),
      trackable_id: z.number().int().positive().optional(),
      action: z.string().optional(),
      created_at_from: z.string().optional(),
      created_at_to: z.string().optional(),
      sort: z.string().optional(),
      direction: z.enum(["asc", "desc"]).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }),
    execute: (client, p) => {
      const params = buildListQueryParams({
        page: p.page,
        limit: p.limit,
        sort: p.sort,
        direction: p.direction,
        extra: {
          trackable_type: p.trackable_type,
          trackable_id: p.trackable_id ? String(p.trackable_id) : undefined,
          action: p.action,
          created_at_from: p.created_at_from,
          created_at_to: p.created_at_to,
        },
      });
      return client.feed.byActor(p.actor_id, params);
    },
  }),

  // ─── Global reads ─────────────────────────────────────────────────────────────
  defineAction({
    slug: "get_me",
    description: "Get the authenticated user's profile.",
    params: z.object({}),
    execute: (client) => client.me.show(),
  }),
  defineAction({
    slug: "get_calendar",
    description:
      "Get calendar events derived from deal close dates within a date range (max 366 days).",
    params: z.object({ from: z.string(), to: z.string() }),
    execute: (client, p) => client.calendar.show(p.from, p.to),
  }),
  defineAction({
    slug: "get_recycle_bin",
    description: "List all archived (discarded) records in the workspace, grouped by type.",
    params: z.object({}),
    execute: (client) => client.recycleBin.show(),
  }),
];

function buildPageParams(page?: number, limit?: number): Record<string, string> {
  const params: Record<string, string> = {};
  if (page) params["page"] = String(page);
  if (limit) params["limit"] = String(limit);
  return params;
}

const actionRegistry = new Map<string, ActionDefinition>(definitions.map((d) => [d.slug, d]));

export function getAction(slug: string): ActionDefinition | undefined {
  return actionRegistry.get(slug);
}

export function listActions(): ActionDefinition[] {
  return [...actionRegistry.values()];
}

export function actionsForResource(resource: string): ActionDefinition[] {
  return [...actionRegistry.values()].filter((a) => a.resource === resource);
}

export function globalActions(): ActionDefinition[] {
  return [...actionRegistry.values()].filter((a) => a.resource === undefined);
}
