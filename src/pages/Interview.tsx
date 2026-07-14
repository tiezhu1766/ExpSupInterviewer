import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useAppStore } from '../store/appStore';
import { useInterviewStore } from '../store/interviewStore';
import { api } from '../services/api';
import type { InterviewMessage, AnswerScore, DecisionNode } from '../types';
import { ChatBubble } from '../components/ChatBubble';
import { ThinkingProcess } from '../components/ThinkingProcess';
import { DecisionTree } from '../components/DecisionTree';
import { ScoreCard } from '../components/ScoreCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MessageSquareText, Clock, ArrowRight, Send, Loader2 } from 'lucide-react';

export function Interview() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { resume, jobDescription, maxRounds } = useAppStore();
  const { currentSession, setCurrentSession, addMessage, addScore, finishSession } = useInterviewStore();

  useEffect(() => {
    if (!resume || !jobDescription) {
      navigate('/prepare');
    }
  }, [resume, jobDescription, navigate]);

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState('');
  const [round, setRound] = useState(1);
  const [finished, setFinished] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const [decisionPath, setDecisionPath] = useState<DecisionNode[]>([]);
  const [avgScores, setAvgScores] = useState<AnswerScore>({ relevance: 0, depth: 0, completeness: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // 从后端恢复面试进度
  useEffect(() => {
    if (!currentSession || currentSession.status === 'finished') return;
    if (messages.length > 0) return;

    setRestoring(true);
    api.getInterview(currentSession.id)
      .then((session) => {
        setCurrentSession(session);
        setMessages(session.messages);
        setStarted(true);
        setRound(session.messages.filter(m => m.type === 'question').length || 1);
        setCurrentQuestionId(session.currentQuestionId || '');
        setAskedIds(session.askedIds || []);
        if (session.scores.length > 0) {
          const avg = session.scores.reduce(
            (acc, s) => ({
              relevance: acc.relevance + s.relevance,
              depth: acc.depth + s.depth,
              completeness: acc.completeness + s.completeness,
            }),
            { relevance: 0, depth: 0, completeness: 0 },
          );
          const n = session.scores.length;
          setAvgScores({
            relevance: Math.round(avg.relevance / n),
            depth: Math.round(avg.depth / n),
            completeness: Math.round(avg.completeness / n),
          });
        }
        if (session.maxRounds) {
          useAppStore.getState().setMaxRounds(session.maxRounds);
        }
      })
      .catch(() => {
        setCurrentSession(null);
      })
      .finally(() => setRestoring(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesRef = useRef<InterviewMessage[]>(messages);
  const currentSessionRef = useRef(currentSession);
  const currentQuestionIdRef = useRef(currentQuestionId);
  const roundRef = useRef(round);
  const askedIdsRef = useRef(askedIds);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);
  useEffect(() => { currentQuestionIdRef.current = currentQuestionId; }, [currentQuestionId]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { askedIdsRef.current = askedIds; }, [askedIds]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
      return () => clearInterval(timerRef.current!);
    }
  }, [started, finished]);

  useEffect(() => {
    if (finished && timerRef.current) clearInterval(timerRef.current);
  }, [finished]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const updateAvgScores = useCallback((allScores: AnswerScore[]) => {
    if (allScores.length === 0) return;
    const avg = allScores.reduce(
      (acc, s) => ({
        relevance: acc.relevance + s.relevance,
        depth: acc.depth + s.depth,
        completeness: acc.completeness + s.completeness,
      }),
      { relevance: 0, depth: 0, completeness: 0 },
    );
    const n = allScores.length;
    setAvgScores({ relevance: Math.round(avg.relevance / n), depth: Math.round(avg.depth / n), completeness: Math.round(avg.completeness / n) });
  }, []);

  const handleStart = useCallback(async () => {
    if (!resume || !jobDescription) return;
    setLoading(true);
    try {
      const result = await api.startInterview(resume, jobDescription, maxRounds);
      setCurrentSession({
        id: result.sessionId,
        resume,
        jobDescription,
        messages: [result.firstQuestion],
        scores: [],
        status: 'ongoing',
        createdAt: new Date().toISOString(),
      });
      setMessages([result.firstQuestion]);
      setCurrentQuestionId(result.questionId);
      setAskedIds([result.questionId]);
      setStarted(true);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '面试启动失败，请重试';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [resume, jobDescription, maxRounds, setCurrentSession]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || finished) return;
    const answer = input.trim();
    setInput('');
    const candidateMsg: InterviewMessage = { role: 'candidate', content: answer };
    setMessages((prev) => [...prev, candidateMsg]);
    addMessage(candidateMsg);
    setLoading(true);

    try {
      const session = currentSessionRef.current;
      const qId = currentQuestionIdRef.current;
      const currentRound = roundRef.current;
      const currentAskedIds = askedIdsRef.current;

      if (!session) return;

      const result = await api.processAnswer(session.id, answer, qId, currentRound, maxRounds, currentAskedIds);
      setMessages((prev) => [...prev, ...result.messages]);
      result.messages.forEach((m) => addMessage(m));

      if (result.scores) {
        addScore(result.scores);
        const allScores = [...(session.scores ?? []), result.scores];
        updateAvgScores(allScores);
      }

      if (result.reasoning) setReasoning(result.reasoning);
      else setReasoning('');

      setDecisionPath(result.decisionPath ?? []);

      if (result.finished) {
        setFinished(true);
        finishSession();
      } else {
        setRound((r) => r + 1);
        if (result.nextQuestionId) {
          setCurrentQuestionId(result.nextQuestionId);
          if (result.nextQuestionId !== qId) {
            setAskedIds((prev) => [...prev, result.nextQuestionId!]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '请求失败，请重试';
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [input, loading, finished, addMessage, addScore, finishSession, updateAvgScores]);

  if (restoring) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 animate-fadeIn">
        <Loader2 size={32} className="animate-spin mx-auto text-accent mb-4" />
        <p className="text-text-tertiary">{t('interview.restoring')}</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 animate-fadeIn">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle text-accent ring-1 ring-accent/20 mb-6">
          <MessageSquareText size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-3 font-heading">{t('interview.ready.title')}</h1>
        <p className="text-text-tertiary mb-10 max-w-md mx-auto leading-relaxed">
          {resume && jobDescription
            ? t('interview.ready.description')
            : t('interview.ready.descriptionEmpty')}
        </p>
        <Button onClick={handleStart} disabled={!resume || !jobDescription || loading} variant="primary" className="text-base px-8 py-4">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          {loading ? t('interview.ready.starting') : t('interview.ready.start')}
        </Button>
        {errorMsg && (
          <p className="mt-4 text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-4 py-2 max-w-md mx-auto">
            {errorMsg}
          </p>
        )}
        {!resume || !jobDescription ? (
          <p className="mt-5">
            <a href="/prepare" className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover transition">
              {t('interview.ready.goToPrepare')}
              <ArrowRight size={14} />
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-text-primary font-heading">{t('interview.title')}</h1>
          <span className="text-text-tertiary text-sm font-medium">{t('interview.round', { round, total: maxRounds })}</span>
        </div>
        <div className="flex items-center gap-2 text-text-tertiary text-sm font-medium bg-elevated/60 border border-border rounded-lg px-3 py-1.5">
          <Clock size={14} />
          <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-surface border border-border-subtle rounded-2xl flex flex-col max-h-[75vh] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
              {messages.map((msg, i) => {
                // 最后一条 AI 回复使用打字机效果
                const isLatestAI = i === messages.length - 1 && msg.role === 'interviewer' && !finished;
                // 超过 30 条消息时，折叠早期消息
                const shouldCollapseOld = messages.length > 30 && i < messages.length - 10;
                return (
                  <ChatBubble
                    key={i}
                    message={msg}
                    useTypewriter={isLatestAI}
                    collapsed={shouldCollapseOld}
                  />
                );
              })}
              {loading && (
                <div className="flex justify-start my-3">
                  <div className="bg-elevated border border-border rounded-2xl rounded-bl-sm px-4 py-3 text-text-tertiary flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t('interview.thinking')}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-border-subtle p-4">
              {errorMsg && (
                <p className="mb-2 text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}
              {finished ? (
                <div className="text-center py-2">
                  <p className="text-success font-semibold mb-4">{t('interview.complete')}</p>
                  <Button href="/report" variant="primary">{t('interview.viewReport')}</Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={t('interview.input.placeholder')}
                    disabled={loading}
                    multiline
                    rows={1}
                    className="flex-1 resize-none min-h-[48px]"
                  />
                  <Button onClick={handleSend} disabled={loading || !input.trim()} variant="primary" className="self-end px-4">
                    <Send size={18} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-text-tertiary mb-4 uppercase tracking-wider">{t('interview.realtimeScores')}</h3>
            <div className="space-y-3">
              <ScoreCard label={t('interview.relevance')} score={avgScores.relevance} />
              <ScoreCard label={t('interview.depth')} score={avgScores.depth} />
              <ScoreCard label={t('interview.completeness')} score={avgScores.completeness} />
            </div>
          </div>

          {reasoning && (
            <div className="bg-surface border border-border-subtle rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-tertiary mb-3 uppercase tracking-wider">{t('interview.aiReasoning')}</h3>
              <ThinkingProcess reason={reasoning} />
            </div>
          )}

          {decisionPath.length > 0 && (
            <div className="bg-surface border border-border-subtle rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-tertiary mb-3 uppercase tracking-wider">决策路径</h3>
              <DecisionTree nodes={decisionPath} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
