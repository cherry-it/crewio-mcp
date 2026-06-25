import type { CrewioClient } from "../../lib/crewio.js";
import { COLLECTION_SCHEMA_CATALOG } from "../../lib/schema-catalog.js";

export type ListParams = Record<string, string>;
export type Attributes = Record<string, unknown>;

type EnumKey = keyof typeof COLLECTION_SCHEMA_CATALOG.enums;

export type ResourceOperation =
  | "query"
  | "get"
  | "create"
  | "update"
  | "discard"
  | "restore"
  | "destroy";

export interface ResourceOps {
  list?: (client: CrewioClient, params: ListParams) => Promise<unknown>;
  get?: (client: CrewioClient, id: number) => Promise<unknown>;
  create?: (client: CrewioClient, attributes: Attributes) => Promise<unknown>;
  update?: (client: CrewioClient, id: number, attributes: Attributes) => Promise<unknown>;
  discard?: (client: CrewioClient, id: number) => Promise<unknown>;
  restore?: (client: CrewioClient, id: number) => Promise<unknown>;
  destroy?: (client: CrewioClient, id: number) => Promise<unknown>;
}

export interface ResourceDefinition {
  slug: string;
  description: string;
  /** Catalog entry (filters/sort/enums) when one exists for this resource. */
  schema?: unknown;
  /** Enum catalogs relevant to this resource, surfaced by describe_resource. */
  enumKeys?: EnumKey[];
  ops: ResourceOps;
}

function requirePositiveInt(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`'${field}' must be a positive integer`);
  }
  return n;
}

const definitions: ResourceDefinition[] = [
  {
    slug: "deal",
    description:
      "Sales deal in a pipeline stage. Create requires pipeline_id and pipeline_stage_id.",
    schema: COLLECTION_SCHEMA_CATALOG.deals,
    enumKeys: ["dealStatus", "dealPriority", "dealSource"],
    ops: {
      list: (client, params) => client.deals.list(params),
      get: (client, id) => client.deals.get(id),
      create: (client, attrs) => {
        const { pipeline_id, ...rest } = attrs;
        return client.deals.create(requirePositiveInt(pipeline_id, "pipeline_id"), rest);
      },
      update: (client, id, attrs) => client.deals.update(id, attrs),
      discard: (client, id) => client.deals.discard(id),
      restore: (client, id) => client.deals.restore(id),
      destroy: (client, id) => client.deals.destroy(id),
    },
  },
  {
    slug: "contact",
    description: "A person. Can be linked to companies (see link_contact_company action).",
    schema: COLLECTION_SCHEMA_CATALOG.contacts,
    ops: {
      list: (client, params) => client.contacts.list(params),
      get: (client, id) => client.contacts.get(id),
      create: (client, attrs) => client.contacts.create(attrs),
      update: (client, id, attrs) => client.contacts.update(id, attrs),
      discard: (client, id) => client.contacts.discard(id),
      restore: (client, id) => client.contacts.restore(id),
      destroy: (client, id) => client.contacts.destroy(id),
    },
  },
  {
    slug: "company",
    description: "An organization.",
    schema: COLLECTION_SCHEMA_CATALOG.companies,
    enumKeys: ["companyIndustry", "companyRegion", "companySize"],
    ops: {
      list: (client, params) => client.companies.list(params),
      get: (client, id) => client.companies.get(id),
      create: (client, attrs) => client.companies.create(attrs),
      update: (client, id, attrs) => client.companies.update(id, attrs),
      discard: (client, id) => client.companies.discard(id),
      restore: (client, id) => client.companies.restore(id),
      destroy: (client, id) => client.companies.destroy(id),
    },
  },
  {
    slug: "pipeline",
    description:
      "Sales pipeline containing stages. get returns the lightweight stage list; use the get_pipeline_board action for the full kanban board with deals.",
    enumKeys: ["pipelineStageType"],
    ops: {
      list: (client, params) => client.pipelines.list(params),
      get: (client, id) => client.pipelines.get(id),
      create: (client, attrs) => client.pipelines.create(attrs),
      update: (client, id, attrs) => client.pipelines.update(id, attrs),
      discard: (client, id) => client.pipelines.discard(id),
      restore: (client, id) => client.pipelines.restore(id),
      destroy: (client, id) => client.pipelines.destroy(id),
    },
  },
  {
    slug: "team",
    description:
      "A team of workspace members. Use add_team_member / remove_team_member actions to manage membership.",
    ops: {
      list: (client, params) => client.teams.list(params),
      get: (client, id) => client.teams.get(id),
      create: (client, attrs) => client.teams.create(attrs),
      update: (client, id, attrs) => client.teams.update(id, attrs),
      discard: (client, id) => client.teams.discard(id),
      restore: (client, id) => client.teams.restore(id),
    },
  },
  {
    slug: "group",
    description:
      "A group of workspace members. Use add_group_member / remove_group_member actions to manage membership.",
    ops: {
      list: (client, params) => client.groups.list(params),
      get: (client, id) => client.groups.get(id),
      create: (client, attrs) => client.groups.create(attrs),
      update: (client, id, attrs) => client.groups.update(id, attrs),
      discard: (client, id) => client.groups.discard(id),
      restore: (client, id) => client.groups.restore(id),
    },
  },
  {
    slug: "member",
    description:
      "A workspace membership. update accepts only { role }; use the member/admin role values.",
    schema: COLLECTION_SCHEMA_CATALOG.members,
    ops: {
      list: (client, params) => client.members.list(params),
      get: (client, id) => client.members.get(id),
      update: (client, id, attrs) => client.members.update(id, String(attrs["role"])),
    },
  },
  {
    slug: "invitation",
    description:
      "A pending workspace invitation. create requires email. destroy cancels the invitation.",
    ops: {
      list: (client, params) => client.invitations.list(params),
      create: (client, attrs) => client.invitations.create(attrs),
      destroy: (client, id) => client.invitations.cancel(id),
    },
  },
  {
    slug: "notification",
    description:
      "In-app notification for the authenticated user. Use mark_notification_read / mark_all_notifications_read / get_unread_notification_count actions.",
    ops: {
      list: (client, params) => client.notifications.list(params),
    },
  },
  {
    slug: "custom_field_definition",
    description:
      "Custom field definition for Deal, Contact, or Company. Filter the list by { entity }. Required before setting custom field values.",
    enumKeys: ["customizableTypes"],
    ops: {
      list: (client, params) => client.customFieldDefinitions.list(params),
      create: (client, attrs) => client.customFieldDefinitions.create(attrs),
      update: (client, id, attrs) => client.customFieldDefinitions.update(id, attrs),
      destroy: (client, id) => client.customFieldDefinitions.destroy(id),
    },
  },
  {
    slug: "workspace",
    description: "A workspace the authenticated user belongs to (read-only).",
    ops: {
      list: (client, params) => client.workspaces.list(params),
      get: (client, id) => client.workspaces.get(id),
    },
  },
  {
    slug: "feed",
    description:
      "Workspace activity feed (read-only). Filter by trackable_type + trackable_id, action, or created_at range. See feed_by_actor / entity feed actions for scoped views.",
    schema: COLLECTION_SCHEMA_CATALOG.feed,
    ops: {
      list: (client, params) => client.feed.list(params),
    },
  },
];

const resourceRegistry = new Map<string, ResourceDefinition>(definitions.map((d) => [d.slug, d]));

export function getResourceDefinition(slug: string): ResourceDefinition | undefined {
  return resourceRegistry.get(slug);
}

export function listResourceSlugs(): string[] {
  return [...resourceRegistry.keys()];
}

/** Enum catalogs relevant to a resource, or undefined when it has none. */
export function resourceEnums(
  def: ResourceDefinition,
): Partial<Record<EnumKey, readonly string[]>> | undefined {
  if (!def.enumKeys?.length) return undefined;
  const enums: Partial<Record<EnumKey, readonly string[]>> = {};
  for (const key of def.enumKeys) {
    enums[key] = COLLECTION_SCHEMA_CATALOG.enums[key];
  }
  return enums;
}

export function supportedOperations(def: ResourceDefinition): ResourceOperation[] {
  const ops: ResourceOperation[] = [];
  if (def.ops.list) ops.push("query");
  if (def.ops.get) ops.push("get");
  if (def.ops.create) ops.push("create");
  if (def.ops.update) ops.push("update");
  if (def.ops.discard) ops.push("discard");
  if (def.ops.restore) ops.push("restore");
  if (def.ops.destroy) ops.push("destroy");
  return ops;
}
