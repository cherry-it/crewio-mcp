import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { commentableTypeSchema } from "../lib/enums.js";
import { paginationSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerCommentTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_comments",
    {
      description: "List comments for a deal, contact, or company.",
      inputSchema: {
        commentable_type: commentableTypeSchema.describe("Entity type"),
        commentable_id: z.number().int().positive().describe("Entity ID"),
        ...paginationSchema,
      },
    },
    async ({ commentable_type, commentable_id, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);
        return successContent(await client.comments.list(commentable_type, commentable_id, params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_comment",
    {
      description: "Post a comment on a deal, contact, or company.",
      inputSchema: {
        body: z.string().min(1).describe("Comment text"),
        commentable_type: commentableTypeSchema.describe("Entity type"),
        commentable_id: z.number().int().positive().describe("Entity ID"),
      },
    },
    async ({ body, commentable_type, commentable_id }) => {
      try {
        return successContent(await client.comments.create(commentable_type, commentable_id, body));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_comment",
    {
      description: "Update a comment body.",
      inputSchema: {
        id: z.number().int().positive().describe("Comment ID"),
        body: z.string().min(1).describe("Updated comment text"),
      },
    },
    async ({ id, body }) => {
      try {
        return successContent(await client.comments.update(id, body));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_comment",
    {
      description: "Permanently delete a comment.",
      inputSchema: { id: z.number().int().positive().describe("Comment ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.comments.destroy(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_comment",
    {
      description: "Archive (soft delete) a comment.",
      inputSchema: { id: z.number().int().positive().describe("Comment ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.comments.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_comment",
    {
      description: "Restore an archived comment.",
      inputSchema: { id: z.number().int().positive().describe("Comment ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.comments.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
