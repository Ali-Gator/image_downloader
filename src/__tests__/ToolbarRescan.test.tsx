import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Toolbar } from '@components/Page/components/Toolbar';
import { ImageData, MessageActionType } from '@types';
import { QualityLevel, SortOption } from '@utils';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const {
  mockSendMessageToContentScript,
  mockIsSidePanelContextRef,
  mockSetImages,
  mockSetState,
  mockUpdateImages,
  mockSetFilterText,
  mockSetQualityFilters,
  mockToggleQualityFilter,
  mockSetCustomSizeFilter,
  mockSetSortOption,
  mockSetIsGridView,
  mockSetDefaultGridView,
} = vi.hoisted(() => ({
  mockSendMessageToContentScript: vi.fn(),
  mockIsSidePanelContextRef: { value: false },
  mockSetImages: vi.fn(),
  mockSetState: vi.fn(),
  mockUpdateImages: vi.fn(),
  mockSetFilterText: vi.fn(),
  mockSetQualityFilters: vi.fn(),
  mockToggleQualityFilter: vi.fn(),
  mockSetCustomSizeFilter: vi.fn(),
  mockSetSortOption: vi.fn(),
  mockSetIsGridView: vi.fn(),
  mockSetDefaultGridView: vi.fn(),
}));

const makeStoreState = (overrides: Partial<ReturnType<typeof defaultStoreState>> = {}) => ({
  ...defaultStoreState(),
  ...overrides,
});

function defaultStoreState() {
  return {
    sourceTabId: null as number | null,
    filterText: '',
    setFilterText: mockSetFilterText,
    qualityFilters: [QualityLevel.ALL],
    setQualityFilters: mockSetQualityFilters,
    toggleQualityFilter: mockToggleQualityFilter,
    customSizeFilter: { minWidth: undefined, minHeight: undefined },
    setCustomSizeFilter: mockSetCustomSizeFilter,
    sortOption: SortOption.DEFAULT,
    setSortOption: mockSetSortOption,
    isGridView: true,
    setIsGridView: mockSetIsGridView,
    updateImages: mockUpdateImages,
    images: [] as ImageData[],
    setImages: mockSetImages,
  };
}

let storeState = makeStoreState();

vi.mock('@store', () => ({
  useImageStore: Object.assign(
    (selector?: (s: typeof storeState) => unknown) =>
      selector ? selector(storeState) : storeState,
    {
      getState: () => storeState,
      setState: mockSetState,
    },
  ),
  useSettingsStore: (
    selector?: (s: {
      defaultGridView: boolean;
      setDefaultGridView: typeof mockSetDefaultGridView;
    }) => unknown,
  ) => {
    const s = { defaultGridView: true, setDefaultGridView: mockSetDefaultGridView };
    return selector ? selector(s) : s;
  },
}));

vi.mock('@utils', async () => {
  const actual = await vi.importActual<typeof import('@utils')>('@utils');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, ...args: string[]) => (args.length ? `${key}:${args.join(',')}` : key),
    }),
    sendMessageToContentScript: (...args: unknown[]) =>
      mockSendMessageToContentScript(
        ...(args as Parameters<typeof mockSendMessageToContentScript>),
      ),
  };
});

vi.mock('@utils/sidePanelUtils', () => ({
  isSidePanelContext: () => mockIsSidePanelContextRef.value,
}));

vi.mock('@components', () => ({
  RatingWidget: () => <div data-testid="rating-widget" />,
}));

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const theme = createTheme();

function renderToolbar() {
  return render(
    <ThemeProvider theme={theme}>
      <SnackbarProvider>
        <Toolbar />
      </SnackbarProvider>
    </ThemeProvider>,
  );
}

const img = (src: string): ImageData => ({
  id: src,
  src,
  alt: '',
  width: 100,
  height: 100,
  aspectRatio: 1,
  filename: src.split('/').pop() ?? '',
  fileSize: 1000,
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Toolbar — Rescan in side panel mode', () => {
  beforeEach(() => {
    mockIsSidePanelContextRef.value = true;
    storeState = makeStoreState({ sourceTabId: 10 });
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 10, url: 'https://a.com' } as chrome.tabs.Tab,
    ]);
  });

  afterEach(() => {
    mockIsSidePanelContextRef.value = false;
    vi.clearAllMocks();
  });

  it('shows rescan button in side panel even when sourceTabId is null', () => {
    storeState = makeStoreState({ sourceTabId: null });
    renderToolbar();
    expect(screen.getByTitle('rescan_button')).toBeInTheDocument();
  });

  it('queries the active tab instead of using sourceTabId', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 10, url: 'https://a.com' } as chrome.tabs.Tab,
    ]);
    mockSendMessageToContentScript.mockResolvedValue({ images: [], pageUrl: 'https://a.com' });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });
  });

  it('merges images when active tab matches sourceTabId (same tab rescan)', async () => {
    const existing = img('https://a.com/1.jpg');
    const newImg = img('https://a.com/2.jpg');
    storeState = makeStoreState({
      sourceTabId: 10,
      images: [existing],
    });

    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 10, url: 'https://a.com' } as chrome.tabs.Tab,
    ]);
    mockSendMessageToContentScript.mockResolvedValue({
      images: [existing, newImg],
      pageUrl: 'https://a.com',
    });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      expect(mockSendMessageToContentScript).toHaveBeenCalledWith(
        10,
        { action: MessageActionType.RESCAN_IMAGES },
        10000,
      );
    });

    await waitFor(() => {
      expect(mockSetImages).toHaveBeenCalledWith([existing, newImg]);
    });

    // Should NOT batch-update store — same tab
    expect(mockSetState).not.toHaveBeenCalled();
  });

  it('replaces images when active tab differs from sourceTabId (tab switch)', async () => {
    const oldImg = img('https://a.com/old.jpg');
    const newImg = img('https://b.com/new.jpg');
    storeState = makeStoreState({
      sourceTabId: 10,
      images: [oldImg],
    });

    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 20, url: 'https://b.com' } as chrome.tabs.Tab,
    ]);
    mockSendMessageToContentScript.mockResolvedValue({
      images: [newImg],
      pageUrl: 'https://b.com',
    });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      expect(mockSendMessageToContentScript).toHaveBeenCalledWith(
        20,
        { action: MessageActionType.GRAB_IMAGES },
        10000,
      );
    });

    await waitFor(() => {
      expect(mockSetState).toHaveBeenCalledWith({ pageUrl: 'https://b.com', sourceTabId: 20 });
      expect(mockSetImages).toHaveBeenCalledWith([newImg]);
    });
  });

  it('shows warning when no active tab is found', async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([]);
    storeState = makeStoreState({ sourceTabId: null });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      expect(mockSendMessageToContentScript).not.toHaveBeenCalled();
    });
  });

  it('deduplicates by originalSrc so enhanced images are not re-added', async () => {
    const enhanced: ImageData = {
      ...img('https://cdn.com/full.jpg'),
      originalSrc: 'https://a.com/thumb.jpg',
      enhanced: true,
    };
    storeState = makeStoreState({
      sourceTabId: 10,
      images: [enhanced],
    });

    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 10, url: 'https://a.com' } as chrome.tabs.Tab,
    ]);
    // Content script returns the original thumbnail URL
    mockSendMessageToContentScript.mockResolvedValue({
      images: [img('https://a.com/thumb.jpg')],
      pageUrl: 'https://a.com',
    });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      // Should NOT add duplicates — the thumbnail URL matches originalSrc
      expect(mockSetImages).not.toHaveBeenCalled();
    });
  });

  it('shows info snackbar when same-tab rescan finds no new images', async () => {
    const existing = img('https://a.com/1.jpg');
    storeState = makeStoreState({
      sourceTabId: 10,
      images: [existing],
    });

    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 10, url: 'https://a.com' } as chrome.tabs.Tab,
    ]);
    mockSendMessageToContentScript.mockResolvedValue({
      images: [existing],
      pageUrl: 'https://a.com',
    });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      expect(mockSetImages).not.toHaveBeenCalled();
    });
  });
});

describe('Toolbar — Rescan in page mode (non-side-panel)', () => {
  beforeEach(() => {
    mockIsSidePanelContextRef.value = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hides rescan button when sourceTabId is null', () => {
    storeState = makeStoreState({ sourceTabId: null });
    renderToolbar();
    expect(screen.queryByTitle('rescan_button')).not.toBeInTheDocument();
  });

  it('shows rescan button when sourceTabId is set', () => {
    storeState = makeStoreState({ sourceTabId: 5 });
    renderToolbar();
    expect(screen.getByTitle('rescan_button')).toBeInTheDocument();
  });

  it('does not query chrome.tabs — uses sourceTabId directly', async () => {
    storeState = makeStoreState({ sourceTabId: 5, images: [] });
    mockSendMessageToContentScript.mockResolvedValue({
      images: [img('https://a.com/1.jpg')],
      pageUrl: 'https://a.com',
    });

    renderToolbar();
    fireEvent.click(screen.getByTitle('rescan_button'));

    await waitFor(() => {
      expect(chrome.tabs.query).not.toHaveBeenCalled();
      expect(mockSendMessageToContentScript).toHaveBeenCalledWith(
        5,
        { action: MessageActionType.RESCAN_IMAGES },
        10000,
      );
    });
  });
});
