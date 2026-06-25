import { Agent, run, type AgentInputItem } from "@openai/agents";
import { env } from "../env.js";
import { createCrewioClient, type AuthContext } from "../lib/crewio.js";
import type { AgentContext } from "./context.js";
import { discoveryTools } from "./discovery/tools.js";
import { AGENT_INSTRUCTIONS } from "./instructions.js";

// Tools are stateless and read the Crewio client from the per-run context,
// so the agent itself can be a singleton.
const agent = new Agent<AgentContext>({
  name: "crewio-agent",
  instructions: AGENT_INSTRUCTIONS,
  model: env.AGENT_MODEL,
  tools: discoveryTools,
});

export interface AgentRunInput {
  auth: AuthContext;
  thread: AgentInputItem[];
}

export interface AgentRunResult {
  finalOutput: string;
  newThread: AgentInputItem[];
}

/**
 * Runs a single agent turn against the current conversation thread.
 * Builds a per-request Crewio client (tagged X-Source-Type: agent) and passes
 * it to the discovery tools via the run context.
 */
export async function runAgent({ auth, thread }: AgentRunInput): Promise<AgentRunResult> {
  const client = createCrewioClient(env.CREWIO_API_URL, { ...auth, sourceType: "agent" });

  const result = await run(agent, thread, {
    context: { client },
    maxTurns: env.AGENT_MAX_TURNS,
  });

  return {
    finalOutput: result.finalOutput ?? "",
    newThread: result.history,
  };
}
