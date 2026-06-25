import { LangfuseSpanProcessor } from "@langfuse/otel";
import { setTraceProcessors } from "@openai/agents";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { env } from "../env.js";
import { LangfuseAgentsTracingProcessor } from "./langfuse-trace-processor.js";
import { mask } from "./mask.js";

/** Tracing is active only when both Langfuse keys are configured. */
export const tracingEnabled = Boolean(env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY);

/**
 * The Langfuse OTel span processor. Exported so the server can flush it on
 * shutdown. `null` when tracing is disabled.
 */
export const langfuseSpanProcessor = tracingEnabled
  ? new LangfuseSpanProcessor({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_BASE_URL,
      environment: env.NODE_ENV,
      mask,
    })
  : null;

if (langfuseSpanProcessor) {
  // Register the global OTel tracer provider that @langfuse/tracing writes to.
  // Must happen before any observation is created (i.e. before the first run).
  new NodeSDK({ spanProcessors: [langfuseSpanProcessor] }).start();

  // Route the OpenAI Agents SDK's built-in traces into Langfuse instead of the
  // default OpenAI backend exporter.
  setTraceProcessors([new LangfuseAgentsTracingProcessor()]);
}
