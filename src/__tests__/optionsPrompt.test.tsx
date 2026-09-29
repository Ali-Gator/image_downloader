import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OptionsPrompt } from '../components/Page/components/OptionsPrompt';
import { StorageKeys } from '../utils/constants';

vi.mock('@utils', async () => {
  const actual = await vi.importActual<typeof import('@utils')>('@utils');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

function mockInstallDate(daysAgo: number) {
  const installDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  vi.mocked(chrome.storage.sync.get).mockResolvedValue({ installDate } as never);
}

function mockStorageFlags(flags: Record<string, boolean>) {
  vi.mocked(chrome.storage.local.get).mockImplementation((keys, cb) => {
    const key = typeof keys === 'string' ? keys : '';
    const value = flags[key];
    const result = value !== undefined ? { [key]: value } : {};
    (cb as (r: Record<string, unknown>) => void)(result);
    return Promise.resolve(result);
  });
}

describe('Options Prompt', () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.set).mockResolvedValue();
    mockInstallDate(8);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT show when daysSinceInstall < 7', async () => {
    mockStorageFlags({
      [StorageKeys.ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: false,
      [StorageKeys.OPTIONS_PROMPT_DISMISSED]: false,
    });
    mockInstallDate(1);

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });
    expect(screen.queryByText('options_prompt_title')).not.toBeInTheDocument();
  });

  it('shows when daysSinceInstall >= 7 and options onboarding not completed', async () => {
    mockStorageFlags({
      [StorageKeys.ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: false,
      [StorageKeys.OPTIONS_PROMPT_DISMISSED]: false,
    });

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(screen.getByText('options_prompt_title')).toBeInTheDocument();
    });
  });

  it('does NOT show when OPTIONS_PROMPT_DISMISSED is true', async () => {
    mockStorageFlags({
      [StorageKeys.ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: false,
      [StorageKeys.OPTIONS_PROMPT_DISMISSED]: true,
    });

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(screen.queryByText('options_prompt_title')).not.toBeInTheDocument();
    });
  });

  it('does NOT show when OPTIONS_ONBOARDING_COMPLETED is true', async () => {
    mockStorageFlags({
      [StorageKeys.ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_PROMPT_DISMISSED]: false,
    });

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(screen.queryByText('options_prompt_title')).not.toBeInTheDocument();
    });
  });

  it('does NOT show when page onboarding not completed', async () => {
    mockStorageFlags({});

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(screen.queryByText('options_prompt_title')).not.toBeInTheDocument();
    });
  });

  it('"Show me" opens options page and dismisses', async () => {
    mockStorageFlags({
      [StorageKeys.ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: false,
      [StorageKeys.OPTIONS_PROMPT_DISMISSED]: false,
    });

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(screen.getByText('options_prompt_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_show_me'));

    expect(chrome.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('options.html?onboarding=true') }),
    );
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [StorageKeys.OPTIONS_PROMPT_DISMISSED]: true }),
    );
  });

  it('"No thanks" sets dismissed flag', async () => {
    mockStorageFlags({
      [StorageKeys.ONBOARDING_COMPLETED]: true,
      [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: false,
      [StorageKeys.OPTIONS_PROMPT_DISMISSED]: false,
    });

    render(<OptionsPrompt />);

    await waitFor(() => {
      expect(screen.getByText('options_prompt_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_no_thanks'));

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [StorageKeys.OPTIONS_PROMPT_DISMISSED]: true }),
    );
    expect(screen.queryByText('options_prompt_title')).not.toBeInTheDocument();
  });
});
