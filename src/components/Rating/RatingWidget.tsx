import React, { useEffect, useState } from 'react';

import { createTheme, Rating, Stack, ThemeProvider, Typography } from '@mui/material';

import { storageGet, storageSet } from '../../utils/localStorage';
import { useTranslation } from '../../utils/useTranslation';

export const RATING_KEY = 'app_rating_score';

const FEEDBACK_FORM_LINK = 'https://forms.gle/9N1Z4ZTPWoS2r7356';
const GOOD_REVIEW_LINK =
  'https://chromewebstore.google.com/detail/image-downloader/hohnpmioogigogdedhigjpjjjonkojbk/reviews';

function RatingWidget() {
  const [value, setValue] = useState<number | null>(0);
  const { t } = useTranslation();

  useEffect(() => {
    storageGet(RATING_KEY, (val) => {
      if (val) {
        setValue(+val);
      }
    });
  }, []);

  const handleClick = (_: React.SyntheticEvent, newValue: number | null) => {
    setValue(newValue);

    if (newValue && newValue > 3) {
      window.open(GOOD_REVIEW_LINK, '_blank', 'noreferrer');
    } else {
      window.open(FEEDBACK_FORM_LINK, '_blank', 'noreferrer');
    }

    storageSet(RATING_KEY, newValue ?? '');
  };

  const themeRating = createTheme({
    direction: window.getComputedStyle(document.body, null).getPropertyValue('direction') as 'rtl',
  });

  return (
    <Stack
      direction="row"
      className="rating-widget"
      justifyContent="center"
      alignItems="center"
      paddingTop="3px"
    >
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
