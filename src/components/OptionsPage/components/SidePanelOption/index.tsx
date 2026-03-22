import { FC } from 'react';

import { Checkbox, FormControlLabel } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';
import { isSidePanelSupported } from '@utils/sidePanelUtils';

import { InfoTooltip } from '../InfoIcon';
import { OptionRow } from '../styles';

export const SidePanelOption: FC = () => {
  const { t } = useTranslation();
  const { openInSidePanel, setOpenInSidePanel } = useSettingsStore();

  if (!isSidePanelSupported()) return null;

  return (
    <OptionRow>
      <FormControlLabel
        control={
          <Checkbox
            checked={openInSidePanel}
            onChange={(e) => setOpenInSidePanel(e.target.checked)}
            size="small"
          />
        }
        label={t('open_in_side_panel')}
      />
      <InfoTooltip title={t('open_in_side_panel_info')} />
    </OptionRow>
  );
};
