import React from 'react';

import { PopupHeaderProps } from '@types';

import { HeaderContainer, HeaderTitle } from './styles';

const Header: React.FC<PopupHeaderProps> = ({ title }) => {
  return (
    <HeaderContainer>
      <HeaderTitle id="popupTitle" variant="h1">
        {title}
      </HeaderTitle>
    </HeaderContainer>
  );
};

export default Header;
