import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { messages, type Locale, type MessageKey } from '../i18n/messages';

type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const Context = createContext<I18n | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>('ko');
  return (
    <Context.Provider value={{ locale, setLocale, t: key => messages[locale][key] }}>
      {children}
    </Context.Provider>
  );
}

export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error('useI18n requires I18nProvider');
  return value;
}
