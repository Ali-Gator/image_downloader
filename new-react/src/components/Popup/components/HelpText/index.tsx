import React from 'react';
import { HelpTextContainer, HelpTextContent } from './styles';

interface HelpTextProps {
  text: string;
}

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