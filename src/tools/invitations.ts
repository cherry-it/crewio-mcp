import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { buildListQueryParams, paginationSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerInvitationTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "create_invitation",
    {
      description: "Invite a user to the workspace by email.",
      inputSchema: {
        email: z.string().email().describe("Email address to invite"),
        role: z.enum(["member", "admin"]).optional().describe("Role (default: member)"),
        first_name: z.string().optional().describe("Invitee first name"),
        last_name: z.string().optional().describe("Invitee last name"),
      },
    },
    async ({ email, role, first_name, last_name }) => {
      try {
        const attrs: Record<string, unknown> = { email };
        if (role) attrs["role"] = role;
        if (first_name) attrs["first_name"] = first_name;
        if (last_name) attrs["last_name"] = last_name;
        return successContent(await client.invitations.create(attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "list_invitations",
    {
      description: "List pending workspace invitations.",
      inputSchema: {
        role: z.enum(["member", "admin"]).optional().describe("Filter by invitation role"),
        ...paginationSchema,
      },
    },
    async (input) => {
      try {
        const params = buildListQueryParams({
          page: input.page,
          limit: input.limit,
          extra: { role: input.role },
        });
        return successContent(await client.invitations.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "cancel_invitation",
    {
      description: "Cancel a pending invitation.",
      inputSchema: { id: z.number().int().positive().describe("Invitation ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.invitations.cancel(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
