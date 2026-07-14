import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../i18n';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  const buttonClass = (lang: Language) =>
    `px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
      language === lang
        ? 'bg-accent text-text-on-accent'
        : 'text-text-tertiary hover:text-text-secondary hover:bg-elevated/60'
    }`;

  return (
    <div className="flex items-center gap-1 rounded-xl bg-elevated p-1 border border-subtle">
      <button onClick={() => setLanguage('en')} className={buttonClass('en')}>
        {t('language.en')}
      </button>
      <button onClick={() => setLanguage('zh')} className={buttonClass('zh')}>
        {t('language.zh')}
      </button>
    </div>
  );
}
