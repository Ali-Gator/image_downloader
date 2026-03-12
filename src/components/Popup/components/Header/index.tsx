import React from 'react';

import { PopupHeaderProps } from '@types';

import { HeaderContainer, HeaderLogo, HeaderTitle } from './styles';

const Header: React.FC<PopupHeaderProps> = ({ title }) => {
  return (
    <HeaderContainer>
      <HeaderLogo src="/img/logo-48.png" alt="Logo" />
      <HeaderTitle id="popupTitle" variant="h1">
        {title}
      </HeaderTitle>
    </HeaderContainer>
  );
};

export default Header;
