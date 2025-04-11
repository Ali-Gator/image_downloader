import React from 'react';

import { HeaderContainer, HeaderTitle } from './styles';

interface HeaderProps {
  title: string;
}

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
