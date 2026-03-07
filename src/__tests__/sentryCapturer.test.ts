import { describe, expect, it, vi } from 'vitest';

// Mock @sentry/browser before importing sentryCapturer
const { mockCaptureException } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(() => 'event-id-123'),
}));
vi.mock('@sentry/browser', () => {
  function BrowserClient() {
    this.captureException = mockCaptureException;
    this.captureMessage = vi.fn();
  }
  function Scope() {
    this.setClient = vi.fn();
    this.setTag = vi.fn();
    this.setLevel = vi.fn();
    this.setContext = vi.fn();
  }
  return {
    BrowserClient,
    Scope,
    defaultStackParser: {},
    getDefaultIntegrations: vi.fn(() => []),
    makeFetchTransport: vi.fn(),
  };
});

import { captureException } from '../utils/sentryCapturer';

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
