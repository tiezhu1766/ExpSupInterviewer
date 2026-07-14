import { create } from 'zustand';
import type { InterviewReport } from '../types';

interface ReportStore {
  reports: InterviewReport[];
  currentReport: InterviewReport | null;
  setCurrentReport: (report: InterviewReport | null) => void;
  addReport: (report: InterviewReport) => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  currentReport: null,
  setCurrentReport: (report) => set({ currentReport: report }),
  addReport: (report) => {
    set((state) => ({ reports: [...state.reports, report] }));
  },
}));
