import { ChangeEvent, FC } from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { Button, Checkbox, Typography } from '@mui/material';

import { ControlsContainer, HeaderContainer, SelectAllContainer, TitleContainer } from './styles';

interface HeaderProps {
  title: string;
  selectedCount: number;
  totalCount: number;
  onSelectAll: (selected: boolean) => void;
  onDownload: () => void;
}

export const Header: FC<HeaderProps> = ({
  title,
  selectedCount,
  totalCount,
  onSelectAll,
  onDownload,
}) => {
  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSelectAll(e.target.checked);
  };

  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  return (
    <HeaderContainer>
      <TitleContainer>
        <PhotoLibraryIcon />
        <Typography variant="h6">{title}</Typography>
      </TitleContainer>

      <ControlsContainer>
        <SelectAllContainer>
          <Checkbox
            id="selectAll"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAllChange}
          />
          <label htmlFor="selectAll">Select All</label>
        </SelectAllContainer>

        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          disabled={selectedCount === 0}
        >
          Download
        </Button>
      </ControlsContainer>
    </HeaderContainer>
  );
};
