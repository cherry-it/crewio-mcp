import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerCompanyTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_companies",
    {
      description:
        "List companies in the workspace. Supports optional search query and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search query to filter companies by name"),
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

        const data = await client.companies.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_company",
    {
      description:
        "Get full details of a single company by ID, including associated contacts and deals.",
      inputSchema: {
        id: z.number().int().positive().describe("Company ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.companies.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_company",
    {
      description: "Create a new company in the workspace.",
      inputSchema: {
        name: z.string().min(1).describe("Company name"),
        website: z.string().url().optional().describe("Company website URL"),
        description: z.string().optional().describe("Notes about the company"),
        industry: z
          .string()
          .optional()
          .describe("Industry sector (e.g. SaaS, Finance, Healthcare)"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.companies.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_company",
    {
      description: "Update an existing company's fields.",
      inputSchema: {
        id: z.number().int().positive().describe("Company ID"),
        name: z.string().optional().describe("Updated company name"),
        website: z.string().url().optional().describe("Updated website URL"),
        description: z.string().optional().describe("Updated notes"),
        industry: z.string().optional().describe("Updated industry sector"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        const data = await client.companies.update(id, attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
