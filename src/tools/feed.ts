import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

const paginationSchema = {
  page: z.coerce.number().int().positive().optional().describe("Page number (default: 1)"),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Results per page (default: 25, max: 100)"),
};

function paginationParams(page?: number, limit?: number): Record<string, string> {
  const params: Record<string, string> = {};
  if (page) params["page"] = String(page);
  if (limit) params["limit"] = String(limit);
  return params;
}

export function registerFeedTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_feed_events",
    {
      description:
        "List workspace activity feed events. Optionally filter by entity (trackable_type + trackable_id), action, or date range.",
      inputSchema: {
        trackable_type: z
          .enum(["Deal", "Contact", "Company"])
          .optional()
          .describe("Filter to events for this entity type (requires trackable_id)"),
        trackable_id: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter to events for this entity ID (requires trackable_type)"),
        action: z
          .string()
          .optional()
          .describe("Filter by feed action (e.g. updated, commented, moved)"),
        created_at_from: z
          .string()
          .optional()
          .describe("Events on or after this ISO 8601 datetime"),
        created_at_to: z.string().optional().describe("Events on or before this ISO 8601 datetime"),
        ...paginationSchema,
      },
    },
    async ({
      trackable_type,
      trackable_id,
      action,
      created_at_from,
      created_at_to,
      page,
      limit,
    }) => {
      try {
        const params = paginationParams(page, limit);
        if (trackable_type) params["trackable_type"] = trackable_type;
        if (trackable_id) params["trackable_id"] = String(trackable_id);
        if (action) params["action"] = action;
        if (created_at_from) params["created_at_from"] = created_at_from;
        if (created_at_to) params["created_at_to"] = created_at_to;

        const data = await client.feed.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_deal_feed",
    {
      description:
        "Get the activity feed for a single deal (stage moves, field changes, comments, etc.).",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
        ...paginationSchema,
      },
    },
    async ({ id, page, limit }) => {
      try {
        const data = await client.deals.feedEvents(id, paginationParams(page, limit));
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_contact_feed",
    {
      description: "Get the activity feed for a single contact.",
      inputSchema: {
        id: z.number().int().positive().describe("Contact ID"),
        ...paginationSchema,
      },
    },
    async ({ id, page, limit }) => {
      try {
        const data = await client.contacts.feedEvents(id, paginationParams(page, limit));
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_company_feed",
    {
      description: "Get the activity feed for a single company.",
      inputSchema: {
        id: z.number().int().positive().describe("Company ID"),
        ...paginationSchema,
      },
    },
    async ({ id, page, limit }) => {
      try {
        const data = await client.companies.feedEvents(id, paginationParams(page, limit));
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
