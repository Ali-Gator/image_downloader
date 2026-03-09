import { debugLogger } from '../utils/debugLogger';

// Helper to flush the fire-and-forget log calls
const flush = () => new Promise((r) => setTimeout(r, 10));

describe('debugLogger', () => {
  beforeEach(async () => {
    // Reset storage mock to use a real in-memory store
    const store: Record<string, unknown> = {};
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (
        keys: string | string[] | Record<string, unknown> | null,
        cb: (items: Record<string, unknown>) => void,
      ) => {
        if (typeof keys === 'string') {
          cb({ [keys]: store[keys] });
        } else {
          cb({ ...store });
        }
      },
    );
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockImplementation(
      (data: Record<string, unknown>, cb?: () => void) => {
        Object.assign(store, data);
        cb?.();
      },
    );

    await debugLogger.clear();
  });

  it('stores a log entry', async () => {
    debugLogger.log('info', 'test', 'hello world', { foo: 'bar' });
    await flush();

    const entries = await debugLogger.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('info');
    expect(entries[0].context).toBe('test');
    expect(entries[0].message).toBe('hello world');
    expect(entries[0].data).toEqual({ foo: 'bar' });
    expect(entries[0].ts).toBeGreaterThan(0);
  });

  it('caps at 100 entries', async () => {
    for (let i = 0; i < 110; i++) {
      debugLogger.log('info', 'test', `entry ${i}`);
      await flush();
    }

    const entries = await debugLogger.getEntries();
    expect(entries).toHaveLength(100);
    // First entry should be entry 10 (oldest 10 were dropped)
    expect(entries[0].message).toBe('entry 10');
  });

  it('export returns valid JSON', async () => {
    debugLogger.log('warn', 'download', 'test export');
    await flush();

    const json = await debugLogger.export();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].level).toBe('warn');
  });

  it('clear removes all entries', async () => {
    debugLogger.log('info', 'test', 'before clear');
    await flush();

    await debugLogger.clear();
    const entries = await debugLogger.getEntries();
    expect(entries).toHaveLength(0);
  });

  it('does not throw when chrome.storage unavailable', async () => {
    const originalStorage = chrome.storage;
    // @ts-expect-error -- deliberately removing storage for test
    chrome.storage = undefined;

    expect(() => debugLogger.log('error', 'test', 'should not throw')).not.toThrow();
    await flush();

    const entries = await debugLogger.getEntries();
    expect(entries).toHaveLength(0);

    chrome.storage = originalStorage;
  });
});
