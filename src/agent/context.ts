import type { CrewioClient } from "../lib/crewio.js";

/**
 * Per-run context passed to the agent and its tools via the OpenAI Agents SDK.
 * Tools read the Crewio client from `runContext.context.client`.
 */
export interface AgentContext {
  client: CrewioClient;
}
