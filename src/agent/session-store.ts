import type { AgentInputItem } from "@openai/agents";

const IDLE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface Session {
  thread: AgentInputItem[];
  lastAccessedAt: number;
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
    this.sessions.set(sessionId, { thread, lastAccessedAt: Date.now() });
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
