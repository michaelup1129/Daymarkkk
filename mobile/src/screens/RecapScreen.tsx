import { Screen } from '../components/Screen';
import { useI18n } from '../hooks/useI18n';

export default function RecapScreen() {
  const { t } = useI18n();
  return <Screen title={t('recapTitle')} subtitle={t('recapBody')} />;
}
