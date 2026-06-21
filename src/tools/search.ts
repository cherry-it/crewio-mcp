import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerSearchTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "search",
    {
      description:
        "Search across all entities in the workspace (deals, contacts, companies) using a single query string.",
      inputSchema: {
        q: z.string().min(1).describe("Search query"),
      },
    },
    async ({ q }) => {
      try {
        const data = await client.search(q);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
