import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerInvitationTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "create_invitation",
    {
      description:
        "Invite a user to the workspace by email. Sends an invitation email; the invitee must accept to join. Role defaults to member if omitted.",
      inputSchema: {
        email: z.string().email().describe("Email address to invite"),
        role: z
          .enum(["member", "admin"])
          .optional()
          .describe("Workspace role for the invitee (default: member)"),
        first_name: z.string().optional().describe("Invitee first name (optional)"),
        last_name: z.string().optional().describe("Invitee last name (optional)"),
      },
    },
    async ({ email, role, first_name, last_name }) => {
      try {
        const attrs: Record<string, unknown> = { email };
        if (role) attrs["role"] = role;
        if (first_name) attrs["first_name"] = first_name;
        if (last_name) attrs["last_name"] = last_name;

        const data = await client.invitations.create(attrs);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "list_invitations",
    {
      description:
        "List pending workspace invitations. Returns email, role, expiry, and who sent each invite.",
      inputSchema: {
        role: z.enum(["member", "admin"]).optional().describe("Filter by invitation role"),
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
        if (role) params["role"] = role;
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.invitations.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "cancel_invitation",
    {
      description: "Cancel a pending workspace invitation by invitation ID.",
      inputSchema: {
        id: z.number().int().positive().describe("Invitation ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.invitations.cancel(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
