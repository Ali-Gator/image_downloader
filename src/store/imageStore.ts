import { create } from 'zustand';

import { ImageData } from '@types';
import { SizeFilter, SortOption } from '@utils';

interface ImageState {
  // Image collections
  images: ImageData[];
  filteredImages: ImageData[];
  selectedImages: ImageData[];

  // UI state
  isLoading: boolean;
  isGridView: boolean;

  // Filter state
  filterText: string;
  sizeFilter: SizeFilter;
  sortOption: SortOption;

  // Actions
  setImages: (images: ImageData[]) => void;
  setFilteredImages: (images: ImageData[]) => void;
  setSelectedImages: (images: ImageData[]) => void;
  toggleSelectImage: (image: ImageData) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsGridView: (isGridView: boolean) => void;
  setFilterText: (text: string) => void;
  setSizeFilter: (filter: SizeFilter) => void;
  setSortOption: (option: SortOption) => void;
  applyFilters: () => void;
}

export const useImageStore = create<ImageState>((set, get) => ({
  // Initial state
  images: [],
  filteredImages: [],
  selectedImages: [],
  isLoading: false,
  isGridView: true,
  filterText: '',
  sizeFilter: SizeFilter.ALL,
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

  setSizeFilter: (sizeFilter) => {
    set({ sizeFilter });
    get().applyFilters();
  },

  setSortOption: (sortOption) => {
    set({ sortOption });
    get().applyFilters();
  },

  applyFilters: () => {
    const { images, filterText, sizeFilter, sortOption } = get();

    // Filter by text
    let filtered = filterText
      ? images.filter(
          (img) =>
            img.alt.toLowerCase().includes(filterText.toLowerCase()) ||
            img.src.toLowerCase().includes(filterText.toLowerCase()),
        )
      : [...images];

    // Filter by size
    if (sizeFilter !== SizeFilter.ALL) {
      filtered = filtered.filter((img) => {
        if (sizeFilter === SizeFilter.SMALL) {
          return img.width < 300 || img.height < 300;
        } else if (sizeFilter === SizeFilter.MEDIUM) {
          return (img.width >= 300 && img.width < 1000) || (img.height >= 300 && img.height < 1000);
        } else if (sizeFilter === SizeFilter.LARGE) {
          return img.width >= 1000 || img.height >= 1000;
        }
        return true;
      });
    }

    // Sort images
    if (sortOption !== SortOption.DEFAULT) {
      filtered.sort((a, b) => {
        switch (sortOption) {
          case SortOption.NAME_ASC:
            return a.alt.localeCompare(b.alt);
          case SortOption.NAME_DESC:
            return b.alt.localeCompare(a.alt);
          case SortOption.SIZE_ASC:
            return a.width * a.height - b.width * b.height;
          case SortOption.SIZE_DESC:
            return b.width * b.height - a.width * a.height;
          default:
            return 0;
        }
      });
    }

    set({ filteredImages: filtered });
  },
}));
