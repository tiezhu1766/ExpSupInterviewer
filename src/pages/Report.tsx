import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useInterviewStore } from '../store/interviewStore';
import { useReportStore } from '../store/reportStore';
import { api } from '../services/api';
import type { InterviewReport, ProgressPoint } from '../types';
import { RadarChart } from '../components/charts/RadarChart';
import { ProgressChart } from '../components/charts/ProgressChart';
import { SuggestionCard } from '../components/SuggestionCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart3, History, Plus, Loader2 } from 'lucide-react';

export function Report() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentSession } = useInterviewStore();
  const { reports, currentReport, setCurrentReport, addReport } = useReportStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSession) {
      navigate('/');
      return;
    }

    if (currentReport && currentReport.sessionId === currentSession.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const report = await api.generateReport(currentSession!);
        const progress: ProgressPoint[] = [
          ...reports.map((r) => ({
            sessionId: r.sessionId,
            totalScore: r.dimensions.reduce((sum, d) => sum + d.score, 0),
            createdAt: new Date().toISOString(),
          })),
          {
            sessionId: report.sessionId,
            totalScore: report.dimensions.reduce((sum, d) => sum + d.score, 0),
            createdAt: new Date().toISOString(),
          },
        ];
        const fullReport: InterviewReport = { ...report, progress };
        if (!cancelled) {
          setCurrentReport(fullReport);
          addReport(fullReport);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentSession]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-accent" size={28} />
        <p className="text-text-tertiary text-lg">{t('report.generating')}</p>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="text-center py-24">
        <p className="text-text-tertiary mb-6">{t('report.noData')}</p>
        <Button href="/prepare" variant="primary">{t('report.startNew')}</Button>
      </div>
    );
  }

  const overallScore = currentReport.dimensions.reduce((sum, d) => sum + d.score, 0);
  const maxScore = currentReport.dimensions.length * 10;

  return (
    <div className="animate-fadeIn space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-heading flex items-center gap-3">
            <BarChart3 size={28} className="text-accent" />
            {t('report.title')}
          </h1>
          <p className="text-text-tertiary text-sm mt-1">{currentReport.sessionId}</p>
        </div>
        <Badge variant="accent" className="self-start sm:self-auto">
          {t('report.overall', { score: overallScore, max: maxScore })}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card hover={false}>
          <h2 className="text-base md:text-lg font-semibold text-text-secondary mb-5 font-heading">{t('report.dimensionRadar')}</h2>
          <RadarChart dimensions={currentReport.dimensions} />
        </Card>

        <div className="space-y-6">
          <Card hover={false}>
            <h2 className="text-base md:text-lg font-semibold text-text-secondary mb-5 font-heading">{t('report.dimensionScores')}</h2>
            <div className="space-y-4">
              {currentReport.dimensions.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary font-medium">{d.name}</span>
                    <span className="text-accent font-bold font-heading">{d.score}/10</span>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(212,168,83,0.25)]"
                      style={{ width: `${d.score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card hover={false}>
            <h2 className="text-base md:text-lg font-semibold text-text-secondary mb-5 font-heading">{t('report.progress')}</h2>
            <ProgressChart progress={currentReport.progress} />
          </Card>
        </div>
      </div>

      {currentReport.suggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-secondary mb-5 font-heading">{t('report.suggestions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentReport.suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center pt-4">
        <Button href="/replay" variant="outline">
          <History size={16} />
          {t('report.viewReplay')}
        </Button>
        <Button href="/prepare" variant="secondary">
          <Plus size={16} />
          {t('report.newInterview')}
        </Button>
      </div>
    </div>
  );
}
