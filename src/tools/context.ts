import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import {
  customizableTypeSchema,
  customFieldTypeSchema,
  dealReportTypeSchema,
} from "../lib/enums.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerCustomFieldDefinitionTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_custom_field_definitions",
    {
      description:
        "List custom field definitions for the workspace. Use entity filter for Deal, Contact, or Company. Required before filtering or setting custom field values.",
      inputSchema: {
        entity: customizableTypeSchema
          .optional()
          .describe("Filter by entity type (Deal, Contact, Company)"),
      },
    },
    async ({ entity }) => {
      try {
        const params: Record<string, string> = {};
        if (entity) params["entity"] = entity;
        return successContent(await client.customFieldDefinitions.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_custom_field_definition",
    {
      description: "Create a custom field definition for an entity type.",
      inputSchema: {
        name: z.string().min(1).describe("Field label"),
        field_type: customFieldTypeSchema.describe("Field type"),
        customizable_type: customizableTypeSchema.describe("Entity type (Deal, Contact, Company)"),
        required: z.boolean().optional().describe("Whether the field is required"),
        position: z.number().int().optional().describe("Display order"),
        placeholder: z.string().optional().describe("Input placeholder"),
        options: z
          .array(z.string())
          .optional()
          .describe("Options for single_select / multi_select fields"),
      },
    },
    async (attrs) => {
      try {
        return successContent(
          await client.customFieldDefinitions.create(attrs as Record<string, unknown>),
        );
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_custom_field_definition",
    {
      description: "Update a custom field definition.",
      inputSchema: {
        id: z.number().int().positive().describe("Definition ID"),
        name: z.string().min(1).optional().describe("Updated label"),
        field_type: customFieldTypeSchema.optional().describe("Updated field type"),
        required: z.boolean().optional().describe("Updated required flag"),
        position: z.number().int().optional().describe("Updated position"),
        placeholder: z.string().optional().describe("Updated placeholder"),
        options: z.array(z.string()).optional().describe("Updated options"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        return successContent(await client.customFieldDefinitions.update(id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_custom_field_definition",
    {
      description: "Delete a custom field definition.",
      inputSchema: {
        id: z.number().int().positive().describe("Definition ID"),
      },
    },
    async ({ id }) => {
      try {
        return successContent(await client.customFieldDefinitions.destroy(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}

export function registerContextTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "get_me",
    {
      description: "Get the authenticated user's profile.",
      inputSchema: {},
    },
    async () => {
      try {
        return successContent(await client.me.show());
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "list_workspaces",
    {
      description: "List workspaces the authenticated user belongs to.",
      inputSchema: {},
    },
    async () => {
      try {
        return successContent(await client.workspaces.list());
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_workspace",
    {
      description: "Get workspace details by ID.",
      inputSchema: {
        id: z.number().int().positive().describe("Workspace ID"),
      },
    },
    async ({ id }) => {
      try {
        return successContent(await client.workspaces.get(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_calendar",
    {
      description:
        "Get calendar events derived from deal close dates within a date range (max 366 days).",
      inputSchema: {
        from: z.string().describe("Start date (YYYY-MM-DD)"),
        to: z.string().describe("End date (YYYY-MM-DD)"),
      },
    },
    async ({ from, to }) => {
      try {
        return successContent(await client.calendar.show(from, to));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_recycle_bin",
    {
      description: "List all archived (discarded) records in the workspace, grouped by type.",
      inputSchema: {},
    },
    async () => {
      try {
        return successContent(await client.recycleBin.show());
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_deal_report",
    {
      description:
        "Run a read-only deal analytics report (pipeline_overview, deal_funnel, win_loss_analysis, revenue_forecast, team_performance, source_attribution, deals_at_risk, sales_cycle, conversion_rate, stage_residency).",
      inputSchema: {
        type: dealReportTypeSchema.describe("Report type"),
        date_from: z.string().optional().describe("Analysis start date (YYYY-MM-DD)"),
        date_to: z.string().optional().describe("Analysis end date (YYYY-MM-DD)"),
        pipeline_id: z
          .array(z.coerce.number().int().positive())
          .optional()
          .describe("Restrict to pipeline IDs"),
        group_by: z.string().optional().describe("Report-specific grouping dimension"),
        page: z.coerce.number().int().positive().optional().describe("Page number"),
        per_page: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Rows per page (max 100)"),
      },
    },
    async ({ type, date_from, date_to, pipeline_id, group_by, page, per_page }) => {
      try {
        const params: Record<string, string | string[]> = {};
        if (date_from) params["date_from"] = date_from;
        if (date_to) params["date_to"] = date_to;
        if (group_by) params["group_by"] = group_by;
        if (page) params["page"] = String(page);
        if (per_page) params["per_page"] = String(per_page);
        if (pipeline_id?.length) params["pipeline_id"] = pipeline_id.map(String);
        return successContent(await client.reports.deals(type, params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
