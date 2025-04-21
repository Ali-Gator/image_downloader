import { memo } from 'react';

import { ImageMetadataProps } from '@types';
import { formatFileSize, getFileExtension } from '@utils';

import { MetadataBadge } from '../MetadataBadge';
import { DimensionsContainer, FileName, MetadataContainer } from './styles';

export const ImageMetadata = memo(({ image, isListMode = false }: ImageMetadataProps) => {
  const { width, height, filename, fileSize } = image;

  const dimensions = width && height ? `${width} × ${height}` : '';
  const fileExtension = getFileExtension(filename);
  const formattedFileSize = formatFileSize(fileSize);

  return (
    <MetadataContainer isListMode={isListMode}>
      <FileName variant="body1" title={filename}>
        {filename}
      </FileName>

      {dimensions && (
        <DimensionsContainer isListMode={isListMode} className="dimensions-container">
          <MetadataBadge>{dimensions}</MetadataBadge>
          {formattedFileSize && <MetadataBadge>{formattedFileSize}</MetadataBadge>}
          <MetadataBadge emphasis>{fileExtension}</MetadataBadge>
        </DimensionsContainer>
      )}
    </MetadataContainer>
  );
});

ImageMetadata.displayName = 'ImageMetadata';
