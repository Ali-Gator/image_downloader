import { FC } from 'react';

import FilterListIcon from '@mui/icons-material/FilterList';
import GridViewIcon from '@mui/icons-material/GridView';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SortIcon from '@mui/icons-material/Sort';
import StraightenIcon from '@mui/icons-material/Straighten';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

import { useImageStore } from '@store';
import { SizeFilter, SortOption, useTranslation } from '@utils';

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

export const Toolbar: FC = () => {
  const { t } = useTranslation();
  const {
    filterText,
    setFilterText,
    sizeFilter,
    setSizeFilter,
    sortOption,
    setSortOption,
    isGridView,
    setIsGridView,
    filteredImages,
    selectedImages,
  } = useImageStore();

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;

  const handleClearFilters = () => {
    setFilterText('');
    setSizeFilter(SizeFilter.ALL);
    setSortOption(SortOption.DEFAULT);
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
                onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
                label={t('size_text')}
              >
                <MenuItem value={SizeFilter.ALL}>{t('size_filter_all')}</MenuItem>
                <MenuItem value={SizeFilter.SMALL}>{t('size_filter_small')}</MenuItem>
                <MenuItem value={SizeFilter.MEDIUM}>{t('size_filter_medium')}</MenuItem>
                <MenuItem value={SizeFilter.LARGE}>{t('size_filter_large')}</MenuItem>
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
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              label={t('sort_text')}
            >
              <MenuItem value={SortOption.DEFAULT}>{t('sort_default')}</MenuItem>
              <MenuItem value={SortOption.NAME_ASC}>{t('sort_name_asc')}</MenuItem>
              <MenuItem value={SortOption.NAME_DESC}>{t('sort_name_desc')}</MenuItem>
              <MenuItem value={SortOption.SIZE_ASC}>{t('sort_size_asc')}</MenuItem>
              <MenuItem value={SortOption.SIZE_DESC}>{t('sort_size_desc')}</MenuItem>
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
