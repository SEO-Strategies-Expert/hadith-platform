import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { colors } from '../theme';
import { Txt } from './kit';

/**
 * عدّاد عرضٍ فقط. **الحكم النهائي على الوقت لساعة الخادم** —
 * انقضاؤه هنا لا يمنع التسليم، وفي الخادم تسامح دقيقة للشبكة.
 */
export function Countdown({ deadline, label }: { deadline: string | null; label: string }) {
  const { n } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) return null;

  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return null;

  const remaining = Math.max(0, Math.floor((end - now) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 120;

  return (
    <Txt variant="smallStrong" color={urgent ? colors.danger : colors.textMuted}>
      {label}: {n(String(minutes).padStart(2, '0'))}:{n(String(seconds).padStart(2, '0'))}
    </Txt>
  );
}
