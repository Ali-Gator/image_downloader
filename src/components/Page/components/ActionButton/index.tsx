import React from 'react';

import { Tooltip } from '@mui/material';

import { StyledIconButton } from '@components/Page/components/ActionButton/styles';
import { ActionButtonProps } from '@types';

export const ActionButton = ({
  tooltip,
  onClick,
  children,
  'aria-label': ariaLabel,
}: ActionButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Tooltip title={tooltip}>
      <StyledIconButton
        size="small"
        onClick={handleClick}
        aria-label={ariaLabel || tooltip}
        className="action-button"
      >
        {children}
      </StyledIconButton>
    </Tooltip>
  );
};
