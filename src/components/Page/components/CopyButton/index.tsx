import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Tooltip } from '@mui/material';

import { CopyButtonProps } from '@components/Page/types';

import { ActionIconButton } from './styles';

export const CopyButton: React.FC<CopyButtonProps> = ({ url, onCopyClick }) => {
  return (
    <Tooltip title="Copy URL" arrow>
      <ActionIconButton onClick={() => onCopyClick(url)} size="small">
        <ContentCopyIcon fontSize="small" />
      </ActionIconButton>
    </Tooltip>
  );
};
