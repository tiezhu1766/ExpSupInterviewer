import type { InterviewMessage } from './interview';

export interface DimensionScore {
  name: string;
  score: number;
}

export interface ProgressPoint {
  sessionId: string;
  totalScore: number;
  createdAt: string;
}

export interface InterviewReport {
  sessionId: string;
  dimensions: DimensionScore[];
  progress: ProgressPoint[];
  suggestions: string[];
  transcript: InterviewMessage[];
}
