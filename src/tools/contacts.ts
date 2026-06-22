import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { customFieldsBodySchema } from "../lib/enums.js";
import {
  archivedFilterSchema,
  buildListQueryParams,
  customFieldFilterSchema,
  paginationSchema,
  sortSchema,
} from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

function attrsWithCustomFields(
  attrs: Record<string, unknown>,
  customFields?: Record<string, string>,
): Record<string, unknown> {
  if (customFields && Object.keys(customFields).length > 0) {
    attrs["custom_fields"] = customFields;
  }
  return attrs;
}

export function registerContactTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_contacts",
    {
      description:
        "List contacts. Supports search, company/creator/telegram filters, custom fields, sort, and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search by name or email"),
        company_id: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter contacts linked to this company ID"),
        creator: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter by creator user ID"),
        telegram: z.string().optional().describe("Filter by Telegram handle (@ prefix optional)"),
        archived: archivedFilterSchema,
        custom_fields: customFieldFilterSchema,
        ...sortSchema,
        ...paginationSchema,
      },
    },
    async (input) => {
      try {
        const params = buildListQueryParams({
          page: input.page,
          limit: input.limit,
          sort: input.sort,
          direction: input.direction,
          customFields: input.custom_fields,
          extra: {
            q: input.q,
            company: input.company_id ? String(input.company_id) : undefined,
            creator: input.creator ? String(input.creator) : undefined,
            telegram: input.telegram,
            archived: input.archived,
          },
        });
        return successContent(await client.contacts.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_contact",
    {
      description: "Get full contact details by ID.",
      inputSchema: { id: z.number().int().positive().describe("Contact ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.contacts.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_contact",
    {
      description: "Create a new contact.",
      inputSchema: {
        first_name: z.string().min(1).optional().describe("First name"),
        last_name: z.string().optional().describe("Last name"),
        email: z.string().email().optional().describe("Email address"),
        phone: z.string().optional().describe("Phone number"),
        title: z.string().optional().describe("Job title"),
        description: z.string().optional().describe("Notes"),
        linkedin: z.string().url().optional().describe("LinkedIn profile URL"),
        telegram: z.string().optional().describe("Telegram handle"),
        github: z.string().optional().describe("GitHub username or URL"),
        x: z.string().optional().describe("X (Twitter) handle"),
        discord: z.string().optional().describe("Discord handle"),
        custom_fields: customFieldsBodySchema,
      },
    },
    async ({ custom_fields, ...attrs }) => {
      try {
        return successContent(
          await client.contacts.create(attrsWithCustomFields(attrs, custom_fields)),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_contact",
    {
      description: "Update an existing contact.",
      inputSchema: {
        id: z.number().int().positive().describe("Contact ID"),
        first_name: z.string().optional().describe("Updated first name"),
        last_name: z.string().optional().describe("Updated last name"),
        email: z.string().email().optional().describe("Updated email"),
        phone: z.string().optional().describe("Updated phone"),
        title: z.string().optional().describe("Updated job title"),
        description: z.string().optional().describe("Updated notes"),
        linkedin: z.string().url().optional().describe("Updated LinkedIn URL"),
        telegram: z.string().optional().describe("Updated Telegram handle"),
        github: z.string().optional().describe("Updated GitHub"),
        x: z.string().optional().describe("Updated X handle"),
        discord: z.string().optional().describe("Updated Discord handle"),
        custom_fields: customFieldsBodySchema,
      },
    },
    async ({ id, custom_fields, ...attrs }) => {
      try {
        return successContent(
          await client.contacts.update(id, attrsWithCustomFields(attrs, custom_fields)),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_contact",
    {
      description: "Archive (soft delete) a contact.",
      inputSchema: { id: z.number().int().positive().describe("Contact ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.contacts.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_contact",
    {
      description: "Restore an archived contact.",
      inputSchema: { id: z.number().int().positive().describe("Contact ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.contacts.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_contact",
    {
      description: "Permanently delete a contact.",
      inputSchema: { id: z.number().int().positive().describe("Contact ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.contacts.destroy(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "list_contact_companies",
    {
      description: "List companies linked to a contact (with role on each link).",
      inputSchema: {
        contact_id: z.number().int().positive().describe("Contact ID"),
      },
    },
    async ({ contact_id }) => {
      try {
        return successContent(await client.contacts.listCompanies(contact_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "link_contact_company",
    {
      description: "Link a contact to a company.",
      inputSchema: {
        contact_id: z.number().int().positive().describe("Contact ID"),
        company_id: z.number().int().positive().describe("Company ID to link"),
        role: z.string().optional().describe("Role label on the link (e.g. CEO, Engineer)"),
      },
    },
    async ({ contact_id, company_id, role }) => {
      try {
        return successContent(await client.contacts.linkCompany(contact_id, company_id, role));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_contact_company_link",
    {
      description: "Update the role label on a contact-company link.",
      inputSchema: {
        contact_id: z.number().int().positive().describe("Contact ID"),
        link_id: z.number().int().positive().describe("CompanyContact link ID"),
        role: z.string().describe("New role label"),
      },
    },
    async ({ contact_id, link_id, role }) => {
      try {
        return successContent(await client.contacts.updateCompanyLink(contact_id, link_id, role));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "unlink_contact_company",
    {
      description: "Remove a contact-company link.",
      inputSchema: {
        contact_id: z.number().int().positive().describe("Contact ID"),
        link_id: z.number().int().positive().describe("CompanyContact link ID"),
      },
    },
    async ({ contact_id, link_id }) => {
      try {
        return successContent(await client.contacts.unlinkCompany(contact_id, link_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_discard_contacts",
    {
      description: "Archive multiple contacts by ID.",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Contact IDs"),
      },
    },
    async ({ ids }) => {
      try {
        return successContent(await client.contacts.bulkDiscard(ids));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_delete_contacts",
    {
      description: "Permanently delete multiple contacts by ID.",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Contact IDs"),
      },
    },
    async ({ ids }) => {
      try {
        return successContent(await client.contacts.bulkDestroy(ids));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
