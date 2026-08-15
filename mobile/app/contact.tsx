import React from 'react';
import { useI18n } from '../src/i18n';
import { APPLY_URL, CONTACT_URL, WEBSITE_URL } from '../src/config';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Card, Screen, Txt } from '../src/ui/kit';
import { openExternal } from '../src/ui/openLink';

export default function ContactScreen() {
  const { t } = useI18n();

  return (
    <Screen>
      <Txt variant="title">{t('contactTitle')}</Txt>

      <Card style={{ gap: spacing.md }}>
        <Txt variant="body" color={colors.textMuted}>
          {t('contactBody')}
        </Txt>
        <Button label={t('contactOpenSite')} onPress={() => void openExternal(CONTACT_URL)} />
        <Button label={t('applyAction')} kind="secondary" onPress={() => void openExternal(APPLY_URL)} />
        <Button label={t('visitWebsite')} kind="ghost" onPress={() => void openExternal(WEBSITE_URL)} />
      </Card>
    </Screen>
  );
}
