interface ScoreCardProps {
  label: string;
  score: number;
}

export function ScoreCard({ label, score }: ScoreCardProps) {
  const colorClass = score >= 7 ? 'text-success' : score >= 4 ? 'text-warning' : 'text-danger';
  const barClass = score >= 7 ? 'bg-success' : score >= 4 ? 'bg-warning' : 'bg-danger';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-tertiary">{label}</span>
        <span className={`text-lg font-bold font-heading ${colorClass}`}>{score}</span>
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className={`h-full ${barClass} rounded-full transition-all duration-500`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}
