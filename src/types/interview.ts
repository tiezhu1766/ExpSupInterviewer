import type { ParsedResume } from './resume';

export interface InterviewMessage {
  role: 'interviewer' | 'candidate' | 'thinking';
  content: string;
  type?: 'question' | 'followup' | 'thinking';
}

export interface AnswerScore {
  relevance: number;
  depth: number;
  completeness: number;
}

export interface InterviewSession {
  id: string;
  resume: ParsedResume;
  jobDescription: string;
  messages: InterviewMessage[];
  scores: AnswerScore[];
  status: 'preparing' | 'ongoing' | 'finished';
  maxRounds: number;
  currentQuestionId?: string;
  askedIds?: string[];
  createdAt: string;
  finishedAt?: string;
}

export interface MatchItem {
  skill: string;
  status: 'full' | 'partial' | 'missing';
  score: number;
  suggestion?: string;
  similarity?: number;
}

export interface MatchResponse {
  overallScore: number;
  items: MatchItem[];
  suggestions: string[];
  matchMode?: 'hybrid' | 'llm_only';
}

export interface DecisionNode {
  name: string;
  status: string;
  note: string;
}

export interface DecisionPath {
  id: string;
  session_id: string;
  message_id?: string | null;
  nodes: DecisionNode[];
  created_at: string;
}
