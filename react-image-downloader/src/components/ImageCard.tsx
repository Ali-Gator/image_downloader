import React from 'react';
import { Card, CardMedia, CardActions, Checkbox, Typography, Button } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

interface ImageCardProps {
  url: string;
  filename: string;
  selected: boolean;
  onToggleSelect: () => void;
  onDownload: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  url,
  filename,
  selected,
  onToggleSelect,
  onDownload
}) => {
  return (
    <Card>
      <CardMedia
        component="img"
        height="140"
        image={url}
        alt={filename}
        sx={{ objectFit: 'contain' }}
      />
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Checkbox
          checked={selected}
          onChange={onToggleSelect}
        />
        <Typography variant="body2" noWrap sx={{ maxWidth: '180px' }}>
          {filename}
        </Typography>
        <Button
          size="small"
          onClick={onDownload}
        >
          <GetAppIcon fontSize="small" />
        </Button>
      </CardActions>
    </Card>
  );
}; 