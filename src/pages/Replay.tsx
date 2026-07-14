import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useInterviewStore } from '../store/interviewStore';
import { api } from '../services/api';
import type { InterviewSession, DecisionPath } from '../types';
import { Timeline } from '../components/Timeline';
import { DecisionTree } from '../components/DecisionTree';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { History, BarChart3, Plus, MessageSquare, CheckCircle2, Clock, Loader2 } from 'lucide-react';

export function Replay() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { currentSession, setCurrentSession } = useInterviewStore();
  const [decisions, setDecisions] = useState<DecisionPath[]>([]);
  const [historyList, setHistoryList] = useState<InterviewSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  // 加载历史列表
  useEffect(() => {
    if (currentSession) return;
    setLoadingHistory(true);
    api.listInterviews(20)
      .then(setHistoryList)
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [currentSession]);

  // 加载决策路径
  useEffect(() => {
    const session = selectedSession || currentSession;
    if (!session) return;
    api.getDecisions(session.id).then(setDecisions).catch(console.error);
  }, [currentSession, selectedSession]);

  const activeSession = selectedSession || currentSession;

  // 选择历史面试
  const handleSelectHistory = (session: InterviewSession) => {
    setSelectedSession(session);
    setCurrentSession(null);
  };

  // 恢复面试进度
  const handleResume = (session: InterviewSession) => {
    setCurrentSession(session);
    setSelectedSession(null);
    navigate('/interview');
  };

  // 查看报告
  const handleViewReport = (session: InterviewSession) => {
    setCurrentSession(session);
    setSelectedSession(null);
    navigate('/report');
  };

  // 历史列表视图
  if (!activeSession) {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-heading flex items-center gap-3">
            <History size={28} className="text-accent" />
            {t('replay.history.title')}
          </h1>
          <Button href="/prepare" variant="secondary" className="text-sm">
            <Plus size={16} />
            {t('replay.newInterview')}
          </Button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-20 text-text-tertiary">
            <Loader2 size={20} className="animate-spin mr-2" />
            {t('replay.history.loading')}
          </div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-20">
            <History size={48} className="mx-auto text-text-tertiary/40 mb-4" />
            <p className="text-text-tertiary">{t('replay.history.empty')}</p>
            <Button href="/prepare" variant="primary" className="mt-4">
              {t('replay.newInterview')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {historyList.map((s) => {
              const date = new Date(s.createdAt).toLocaleDateString(
                language === 'zh' ? 'zh-CN' : 'en-US',
                { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
              );
              const questionCount = s.messages.filter(m => m.type === 'question').length;
              return (
                <Card key={s.id} hover onClick={() => handleSelectHistory(s)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          s.status === 'finished'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {s.status === 'finished' ? t('replay.status.finished') : t('replay.status.ongoing')}
                        </span>
                        {s.status === 'ongoing' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResume(s); }}
                            className="text-xs text-accent hover:text-accent-hover transition"
                          >
                            {t('replay.history.resume')}
                          </button>
                        )}
                        {s.status === 'finished' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewReport(s); }}
                            className="text-xs text-accent hover:text-accent-hover transition"
                          >
                            {t('replay.viewReport')}
                          </button>
                        )}
                      </div>
                      <p className="text-text-primary font-medium truncate">{s.resume.name || t('replay.history.unnamed')}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-tertiary">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={12} />
                          {t('replay.messages', { count: s.messages.length })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {t('replay.scoredAnswers', { count: s.scores.length })}
                        </span>
                        <span>{questionCount}/{s.maxRounds} {t('replay.history.questions')}</span>
                      </div>
                    </div>
                    <BarChart3 size={18} className="text-text-tertiary shrink-0 ml-4" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 回放详情视图
  const date = new Date(activeSession.createdAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-fadeIn space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-heading flex items-center gap-3">
            <History size={28} className="text-accent" />
            {t('replay.title')}
          </h1>
          <p className="text-text-tertiary text-sm mt-1">{date}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={14} />
            {t('replay.messages', { count: activeSession.messages.length })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            {t('replay.scoredAnswers', { count: activeSession.scores.length })}
          </span>
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl p-4 md:p-8 lg:p-10 overflow-x-auto shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <Timeline messages={activeSession.messages} />
      </div>

      {decisions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary font-heading">决策路径</h2>
          {decisions.map((dp) => {
            const dpDate = new Date(dp.created_at).toLocaleString(
              language === 'zh' ? 'zh-CN' : 'en-US',
              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            );
            return (
              <div key={dp.id} className="bg-surface border border-border-subtle rounded-2xl p-5">
                <p className="text-xs text-text-tertiary mb-3">{dpDate}</p>
                <DecisionTree nodes={dp.nodes} />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 justify-center pt-4">
        <Button onClick={() => { setSelectedSession(null); setCurrentSession(null); }} variant="outline">
          {t('replay.backToList')}
        </Button>
        {activeSession.status === 'finished' && (
          <Button onClick={() => handleViewReport(activeSession)} variant="primary">
            <BarChart3 size={16} />
            {t('replay.viewReport')}
          </Button>
        )}
        {selectedSession && selectedSession.status === 'ongoing' && (
          <Button onClick={() => handleResume(selectedSession)} variant="primary">
            <Plus size={16} />
            {t('replay.history.resume')}
          </Button>
        )}
        <Button href="/prepare" variant="secondary">
          <Plus size={16} />
          {t('replay.newInterview')}
        </Button>
      </div>
    </div>
  );
}
