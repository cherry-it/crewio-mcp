import "./env.js"; // Validate env on startup

import Fastify from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { env } from "./env.js";
import { createMcpServer } from "./server.js";

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "warn" : "info",
    transport:
      env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/healthz", async () => ({ status: "ok", service: "crewio-mcp" }));

const mcpMethodNotAllowed = {
  jsonrpc: "2.0" as const,
  error: { code: -32000, message: "Method not allowed." },
  id: null,
};

// ─── MCP endpoint ─────────────────────────────────────────────────────────────
// Handles Streamable HTTP transport (MCP spec 2024-11-05).
// Each POST creates a stateless server instance scoped to the request's auth.
//
// Auth is passed by the MCP client (e.g. Cursor) via request headers:
//   Authorization: Bearer <crewio_api_token>
//   X-Workspace-Id: <workspace_id>
//
// Cursor config example:
//   {
//     "mcpServers": {
//       "crewio": {
//         "url": "https://mcp.crewio.io/mcp",
//         "headers": {
//           "Authorization": "Bearer <token>",
//           "X-Workspace-Id": "42"
//         }
//       }
//     }
//   }

app.post("/mcp", async (request, reply) => {
  const authorization = request.headers["authorization"];
  const workspaceId = request.headers["x-workspace-id"];

  if (!authorization?.startsWith("Bearer ")) {
    return reply.code(401).send({
      error: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header. Expected: Bearer <token>",
    });
  }

  if (!workspaceId || typeof workspaceId !== "string") {
    return reply.code(401).send({
      error: "UNAUTHORIZED",
      message: "Missing X-Workspace-Id header.",
    });
  }

  const token = authorization.slice(7);
  const server = createMcpServer({ token, workspaceId });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session persistence
  });

  reply.hijack();

  reply.raw.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  } catch (err) {
    app.log.error(err);
    if (!reply.raw.headersSent) {
      reply.raw.writeHead(500, { "Content-Type": "application/json" });
      reply.raw.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        }),
      );
    }
  }
});

// Stateless mode — Cursor probes GET for an optional SSE stream; 405 is expected.
app.get("/mcp", async (_request, reply) => {
  return reply.code(405).send(mcpMethodNotAllowed);
});

app.delete("/mcp", async (_request, reply) => {
  return reply.code(405).send(mcpMethodNotAllowed);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(): Promise<void> {
  app.log.info("Shutting down…");
  await app.close();
  app.log.info("Shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`crewio-mcp listening on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
