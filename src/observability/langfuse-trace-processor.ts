import {
  startObservation,
  type LangfuseAgent,
  type LangfuseGeneration,
  type LangfuseGuardrail,
  type LangfuseObservationAttributes,
  type LangfuseSpan,
  type LangfuseTool,
} from "@langfuse/tracing";
import type {
  GenerationSpanData,
  ResponseSpanData,
  Span,
  SpanData,
  Trace,
  TracingProcessor,
} from "@openai/agents";

/** Langfuse observation types we map the Agents SDK span kinds onto. */
type BridgeObservationType = "agent" | "generation" | "tool" | "guardrail" | "span";

/** The concrete observation kinds this bridge creates. */
type BridgeObservation =
  | LangfuseSpan
  | LangfuseGeneration
  | LangfuseAgent
  | LangfuseTool
  | LangfuseGuardrail;

/**
 * Bridges the OpenAI Agents SDK's built-in tracing into Langfuse.
 *
 * The Agents SDK emits its own trace/span tree (agent runs, generations, tool
 * calls, handoffs, guardrails). This processor mirrors that tree into Langfuse
 * OpenTelemetry observations so the full hierarchy — with model, token usage,
 * and tool I/O — shows up in Langfuse.
 *
 * The trace root itself is owned by `runAgent` (a `startActiveObservation`
 * span), which lets us attach the user message, final reply, session, and user.
 * Top-level Agents spans nest under that active root via OTel context; nested
 * spans nest under their parent observation explicitly.
 */
export class LangfuseAgentsTracingProcessor implements TracingProcessor {
  readonly #observations = new Map<string, BridgeObservation>();

  onTraceStart(_trace: Trace): Promise<void> {
    return Promise.resolve();
  }

  onTraceEnd(_trace: Trace): Promise<void> {
    return Promise.resolve();
  }

  onSpanStart(span: Span<SpanData>): Promise<void> {
    const parent = span.parentId ? this.#observations.get(span.parentId) : undefined;
    const name = spanName(span.spanData);
    const asType = observationType(span.spanData);

    const observation = createObservation(parent, name, asType);
    this.#observations.set(span.spanId, observation);

    return Promise.resolve();
  }

  onSpanEnd(span: Span<SpanData>): Promise<void> {
    const observation = this.#observations.get(span.spanId);
    if (!observation) return Promise.resolve();
    this.#observations.delete(span.spanId);

    observation.update(buildAttributes(span));
    observation.end();

    return Promise.resolve();
  }

  shutdown(): Promise<void> {
    this.#observations.clear();
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Creates a child observation under `parent`, or a root-level observation that
 * nests under the currently active OTel span when there is no Agents parent.
 * Split per literal `asType` so the strongly typed Langfuse overloads resolve.
 */
function createObservation(
  parent: BridgeObservation | undefined,
  name: string,
  asType: BridgeObservationType,
): BridgeObservation {
  switch (asType) {
    case "generation":
      return parent
        ? parent.startObservation(name, {}, { asType: "generation" })
        : startObservation(name, {}, { asType: "generation" });
    case "tool":
      return parent
        ? parent.startObservation(name, {}, { asType: "tool" })
        : startObservation(name, {}, { asType: "tool" });
    case "guardrail":
      return parent
        ? parent.startObservation(name, {}, { asType: "guardrail" })
        : startObservation(name, {}, { asType: "guardrail" });
    case "agent":
      return parent
        ? parent.startObservation(name, {}, { asType: "agent" })
        : startObservation(name, {}, { asType: "agent" });
    default:
      return parent ? parent.startObservation(name) : startObservation(name);
  }
}

function observationType(data: SpanData): BridgeObservationType {
  switch (data.type) {
    case "agent":
      return "agent";
    case "generation":
    case "response":
      return "generation";
    case "function":
    case "mcp_tools":
      return "tool";
    case "guardrail":
      return "guardrail";
    default:
      return "span";
  }
}

function spanName(data: SpanData): string {
  switch (data.type) {
    case "agent":
    case "function":
    case "guardrail":
    case "custom":
      return data.name;
    case "generation":
      return "generation";
    case "response":
      return "response";
    case "handoff":
      return "handoff";
    case "mcp_tools":
      return "mcp_list_tools";
    default:
      return data.type;
  }
}

/** Builds the Langfuse attributes for a finished span from its final data. */
function buildAttributes(span: Span<SpanData>): LangfuseObservationAttributes {
  const data = span.spanData;
  const attributes: LangfuseObservationAttributes = {};

  switch (data.type) {
    case "agent":
      attributes.metadata = pruneUndefined({
        handoffs: data.handoffs,
        tools: data.tools,
        output_type: data.output_type,
      });
      break;
    case "function":
      attributes.input = safeJsonParse(data.input);
      attributes.output = safeJsonParse(data.output);
      if (data.mcp_data) attributes.metadata = { mcp_data: data.mcp_data };
      break;
    case "generation":
      applyGenerationAttributes(attributes, data);
      break;
    case "response":
      applyResponseAttributes(attributes, data);
      break;
    case "handoff":
      attributes.metadata = pruneUndefined({
        from_agent: data.from_agent,
        to_agent: data.to_agent,
      });
      break;
    case "guardrail":
      attributes.metadata = { triggered: data.triggered };
      break;
    case "custom":
      attributes.metadata = data.data;
      break;
    case "mcp_tools":
      attributes.output = data.result;
      if (data.server) attributes.metadata = { server: data.server };
      break;
    default:
      break;
  }

  if (span.error) {
    attributes.level = "ERROR";
    attributes.statusMessage = span.error.message;
    if (span.error.data) {
      attributes.metadata = { ...(attributes.metadata ?? {}), error: span.error.data };
    }
  }

  return attributes;
}

function applyGenerationAttributes(
  attributes: LangfuseObservationAttributes,
  data: GenerationSpanData,
): void {
  attributes.model = data.model;
  attributes.input = data.input;
  attributes.output = data.output;
  attributes.modelParameters = toModelParameters(data.model_config);
  attributes.usageDetails = toUsageDetails(data.usage?.input_tokens, data.usage?.output_tokens);
}

function applyResponseAttributes(
  attributes: LangfuseObservationAttributes,
  data: ResponseSpanData,
): void {
  attributes.input = data._input;

  const response = data._response;
  if (!isRecord(response)) return;

  attributes.output = response.output ?? response;
  if (typeof response.model === "string") attributes.model = response.model;

  const usage = response.usage;
  if (isRecord(usage)) {
    attributes.usageDetails = toUsageDetails(
      numberOrUndefined(usage.input_tokens),
      numberOrUndefined(usage.output_tokens),
    );
  }
}

function toUsageDetails(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
): Record<string, number> | undefined {
  const usage: Record<string, number> = {};
  if (typeof inputTokens === "number") usage.input = inputTokens;
  if (typeof outputTokens === "number") usage.output = outputTokens;
  return Object.keys(usage).length > 0 ? usage : undefined;
}

function toModelParameters(
  config: Record<string, unknown> | undefined,
): Record<string, string | number> | undefined {
  if (!config) return undefined;
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string" || typeof value === "number") params[key] = value;
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

function safeJsonParse(value: string): unknown {
  if (!value) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function pruneUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
