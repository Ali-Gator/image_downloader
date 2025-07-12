import { memo } from 'react';

import { MenuItem, SelectChangeEvent, Typography } from '@mui/material';

import { useSettingsStore } from '@store';

import { StyledFormControl, StyledSelect } from './styles';

/**
 * Component for selecting default resolution preference
 */
export const ResolutionDefaults = memo(() => {
  const { defaultResolutionSelection, setDefaultResolutionSelection } = useSettingsStore();

  const handleResolutionChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as 'highest' | 'lowest' | 'medium' | 'original';
    setDefaultResolutionSelection(value);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
      <Typography style={{ width: '180px', minWidth: '180px', flexShrink: 0 }}>
        Default Resolution:
      </Typography>

      <StyledFormControl>
        <StyledSelect
          value={defaultResolutionSelection}
          onChange={handleResolutionChange}
          displayEmpty
        >
          <MenuItem value="highest">Highest Quality</MenuItem>
          <MenuItem value="medium">Medium Quality</MenuItem>
          <MenuItem value="lowest">Lowest Quality</MenuItem>
          <MenuItem value="original">Original (as found)</MenuItem>
        </StyledSelect>
      </StyledFormControl>
    </div>
  );
});

ResolutionDefaults.displayName = 'ResolutionDefaults';
