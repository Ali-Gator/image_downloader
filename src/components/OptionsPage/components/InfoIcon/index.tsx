import { FC, ReactNode } from 'react';

import InfoIcon from '@mui/icons-material/Info';
import { IconButton, Tooltip } from '@mui/material';

interface InfoIconProps {
  title: ReactNode;
  placement?:
    | 'top'
    | 'top-end'
    | 'top-start'
    | 'bottom'
    | 'bottom-end'
    | 'bottom-start'
    | 'left'
    | 'right';
}

export const InfoTooltip: FC<InfoIconProps> = ({ title, placement = 'top-end' }) => {
  return (
    <Tooltip title={title} arrow placement={placement}>
      <IconButton size="small" color="primary" aria-label="info">
        <InfoIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
