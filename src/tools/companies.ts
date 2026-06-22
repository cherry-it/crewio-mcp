import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import {
  companyIndustrySchema,
  companyRegionSchema,
  companySizeSchema,
  customFieldsBodySchema,
} from "../lib/enums.js";
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

export function registerCompanyTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_companies",
    {
      description:
        "List companies. Supports search, industry/region/size/creator filters, custom fields, sort, and pagination.",
      inputSchema: {
        q: z.string().optional().describe("Search by company name"),
        industry: companyIndustrySchema.optional().describe("Filter by industry"),
        region: companyRegionSchema.optional().describe("Filter by region"),
        company_size: companySizeSchema.optional().describe("Filter by company size"),
        creator: z.coerce
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter by creator user ID"),
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
            industry: input.industry,
            region: input.region,
            company_size: input.company_size,
            creator: input.creator ? String(input.creator) : undefined,
            archived: input.archived,
          },
        });
        return successContent(await client.companies.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_company",
    {
      description: "Get full company details by ID.",
      inputSchema: { id: z.number().int().positive().describe("Company ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.companies.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_company",
    {
      description:
        "Create a new company. Call list_custom_field_definitions first to check required custom fields for this workspace.",
      inputSchema: {
        name: z.string().min(1).describe("Company name"),
        website: z.string().url().optional().describe("Website URL"),
        description: z.string().optional().describe("Notes"),
        industry: companyIndustrySchema.optional().describe("Industry"),
        region: companyRegionSchema.optional().describe("Region"),
        company_size: companySizeSchema.optional().describe("Company size"),
        street: z.string().optional().describe("Street address"),
        city: z.string().optional().describe("City"),
        postal_code: z.string().optional().describe("Postal code"),
        country: z.string().optional().describe("Country"),
        phone: z.string().optional().describe("Phone number"),
        vat_number: z.string().optional().describe("VAT number"),
        registration_number: z.string().optional().describe("Registration number"),
        parent_id: z.number().int().positive().optional().describe("Parent company ID"),
        custom_fields: customFieldsBodySchema,
      },
    },
    async ({ custom_fields, ...attrs }) => {
      try {
        return successContent(
          await client.companies.create(attrsWithCustomFields(attrs, custom_fields)),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_company",
    {
      description: "Update an existing company.",
      inputSchema: {
        id: z.number().int().positive().describe("Company ID"),
        name: z.string().optional().describe("Updated name"),
        website: z.string().url().optional().describe("Updated website"),
        description: z.string().optional().describe("Updated notes"),
        industry: companyIndustrySchema.optional().describe("Updated industry"),
        region: companyRegionSchema.optional().describe("Updated region"),
        company_size: companySizeSchema.optional().describe("Updated company size"),
        street: z.string().optional().describe("Updated street"),
        city: z.string().optional().describe("Updated city"),
        postal_code: z.string().optional().describe("Updated postal code"),
        country: z.string().optional().describe("Updated country"),
        phone: z.string().optional().describe("Updated phone"),
        vat_number: z.string().optional().describe("Updated VAT number"),
        registration_number: z.string().optional().describe("Updated registration number"),
        parent_id: z.number().int().positive().optional().describe("Updated parent company ID"),
        custom_fields: customFieldsBodySchema,
      },
    },
    async ({ id, custom_fields, ...attrs }) => {
      try {
        return successContent(
          await client.companies.update(id, attrsWithCustomFields(attrs, custom_fields)),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_company",
    {
      description: "Archive (soft delete) a company.",
      inputSchema: { id: z.number().int().positive().describe("Company ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.companies.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_company",
    {
      description: "Restore an archived company.",
      inputSchema: { id: z.number().int().positive().describe("Company ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.companies.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_company",
    {
      description: "Permanently delete a company.",
      inputSchema: { id: z.number().int().positive().describe("Company ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.companies.destroy(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_discard_companies",
    {
      description: "Archive multiple companies by ID.",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Company IDs"),
      },
    },
    async ({ ids }) => {
      try {
        return successContent(await client.companies.bulkDiscard(ids));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "bulk_delete_companies",
    {
      description: "Permanently delete multiple companies by ID.",
      inputSchema: {
        ids: z.array(z.number().int().positive()).min(1).describe("Company IDs"),
      },
    },
    async ({ ids }) => {
      try {
        return successContent(await client.companies.bulkDestroy(ids));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
