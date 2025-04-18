import React from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import { Tooltip } from '@mui/material';

import { DownloadButtonProps } from '@types';

import { ActionIconButton } from './styles';

export const DownloadButton: React.FC<DownloadButtonProps> = ({ url, onDownloadClick }) => {
  return (
    <Tooltip title="Download image" arrow>
      <ActionIconButton onClick={() => onDownloadClick(url)} size="small">
        <DownloadIcon fontSize="small" />
      </ActionIconButton>
    </Tooltip>
  );
};
