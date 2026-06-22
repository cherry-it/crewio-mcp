import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import {
  customFieldsBodySchema,
  dealPrioritySchema,
  dealSourceSchema,
  dealStatusSchema,
} from "../lib/enums.js";
import {
  archivedFilterSchema,
  buildListQueryParams,
  customFieldFilterSchema,
  paginationSchema,
  sortSchema,
} from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

function attrsWithCustomFields(
  attrs: Record<string, unknown>,
  customFields?: Record<string, string>,
): Record<string, unknown> {
  if (customFields && Object.keys(customFields).length > 0) {
    attrs["custom_fields"] = customFields;
  }
  return attrs;
}

export function registerDealTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_deals",
    {
      description:
        "List deals in the workspace. Supports search, filters, sort, custom field filters, and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search query to filter deals by title"),
        status: dealStatusSchema.optional().describe("Filter by deal status"),
        pipeline: z.coerce.number().int().positive().optional().describe("Filter by pipeline ID"),
        pipeline_stage: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter by pipeline stage ID"),
        company: z.coerce.number().int().positive().optional().describe("Filter by company ID"),
        assignee: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter by assignee user ID"),
        priority: dealPrioritySchema.optional().describe("Filter by deal priority"),
        source: dealSourceSchema.optional().describe("Filter by deal source"),
        value_min: z.coerce.number().optional().describe("Minimum deal value (inclusive)"),
        value_max: z.coerce.number().optional().describe("Maximum deal value (inclusive)"),
        close_date_from: z
          .string()
          .optional()
          .describe("Expected close date on or after (YYYY-MM-DD)"),
        close_date_to: z
          .string()
          .optional()
          .describe("Expected close date on or before (YYYY-MM-DD)"),
        archived: archivedFilterSchema,
        custom_fields: customFieldFilterSchema,
        ...sortSchema,
        ...paginationSchema,
      },
    },
    async (input) => {
      try {
        const params = buildListQueryParams({
          page: input.page,
          limit: input.limit,
          sort: input.sort,
          direction: input.direction,
          customFields: input.custom_fields,
          extra: {
            q: input.q,
            status: input.status,
            pipeline: input.pipeline ? String(input.pipeline) : undefined,
            pipeline_stage: input.pipeline_stage ? String(input.pipeline_stage) : undefined,
            company: input.company ? String(input.company) : undefined,
            assignee: input.assignee ? String(input.assignee) : undefined,
            priority: input.priority,
            source: input.source,
            value_min: input.value_min !== undefined ? String(input.value_min) : undefined,
            value_max: input.value_max !== undefined ? String(input.value_max) : undefined,
            close_date_from: input.close_date_from,
            close_date_to: input.close_date_to,
            archived: input.archived,
          },
        });
        return successContent(await client.deals.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_deal",
    {
      description:
        "Get full details of a single deal by ID, including pipeline stage, contacts, company, assignees, and custom fields.",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
      },
    },
    async ({ id }) => {
      try {
        return successContent(await client.deals.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_deal",
    {
      description:
        "Create a new deal in a pipeline stage. Uses POST /pipelines/:pipeline_id/deals. Call list_custom_field_definitions first to check required custom fields for this workspace.",
      inputSchema: {
        pipeline_id: z.number().int().positive().describe("Pipeline ID"),
        title: z.string().min(1).describe("Deal title"),
        pipeline_stage_id: z
          .number()
          .int()
          .positive()
          .describe("Pipeline stage ID to place the deal in"),
        value: z.number().optional().describe("Deal value (monetary amount)"),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe("ISO 4217 currency code (e.g. USD, EUR)"),
        status: dealStatusSchema.optional().describe("Deal status (default: open)"),
        company_id: z.number().int().positive().optional().describe("Associated company ID"),
        description: z.string().optional().describe("Deal description or notes"),
        expected_close_date: z.string().optional().describe("Expected close date (YYYY-MM-DD)"),
        priority: dealPrioritySchema.optional().describe("Deal priority"),
        source: dealSourceSchema.optional().describe("Deal source"),
        probability: z.number().optional().describe("Win probability (0-100)"),
        contact_ids: z.array(z.number().int().positive()).optional().describe("Linked contact IDs"),
        assignee_ids: z.array(z.number().int().positive()).optional().describe("Assignee user IDs"),
        custom_fields: customFieldsBodySchema,
      },
    },
    async ({ pipeline_id, custom_fields, ...attrs }) => {
      try {
        return successContent(
          await client.deals.create(pipeline_id, attrsWithCustomFields(attrs, custom_fields)),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_deal",
    {
      description: "Update an existing deal's fields, contacts, assignees, or custom fields.",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
        title: z.string().optional().describe("New deal title"),
        value: z.number().optional().describe("Updated deal value"),
        currency: z.string().length(3).optional().describe("Updated currency code"),
        status: dealStatusSchema.optional().describe("Updated deal status"),
        lost_reason: z
          .string()
          .optional()
          .describe("Reason for losing the deal (required when status is 'lost')"),
        company_id: z.number().int().positive().optional().describe("Associated company ID"),
        description: z.string().optional().describe("Updated description"),
        expected_close_date: z
          .string()
          .optional()
          .describe("Updated expected close date (YYYY-MM-DD)"),
        priority: dealPrioritySchema.optional().describe("Updated deal priority"),
        source: dealSourceSchema.optional().describe("Updated deal source"),
        probability: z.number().optional().describe("Updated win probability"),
        contact_ids: z
          .array(z.number().int().positive())
          .optional()
          .describe("Replace linked contacts"),
        assignee_ids: z.array(z.number().int().positive()).optional().describe("Replace assignees"),
        custom_fields: customFieldsBodySchema,
      },
    },
    async ({ id, custom_fields, ...attrs }) => {
      try {
        return successContent(
          await client.deals.update(id, attrsWithCustomFields(attrs, custom_fields)),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "move_deal",
    {
      description:
        "Move a deal to another pipeline stage and position (kanban reorder). Cannot move across pipelines on this endpoint.",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
        pipeline_stage_id: z.number().int().positive().describe("Target pipeline stage ID"),
        position: z
          .number()
          .int()
          .positive()
          .describe("Target position within the stage (1-based)"),
        lost_reason: z.string().optional().describe("Required when moving to a lost stage"),
      },
    },
    async ({ id, pipeline_stage_id, position, lost_reason }) => {
      try {
        const attrs: Record<string, unknown> = {
          pipeline_stage_id,
          position,
        };
        if (lost_reason) attrs["lost_reason"] = lost_reason;
        return successContent(await client.deals.move(id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_deal",
    {
      description: "Archive (soft delete) a deal.",
      inputSchema: { id: z.number().int().positive().describe("Deal ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.deals.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_deal",
    {
      description: "Restore an archived deal from the recycle bin.",
      inputSchema: { id: z.number().int().positive().describe("Deal ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.deals.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_deal",
    {
      description: "Permanently delete a deal.",
      inputSchema: { id: z.number().int().positive().describe("Deal ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.deals.destroy(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_discard_deals",
    {
      description: "Archive multiple deals by ID.",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Deal IDs to archive"),
      },
    },
    async ({ ids }) => {
      try {
        return successContent(await client.deals.bulkDiscard(ids));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_delete_deals",
    {
      description: "Permanently delete multiple deals by ID.",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Deal IDs to delete"),
      },
    },
    async ({ ids }) => {
      try {
        return successContent(await client.deals.bulkDestroy(ids));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_move_deals",
    {
      description: "Move multiple deals to a pipeline stage (appended at end of stage).",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Deal IDs to move"),
        pipeline_stage_id: z.number().int().positive().describe("Target pipeline stage ID"),
        lost_reason: z.string().optional().describe("Required when target stage is a lost stage"),
      },
    },
    async ({ ids, pipeline_stage_id, lost_reason }) => {
      try {
        return successContent(await client.deals.bulkMove(pipeline_stage_id, ids, lost_reason));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_update_deal_status",
    {
      description: "Update status for multiple deals (e.g. mark as won or lost).",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Deal IDs"),
        status: dealStatusSchema.describe("New status for all deals"),
        lost_reason: z.string().optional().describe("Required when status is 'lost'"),
      },
    },
    async ({ ids, status, lost_reason }) => {
      try {
        return successContent(await client.deals.bulkUpdateStatus(status, ids, lost_reason));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
