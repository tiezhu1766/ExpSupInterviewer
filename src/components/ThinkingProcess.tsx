import { useTranslation } from '../i18n/useTranslation';
import { Brain } from 'lucide-react';

interface ThinkingProcessProps {
  reason: string;
}

export function ThinkingProcess({ reason }: ThinkingProcessProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-elevated/50 border border-subtle rounded-xl px-4 py-3 text-sm">
      <div className="flex items-start gap-2 text-text-tertiary">
        <Brain size={14} className="text-accent mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-text-secondary">{t('thinking.decision')}</span>
          <span className="ml-1">{reason}</span>
        </div>
      </div>
    </div>
  );
}
