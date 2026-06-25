import type { MaskFunction } from "@langfuse/otel";

/**
 * Keys whose values are redacted before a span is exported to Langfuse.
 * Crewio traces can carry CRM data and request credentials, so anything that
 * looks like a secret is stripped to avoid leaking it into the trace store.
 */
const SECRET_KEY_PATTERN = /(authorization|token|secret|password|api[-_]?key|bearer)/i;
const MAX_DEPTH = 8;

/** Recursively redacts secret-looking fields from span input/output payloads. */
export const mask: MaskFunction = ({ data }) => redact(data, 0);

function redact(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : redact(entry, depth + 1);
    }
    return result;
  }

  return value;
}
