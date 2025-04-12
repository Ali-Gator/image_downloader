import { ImageData } from '@types';
import { SizeFilter, SortOption } from '@utils';

/**
 * Props for the ImageGrid component
 */
export interface ImageGridProps {
  images: ImageData[];
  selectedImages: ImageData[];
  setSelectedImages: (images: ImageData[]) => void;
  isGridView: boolean;
}

/**
 * Props for the ImageCard component
 */
export interface ImageCardProps {
  image: ImageData;
  isSelected: boolean;
  onSelect: (url: string) => void;
}

/**
 * Props for the Toolbar component
 */
export interface ToolbarProps {
  filterText: string;
  setFilterText: (text: string) => void;
  sizeFilter: SizeFilter;
  setSizeFilter: (size: SizeFilter) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
  selectedCount: number;
  totalCount: number;
}

/**
 * Props for the Header component
 */
export interface HeaderProps {
  title: string;
  selectedCount: number;
  totalCount: number;
  onSelectAll: (select: boolean) => void;
  onDownload: () => void;
}
