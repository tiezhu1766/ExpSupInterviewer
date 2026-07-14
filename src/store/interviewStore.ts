import { create } from 'zustand';
import type { InterviewSession, InterviewMessage, AnswerScore } from '../types';

const STORAGE_KEY = 'exp_sup_interview_current';

interface InterviewStore {
  currentSession: InterviewSession | null;
  sessions: InterviewSession[];
  setCurrentSession: (session: InterviewSession | null) => void;
  addMessage: (message: InterviewMessage) => void;
  addScore: (score: AnswerScore) => void;
  finishSession: () => void;
}

function persist(session: InterviewSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* quota exceeded */ }
}

function loadPersisted(): InterviewSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const initialSession = loadPersisted();

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  currentSession: initialSession,
  sessions: [],
  setCurrentSession: (session) => {
    set({ currentSession: session });
    persist(session);
  },
  addMessage: (message) => {
    const { currentSession, sessions } = get();
    if (!currentSession) return;
    const updated = {
      ...currentSession,
      messages: [...currentSession.messages, message],
    };
    const newSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
    set({ currentSession: updated, sessions: newSessions });
    persist(updated);
  },
  addScore: (score) => {
    const { currentSession, sessions } = get();
    if (!currentSession) return;
    const updated = {
      ...currentSession,
      scores: [...currentSession.scores, score],
    };
    const newSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
    set({ currentSession: updated, sessions: newSessions });
    persist(updated);
  },
  finishSession: () => {
    const { currentSession, sessions } = get();
    if (!currentSession) return;
    const finished = {
      ...currentSession,
      status: 'finished' as const,
      finishedAt: new Date().toISOString(),
    };
    const newSessions = sessions.map((s) => (s.id === finished.id ? finished : s));
    set({
      currentSession: finished,
      sessions: newSessions,
    });
    persist(finished);
  },
}));
