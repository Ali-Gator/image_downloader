import { FC } from 'react';

import { Checkbox, FormControlLabel } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { OptionRow } from '../styles';

export const OrganizeByDomainOption: FC = () => {
  const { t } = useTranslation();
  const { organizeByDomain, setOrganizeByDomain } = useSettingsStore();

  return (
    <OptionRow data-onboarding="organize-by-domain">
      <FormControlLabel
        control={
          <Checkbox
            checked={organizeByDomain}
            onChange={(e) => setOrganizeByDomain(e.target.checked)}
            size="small"
          />
        }
        label={t('organize_by_domain')}
      />
      <InfoTooltip title={t('organize_by_domain_info')} />
    </OptionRow>
  );
};
