import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { buildListQueryParams, paginationSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerNotificationTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_notifications",
    {
      description: "List in-app notifications for the authenticated user.",
      inputSchema: {
        status: z
          .enum(["read", "unread"])
          .optional()
          .describe("Filter by read state (omit for all)"),
        ...paginationSchema,
      },
    },
    async (input) => {
      try {
        const params = buildListQueryParams({
          page: input.page,
          limit: input.limit,
          extra: { status: input.status },
        });
        return successContent(await client.notifications.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_unread_notification_count",
    {
      description: "Count unread notifications for the authenticated user.",
      inputSchema: {},
    },
    async () => {
      try {
        return successContent(await client.notifications.unreadCount());
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "mark_notification_read",
    {
      description: "Mark a single notification as read.",
      inputSchema: { id: z.number().int().positive().describe("Notification ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.notifications.markRead(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "mark_all_notifications_read",
    {
      description: "Mark all notifications as read.",
      inputSchema: {},
    },
    async () => {
      try {
        return successContent(await client.notifications.markAllRead());
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
