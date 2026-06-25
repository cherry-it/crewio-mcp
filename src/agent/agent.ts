import { LangfuseOtelSpanAttributes, startActiveObservation } from "@langfuse/tracing";
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
  /** Chat session id — groups turns of the same conversation in Langfuse. */
  sessionId?: string;
}

export interface AgentRunResult {
  finalOutput: string;
  newThread: AgentInputItem[];
}

/**
 * Runs a single agent turn against the current conversation thread.
 * Builds a per-request Crewio client (tagged X-Source-Type: agent) and passes
 * it to the discovery tools via the run context.
 *
 * The whole turn is wrapped in a Langfuse root observation so the trace carries
 * the user message, the final reply, the session, and the workspace. The agent,
 * generation, and tool spans the SDK emits are nested underneath via the
 * registered trace processor.
 */
export async function runAgent({
  auth,
  thread,
  sessionId,
}: AgentRunInput): Promise<AgentRunResult> {
  const client = createCrewioClient(env.CREWIO_API_URL, { ...auth, sourceType: "agent" });

  return startActiveObservation(
    "crewio-agent-chat",
    async (root) => {
      root.update({ input: lastUserMessage(thread) });
      if (sessionId) {
        root.otelSpan.setAttribute(LangfuseOtelSpanAttributes.TRACE_SESSION_ID, sessionId);
      }
      root.otelSpan.setAttribute(LangfuseOtelSpanAttributes.TRACE_USER_ID, auth.workspaceId);

      const result = await run(agent, thread, {
        context: { client },
        maxTurns: env.AGENT_MAX_TURNS,
      });

      const finalOutput = result.finalOutput ?? "";
      root.update({ output: finalOutput });

      return { finalOutput, newThread: result.history };
    },
    { asType: "span" },
  );
}

/** Extracts the most recent user-authored text from the thread for trace input. */
function lastUserMessage(thread: AgentInputItem[]): string | undefined {
  for (let i = thread.length - 1; i >= 0; i--) {
    const item = thread[i];
    if (item && "role" in item && item.role === "user") {
      const { content } = item;
      return typeof content === "string" ? content : JSON.stringify(content);
    }
  }
  return undefined;
}
