import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Onboarding } from '../components/Page/components/Onboarding';
import { steps } from '../components/Page/components/Onboarding/steps';
import { StorageKeys } from '../utils/constants';

vi.mock('@utils', async () => {
  const actual = await vi.importActual<typeof import('@utils')>('@utils');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('Page Onboarding', () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockImplementation((_keys, cb) => {
      (cb as (result: Record<string, unknown>) => void)({});
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows onboarding when ONBOARDING_COMPLETED is not set', async () => {
    render(<Onboarding />);
    await waitFor(() => {
      expect(screen.getByText('onboarding_welcome_title')).toBeInTheDocument();
    });
  });

  it('does NOT show when ONBOARDING_COMPLETED is true', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation((keys, cb) => {
      const key = typeof keys === 'string' ? keys : '';
      (cb as (result: Record<string, unknown>) => void)({ [key]: true });
      return Promise.resolve({ [key]: true });
    });

    render(<Onboarding />);
    await waitFor(() => {
      expect(screen.queryByText('onboarding_welcome_title')).not.toBeInTheDocument();
    });
  });

  it('Next button advances to next step', async () => {
    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('onboarding_welcome_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_next'));

    await waitFor(() => {
      expect(screen.getByText('onboarding_select_title')).toBeInTheDocument();
    });
  });

  it('Back button goes to previous step', async () => {
    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('onboarding_welcome_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_next'));
    await waitFor(() => {
      expect(screen.getByText('onboarding_select_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_back'));
    await waitFor(() => {
      expect(screen.getByText('onboarding_welcome_title')).toBeInTheDocument();
    });
  });

  it('Skip sets completed flag and closes', async () => {
    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('onboarding_welcome_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_skip'));

    expect(screen.queryByText('onboarding_welcome_title')).not.toBeInTheDocument();
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [StorageKeys.ONBOARDING_COMPLETED]: true }),
    );
  });

  it('"Show me" on last step opens options with onboarding param', async () => {
    render(<Onboarding />);

    await waitFor(() => {
      expect(screen.getByText('onboarding_welcome_title')).toBeInTheDocument();
    });

    for (let i = 0; i < steps.length - 1; i++) {
      fireEvent.click(screen.getByText('onboarding_next'));
    }

    await waitFor(() => {
      expect(screen.getByText('onboarding_options_title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('onboarding_show_me'));

    expect(chrome.tabs.create).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('options.html?onboarding=true') }),
    );
  });
});
