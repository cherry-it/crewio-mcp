import { CrewioApiError, type CrewioResult } from "./crewio.js";

export function apiError(err: unknown): string {
  if (err instanceof CrewioApiError) {
    return `API error ${err.status}: ${JSON.stringify(err.body)}`;
  }
  return String(err);
}

export function formatResult<T>(result: CrewioResult<T> | T): unknown {
  if (result !== null && typeof result === "object" && "body" in result) {
    const { body, pagination } = result as CrewioResult<T>;
    return pagination ? { data: body, pagination } : { data: body };
  }
  if (result !== null && typeof result === "object" && "data" in result) {
    return result;
  }
  return { data: result };
}

export function successContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(formatResult(result), null, 2) }],
  };
}

export function errorContent(err: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${apiError(err)}` }],
    isError: true as const,
  };
}
