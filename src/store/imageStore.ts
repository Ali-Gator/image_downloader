import { create } from 'zustand';

import { SizeFilter, SortOption } from '../utils';
import { ImageState } from './types';

export const useImageStore = create<ImageState>((set, get) => ({
  // Initial state
  images: [],
  filteredImages: [],
  selectedImages: [],
  isLoading: false,
  isGridView: true,
  filterText: '',
  sizeFilters: [SizeFilter.ALL],
  customSizeFilter: { minWidth: 0, minHeight: 0 },
  sortOption: SortOption.DEFAULT,

  // Actions
  setImages: (images) => {
    set({ images });
    get().applyFilters();
  },

  setFilteredImages: (filteredImages) => set({ filteredImages }),

  setSelectedImages: (selectedImages) => set({ selectedImages }),

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

  setSizeFilters: (sizeFilters) => {
    set({ sizeFilters });
    get().applyFilters();
  },

  toggleSizeFilter: (filter) => {
    const { sizeFilters } = get();

    // Special case for 'ALL' filter
    if (filter === SizeFilter.ALL) {
      // If ALL is being toggled and wasn't already selected, select only ALL
      if (!sizeFilters.includes(SizeFilter.ALL)) {
        set({ sizeFilters: [SizeFilter.ALL] });
      } else if (sizeFilters.length > 1) {
        // If there are other filters and ALL is being toggled off, remove ALL
        set({ sizeFilters: sizeFilters.filter((f) => f !== SizeFilter.ALL) });
      }
      // Don't allow removing ALL if it's the only filter selected
    } else {
      // For non-ALL filters
      // If the filter is already selected, remove it
      if (sizeFilters.includes(filter)) {
        // Ensure at least one filter remains selected
        if (sizeFilters.length > 1) {
          set({ sizeFilters: sizeFilters.filter((f) => f !== filter) });
        }
      } else {
        // If the filter isn't selected, add it and remove ALL if it was selected
        const newFilters = sizeFilters.includes(SizeFilter.ALL)
          ? [filter]
          : [...sizeFilters, filter];
        set({ sizeFilters: newFilters });
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
    const { images, filterText, sizeFilters, customSizeFilter, sortOption } = get();

    // Filter by text
    let filtered = filterText
      ? images.filter((img) => {
          const searchTerm = filterText.toLowerCase();
          const altText = (img.alt || '').toLowerCase();
          const srcUrl = img.src.toLowerCase();
          const filename = (img.filename || '').toLowerCase();

          return (
            altText.includes(searchTerm) ||
            srcUrl.includes(searchTerm) ||
            filename.includes(searchTerm)
          );
        })
      : [...images];

    // Используем либо стандартные фильтры размера, либо кастомные, но не оба вместе
    if (customSizeFilter.minWidth || customSizeFilter.minHeight) {
      // Если заданы кастомные фильтры, используем только их
      filtered = filtered.filter((img) => {
        const passesMinWidth = !customSizeFilter.minWidth || img.width >= customSizeFilter.minWidth;
        const passesMinHeight =
          !customSizeFilter.minHeight || img.height >= customSizeFilter.minHeight;
        return passesMinWidth && passesMinHeight;
      });
    } else if (!sizeFilters.includes(SizeFilter.ALL)) {
      // Иначе используем стандартные фильтры, если не выбран ALL
      filtered = filtered.filter((img) => {
        // Check if the image matches any of the selected size filters
        return sizeFilters.some((filter) => {
          if (filter === SizeFilter.SMALL) {
            return img.width < 300;
          } else if (filter === SizeFilter.MEDIUM) {
            return img.width >= 300 && img.width < 1000;
          } else if (filter === SizeFilter.LARGE) {
            return img.width >= 1000;
          }
          return false;
        });
      });
    }

    // Sort images
    if (sortOption !== SortOption.DEFAULT) {
      filtered.sort((a, b) => {
        switch (sortOption) {
          case SortOption.NAME_ASC:
            return a.filename.localeCompare(b.filename);
          case SortOption.NAME_DESC:
            return b.filename.localeCompare(a.filename);
          case SortOption.SIZE_ASC:
            return a.fileSize - b.fileSize;
          case SortOption.SIZE_DESC:
            return b.fileSize - a.fileSize;
          default:
            return 0;
        }
      });
    }

    set({ filteredImages: filtered });
  },
}));
