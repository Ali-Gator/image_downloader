import { FC } from 'react';

import { Button } from '@mui/material';

import { ApplicationLinks, useTranslation } from '@utils';

export const ReportBugLink: FC = () => {
  const { t } = useTranslation();

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => window.open(ApplicationLinks.BUG_REPORT_FORM, '_blank', 'noreferrer')}
      data-onboarding="report-bug"
    >
      {t('report_bug_text')}
    </Button>
  );
};
