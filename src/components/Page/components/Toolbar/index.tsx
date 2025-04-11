import { FC } from 'react';

import FilterListIcon from '@mui/icons-material/FilterList';
import GridViewIcon from '@mui/icons-material/GridView';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SortIcon from '@mui/icons-material/Sort';
import StraightenIcon from '@mui/icons-material/Straighten';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import {
  ControlItem,
  ControlsRow,
  CounterBadge,
  CounterText,
  InfoContainer,
  LeftSection,
  RightSection,
  SortContainer,
  ToolbarContainer,
  ViewButton,
  ViewOptionsContainer,
} from './styles';

interface ToolbarProps {
  filterText: string;
  setFilterText: (text: string) => void;
  sizeFilter: string;
  setSizeFilter: (size: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
  selectedCount: number;
  totalCount: number;
}

export const Toolbar: FC<ToolbarProps> = ({
  filterText,
  setFilterText,
  sizeFilter,
  setSizeFilter,
  sortOption,
  setSortOption,
  isGridView,
  setIsGridView,
  selectedCount,
  totalCount,
}) => {
  const handleClearFilters = () => {
    setFilterText('');
    setSizeFilter('all');
    setSortOption('default');
  };

  return (
    <ToolbarContainer>
      <LeftSection>
        <ControlsRow>
          <ControlItem>
            <FilterListIcon />
            <TextField
              placeholder="Filter..."
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </ControlItem>

          <ControlItem>
            <StraightenIcon />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="size-filter-label">Size</InputLabel>
              <Select
                labelId="size-filter-label"
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                label="Size"
              >
                <MenuItem value="all">All sizes</MenuItem>
                <MenuItem value="small">Small ({'<'} 500px)</MenuItem>
                <MenuItem value="medium">Medium (500-1000px)</MenuItem>
                <MenuItem value="large">Large ({'>'} 1000px)</MenuItem>
              </Select>
            </FormControl>
          </ControlItem>

          <ControlItem>
            <Button startIcon={<RestartAltIcon />} variant="outlined" onClick={handleClearFilters}>
              Reset
            </Button>
          </ControlItem>
        </ControlsRow>
      </LeftSection>

      <RightSection>
        <InfoContainer>
          <CounterBadge>
            <PhotoLibraryIcon />
            <CounterText>
              {selectedCount} of {totalCount} images selected
            </CounterText>
          </CounterBadge>
        </InfoContainer>

        <SortContainer>
          <SortIcon />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-images-label">Sort</InputLabel>
            <Select
              labelId="sort-images-label"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label="Sort"
            >
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="name-asc">Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z-A)</MenuItem>
              <MenuItem value="size-asc">Size (↑)</MenuItem>
              <MenuItem value="size-desc">Size (↓)</MenuItem>
            </Select>
          </FormControl>
        </SortContainer>

        <ViewOptionsContainer>
          <ViewButton onClick={() => setIsGridView(true)} active={isGridView}>
            <GridViewIcon />
          </ViewButton>
          <ViewButton onClick={() => setIsGridView(false)} active={!isGridView}>
            <ViewListIcon />
          </ViewButton>
        </ViewOptionsContainer>
      </RightSection>
    </ToolbarContainer>
  );
};
