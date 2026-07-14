import type {
  ParsedResume,
  InterviewSession,
  InterviewReport,
} from '../types';

export interface AppState {
  resume: ParsedResume | null;
  jobDescription: string;
  currentSessionId: string | null;
  sessions: InterviewSession[];
  reports: InterviewReport[];
}

const STORAGE_KEY = 'exp_sup_interviewer_state';
const MAX_SESSIONS = 10;

const defaultState: AppState = {
  resume: null,
  jobDescription: '',
  currentSessionId: null,
  sessions: [],
  reports: [],
};

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function trimSessions(state: AppState): AppState {
  if (state.sessions.length <= MAX_SESSIONS) return state;

  const sortedSessions = sortByCreatedAt(state.sessions);
  const keptSessions = sortedSessions.slice(-MAX_SESSIONS);
  const removedIds = new Set(
    sortedSessions.slice(0, sortedSessions.length - MAX_SESSIONS).map((s) => s.id),
  );

  return {
    ...state,
    sessions: keptSessions,
    reports: state.reports.filter((r) => !removedIds.has(r.sessionId)),
    currentSessionId: removedIds.has(state.currentSessionId ?? '')
      ? null
      : state.currentSessionId,
  };
}

function trimOldestSession(state: AppState): AppState {
  if (state.sessions.length === 0) return state;

  const sortedSessions = sortByCreatedAt(state.sessions);
  const removedSession = sortedSessions[0];
  const keptSessions = sortedSessions.slice(1);

  return {
    ...state,
    sessions: keptSessions,
    reports: state.reports.filter((r) => r.sessionId !== removedSession.id),
    currentSessionId:
      state.currentSessionId === removedSession.id ? null : state.currentSessionId,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return JSON.parse(raw) as AppState;
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): AppState {
  let trimmed = trimSessions(state);

  try {
    const payload = JSON.stringify(trimmed);
    localStorage.setItem(STORAGE_KEY, payload);
    return trimmed;
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      let emergency = trimmed;
      while (emergency.sessions.length > 0) {
        emergency = trimOldestSession(emergency);
        try {
          const payload = JSON.stringify(emergency);
          localStorage.setItem(STORAGE_KEY, payload);
          return emergency;
        } catch {
          // continue trimming
        }
      }
    }
    return trimmed;
  }
}
