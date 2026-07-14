import { Lightbulb } from 'lucide-react';

interface Props {
  suggestion: string;
  index: number;
}

export function SuggestionCard({ suggestion, index }: Props) {
  return (
    <div className="flex items-start gap-4 p-5 bg-surface rounded-2xl border border-border-subtle">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent ring-1 ring-accent/20 text-sm font-bold">
        {index + 1}
      </div>
      <p className="text-text-tertiary text-sm leading-relaxed">{suggestion}</p>
      <Lightbulb size={16} className="text-accent shrink-0 mt-0.5 opacity-60" />
    </div>
  );
}
