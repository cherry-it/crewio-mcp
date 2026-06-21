import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerTeamTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_teams",
    {
      description: "List all teams in the workspace, including their members.",
      inputSchema: {
        archived: z
          .boolean()
          .optional()
          .describe("When true, returns archived (discarded) teams instead of active ones"),
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

        const data = await client.teams.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_team",
    {
      description: "Get full details of a single team by ID, including its members.",
      inputSchema: {
        id: z.number().int().positive().describe("Team ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.teams.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_team",
    {
      description: "Create a new team in the workspace.",
      inputSchema: {
        name: z.string().min(1).describe("Team name"),
        description: z.string().optional().describe("Optional team description"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.teams.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_team",
    {
      description: "Update an existing team's name or description.",
      inputSchema: {
        id: z.number().int().positive().describe("Team ID"),
        name: z.string().min(1).optional().describe("New team name"),
        description: z.string().optional().describe("Updated team description"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        const data = await client.teams.update(id, attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "add_team_member",
    {
      description: "Add a workspace member to a team by user ID.",
      inputSchema: {
        team_id: z.number().int().positive().describe("Team ID"),
        user_id: z.number().int().positive().describe("User ID of the workspace member to add"),
      },
    },
    async ({ team_id, user_id }) => {
      try {
        const data = await client.teams.addMember(team_id, user_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "remove_team_member",
    {
      description: "Remove a member from a team.",
      inputSchema: {
        team_id: z.number().int().positive().describe("Team ID"),
        user_id: z.number().int().positive().describe("User ID of the member to remove"),
      },
    },
    async ({ team_id, user_id }) => {
      try {
        const data = await client.teams.removeMember(team_id, user_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
