import { Tooltip } from '@mui/material';

import { ActionButtonProps } from '@types';

import { StyledIconButton } from './styles';

export const ActionButton = ({
  tooltip,
  onClick,
  children,
  'aria-label': ariaLabel,
}: ActionButtonProps) => (
  <Tooltip title={tooltip} arrow>
    <StyledIconButton onClick={onClick} size="small" aria-label={ariaLabel || tooltip}>
      {children}
    </StyledIconButton>
  </Tooltip>
);
