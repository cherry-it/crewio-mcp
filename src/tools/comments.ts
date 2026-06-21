import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerCommentTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_comments",
    {
      description: "List comments for a deal, contact, or company.",
      inputSchema: {
        commentable_type: z
          .enum(["Deal", "Contact", "Company"])
          .describe("The type of the entity to fetch comments for"),
        commentable_id: z
          .number()
          .int()
          .positive()
          .describe("The ID of the entity to fetch comments for"),
      },
    },
    async ({ commentable_type, commentable_id }) => {
      try {
        const data = await client.comments.list(commentable_type, commentable_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_comment",
    {
      description: "Post a comment on a deal, contact, or company.",
      inputSchema: {
        body: z.string().min(1).describe("Comment text"),
        commentable_type: z
          .enum(["Deal", "Contact", "Company"])
          .describe("The type of the entity to comment on"),
        commentable_id: z.number().int().positive().describe("The ID of the entity to comment on"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.comments.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
