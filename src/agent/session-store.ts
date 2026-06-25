import type { AgentInputItem } from "@openai/agents";

const IDLE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Cap how many user turns of history we replay to the model. Each agent run
// re-sends the whole thread (instructions + tool schemas + every prior tool
// output) once per turn, so unbounded history quickly burns the token budget.
const MAX_HISTORY_USER_TURNS = 8;

// Push notifications are injected as standalone user messages but do NOT count
// as user turns (so they can't evict real conversation). This caps how many we
// keep so a burst of notifications with no reply can't grow the thread forever.
const MAX_RETAINED_NOTIFICATIONS = 10;

/**
 * Prefix marking a thread item as an injected push notification (see
 * POST /chat/context) rather than something the user actually typed.
 */
export const TELEGRAM_NOTIFICATION_PREFIX = "[Crewio notification received via Telegram]";

interface Session {
  thread: AgentInputItem[];
  lastAccessedAt: number;
}

function isUserMessage(item: AgentInputItem): boolean {
  return "role" in item && item.role === "user";
}

function isNotificationItem(item: AgentInputItem): boolean {
  if (!isUserMessage(item)) return false;
  const { content } = item as { content?: unknown };
  return typeof content === "string" && content.startsWith(TELEGRAM_NOTIFICATION_PREFIX);
}

/** A real user turn is a user message the human actually typed (not a notification). */
function isRealUserTurn(item: AgentInputItem): boolean {
  return isUserMessage(item) && !isNotificationItem(item);
}

/**
 * Trims history before persisting:
 *
 *   1. Keeps only the most recent `MAX_HISTORY_USER_TURNS` *real* user turns.
 *      Trimming starts at a user-message boundary so function_call/
 *      function_call_result pairs stay intact and the thread never begins with
 *      an orphaned tool output. Injected notifications don't count as turns.
 *   2. Caps retained notification items, dropping the oldest. Notifications are
 *      standalone user messages with no tool outputs attached, so removing them
 *      individually never orphans a function_call_result.
 */
function trimThread(thread: AgentInputItem[]): AgentInputItem[] {
  let result = thread;

  const realTurnStarts: number[] = [];
  for (let i = 0; i < result.length; i++) {
    if (isRealUserTurn(result[i])) realTurnStarts.push(i);
  }
  if (realTurnStarts.length > MAX_HISTORY_USER_TURNS) {
    const start = realTurnStarts[realTurnStarts.length - MAX_HISTORY_USER_TURNS];
    result = result.slice(start);
  }

  const notificationIdx: number[] = [];
  for (let i = 0; i < result.length; i++) {
    if (isNotificationItem(result[i])) notificationIdx.push(i);
  }
  if (notificationIdx.length > MAX_RETAINED_NOTIFICATIONS) {
    const dropCount = notificationIdx.length - MAX_RETAINED_NOTIFICATIONS;
    const dropSet = new Set(notificationIdx.slice(0, dropCount));
    result = result.filter((_, i) => !dropSet.has(i));
  }

  return result;
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
