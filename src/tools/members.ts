import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerMemberTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_members",
    {
      description:
        "List all members of the workspace, including their role (owner, admin, member) and user details.",
      inputSchema: {
        role: z.enum(["owner", "admin", "member"]).optional().describe("Filter by workspace role"),
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
    async ({ role, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (role) params["filter[role]"] = role;
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.members.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_member",
    {
      description:
        "Get details of a single workspace member by membership ID, including their role and user profile.",
      inputSchema: {
        id: z.number().int().positive().describe("Workspace membership ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.members.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_member_role",
    {
      description:
        "Update a workspace member's role. Only 'member' and 'admin' can be assigned — ownership transfers are not supported via this tool.",
      inputSchema: {
        id: z.number().int().positive().describe("Workspace membership ID"),
        role: z.enum(["member", "admin"]).describe("New role to assign (member or admin)"),
      },
    },
    async ({ id, role }) => {
      try {
        const data = await client.members.update(id, role);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
