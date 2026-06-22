import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { buildListQueryParams, paginationSchema, sortSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerMemberTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_members",
    {
      description: "List workspace members with optional role filter, sort, and pagination.",
      inputSchema: {
        role: z.enum(["owner", "admin", "member"]).optional().describe("Filter by workspace role"),
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
          extra: { role: input.role },
        });
        return successContent(await client.members.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_member",
    {
      description: "Get a workspace member by membership ID.",
      inputSchema: {
        id: z.number().int().positive().describe("Workspace membership ID"),
      },
    },
    async ({ id }) => {
      try {
        return successContent(await client.members.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_member_role",
    {
      description: "Update a member's role (member or admin only).",
      inputSchema: {
        id: z.number().int().positive().describe("Workspace membership ID"),
        role: z.enum(["member", "admin"]).describe("New role"),
      },
    },
    async ({ id, role }) => {
      try {
        return successContent(await client.members.update(id, role));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
