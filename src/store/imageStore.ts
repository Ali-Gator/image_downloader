import { create } from 'zustand';

import { QualityLevel, SortOption } from '../utils';
import { ImageState } from './types';
import { getQualityFromDimensions } from '../utils/imageUtils';

export const useImageStore = create<ImageState>((set, get) => ({
  // Initial state
  images: [],
  filteredImages: [],
  selectedImages: [],
  pageUrl: null,
  isLoading: false,
  isGridView: true,
  filterText: '',
  qualityFilters: [QualityLevel.ALL],
  customSizeFilter: { minWidth: 0, minHeight: 0 },
  sortOption: SortOption.DEFAULT,

  // Actions
  setImages: (images) => {
    set({ images });
    get().applyFilters();
  },

  setFilteredImages: (filteredImages) => set({ filteredImages }),

  setSelectedImages: (selectedImages) => set({ selectedImages }),

  setPageUrl: (pageUrl) => set({ pageUrl }),

  toggleSelectImage: (image) => {
    const { selectedImages } = get();
    const isSelected = selectedImages.some((img) => img.id === image.id);

    if (isSelected) {
      set({ selectedImages: selectedImages.filter((img) => img.id !== image.id) });
    } else {
      set({ selectedImages: [...selectedImages, image] });
    }
  },

  selectAll: () => {
    const { filteredImages } = get();
    set({ selectedImages: [...filteredImages] });
  },

  deselectAll: () => {
    set({ selectedImages: [] });
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  setIsGridView: (isGridView) => set({ isGridView }),

  setFilterText: (filterText) => {
    set({ filterText });
    get().applyFilters();
  },

  setQualityFilters: (qualityFilters) => {
    set({ qualityFilters });
    get().applyFilters();
  },

  toggleQualityFilter: (filter) => {
    const { qualityFilters } = get();

    // Special case for 'ALL' filter
    if (filter === QualityLevel.ALL) {
      // If ALL is being toggled and wasn't already selected, select only ALL
      if (!qualityFilters.includes(QualityLevel.ALL)) {
        set({ qualityFilters: [QualityLevel.ALL] });
      } else if (qualityFilters.length > 1) {
        // If there are other filters and ALL is being toggled off, remove ALL
        set({ qualityFilters: qualityFilters.filter((f) => f !== QualityLevel.ALL) });
      }
      // Don't allow removing ALL if it's the only filter selected
    } else {
      // For non-ALL filters
      // If the filter is already selected, remove it
      if (qualityFilters.includes(filter)) {
        // Ensure at least one filter remains selected
        if (qualityFilters.length > 1) {
          set({ qualityFilters: qualityFilters.filter((f) => f !== filter) });
        }
      } else {
        // If the filter isn't selected, add it and remove ALL if it was selected
        const newFilters = qualityFilters.includes(QualityLevel.ALL)
          ? [filter]
          : [...qualityFilters, filter];
        set({ qualityFilters: newFilters });
      }
    }

    get().applyFilters();
  },

  setCustomSizeFilter: (customSizeFilter) => {
    set({ customSizeFilter });
    get().applyFilters();
  },

  setSortOption: (sortOption) => {
    set({ sortOption });
    get().applyFilters();
  },

  applyFilters: () => {
    const { images, filterText, qualityFilters, customSizeFilter, sortOption } = get();

    // Filter by text - optimize for memory usage
    let filtered = filterText
      ? images.filter((img) => {
          const searchTerm = filterText.toLowerCase();
          // Use more efficient string matching - only check first 100 chars of URL
          const altText = (img.alt || '').toLowerCase();
          const srcUrl = img.src.toLowerCase().slice(0, 100);
          const filename = (img.filename || '').toLowerCase();

          return (
            altText.includes(searchTerm) ||
            srcUrl.includes(searchTerm) ||
            filename.includes(searchTerm)
          );
        })
      : images; // Don't clone array if not needed

    // Use either standard quality filters or custom size filters, but not both
    if (customSizeFilter.minWidth || customSizeFilter.minHeight) {
      // If custom filters are set, use only them
      filtered = filtered.filter((img) => {
        const passesMinWidth = !customSizeFilter.minWidth || img.width >= customSizeFilter.minWidth;
        const passesMinHeight =
          !customSizeFilter.minHeight || img.height >= customSizeFilter.minHeight;
        return passesMinWidth && passesMinHeight;
      });
    } else if (!qualityFilters.includes(QualityLevel.ALL)) {
      // Otherwise use standard quality filters, if ALL is not selected
      filtered = filtered.filter((img) => {
        // Performance API images have unknown dimensions — always show them
        if (img.width === 0 && img.height === 0) return true;

        // Determine image quality based on dimensions
        const imageQuality = getQualityFromDimensions(img.width, img.height);

        // Check if the image matches any of the selected quality filters
        return qualityFilters.some((filter) => {
          return filter === imageQuality;
        });
      });
    }

    // Sort images - optimize for memory usage
    if (sortOption !== SortOption.DEFAULT) {
      // Only clone if we need to sort and it's not already a copy
      if (filtered === images) {
        filtered = [...filtered];
      }

      filtered.sort((a, b) => {
        switch (sortOption) {
          case SortOption.NAME_ASC:
            return (a.filename || '').localeCompare(b.filename || '');
          case SortOption.NAME_DESC:
            return (b.filename || '').localeCompare(a.filename || '');
          case SortOption.SIZE_ASC:
            return (a.fileSize || 0) - (b.fileSize || 0);
          case SortOption.SIZE_DESC:
            return (b.fileSize || 0) - (a.fileSize || 0);
          default:
            return 0;
        }
      });
    }

    set({ filteredImages: filtered });
  },
}));
