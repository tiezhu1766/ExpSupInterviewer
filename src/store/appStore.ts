import { create } from 'zustand';
import type { ParsedResume } from '../types';

const STORAGE_KEY = 'exp_sup_app_state';

interface AppStore {
  resume: ParsedResume | null;
  jobDescription: string;
  maxRounds: number;
  setResume: (resume: ParsedResume | null) => void;
  setJobDescription: (jd: string) => void;
  setMaxRounds: (n: number) => void;
}

function loadState(): Pick<AppStore, 'resume' | 'jobDescription' | 'maxRounds'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { resume: null, jobDescription: '', maxRounds: 5 };
    const data = JSON.parse(raw);
    return {
      resume: data.resume ?? null,
      jobDescription: data.jobDescription ?? '',
      maxRounds: data.maxRounds ?? 5,
    };
  } catch {
    return { resume: null, jobDescription: '', maxRounds: 5 };
  }
}

function persist(state: { resume: ParsedResume | null; jobDescription: string; maxRounds: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      resume: state.resume,
      jobDescription: state.jobDescription,
      maxRounds: state.maxRounds,
    }));
  } catch { /* quota exceeded, ignore */ }
}

const initial = loadState();

export const useAppStore = create<AppStore>((set, get) => ({
  ...initial,
  setResume: (resume) => {
    set({ resume });
    persist({ ...get(), resume });
  },
  setJobDescription: (jobDescription) => {
    set({ jobDescription });
    persist({ ...get(), jobDescription });
  },
  setMaxRounds: (maxRounds) => {
    set({ maxRounds });
    persist({ ...get(), maxRounds });
  },
}));
