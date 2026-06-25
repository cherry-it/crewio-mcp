import type { FastifyRequest, FastifyReply } from "fastify";
import type { AuthContext } from "../lib/crewio.js";

export type AuthResult =
  | { ok: true; auth: AuthContext }
  | { ok: false; code: 401; message: string };

/**
 * Extracts and validates Crewio auth headers from a Fastify request.
 * Returns the parsed AuthContext or a structured error to send back.
 */
export function extractAuth(request: FastifyRequest): AuthResult {
  const authorization = request.headers["authorization"];
  const workspaceId = request.headers["x-workspace-id"];

  if (!authorization?.startsWith("Bearer ")) {
    return {
      ok: false,
      code: 401,
      message: "Missing or invalid Authorization header. Expected: Bearer <token>",
    };
  }

  if (!workspaceId || typeof workspaceId !== "string") {
    return {
      ok: false,
      code: 401,
      message: "Missing X-Workspace-Id header.",
    };
  }

  return {
    ok: true,
    auth: { token: authorization.slice(7), workspaceId },
  };
}

export function replyUnauthorized(reply: FastifyReply, message: string): void {
  void reply.code(401).send({ error: "UNAUTHORIZED", message });
}
