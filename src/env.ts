import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3002),
  // The base URL of the crewio backend this MCP server proxies to.
  CREWIO_API_URL: z.string().url(),

  // OpenAI agent config
  OPENAI_API_KEY: z.string().min(1),
  AGENT_MODEL: z.string().default("gpt-4.1"),
  AGENT_MAX_TURNS: z.coerce.number().int().positive().default(10),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

export const env = parseEnv();
