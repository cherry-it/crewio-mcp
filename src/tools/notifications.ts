import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerNotificationTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_notifications",
    {
      description:
        "List in-app notifications for the authenticated user in the current workspace. Each item includes id, read_at, created_at, and a curated message payload.",
      inputSchema: {
        status: z
          .enum(["read", "unread"])
          .optional()
          .describe("Filter by read state (omit for all notifications)"),
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
    async ({ status, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (status) params["status"] = status;
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.notifications.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_unread_notification_count",
    {
      description:
        "Return the number of unread in-app notifications for the authenticated user in the current workspace.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.notifications.unreadCount();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "mark_notification_read",
    {
      description: "Mark a single notification as read by notification ID.",
      inputSchema: {
        id: z.number().int().positive().describe("Notification ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.notifications.markRead(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "mark_all_notifications_read",
    {
      description:
        "Mark all unread in-app notifications as read for the authenticated user in the current workspace.",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await client.notifications.markAllRead();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
