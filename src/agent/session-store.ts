import type { AgentInputItem } from "@openai/agents";

const IDLE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Cap how many user turns of history we replay to the model. Each agent run
// re-sends the whole thread (instructions + tool schemas + every prior tool
// output) once per turn, so unbounded history quickly burns the token budget.
const MAX_HISTORY_USER_TURNS = 8;

interface Session {
  thread: AgentInputItem[];
  lastAccessedAt: number;
}

function isUserMessage(item: AgentInputItem): boolean {
  return "role" in item && item.role === "user";
}

/**
 * Keeps only the most recent `MAX_HISTORY_USER_TURNS` user turns. Trimming always
 * starts at a user-message boundary so function_call/function_call_result pairs
 * stay intact and the thread never begins with an orphaned tool output.
 */
function trimThread(thread: AgentInputItem[]): AgentInputItem[] {
  const userTurnStarts: number[] = [];
  for (let i = 0; i < thread.length; i++) {
    if (isUserMessage(thread[i])) userTurnStarts.push(i);
  }
  if (userTurnStarts.length <= MAX_HISTORY_USER_TURNS) return thread;
  const start = userTurnStarts[userTurnStarts.length - MAX_HISTORY_USER_TURNS];
  return thread.slice(start);
}

/**
 * In-memory conversation session store.
 * Maps session_id -> thread (ordered list of AgentInputItems).
 * Sessions expire after 1 hour of inactivity.
 */
class SessionStore {
  private readonly sessions = new Map<string, Session>();
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.evictionTimer = setInterval(() => this.evictStale(), IDLE_TTL_MS);
    // Allow the process to exit without waiting for this timer.
    this.evictionTimer.unref();
  }

  get(sessionId: string): AgentInputItem[] | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    session.lastAccessedAt = Date.now();
    return session.thread;
  }

  set(sessionId: string, thread: AgentInputItem[]): void {
    this.sessions.set(sessionId, { thread: trimThread(thread), lastAccessedAt: Date.now() });
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private evictStale(): void {
    const cutoff = Date.now() - IDLE_TTL_MS;
    for (const [id, session] of this.sessions) {
      if (session.lastAccessedAt < cutoff) {
        this.sessions.delete(id);
      }
    }
  }

  destroy(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }
    this.sessions.clear();
  }
}

export const sessionStore = new SessionStore();
