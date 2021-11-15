import React from 'react';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Dialog from '../../ui/dialog';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  FONT_WEIGHT,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function NewCollectiblesNotice() {
  const t = useI18nContext();

  return (
    <Box marginBottom={8}>
      <Dialog type="message">
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={1}>
            <i style={{ fontSize: '1.2rem' }} className="fa fa-info-circle" />
          </Box>
          <Box paddingLeft={4}>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.Paragraph}
              align={TEXT_ALIGN.LEFT}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('newNFTsDetected')}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.Paragraph}
              align={TEXT_ALIGN.LEFT}
              boxProps={{ marginBottom: 4 }}
            >
              {t('newNFTsDetectedInfo')}
            </Typography>
            <Box marginTop={2}>
              <Button
                type="link"
                style={{ fontSize: '1rem', padding: 0 }}
                onClick={() => {
                  console.log('show preference popover');
                }}
              >
                {t('selectNFTPrivacyPreference')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
