import { tool, type RunContext } from "@openai/agents";
import { z } from "zod";
import type { CrewioClient } from "../../lib/crewio.js";
import { COLLECTION_SCHEMA_CATALOG } from "../../lib/schema-catalog.js";
import { apiError, formatResult } from "../../lib/tool-helpers.js";
import type { AgentContext } from "../context.js";
import { actionsForResource, getAction, globalActions, listActions } from "./action-registry.js";
import {
  getResourceDefinition,
  listResourceSlugs,
  supportedOperations,
} from "./resource-registry.js";

function clientFrom(runContext?: RunContext<AgentContext>): CrewioClient {
  if (!runContext) throw new Error("Run context is unavailable");
  return runContext.context.client;
}

function ok(result: unknown): string {
  return JSON.stringify(formatResult(result));
}

function fail(err: unknown): string {
  if (err instanceof z.ZodError) {
    const issues = err.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return `Invalid params: ${issues}`;
  }
  return `Error: ${apiError(err)}`;
}

/** Top-level param key names for an action's Zod object schema (optional keys suffixed with "?"). */
function paramKeys(schema: z.ZodTypeAny): string[] {
  if (schema instanceof z.ZodObject) {
    return Object.entries(schema.shape).map(([key, value]) =>
      value instanceof z.ZodOptional ? `${key}?` : key,
    );
  }
  return [];
}

function actionSummary(resource: string) {
  return actionsForResource(resource).map((a) => ({
    name: a.slug,
    description: a.description,
    params: paramKeys(a.params),
  }));
}

const describeResource = tool({
  name: "describe_resource",
  description:
    "Introspect the CRM. Call with no resource to list all resources and global actions. Call with a resource slug to learn its filters, sort fields, supported operations, and related perform_action slugs. Always describe a resource before querying or mutating it.",
  parameters: z.object({
    resource: z
      .string()
      .nullable()
      .describe("Resource slug (e.g. deal, contact, company). Omit/null for the full catalog."),
  }),
  execute: (input, runContext?: RunContext<AgentContext>): string => {
    clientFrom(runContext); // ensure context is present
    const { resource } = input;

    if (!resource) {
      return JSON.stringify({
        resources: listResourceSlugs().map((slug) => {
          const def = getResourceDefinition(slug);
          return {
            slug,
            description: def?.description,
            operations: def ? supportedOperations(def) : [],
          };
        }),
        globalActions: globalActions().map((a) => ({
          name: a.slug,
          description: a.description,
          params: paramKeys(a.params),
        })),
        common: COLLECTION_SCHEMA_CATALOG.common,
        notes:
          "Use query_resources / get_resource / create_resource / update_resource / delete_resource for the operations above. Use perform_action for the listed actions. Use search for omnibox lookup.",
      });
    }

    const def = getResourceDefinition(resource);
    if (!def) {
      return JSON.stringify({
        error: `Unknown resource '${resource}'`,
        availableResources: listResourceSlugs(),
      });
    }

    return JSON.stringify({
      resource: def.slug,
      description: def.description,
      operations: supportedOperations(def),
      schema: def.schema ?? null,
      common: COLLECTION_SCHEMA_CATALOG.common,
      enums: COLLECTION_SCHEMA_CATALOG.enums,
      actions: actionSummary(def.slug),
    });
  },
});

const queryResources = tool({
  name: "query_resources",
  description:
    "List records of a resource with optional filters, sort, pagination, and custom field filters. Call describe_resource first to learn valid filter and sort keys. Keep limit small (<=10) unless more are needed.",
  parameters: z.object({
    resource: z.string().describe("Resource slug to list"),
    filters: z
      .record(z.string(), z.string())
      .nullable()
      .describe("Filter key/value pairs from describe_resource (e.g. { status: 'open' })"),
    custom_fields: z
      .record(z.string(), z.string())
      .nullable()
      .describe("Custom field filters keyed by definition ID"),
    sort: z.string().nullable().describe("Sort field (per-resource allowlist)"),
    direction: z.enum(["asc", "desc"]).nullable().describe("Sort direction"),
    page: z.number().int().positive().nullable().describe("Page number"),
    limit: z.number().int().positive().max(100).nullable().describe("Results per page (max 100)"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    const def = getResourceDefinition(input.resource);
    if (!def?.ops.list) {
      return `Error: resource '${input.resource}' does not support query. Call describe_resource for valid resources/operations.`;
    }
    try {
      const params = buildQuery(input);
      return ok(await def.ops.list(clientFrom(runContext), params));
    } catch (err) {
      return fail(err);
    }
  },
});

function buildQuery(input: {
  filters: Record<string, string> | null;
  custom_fields: Record<string, string> | null;
  sort: string | null;
  direction: "asc" | "desc" | null;
  page: number | null;
  limit: number | null;
}): Record<string, string> {
  const params: Record<string, string> = { ...(input.filters ?? {}) };
  if (input.sort) params["sort"] = input.sort;
  if (input.direction) params["direction"] = input.direction;
  if (input.page) params["page"] = String(input.page);
  if (input.limit) params["limit"] = String(input.limit);
  if (input.custom_fields) {
    for (const [defId, value] of Object.entries(input.custom_fields)) {
      params[`custom_field[${defId}]`] = value;
    }
  }
  return params;
}

const getResource = tool({
  name: "get_resource",
  description: "Fetch a single record of a resource by its numeric ID.",
  parameters: z.object({
    resource: z.string().describe("Resource slug"),
    id: z.number().int().positive().describe("Record ID"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    const def = getResourceDefinition(input.resource);
    if (!def?.ops.get) {
      return `Error: resource '${input.resource}' does not support get.`;
    }
    try {
      return ok(await def.ops.get(clientFrom(runContext), input.id));
    } catch (err) {
      return fail(err);
    }
  },
});

const createResource = tool({
  name: "create_resource",
  description:
    "Create a record of a resource. attributes is an object of field values; call describe_resource (and list custom_field_definition) first to learn required fields.",
  parameters: z.object({
    resource: z.string().describe("Resource slug"),
    attributes: z.record(z.string(), z.unknown()).describe("Field values for the new record"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    const def = getResourceDefinition(input.resource);
    if (!def?.ops.create) {
      return `Error: resource '${input.resource}' does not support create.`;
    }
    try {
      return ok(await def.ops.create(clientFrom(runContext), input.attributes));
    } catch (err) {
      return fail(err);
    }
  },
});

const updateResource = tool({
  name: "update_resource",
  description:
    "Update a record of a resource by ID. attributes contains only the fields to change.",
  parameters: z.object({
    resource: z.string().describe("Resource slug"),
    id: z.number().int().positive().describe("Record ID"),
    attributes: z.record(z.string(), z.unknown()).describe("Fields to update"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    const def = getResourceDefinition(input.resource);
    if (!def?.ops.update) {
      return `Error: resource '${input.resource}' does not support update.`;
    }
    try {
      return ok(await def.ops.update(clientFrom(runContext), input.id, input.attributes));
    } catch (err) {
      return fail(err);
    }
  },
});

const deleteResource = tool({
  name: "delete_resource",
  description:
    "Archive, restore, or permanently delete a record. mode=discard archives (soft delete), restore un-archives, destroy permanently deletes.",
  parameters: z.object({
    resource: z.string().describe("Resource slug"),
    id: z.number().int().positive().describe("Record ID"),
    mode: z.enum(["discard", "restore", "destroy"]).describe("Deletion mode"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    const def = getResourceDefinition(input.resource);
    const op = def?.ops[input.mode];
    if (!op) {
      return `Error: resource '${input.resource}' does not support '${input.mode}'.`;
    }
    try {
      return ok(await op(clientFrom(runContext), input.id));
    } catch (err) {
      return fail(err);
    }
  },
});

const search = tool({
  name: "search",
  description:
    "Omnibox search across deals, contacts, companies, teams, groups, members, and saved reports. Returns top matches per type.",
  parameters: z.object({
    query: z.string().min(2).max(100).describe("Search query (2-100 characters)"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    try {
      return ok(await clientFrom(runContext).search(input.query));
    } catch (err) {
      return fail(err);
    }
  },
});

const performAction = tool({
  name: "perform_action",
  description:
    "Execute a specialized (non-CRUD) action by slug, such as move_deal, link_contact_company, bulk operations, comments, membership changes, reports, or global reads. Discover available actions and their params via describe_resource.",
  parameters: z.object({
    action: z.string().describe("Action slug (see describe_resource)"),
    params: z.record(z.string(), z.unknown()).nullable().describe("Parameters for the action"),
  }),
  execute: async (input, runContext?: RunContext<AgentContext>): Promise<string> => {
    const action = getAction(input.action);
    if (!action) {
      return `Error: unknown action '${input.action}'. Available actions: ${listActions()
        .map((a) => a.slug)
        .join(", ")}`;
    }
    try {
      return ok(await action.execute(clientFrom(runContext), input.params ?? {}));
    } catch (err) {
      return fail(err);
    }
  },
});

export const discoveryTools = [
  describeResource,
  queryResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  search,
  performAction,
];
