import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerSearchTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "search",
    {
      description:
        "Omnibox search across deals, contacts, companies, teams, groups, members, and saved reports. Returns top 5 per type plus total counts.",
      inputSchema: {
        q: z.string().min(2).max(100).describe("Search query (2-100 characters)"),
      },
    },
    async ({ q }) => {
      try {
        return successContent(await client.search(q));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
