import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

import { ImageActionsProps } from '@types';
import { useImageOperations, useTranslation } from '@utils';

import { ActionButton } from '../ActionButton';
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
  const { t } = useTranslation();

  return (
    <ActionsContainer orientation={orientation} className="actions-container">
      {showCopy && (
        <ActionButton
          tooltip={t('copy_url_tooltip')}
          onClick={handleCopyUrl}
          aria-label={t('copy_url_tooltip')}
        >
          <ContentCopyIcon fontSize="small" />
        </ActionButton>
      )}
      {showDownload && (
        <ActionButton
          tooltip={t('download_image_tooltip')}
          onClick={handleDownload}
          aria-label={t('download_image_tooltip')}
        >
          <DownloadIcon fontSize="small" />
        </ActionButton>
      )}
    </ActionsContainer>
  );
};
