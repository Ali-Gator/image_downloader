import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCaptureException = vi.fn(() => 'event-id-123');

vi.mock('@sentry/browser', () => {
  class MockBrowserClient {
    captureException = mockCaptureException;
  }

  class MockScope {
    setClient = vi.fn();
    setTag = vi.fn();
    setLevel = vi.fn();
    setContext = vi.fn();
  }

  return {
    BrowserClient: MockBrowserClient,
    Scope: MockScope,
    defaultStackParser: {},
    getDefaultIntegrations: vi.fn(() => []),
    makeFetchTransport: () => {},
  };
});

const { captureException } = await import('../utils/sentryCapturer');

describe('captureException', () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
  });

  it('filters "Blocked" errors', () => {
    const result = captureException(new Error('Blocked'));
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "Cannot access a chrome://" errors', () => {
    const result = captureException(new Error('Cannot access a chrome:// URL'));
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "receiving end does not exist" errors', () => {
    const result = captureException(
      new Error('Could not establish connection. Receiving end does not exist.'),
    );
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "No current window" errors', () => {
    const result = captureException(new Error('No current window'));
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "tabs cannot be edited right now" errors', () => {
    const result = captureException(new Error('Tabs cannot be edited right now'));
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "io error" errors', () => {
    const result = captureException(new Error('IO Error'));
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "Cannot access a chrome-extension://" errors', () => {
    const result = captureException(
      new Error('Cannot access a chrome-extension:// URL of different extension'),
    );
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "Cannot access contents of the page" errors', () => {
    const result = captureException(
      new Error(
        'Cannot access contents of the page. Extension manifest must request permission to access the respective host.',
      ),
    );
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('filters "Could not load file" errors', () => {
    const result = captureException(new Error("Could not load file: 'content-script.js'."));
    expect(result).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('sends real errors to Sentry', () => {
    const result = captureException(new Error('Download failed: network timeout'));
    expect(result).toBe('event-id-123');
    expect(mockCaptureException).toHaveBeenCalled();
  });

  it('sends errors with empty message to Sentry', () => {
    const result = captureException(new Error(''));
    expect(result).toBe('event-id-123');
    expect(mockCaptureException).toHaveBeenCalled();
  });
});
