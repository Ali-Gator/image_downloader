import React from 'react';

import { HelpTextProps } from '@types';

import { HelpTextContainer, HelpTextContent } from './styles';

const HelpText: React.FC<HelpTextProps> = ({ text }) => {
  return (
    <HelpTextContainer>
      <HelpTextContent id="helpText" variant="body2">
        {text}
      </HelpTextContent>
    </HelpTextContainer>
  );
};

export default HelpText;
