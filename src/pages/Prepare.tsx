import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';
import type { MatchResponse } from '../types';
import { ResumeUploader } from '../components/ResumeUploader';
import { MatchReport } from '../components/MatchReport';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUp, Briefcase, BarChart3, ArrowRight, Hash } from 'lucide-react';

export function Prepare() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { resume, jobDescription, maxRounds, setResume, setJobDescription, setMaxRounds } = useAppStore();
  const [step, setStep] = useState(resume ? 1 : 0);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const steps = [
    { key: 'prepare.step.upload', Icon: FileUp },
    { key: 'prepare.step.jd', Icon: Briefcase },
    { key: 'prepare.step.report', Icon: BarChart3 },
  ];

  const handleParsed = useCallback((r: typeof resume) => {
    if (r) {
      setResume(r);
      setStep(1);
    }
  }, [setResume]);

  const handleAnalyze = useCallback(async () => {
    if (!resume || !jobDescription.trim()) return;
    setMatching(true);
    setMatchError(null);
    try {
      const result = await api.matchResumeJD(resume, jobDescription);
      setMatchResult(result);
      setStep(2);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '匹配分析失败，请重试';
      setMatchError(msg);
    } finally {
      setMatching(false);
    }
  }, [resume, jobDescription]);

  const handleStartInterview = useCallback(() => {
    navigate('/interview');
  }, [navigate]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 animate-fadeIn">
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-10 md:mb-14">
        {steps.map(({ key, Icon }, i) => (
          <div key={key} className="flex items-center gap-2 md:gap-3">
            <div
              className={`flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl transition ${
                i <= step
                  ? 'bg-accent text-text-on-accent shadow-[0_0_16px_rgba(212,168,83,0.25)]'
                  : 'bg-elevated text-text-tertiary border border-border'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${i <= step ? 'text-text-secondary' : 'text-text-tertiary/60'}`}>
              {t(key)}
            </span>
            {i < steps.length - 1 && (
              <div className={`hidden md:block w-10 h-px mx-1 ${i < step ? 'bg-accent/40' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {step < 2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className={step === 0 ? '' : 'opacity-50 pointer-events-none transition'}>
            <h2 className="text-lg font-semibold text-text-primary mb-4 font-heading flex items-center gap-2">
              <FileUp size={18} className="text-accent" />
              {t('prepare.resume.title')}
            </h2>
            <ResumeUploader onParsed={handleParsed} />
          </div>

          <div className={step >= 1 ? '' : 'opacity-50 pointer-events-none transition'}>
            <h2 className="text-lg font-semibold text-text-primary mb-4 font-heading flex items-center gap-2">
              <Briefcase size={18} className="text-accent" />
              {t('prepare.jd.title')}
            </h2>
            <Card hover={false}>
              <Input
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder={t('prepare.jd.placeholder')}
                multiline
                disabled={matching}
                className="min-h-[200px]"
              />

              {/* 面试问题数量配置 */}
              <div className="mt-4 p-4 bg-elevated/60 border border-border rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Hash size={14} className="text-accent" />
                    {t('prepare.maxRounds.label')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={maxRounds}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10);
                        if (v >= 1 && v <= 20) setMaxRounds(v);
                      }}
                      className="w-14 bg-input border border-border rounded-lg px-2 py-1 text-center text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none"
                    />
                    <span className="text-text-tertiary text-sm">/ 20</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={maxRounds}
                  onChange={e => setMaxRounds(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <p className="text-xs text-text-tertiary mt-2">{t('prepare.maxRounds.hint')}</p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!resume || !jobDescription.trim() || matching}
                variant="primary"
                className="mt-4 w-full"
              >
                {matching ? t('prepare.analyzing') : t('prepare.analyze')}
                {!matching && <ArrowRight size={16} />}
              </Button>
              {matchError && (
                <p className="mt-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                  {matchError}
                </p>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {step === 2 && matchResult && resume && (
        <div className="max-w-2xl mx-auto">
          <MatchReport
            matchResult={matchResult}
            resume={resume}
            jobDescription={jobDescription}
            onStartInterview={handleStartInterview}
          />
        </div>
      )}
    </div>
  );
}
