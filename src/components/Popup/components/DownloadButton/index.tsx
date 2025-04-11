import React from 'react';

import { PhotoLibrary } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { StyledButton } from './styles';

interface DownloadButtonProps {
  onClick: () => void;
  isLoading: boolean;
  text: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, isLoading, text }) => {
  return (
    <StyledButton
      id="grabBtn"
      onClick={onClick}
      disabled={isLoading}
      variant="contained"
      color="secondary"
      fullWidth
    >
      {isLoading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <>
          <PhotoLibrary />
          <span id="downloadBtnText">{text}</span>
        </>
      )}
    </StyledButton>
  );
};

export default DownloadButton;
