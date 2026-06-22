import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrewioClient } from "../lib/crewio.js";
import { pipelineStageTypeSchema } from "../lib/enums.js";
import { paginationSchema } from "../lib/query-params.js";
import { errorContent, successContent } from "../lib/tool-helpers.js";

export function registerPipelineTools(server: McpServer, client: CrewioClient) {
  server.registerTool(
    "list_pipelines",
    {
      description: "List all pipelines in the workspace (ordered by position).",
      inputSchema: { ...paginationSchema },
    },
    async ({ page, limit }) => {
      try {
        const params: Record<string, string> = {};
        if (page) params["page"] = String(page);
        if (limit) params["limit"] = String(limit);
        return successContent(await client.pipelines.list(params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_pipeline",
    {
      description:
        "Get pipeline details with stages. Defaults to a lightweight response (stages only). Use include_deals=true only when you need the full kanban board; prefer include_deals=false for stage IDs.",
      inputSchema: {
        id: z.number().int().positive().describe("Pipeline ID"),
        include_deals: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include full kanban board with deals per stage (default: false)"),
        q: z
          .string()
          .optional()
          .describe("Search deals on the board by title (only when include_deals=true)"),
      },
    },
    async ({ id, include_deals, q }) => {
      try {
        const params: Record<string, string> = {
          include_deals: include_deals ? "true" : "false",
        };
        if (q) params["q"] = q;
        return successContent(await client.pipelines.get(id, params));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_pipeline",
    {
      description: "Create a new pipeline (default stages are seeded automatically).",
      inputSchema: {
        name: z.string().min(1).describe("Pipeline name"),
        description: z.string().optional().describe("Optional description"),
        position: z.number().int().positive().optional().describe("Display order position"),
      },
    },
    async (attrs) => {
      try {
        return successContent(await client.pipelines.create(attrs as Record<string, unknown>));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_pipeline",
    {
      description: "Update pipeline name, description, or position.",
      inputSchema: {
        id: z.number().int().positive().describe("Pipeline ID"),
        name: z.string().min(1).optional().describe("New name"),
        description: z.string().optional().describe("Updated description"),
        position: z.number().int().positive().optional().describe("Updated position"),
      },
    },
    async ({ id, ...attrs }) => {
      try {
        return successContent(await client.pipelines.update(id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_pipeline",
    {
      description: "Archive a pipeline and its stages.",
      inputSchema: { id: z.number().int().positive().describe("Pipeline ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.pipelines.discard(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_pipeline",
    {
      description: "Restore an archived pipeline.",
      inputSchema: { id: z.number().int().positive().describe("Pipeline ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.pipelines.restore(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_pipeline",
    {
      description: "Permanently delete a pipeline.",
      inputSchema: { id: z.number().int().positive().describe("Pipeline ID") },
    },
    async ({ id }) => {
      try {
        return successContent(await client.pipelines.destroy(id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "create_pipeline_stage",
    {
      description: "Create a new stage in a pipeline.",
      inputSchema: {
        pipeline_id: z.number().int().positive().describe("Pipeline ID"),
        name: z.string().min(1).describe("Stage name"),
        color: z.string().optional().describe("Stage color (hex)"),
        position: z.number().int().positive().optional().describe("Position in pipeline"),
        stage_type: pipelineStageTypeSchema.optional().describe("Stage type (default: standard)"),
      },
    },
    async ({ pipeline_id, ...attrs }) => {
      try {
        return successContent(await client.pipelines.createStage(pipeline_id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "update_pipeline_stage",
    {
      description: "Update a pipeline stage.",
      inputSchema: {
        pipeline_id: z.number().int().positive().describe("Pipeline ID"),
        stage_id: z.number().int().positive().describe("Stage ID"),
        name: z.string().min(1).optional().describe("Updated name"),
        color: z.string().optional().describe("Updated color"),
        position: z.number().int().positive().optional().describe("Updated position"),
        stage_type: pipelineStageTypeSchema.optional().describe("Updated stage type"),
      },
    },
    async ({ pipeline_id, stage_id, ...attrs }) => {
      try {
        return successContent(await client.pipelines.updateStage(pipeline_id, stage_id, attrs));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "discard_pipeline_stage",
    {
      description: "Archive a pipeline stage and its deals.",
      inputSchema: {
        pipeline_id: z.number().int().positive().describe("Pipeline ID"),
        stage_id: z.number().int().positive().describe("Stage ID"),
      },
    },
    async ({ pipeline_id, stage_id }) => {
      try {
        return successContent(await client.pipelines.discardStage(pipeline_id, stage_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "restore_pipeline_stage",
    {
      description: "Restore an archived pipeline stage.",
      inputSchema: {
        pipeline_id: z.number().int().positive().describe("Pipeline ID"),
        stage_id: z.number().int().positive().describe("Stage ID"),
      },
    },
    async ({ pipeline_id, stage_id }) => {
      try {
        return successContent(await client.pipelines.restoreStage(pipeline_id, stage_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "delete_pipeline_stage",
    {
      description: "Permanently delete a pipeline stage.",
      inputSchema: {
        pipeline_id: z.number().int().positive().describe("Pipeline ID"),
        stage_id: z.number().int().positive().describe("Stage ID"),
      },
    },
    async ({ pipeline_id, stage_id }) => {
      try {
        return successContent(await client.pipelines.destroyStage(pipeline_id, stage_id));
      } catch (err) {
        return errorContent(err);
      }
    },
  );
}
