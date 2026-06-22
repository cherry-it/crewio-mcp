import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { buildListQueryParams, paginationSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerGroupTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_groups",
    {
      description: "List groups in the workspace.",
      inputSchema: {
        archived: z
          .boolean()
          .optional()
          .describe("When true, returns archived groups instead of active ones"),
        ...paginationSchema,
      },
    },
    async (input) => {
      try {
        const params = buildListQueryParams({
          page: input.page,
          limit: input.limit,
          extra: { archived: input.archived ? "true" : undefined },
        });
        return successContent(await client.groups.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_group",
    {
      description: "Get group details including members.",
      inputSchema: { id: z.number().int().positive().describe("Group ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.groups.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_group",
    {
      description: "Create a new group.",
      inputSchema: {
        name: z.string().min(1).describe("Group name"),
        description: z.string().optional().describe("Optional description"),
      },
    },
    async (attrs) => {
      try {
        return successContent(await client.groups.create(attrs as Record<string, unknown>));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_group",
    {
      description: "Update a group.",
      inputSchema: {
        id: z.number().int().positive().describe("Group ID"),
        name: z.string().min(1).optional().describe("New name"),
        description: z.string().optional().describe("Updated description"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        return successContent(await client.groups.update(id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_group",
    {
      description: "Archive a group.",
      inputSchema: { id: z.number().int().positive().describe("Group ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.groups.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_group",
    {
      description: "Restore an archived group.",
      inputSchema: { id: z.number().int().positive().describe("Group ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.groups.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "add_group_member",
    {
      description: "Add a workspace member to a group.",
      inputSchema: {
        group_id: z.number().int().positive().describe("Group ID"),
        user_id: z.number().int().positive().describe("User ID to add"),
      },
    },
    async ({ group_id, user_id }) => {
      try {
        return successContent(await client.groups.addMember(group_id, user_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "remove_group_member",
    {
      description: "Remove a member from a group.",
      inputSchema: {
        group_id: z.number().int().positive().describe("Group ID"),
        user_id: z.number().int().positive().describe("User ID to remove"),
      },
    },
    async ({ group_id, user_id }) => {
      try {
        return successContent(await client.groups.removeMember(group_id, user_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
