import type { FastifyInstance } from "fastify";
import { runAgent } from "../../agent/agent.js";
import { sessionStore } from "../../agent/session-store.js";
import { extractAuth, replyUnauthorized } from "../auth.js";

interface ChatBody {
  session_id?: unknown;
  message?: unknown;
}

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /chat
   *
   * Headers:
   *   Authorization: Bearer <crewio_api_token>
   *   X-Workspace-Id: <workspace_id>
   *
   * Body: { session_id: string, message: string }
   *
   * Response: { session_id: string, reply: string }
   *
   * The same auth credentials passed here are forwarded to the /mcp loopback,
   * which proxies them to the Crewio API. No server-side credential storage.
   */
  app.post<{ Body: ChatBody }>("/chat", async (request, reply) => {
    const authResult = extractAuth(request);
    if (!authResult.ok) {
      return replyUnauthorized(reply, authResult.message);
    }

    const { session_id, message } = request.body ?? {};

    if (typeof session_id !== "string" || !session_id.trim()) {
      return reply.code(422).send({ error: "UNPROCESSABLE", message: "session_id is required." });
    }
    if (typeof message !== "string" || !message.trim()) {
      return reply.code(422).send({ error: "UNPROCESSABLE", message: "message is required." });
    }

    const existingThread = sessionStore.get(session_id) ?? [];
    const thread = [...existingThread, { role: "user" as const, content: message }];

    try {
      const { finalOutput, newThread } = await runAgent({
        auth: authResult.auth,
        thread,
        sessionId: session_id,
      });
      sessionStore.set(session_id, newThread);
      return reply.code(200).send({ session_id, reply: finalOutput });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.error({ session_id, err }, "agent run failed");
      return reply.code(500).send({ error: "AGENT_ERROR", message });
    }
  });

  /**
   * DELETE /chat
   *
   * Headers: same auth as POST /chat.
   * Body: { session_id: string }
   *
   * Drops the in-memory conversation thread for the session so the next message
   * starts fresh. Idempotent — clearing an unknown session is a no-op.
   */
  app.delete<{ Body: ChatBody }>("/chat", async (request, reply) => {
    const authResult = extractAuth(request);
    if (!authResult.ok) {
      return replyUnauthorized(reply, authResult.message);
    }

    const { session_id } = request.body ?? {};
    if (typeof session_id !== "string" || !session_id.trim()) {
      return reply.code(422).send({ error: "UNPROCESSABLE", message: "session_id is required." });
    }

    sessionStore.delete(session_id);
    return reply.code(200).send({ session_id, cleared: true });
  });
}
