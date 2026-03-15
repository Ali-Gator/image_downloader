import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OptionsOnboarding } from '../components/OptionsPage/components/OptionsOnboarding';
import { StorageKeys } from '../utils/constants';

const mockSetShowOnboardingNextTime = vi.fn();

vi.mock('@utils', async () => {
  const actual = await vi.importActual<typeof import('@utils')>('@utils');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@store', () => ({
  useSettingsStore: Object.assign(
    (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        showOnboardingNextTime: false,
        setShowOnboardingNextTime: mockSetShowOnboardingNextTime,
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        showOnboardingNextTime: false,
      }),
    },
  ),
}));

describe('Options Onboarding', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockImplementation((_keys, cb) => {
      (cb as (result: Record<string, unknown>) => void)({});
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  function setUrlParam(param: string) {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: param },
      writable: true,
    });
  }

  it('shows when URL has ?onboarding=true', async () => {
    setUrlParam('?onboarding=true');
    render(<OptionsOnboarding />);

    await waitFor(() => {
      expect(screen.getByText('options_onboarding_folder_title')).toBeInTheDocument();
    });
  });

  it('does NOT show without trigger', async () => {
    setUrlParam('');
    render(<OptionsOnboarding />);

    await waitFor(() => {
      expect(screen.queryByText('options_onboarding_folder_title')).not.toBeInTheDocument();
    });
  });

  it('does NOT show when OPTIONS_ONBOARDING_COMPLETED is true', async () => {
    setUrlParam('?onboarding=true');
    vi.mocked(chrome.storage.local.get).mockImplementation((keys, cb) => {
      const key = typeof keys === 'string' ? keys : '';
      (cb as (result: Record<string, unknown>) => void)({ [key]: true });
      return Promise.resolve({ [key]: true });
    });

    render(<OptionsOnboarding />);

    await waitFor(() => {
      expect(screen.queryByText('options_onboarding_folder_title')).not.toBeInTheDocument();
    });
  });

  it('step navigation works', async () => {
    setUrlParam('?onboarding=true');
    render(<OptionsOnboarding />);

    await waitFor(() => {
      expect(screen.getByText('options_onboarding_folder_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_next'));

    await waitFor(() => {
      expect(screen.getByText('options_onboarding_rename_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_back'));

    await waitFor(() => {
      expect(screen.getByText('options_onboarding_folder_title')).toBeInTheDocument();
    });
  });

  it('Finish sets OPTIONS_ONBOARDING_COMPLETED and resets showOnboardingNextTime', async () => {
    setUrlParam('?onboarding=true');
    render(<OptionsOnboarding />);

    await waitFor(() => {
      expect(screen.getByText('options_onboarding_folder_title')).toBeInTheDocument();
    });

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('onboarding_next'));
    }

    await waitFor(() => {
      expect(screen.getByText('options_onboarding_done_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_finish'));

    expect(mockSetShowOnboardingNextTime).toHaveBeenCalledWith(false);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [StorageKeys.OPTIONS_ONBOARDING_COMPLETED]: true }),
    );
  });
});
