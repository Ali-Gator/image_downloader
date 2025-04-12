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
import { useTranslation } from '../../../../utils/useTranslation';

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
  const { t } = useTranslation();

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
              placeholder={t('filter_text')}
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </ControlItem>

          <ControlItem>
            <StraightenIcon />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="size-filter-label">{t('size_text')}</InputLabel>
              <Select
                labelId="size-filter-label"
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                label={t('size_text')}
              >
                <MenuItem value="all">{t('size_filter_all')}</MenuItem>
                <MenuItem value="small">{t('size_filter_small')}</MenuItem>
                <MenuItem value="medium">{t('size_filter_medium')}</MenuItem>
                <MenuItem value="large">{t('size_filter_large')}</MenuItem>
              </Select>
            </FormControl>
          </ControlItem>

          <ControlItem>
            <Button
              startIcon={<RestartAltIcon />}
              variant="outlined"
              onClick={handleClearFilters}
              title={t('reset_filters_title')}
            >
              {t('reset_btn')}
            </Button>
          </ControlItem>
        </ControlsRow>
      </LeftSection>

      <RightSection>
        <InfoContainer>
          <CounterBadge>
            <PhotoLibraryIcon />
            <CounterText>
              {selectedCount} {t('of_text')} {totalCount} {t('images_selected_text')}
            </CounterText>
          </CounterBadge>
        </InfoContainer>

        <SortContainer>
          <SortIcon />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-images-label">{t('sort_text')}</InputLabel>
            <Select
              labelId="sort-images-label"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label={t('sort_text')}
            >
              <MenuItem value="default">{t('sort_default')}</MenuItem>
              <MenuItem value="name-asc">{t('sort_name_asc')}</MenuItem>
              <MenuItem value="name-desc">{t('sort_name_desc')}</MenuItem>
              <MenuItem value="size-asc">{t('sort_size_asc')}</MenuItem>
              <MenuItem value="size-desc">{t('sort_size_desc')}</MenuItem>
            </Select>
          </FormControl>
        </SortContainer>

        <ViewOptionsContainer>
          <ViewButton
            onClick={() => setIsGridView(true)}
            active={isGridView}
            title={t('grid_view_text')}
          >
            <GridViewIcon />
          </ViewButton>
          <ViewButton
            onClick={() => setIsGridView(false)}
            active={!isGridView}
            title={t('list_view_text')}
          >
            <ViewListIcon />
          </ViewButton>
        </ViewOptionsContainer>
      </RightSection>
    </ToolbarContainer>
  );
};
