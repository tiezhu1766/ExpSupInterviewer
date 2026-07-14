import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { MatchResponse, ParsedResume } from '../types';
import { api } from '../services/api';
import { RingChart } from './charts/RingChart';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Lightbulb, ArrowRight, Download } from 'lucide-react';

interface MatchReportProps {
  matchResult: MatchResponse;
  resume: ParsedResume;
  jobDescription: string;
  onStartInterview: () => void;
}

const statusColors = {
  full: 'bg-[var(--c-success-bg)] text-[var(--c-success-text)] border-[var(--c-success-text)]/20',
  partial: 'bg-[var(--c-warning-bg)] text-[var(--c-warning-text)] border-[var(--c-warning-text)]/20',
  missing: 'bg-[var(--c-danger-bg)] text-[var(--c-danger-text)] border-[var(--c-danger-text)]/20',
};

const matchModeStyles = {
  hybrid: 'bg-[var(--c-success-bg)] text-[var(--c-success-text)] border-[var(--c-success-text)]/20',
  llm_only: 'bg-[var(--c-warning-bg)] text-[var(--c-warning-text)] border-[var(--c-warning-text)]/20',
};

function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return 'bg-[var(--c-success-text)]';
  if (similarity >= 0.5) return 'bg-[var(--c-warning-text)]';
  return 'bg-[var(--c-danger-text)]';
}

export function MatchReport({ matchResult, resume, jobDescription, onStartInterview }: MatchReportProps) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const { overallScore, items, suggestions, matchMode } = matchResult;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadMatchPDF(resume, jobDescription);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match_report_${resume.name || 'candidate'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const statusLabels = {
    full: t('matchReport.status.matched'),
    partial: t('matchReport.status.partial'),
    missing: t('matchReport.status.missing'),
  };

  const matchText =
    overallScore >= 70 ? t('matchReport.great') : overallScore >= 40 ? t('matchReport.decent') : t('matchReport.low');

  return (
    <div className="space-y-6">
      <Card hover={false} className="flex flex-col items-center py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="relative">
          <RingChart percentage={overallScore} size={180} strokeWidth={14} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-text-primary font-heading">{overallScore}</span>
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider mt-1">{t('matchReport.matchScore')}</span>
          </div>
        </div>
        <p className="relative mt-6 text-text-secondary text-center max-w-sm leading-relaxed">
          {matchText}
        </p>
        {matchMode && (
          <span
            className={`relative mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold border ${matchModeStyles[matchMode]}`}
          >
            {matchMode === 'hybrid'
              ? t('matchReport.matchMode.hybrid')
              : t('matchReport.matchMode.llmOnly')}
          </span>
        )}
      </Card>

      <Card hover={false}>
        <h3 className="text-lg font-semibold text-text-primary mb-5 font-heading">{t('matchReport.skillsAnalysis')}</h3>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.skill} className="py-3 border-b border-border-subtle last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary font-medium">{item.skill}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <span className="text-text-tertiary text-sm font-medium">{item.score}%</span>
              </div>
              {item.similarity !== undefined && item.similarity !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(item.similarity * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('matchReport.similarity')}
                  >
                    <div
                      className={`h-full rounded-full ${getSimilarityColor(item.similarity)}`}
                      style={{ width: `${Math.round(item.similarity * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-tertiary font-medium w-9 text-right">
                    {Math.round(item.similarity * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {suggestions.length > 0 && (
        <Card hover={false}>
          <h3 className="text-lg font-semibold text-text-primary mb-5 font-heading">{t('matchReport.suggestions')}</h3>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-elevated/40 border border-subtle">
                <Lightbulb size={18} className="text-accent shrink-0 mt-0.5" />
                <p className="text-text-tertiary text-sm leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-center gap-4 pt-2">
        <Button onClick={handleDownloadPDF} variant="secondary" disabled={downloading} className="text-base px-6 py-4">
          <Download size={18} />
          {downloading ? t('matchReport.downloading') || '下载中...' : t('matchReport.downloadPDF') || '下载报告'}
        </Button>
        <Button onClick={onStartInterview} variant="primary" className="text-base px-10 py-4">
          {t('matchReport.startInterview')}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
