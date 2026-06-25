import { langfuseSpanProcessor } from "./observability/instrumentation.js"; // Init tracing first

import Fastify from "fastify";
import { env } from "./env.js";
import { healthRoutes } from "./http/routes/health.js";
import { mcpRoutes } from "./http/routes/mcp.js";
import { chatRoutes } from "./http/routes/chat.js";
import { sessionStore } from "./agent/session-store.js";

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "warn" : "info",
    transport:
      env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

await app.register(healthRoutes);
await app.register(mcpRoutes);
await app.register(chatRoutes);

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(): Promise<void> {
  app.log.info("Shutting down…");
  sessionStore.destroy();
  await app.close();
  if (langfuseSpanProcessor) {
    try {
      await langfuseSpanProcessor.forceFlush();
    } catch (err) {
      app.log.error(err, "failed to flush Langfuse traces");
    }
  }
  app.log.info("Shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`crewio-agent listening on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
