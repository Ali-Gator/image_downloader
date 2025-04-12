/**
 * Props for the Header component
 */
export interface HeaderProps {
  title: string;
}

/**
 * Props for the DownloadButton component
 */
export interface DownloadButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

/**
 * Props for the HelpText component
 */
export interface HelpTextProps {
  text: string;
}

/**
 * Represents an image with metadata
 */
export interface ImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio?: number;
}
