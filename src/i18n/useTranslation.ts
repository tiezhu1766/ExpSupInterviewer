import { useState, useEffect } from 'react';
import { getLanguage, setLanguage, subscribe, t } from './index';
import type { Language } from './index';

export function useTranslation() {
  const [language, setLangState] = useState<Language>(getLanguage());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setLangState(getLanguage());
    });
    return unsubscribe;
  }, []);

  return {
    t,
    language,
    setLanguage,
  };
}
