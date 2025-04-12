import React from 'react';

import { HeaderContainer, HeaderTitle } from './styles';
import { HeaderProps } from '../../types';

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <HeaderContainer>
      <HeaderTitle id="popupTitle" variant="h1">
        {title}
      </HeaderTitle>
    </HeaderContainer>
  );
};

export default Header;
