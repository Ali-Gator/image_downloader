import React, { useEffect, useState } from 'react';

import { createTheme, Rating, Stack, ThemeProvider, Typography } from '@mui/material';

import { ApplicationLinks, StorageKeys, storageGet, storageSet, useTranslation } from '@utils';

function RatingWidget() {
  const [value, setValue] = useState<number | null>(0);
  const { t } = useTranslation();

  useEffect(() => {
    storageGet(StorageKeys.RATING_SCORE, (val) => {
      if (val) {
        setValue(+val);
      }
    });
  }, []);

  const handleClick = (_: React.SyntheticEvent, newValue: number | null) => {
    setValue(newValue);

    if (newValue && newValue > 3) {
      window.open(ApplicationLinks.GOOD_REVIEW, '_blank', 'noreferrer');
    } else {
      window.open(ApplicationLinks.FEEDBACK_FORM, '_blank', 'noreferrer');
    }

    storageSet(StorageKeys.RATING_SCORE, newValue ?? '');
  };

  const themeRating = createTheme({
    direction: window.getComputedStyle(document.body, null).getPropertyValue('direction') as 'rtl',
  });

  return (
    <Stack direction="row" className="rating-widget" justifyContent="center" alignItems="center">
      <Typography variant="body2" sx={{ marginRight: '5px' }}>
        {t('rateUs')}
      </Typography>
      <ThemeProvider theme={themeRating}>
        <Rating
          name="size-small"
          value={value}
          size="small"
          sx={{ marginRight: '10px' }}
          onChange={handleClick}
        />
      </ThemeProvider>
    </Stack>
  );
}

export default RatingWidget;
