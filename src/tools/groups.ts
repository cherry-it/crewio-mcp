import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerGroupTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_groups",
    {
      description: "List all groups in the workspace, including their members.",
      inputSchema: {
        archived: z
          .boolean()
          .optional()
          .describe("When true, returns archived (discarded) groups instead of active ones"),
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
    async ({ archived, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (archived) params["archived"] = "true";
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.groups.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_group",
    {
      description: "Get full details of a single group by ID, including its members.",
      inputSchema: {
        id: z.number().int().positive().describe("Group ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.groups.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_group",
    {
      description: "Create a new group in the workspace.",
      inputSchema: {
        name: z.string().min(1).describe("Group name"),
        description: z.string().optional().describe("Optional group description"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.groups.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_group",
    {
      description: "Update an existing group's name or description.",
      inputSchema: {
        id: z.number().int().positive().describe("Group ID"),
        name: z.string().min(1).optional().describe("New group name"),
        description: z.string().optional().describe("Updated group description"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        const data = await client.groups.update(id, attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "add_group_member",
    {
      description: "Add a workspace member to a group by user ID.",
      inputSchema: {
        group_id: z.number().int().positive().describe("Group ID"),
        user_id: z.number().int().positive().describe("User ID of the workspace member to add"),
      },
    },
    async ({ group_id, user_id }) => {
      try {
        const data = await client.groups.addMember(group_id, user_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "remove_group_member",
    {
      description: "Remove a member from a group.",
      inputSchema: {
        group_id: z.number().int().positive().describe("Group ID"),
        user_id: z.number().int().positive().describe("User ID of the member to remove"),
      },
    },
    async ({ group_id, user_id }) => {
      try {
        const data = await client.groups.removeMember(group_id, user_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
