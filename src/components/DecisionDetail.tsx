import { useTranslation } from '../i18n/useTranslation';
import { ArrowRight } from 'lucide-react';

interface DecisionDetailProps {
  reason: string;
  quality: string;
}

const qualityBase = 'rounded-full px-2.5 py-0.5 text-xs font-semibold border';

const qualityColors: Record<string, string> = {
  good: 'bg-[var(--c-success-bg)] text-[var(--c-success-text)] border-[var(--c-success-text)]/20',
  vague: 'bg-[var(--c-warning-bg)] text-[var(--c-warning-text)] border-[var(--c-warning-text)]/20',
  shallow: 'bg-[var(--c-warning-bg)] text-[var(--c-warning-text)] border-[var(--c-warning-text)]/20',
  no_data: 'bg-[var(--c-danger-bg)] text-[var(--c-danger-text)] border-[var(--c-danger-text)]/20',
  irrelevant: 'bg-[var(--c-danger-bg)] text-[var(--c-danger-text)] border-[var(--c-danger-text)]/20',
};

export function DecisionDetail({ reason, quality }: DecisionDetailProps) {
  const { t } = useTranslation();
  const badgeCls = qualityColors[quality] ?? 'bg-elevated text-text-secondary border-border';

  return (
    <div className="mt-3 ml-6 space-y-2">
      <div className="flex items-center gap-3 text-sm">
        <span className={`${qualityBase} ${badgeCls}`}>
          {t(`quality.${quality}`)}
        </span>
        <ArrowRight size={14} className="text-text-tertiary" />
        <span className="text-text-tertiary">{t('decisionDetail.followUp')}</span>
      </div>
      <div className="bg-elevated/50 border border-subtle rounded-xl px-4 py-3 text-sm text-text-tertiary leading-relaxed">
        {reason}
      </div>
    </div>
  );
}
