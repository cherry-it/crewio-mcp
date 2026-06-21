import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerDealTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_deals",
    {
      description:
        "List deals in the workspace. Supports search, filters (status, pipeline, stage, company, assignee, priority, source, value/date ranges), and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search query to filter deals by title"),
        status: z.enum(["open", "won", "lost"]).optional().describe("Filter by deal status"),
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
        priority: z
          .enum(["none", "low", "medium", "high", "urgent"])
          .optional()
          .describe("Filter by deal priority"),
        source: z
          .enum(["referral", "inbound", "outbound", "website", "conference", "other"])
          .optional()
          .describe("Filter by deal source"),
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
        archived: z
          .enum(["active", "archived", "all"])
          .optional()
          .describe("Filter by archived state (default: active only)"),
        page: z.coerce.number().int().positive().optional().describe("Page number (default: 1)"),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Results per page (default: 25, max: 100)"),
      },
    },
    async ({
      q,
      status,
      pipeline,
      pipeline_stage,
      company,
      assignee,
      priority,
      source,
      value_min,
      value_max,
      close_date_from,
      close_date_to,
      archived,
      page,
      limit,
    }) => {
      try {
        const params: Record<string, string> = {};
        if (q) params["q"] = q;
        if (status) params["status"] = status;
        if (pipeline) params["pipeline"] = String(pipeline);
        if (pipeline_stage) params["pipeline_stage"] = String(pipeline_stage);
        if (company) params["company"] = String(company);
        if (assignee) params["assignee"] = String(assignee);
        if (priority) params["priority"] = priority;
        if (source) params["source"] = source;
        if (value_min !== undefined) params["value_min"] = String(value_min);
        if (value_max !== undefined) params["value_max"] = String(value_max);
        if (close_date_from) params["close_date_from"] = close_date_from;
        if (close_date_to) params["close_date_to"] = close_date_to;
        if (archived) params["archived"] = archived;
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.deals.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_deal",
    {
      description:
        "Get full details of a single deal by ID, including pipeline stage, contacts, company, assignees, and activity feed.",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.deals.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_deal",
    {
      description: "Create a new deal in the workspace.",
      inputSchema: {
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
        status: z.enum(["open", "won", "lost"]).optional().describe("Deal status (default: open)"),
        company_id: z.number().int().positive().optional().describe("Associated company ID"),
        description: z.string().optional().describe("Deal description or notes"),
        expected_close_date: z
          .string()
          .optional()
          .describe("Expected close date in ISO 8601 format (YYYY-MM-DD)"),
        priority: z.enum(["low", "medium", "high"]).optional().describe("Deal priority"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.deals.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_deal",
    {
      description: "Update an existing deal's fields.",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
        title: z.string().optional().describe("New deal title"),
        value: z.number().optional().describe("Updated deal value"),
        status: z.enum(["open", "won", "lost"]).optional().describe("Updated deal status"),
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
        priority: z.enum(["low", "medium", "high"]).optional().describe("Updated deal priority"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        const data = await client.deals.update(id, attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
