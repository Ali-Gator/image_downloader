import React from 'react';

import { ImageActionsProps } from '@components/Page/types';

import { CopyButton } from '../CopyButton';
import { DownloadButton } from '../DownloadButton';
import { ActionsContainer } from './styles';

export const ImageActions = ({
  image,
  orientation = 'horizontal',
  showCopy = true,
  showDownload = true,
}: ImageActionsProps) => {
  const { src } = image;

  return (
    <ActionsContainer orientation={orientation} className="actions-container">
      {showCopy && <CopyButton url={src} onCopyClick={() => {}} />}
      {showDownload && <DownloadButton url={src} onDownloadClick={() => {}} />}
    </ActionsContainer>
  );
};
