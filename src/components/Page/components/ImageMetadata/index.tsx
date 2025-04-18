import { memo, useEffect, useState } from 'react';

import { ImageMetadataProps } from '@types';
import { getFileExtension, getFileSize } from '@utils';

import { MetadataBadge } from '../MetadataBadge';
import { DimensionsContainer, FileName, MetadataContainer } from './styles';

export const ImageMetadata = memo(({ image, isListMode = false }: ImageMetadataProps) => {
  const { src, width, height, filename } = image;
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isLoadingSize, setIsLoadingSize] = useState(false);

  useEffect(() => {
    setIsLoadingSize(true);

    const fetchFileSize = async () => {
      try {
        const size = await getFileSize(src);
        setFileSize(size);
      } catch (error) {
        console.error('Error getting file size:', error);
        setFileSize(null);
      } finally {
        setIsLoadingSize(false);
      }
    };

    fetchFileSize();
  }, [src]);

  const dimensions = width && height ? `${width} × ${height}` : '';
  const fileExtension = getFileExtension(filename);

  return (
    <MetadataContainer isListMode={isListMode}>
      <FileName variant="body1" title={filename}>
        {filename}
      </FileName>

      {dimensions && (
        <DimensionsContainer isListMode={isListMode} className="dimensions-container">
          <MetadataBadge>{dimensions}</MetadataBadge>
          {!isLoadingSize && fileSize && <MetadataBadge>{fileSize}</MetadataBadge>}
          <MetadataBadge emphasis>{fileExtension}</MetadataBadge>
        </DimensionsContainer>
      )}
    </MetadataContainer>
  );
});

ImageMetadata.displayName = 'ImageMetadata';
