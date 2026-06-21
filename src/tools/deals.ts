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
        "List deals in the workspace. Supports optional search query, status filter (open/won/lost), and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search query to filter deals by title"),
        status: z.enum(["open", "won", "lost"]).optional().describe("Filter by deal status"),
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
    async ({ q, status, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (q) params["q"] = q;
        if (status) params["filter[status]"] = status;
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
