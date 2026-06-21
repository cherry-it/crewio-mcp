import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type CrewioClient, CrewioApiError } from "../lib/crewio.js";

function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function registerContactTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_contacts",
    {
      description: "List contacts in the workspace. Supports optional search query and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search query to filter contacts by name or email"),
        company_id: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter contacts by company ID"),
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
    async ({ q, company_id, page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (q) params["q"] = q;
        if (company_id) params["filter[company]"] = String(company_id);
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);

        const data = await client.contacts.list(params);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "get_contact",
    {
      description: "Get full details of a single contact by ID.",
      inputSchema: {
        id: z.number().int().positive().describe("Contact ID"),
      },
    },
    async ({ id }) => {
      try {
        const data = await client.contacts.get(id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "create_contact",
    {
      description: "Create a new contact in the workspace.",
      inputSchema: {
        first_name: z.string().min(1).describe("Contact's first name"),
        last_name: z.string().optional().describe("Contact's last name"),
        email: z.string().email().optional().describe("Contact's email address"),
        phone: z.string().optional().describe("Contact's phone number"),
        title: z.string().optional().describe("Job title (e.g. CEO, Engineer)"),
        description: z.string().optional().describe("Notes about the contact"),
        linkedin: z.string().url().optional().describe("LinkedIn profile URL"),
      },
    },
    async (attrs) => {
      try {
        const data = await client.contacts.create(attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );

  server.registerTool(
    "update_contact",
    {
      description: "Update an existing contact's fields.",
      inputSchema: {
        id: z.number().int().positive().describe("Contact ID"),
        first_name: z.string().optional().describe("Updated first name"),
        last_name: z.string().optional().describe("Updated last name"),
        email: z.string().email().optional().describe("Updated email address"),
        phone: z.string().optional().describe("Updated phone number"),
        title: z.string().optional().describe("Updated job title"),
        description: z.string().optional().describe("Updated notes"),
        linkedin: z.string().url().optional().describe("Updated LinkedIn profile URL"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        const data = await client.contacts.update(id, attrs as Record<string, unknown>);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${apiError(err)}` }], isError: true };
      }
    },
  );
}
