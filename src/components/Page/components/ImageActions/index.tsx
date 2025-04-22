import { ImageActionsProps } from '@types';
import { useImageOperations } from '@utils/imageOperations';

import { CopyButton } from '../CopyButton';
import { DownloadButton } from '../DownloadButton';
import { ActionsContainer } from './styles';

/**
 * Component that displays copy and download action buttons for an image
 */
export const ImageActions = ({
  image,
  orientation = 'horizontal',
  showCopy = true,
  showDownload = true,
}: ImageActionsProps) => {
  const { src, filename } = image;
  const { handleCopyUrl, handleDownload } = useImageOperations(src, filename);

  return (
    <ActionsContainer orientation={orientation} className="actions-container">
      {showCopy && <CopyButton url={src} onCopyClick={handleCopyUrl} />}
      {showDownload && <DownloadButton url={src} onDownloadClick={handleDownload} />}
    </ActionsContainer>
  );
};
