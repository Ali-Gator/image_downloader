import React from 'react';

import { MetadataBadgeProps } from '@components/Page/types';
import { StyledBadge } from './styles';

export const MetadataBadge = ({ children, emphasis = false }: MetadataBadgeProps) => {
  return <StyledBadge emphasis={emphasis}>{children}</StyledBadge>;
}; 