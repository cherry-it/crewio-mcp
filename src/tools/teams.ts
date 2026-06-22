import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { buildListQueryParams, paginationSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerTeamTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_teams",
    {
      description: "List teams in the workspace.",
      inputSchema: {
        archived: z
          .boolean()
          .optional()
          .describe("When true, returns archived teams instead of active ones"),
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
        return successContent(await client.teams.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_team",
    {
      description: "Get team details including members.",
      inputSchema: { id: z.number().int().positive().describe("Team ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.teams.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_team",
    {
      description: "Create a new team.",
      inputSchema: {
        name: z.string().min(1).describe("Team name"),
        description: z.string().optional().describe("Optional description"),
      },
    },
    async (attrs) => {
      try {
        return successContent(await client.teams.create(attrs as Record<string, unknown>));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_team",
    {
      description: "Update a team.",
      inputSchema: {
        id: z.number().int().positive().describe("Team ID"),
        name: z.string().min(1).optional().describe("New name"),
        description: z.string().optional().describe("Updated description"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        return successContent(await client.teams.update(id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_team",
    {
      description: "Archive a team.",
      inputSchema: { id: z.number().int().positive().describe("Team ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.teams.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_team",
    {
      description: "Restore an archived team.",
      inputSchema: { id: z.number().int().positive().describe("Team ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.teams.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "add_team_member",
    {
      description: "Add a workspace member to a team.",
      inputSchema: {
        team_id: z.number().int().positive().describe("Team ID"),
        user_id: z.number().int().positive().describe("User ID to add"),
      },
    },
    async ({ team_id, user_id }) => {
      try {
        return successContent(await client.teams.addMember(team_id, user_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "remove_team_member",
    {
      description: "Remove a member from a team.",
      inputSchema: {
        team_id: z.number().int().positive().describe("Team ID"),
        user_id: z.number().int().positive().describe("User ID to remove"),
      },
    },
    async ({ team_id, user_id }) => {
      try {
        return successContent(await client.teams.removeMember(team_id, user_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
