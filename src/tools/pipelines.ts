import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerPipelineTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_pipelines",
    {
      description:
        "List all pipelines in the workspace. Returns each pipeline with its stages and deals on the board.",
      inputSchema: {
        q: z.string().optional().describe("Search query to filter pipelines by name"),
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
    async ({ q, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (q) params["q"] = q;
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.pipelines.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_pipeline",
    {
      description:
        "Get full details of a single pipeline by ID, including all stages and their deals.",
      inputSchema: {
        id: z.number().int().positive().describe("Pipeline ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.pipelines.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_pipeline",
    {
      description: "Create a new pipeline in the workspace.",
      inputSchema: {
        name: z.string().min(1).describe("Pipeline name"),
        description: z.string().optional().describe("Optional pipeline description"),
        position: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Display order position among pipelines"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.pipelines.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_pipeline",
    {
      description: "Update an existing pipeline's name, description, or position.",
      inputSchema: {
        id: z.number().int().positive().describe("Pipeline ID"),
        name: z.string().min(1).optional().describe("New pipeline name"),
        description: z.string().optional().describe("Updated description"),
        position: z.number().int().positive().optional().describe("Updated display order position"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        const data = await client.pipelines.update(id, attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
