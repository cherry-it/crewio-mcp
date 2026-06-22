import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { commentableTypeSchema } from "../lib/enums.js";
import { buildListQueryParams, paginationSchema, sortSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerFeedTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_feed_events",
    {
      description: "List workspace activity feed events. Filter by entity, action, or date range.",
      inputSchema: {
        trackable_type: commentableTypeSchema
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
          extra: {
            trackable_type: input.trackable_type,
            trackable_id: input.trackable_id ? String(input.trackable_id) : undefined,
            action: input.action,
            created_at_from: input.created_at_from,
            created_at_to: input.created_at_to,
          },
        });
        return successContent(await client.feed.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "list_feed_events_by_actor",
    {
      description: "List feed events performed by a specific user (actor ID).",
      inputSchema: {
        actor_id: z.number().int().positive().describe("User ID of the actor"),
        trackable_type: commentableTypeSchema.optional().describe("Optional entity type filter"),
        trackable_id: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional entity ID filter"),
        action: z.string().optional().describe("Optional action filter"),
        created_at_from: z.string().optional().describe("Events on or after (ISO 8601)"),
        created_at_to: z.string().optional().describe("Events on or before (ISO 8601)"),
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
          extra: {
            trackable_type: input.trackable_type,
            trackable_id: input.trackable_id ? String(input.trackable_id) : undefined,
            action: input.action,
            created_at_from: input.created_at_from,
            created_at_to: input.created_at_to,
          },
        });
        return successContent(await client.feed.byActor(input.actor_id, params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_deal_feed",
    {
      description: "Get the activity feed for a single deal.",
      inputSchema: {
        id: z.number().int().positive().describe("Deal ID"),
        ...paginationSchema,
      },
    },
    async ({ id, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);
        return successContent(await client.deals.feedEvents(id, params));
      } catch (err) {
        return errorContent(err);
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
        const params: Record<string, string> = {};
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);
        return successContent(await client.contacts.feedEvents(id, params));
      } catch (err) {
        return errorContent(err);
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
        const params: Record<string, string> = {};
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);
        return successContent(await client.companies.feedEvents(id, params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
