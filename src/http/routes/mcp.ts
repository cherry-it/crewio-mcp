import type { FastifyInstance } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../../server.js";
import { extractAuth, replyUnauthorized } from "../auth.js";

const mcpMethodNotAllowed = {
  jsonrpc: "2.0" as const,
  error: { code: -32000, message: "Method not allowed." },
  id: null,
};

export async function mcpRoutes(app: FastifyInstance): Promise<void> {
  // Stateless Streamable HTTP MCP transport.
  // Each POST creates a fresh McpServer scoped to the request's auth context.
  app.post("/mcp", async (request, reply) => {
    const result = extractAuth(request);
    if (!result.ok) {
      return replyUnauthorized(reply, result.message);
    }

    const sourceType = request.headers["x-source-type"];
    const auth = {
      ...result.auth,
      sourceType: typeof sourceType === "string" ? sourceType : "mcp",
    };
    const server = createMcpServer(auth);
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

  // Stateless mode — GET/DELETE return 405 as expected by the MCP spec.
  app.get("/mcp", async (_request, reply) => {
    return reply.code(405).send(mcpMethodNotAllowed);
  });

  app.delete("/mcp", async (_request, reply) => {
    return reply.code(405).send(mcpMethodNotAllowed);
  });
}
