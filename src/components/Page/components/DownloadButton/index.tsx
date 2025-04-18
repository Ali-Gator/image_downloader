import React from 'react';
import { Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

import { DownloadButtonProps } from '@components/Page/types';
import { ActionIconButton } from './styles';

export const DownloadButton: React.FC<DownloadButtonProps> = ({ url, fileName, onDownloadClick }) => {
  return (
    <Tooltip title="Download image" arrow>
      <ActionIconButton onClick={() => onDownloadClick(url)} size="small">
        <DownloadIcon fontSize="small" />
      </ActionIconButton>
    </Tooltip>
  );
}; 