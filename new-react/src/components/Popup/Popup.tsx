import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import { PhotoLibrary } from '@mui/icons-material';
import RatingWidget from '../Rating/RatingWidget';

const Popup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGrabImages = async () => {
    setIsLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'grabImages' });
      }
    } catch (error) {
      console.error('Error grabbing images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="popup-container">
      <div className="header">
        <Typography variant="h6" id="popupTitle">
          Image Downloader
        </Typography>
      </div>
      <div className="content">
        <Button
          id="grabBtn"
          variant="contained"
          startIcon={<PhotoLibrary />}
          onClick={handleGrabImages}
          disabled={isLoading}
        >
          <span id="downloadBtnText">DOWNLOAD</span>
        </Button>
        <Typography className="help-text" id="helpText">
          Select images to download and click the button
        </Typography>
        <RatingWidget />
      </div>
    </div>
  );
};

export default Popup;
