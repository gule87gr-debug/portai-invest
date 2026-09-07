/**
 * Offline action queue.
 *
 * Actions taken while the browser is offline (or that fail because of
 * connectivity) are persisted to localStorage and replayed automatically
 * once the connection returns.
 */

export type QueuedAction = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
};

type Handler = (payload: any) => Promise<void>;

const STORAGE_KEY = "portai-offline-queue-v1";
const MAX_ATTEMPTS = 5;

const handlers = new Map<string, Handler>();
const listeners = new Set<(count: number) => void>();
let flushing = false;

const read = (): QueuedAction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
};

const write = (items: QueuedAction[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l(items.length));
};

export const registerOfflineHandler = (type: string, handler: Handler) => {
  handlers.set(type, handler);
};

export const queuedActionCount = () => read().length;

export const onQueueChange = (cb: (count: number) => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const enqueueAction = (type: string, payload: unknown) => {
  const items = read();
  items.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  });
  write(items);
};

export const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

/** True when an error looks like it was caused by connectivity, not by logic. */
export const isNetworkError = (err: unknown) => {
  if (isOffline()) return true;
  const msg = String((err as any)?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("timeout")
  );
};

export const flushQueue = async () => {
  if (flushing || isOffline()) return;
  flushing = true;
  try {
    let items = read();
    while (items.length > 0) {
      const [next, ...rest] = items;
      const handler = handlers.get(next.type);
      if (!handler) {
        // Unknown action type (e.g. after a deploy) — drop it.
        items = rest;
        write(items);
        continue;
      }
      try {
        await handler(next.payload);
        items = rest;
        write(items);
      } catch (err) {
        if (isNetworkError(err)) {
          // Still offline — stop and retry on the next reconnect.
          break;
        }
        next.attempts += 1;
        if (next.attempts >= MAX_ATTEMPTS) {
          items = rest;
        } else {
          items = [next, ...rest];
        }
        write(items);
        break;
      }
    }
  } finally {
    flushing = false;
  }
};

let initialised = false;

export const initOfflineQueue = () => {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  window.addEventListener("online", () => {
    void flushQueue();
  });
  // Replay anything left over from a previous session.
  void flushQueue();
};
