const STORAGE_KEY = 'debug-log';
const MAX_ENTRIES = 100;
const FLUSH_DELAY_MS = 1000;

interface DebugLogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  context: string;
  message: string;
  data?: Record<string, unknown>;
}

const getStorage = (): chrome.storage.StorageArea | null => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return chrome.storage.local;
    }
  } catch {
    // Not in extension context
  }
  return null;
};

const readEntries = (): Promise<DebugLogEntry[]> => {
  const storage = getStorage();
  if (!storage) return Promise.resolve([]);

  return new Promise((resolve) => {
    storage.get(STORAGE_KEY, (result) => {
      resolve((result[STORAGE_KEY] as DebugLogEntry[]) || []);
    });
  });
};

const writeEntries = (entries: DebugLogEntry[]): Promise<void> => {
  const storage = getStorage();
  if (!storage) return Promise.resolve();

  return new Promise((resolve) => {
    storage.set({ [STORAGE_KEY]: entries }, () => resolve());
  });
};

// In-memory buffer to batch writes
let pendingEntries: DebugLogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushBuffer = async (): Promise<void> => {
  if (pendingEntries.length === 0) return;

  const batch = pendingEntries;
  pendingEntries = [];
  flushTimer = null;

  try {
    const stored = await readEntries();
    const merged = stored.concat(batch).slice(-MAX_ENTRIES);
    await writeEntries(merged);
  } catch {
    // Silent fallback
  }
};

const scheduleFlush = (): void => {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushBuffer().catch(() => {});
  }, FLUSH_DELAY_MS);
};

export const debugLogger = {
  /**
   * Log an entry. Buffers in memory and flushes to storage after a delay.
   */
  log(
    level: DebugLogEntry['level'],
    context: string,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    pendingEntries.push({ ts: Date.now(), level, context, message, data });
    scheduleFlush();
  },

  async getEntries(): Promise<DebugLogEntry[]> {
    // Flush pending entries first so callers see the latest data
    await flushBuffer();
    return readEntries();
  },

  async clear(): Promise<void> {
    pendingEntries = [];
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    return writeEntries([]);
  },

  async export(): Promise<string> {
    const entries = await this.getEntries();
    return JSON.stringify(entries, null, 2);
  },
};
