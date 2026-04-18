import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('content-script initialization', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('calls performance.setResourceTimingBufferSize(500) at load', async () => {
    const spy = vi.fn();
    (performance as Performance & { setResourceTimingBufferSize?: (n: number) => void }).setResourceTimingBufferSize =
      spy;

    vi.doMock('../utils/settingsReader', () => ({
      getSettingFromStorage: vi.fn().mockResolvedValue(false),
    }));
    await import('../contentScript/content-script');

    expect(spy).toHaveBeenCalledWith(500);
  });

  it('does not create MutationObserver or PerformanceObserver when enableLegacyObservers is false', async () => {
    // eslint-disable-next-line prefer-arrow-callback
    const mutationSpy = vi.fn(function (this: MutationObserver) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
    // eslint-disable-next-line prefer-arrow-callback
    const perfSpy = vi.fn(function (this: PerformanceObserver) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
    global.MutationObserver = mutationSpy as unknown as typeof MutationObserver;
    global.PerformanceObserver = perfSpy as unknown as typeof PerformanceObserver;

    vi.doMock('../utils/settingsReader', () => ({
      getSettingFromStorage: vi.fn().mockResolvedValue(false),
    }));
    await import('../contentScript/content-script');
    // Flush microtasks so maybeEnableLegacyObservers() resolves
    await Promise.resolve();
    await Promise.resolve();

    expect(mutationSpy).not.toHaveBeenCalled();
    expect(perfSpy).not.toHaveBeenCalled();
  });

  it('creates PerformanceObserver and MutationObserver when enableLegacyObservers is true', async () => {
    // eslint-disable-next-line prefer-arrow-callback
    const mutationSpy = vi.fn(function (this: MutationObserver) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
    // eslint-disable-next-line prefer-arrow-callback
    const perfSpy = vi.fn(function (this: PerformanceObserver) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
    global.MutationObserver = mutationSpy as unknown as typeof MutationObserver;
    global.PerformanceObserver = perfSpy as unknown as typeof PerformanceObserver;

    vi.doMock('../utils/settingsReader', () => ({
      getSettingFromStorage: vi.fn().mockResolvedValue(true),
    }));
    vi.useFakeTimers();
    await import('../contentScript/content-script');
    // Flush microtasks so the storage read resolves and initPerfObserver() is called
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    // Advance past the 800 ms debounce for startMutationObserver
    vi.advanceTimersByTime(1000);

    expect(perfSpy).toHaveBeenCalled();
    expect(mutationSpy).toHaveBeenCalled();
  });

  it('registers the HEALTH_CHECK message listener synchronously on import', async () => {
    vi.doMock('../utils/settingsReader', () => ({
      getSettingFromStorage: vi.fn().mockResolvedValue(false),
    }));
    await import('../contentScript/content-script');

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});
