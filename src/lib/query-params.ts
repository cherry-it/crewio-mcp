import { z } from "zod";

export const paginationSchema = {
  page: z.coerce.number().int().positive().optional().describe("Page number (default: 1)"),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Results per page (default: 25, max: 100)"),
};

export const sortSchema = {
  sort: z
    .string()
    .optional()
    .describe("Sort field (per-resource allowlist — see crewio schema resource)"),
  direction: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction (default varies by endpoint)"),
};

export const archivedFilterSchema = z
  .enum(["active", "archived", "all"])
  .optional()
  .describe("Archive filter: active (default), archived, or all");

export const customFieldFilterSchema = z
  .record(z.string(), z.string())
  .optional()
  .describe('Filter by custom field values, keyed by definition ID (e.g. { "12": "ruby" })');

export function buildPaginationParams(page?: number, limit?: number): Record<string, string> {
  const params: Record<string, string> = {};
  if (page) params["page"] = String(page);
  if (limit) params["limit"] = String(limit);
  return params;
}

export function buildSortParams(sort?: string, direction?: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (sort) params["sort"] = sort;
  if (direction) params["direction"] = direction;
  return params;
}

export function appendCustomFieldFilters(
  params: Record<string, string>,
  customFields?: Record<string, string>,
): void {
  if (!customFields) return;
  for (const [definitionId, value] of Object.entries(customFields)) {
    params[`custom_field[${definitionId}]`] = value;
  }
}

export function mergeQueryParams(
  ...parts: Array<Record<string, string> | undefined>
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const part of parts) {
    if (part) Object.assign(merged, part);
  }
  return merged;
}

function compactExtra(
  extra?: Record<string, string | undefined>,
): Record<string, string> | undefined {
  if (!extra) return undefined;
  const compact = Object.fromEntries(
    Object.entries(extra).filter(([, value]) => value !== undefined && value !== ""),
  ) as Record<string, string>;
  return Object.keys(compact).length > 0 ? compact : undefined;
}

export function buildListQueryParams(options: {
  page?: number;
  limit?: number;
  sort?: string;
  direction?: string;
  customFields?: Record<string, string>;
  extra?: Record<string, string | undefined>;
}): Record<string, string> {
  const params = mergeQueryParams(
    buildPaginationParams(options.page, options.limit),
    buildSortParams(options.sort, options.direction),
    compactExtra(options.extra),
  );
  appendCustomFieldFilters(params, options.customFields);
  return params;
}
