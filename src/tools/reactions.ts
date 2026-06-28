import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerReactionTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "create_reaction",
    {
      description:
        "Add an emoji reaction to a comment. Idempotent — repeating the same emoji " +
        "returns the existing reaction instead of creating a duplicate.",
      inputSchema: {
        comment_id: z.number().int().positive().describe("Comment ID"),
        emoji: z.string().min(1).describe("Emoji to react with (e.g. 👍, 🎉, 💪)"),
      },
    },
    async ({ comment_id, emoji }) => {
      try {
        return successContent(await client.reactions.create(comment_id, emoji));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "remove_reaction",
    {
      description:
        "Remove your emoji reaction from a comment. Only the reaction author can remove it.",
      inputSchema: {
        comment_id: z.number().int().positive().describe("Comment ID"),
        reaction_id: z.number().int().positive().describe("Reaction ID to remove"),
      },
    },
    async ({ comment_id, reaction_id }) => {
      try {
        return successContent(await client.reactions.destroy(comment_id, reaction_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
