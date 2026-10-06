import { Screen } from '../components/Screen';
import { useI18n } from '../hooks/useI18n';

export default function CalendarScreen() {
  const { t } = useI18n();
  return <Screen title={t('calendarTitle')} subtitle={t('calendarBody')} />;
}
