import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdvancedOptions } from '../components/OptionsPage/components/AdvancedOptions';
import { useSettingsStore } from '../store/settingsStore';
import { DEFAULT_OPTIONS } from '../utils/constants';

vi.mock('@utils', async () => {
  const actual = await vi.importActual<typeof import('@utils')>('@utils');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('AdvancedOptions', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      maxOgFetches: DEFAULT_OPTIONS.maxOgFetches,
      maxBgImages: DEFAULT_OPTIONS.maxBgImages,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default values', () => {
    render(<AdvancedOptions />);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue(DEFAULT_OPTIONS.maxOgFetches);
    expect(inputs[1]).toHaveValue(DEFAULT_OPTIONS.maxBgImages);
  });

  it('commits maxOgFetches on blur', () => {
    render(<AdvancedOptions />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '75' } });
    expect(useSettingsStore.getState().maxOgFetches).toBe(DEFAULT_OPTIONS.maxOgFetches);

    fireEvent.blur(inputs[0]);
    expect(useSettingsStore.getState().maxOgFetches).toBe(75);
  });

  it('commits maxBgImages on blur', () => {
    render(<AdvancedOptions />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '500' } });
    fireEvent.blur(inputs[1]);

    expect(useSettingsStore.getState().maxBgImages).toBe(500);
  });

  it('clamps values to minimum of 1 on blur', () => {
    render(<AdvancedOptions />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.blur(inputs[0]);

    expect(useSettingsStore.getState().maxOgFetches).toBe(1);
  });
});
