import { z } from "zod";

export const dealStatusSchema = z.enum(["open", "won", "lost"]);
export const dealPrioritySchema = z.enum(["none", "low", "medium", "high", "urgent"]);
export const dealSourceSchema = z.enum([
  "referral",
  "inbound",
  "outbound",
  "website",
  "conference",
  "other",
]);

export const companyIndustrySchema = z.enum([
  "technology",
  "finance",
  "healthcare",
  "education",
  "real_estate",
  "retail",
  "manufacturing",
  "media",
  "telecommunications",
  "energy",
  "transportation",
  "consulting",
  "legal",
  "non_profit",
  "government",
  "agriculture",
  "construction",
  "hospitality",
  "automotive",
  "pharmaceuticals",
]);

export const companyRegionSchema = z.enum(["north_america", "emea", "apac", "latam", "global"]);

export const companySizeSchema = z.enum([
  "tiny",
  "small",
  "medium",
  "mid_market",
  "large",
  "enterprise",
]);

export const customizableTypeSchema = z.enum(["Deal", "Contact", "Company"]);
export const commentableTypeSchema = customizableTypeSchema;

export const customFieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "boolean",
  "single_select",
  "multi_select",
]);

export const pipelineStageTypeSchema = z.enum(["standard", "won", "lost"]);

export const dealReportTypeSchema = z.enum([
  "pipeline_overview",
  "deal_funnel",
  "win_loss_analysis",
  "revenue_forecast",
  "team_performance",
  "source_attribution",
  "deals_at_risk",
  "sales_cycle",
  "conversion_rate",
]);

export const customFieldsBodySchema = z
  .record(z.string(), z.string())
  .optional()
  .describe("Custom field values keyed by definition ID");
