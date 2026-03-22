import { FC } from 'react';

import BugReportIcon from '@mui/icons-material/BugReport';
import { Link, Stack } from '@mui/material';

import { ApplicationLinks, useTranslation } from '@utils';

export const ReportBugLink: FC = () => {
  const { t } = useTranslation();

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <BugReportIcon fontSize="small" />
      <Link
        href={ApplicationLinks.BUG_REPORT_FORM}
        target="_blank"
        rel="noreferrer"
        color="inherit"
        underline="hover"
        variant="body2"
        data-onboarding="report-bug"
      >
        {t('report_bug_text')}
      </Link>
    </Stack>
  );
};
