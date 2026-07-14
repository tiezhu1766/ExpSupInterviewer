import type {
  ParsedResume,
  MatchResponse,
  InterviewMessage,
  AnswerScore,
  InterviewSession,
  InterviewReport,
  LLMConfig,
  DecisionNode,
  DecisionPath,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''; // 空字符串表示使用相对路径，由 Vite proxy 转发

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => 'Request failed');
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function parseResume(input: { file?: File; text?: string }): Promise<ParsedResume> {
  const formData = new FormData();
  if (input.file) {
    formData.append('file', input.file);
  } else if (input.text) {
    formData.append('text', input.text);
  } else {
    throw new Error('Either file or text must be provided');
  }

  const response = await fetch(`${BASE_URL}/api/resume/parse`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ParsedResume>(response);
}

export async function matchResumeJD(
  resume: ParsedResume,
  jobDescription: string,
): Promise<MatchResponse> {
  const response = await fetch(`${BASE_URL}/api/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jobDescription }),
  });
  return handleResponse<MatchResponse>(response);
}

export async function downloadMatchPDF(resume: ParsedResume, jobDescription: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/match/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jobDescription }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => 'Request failed');
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.blob();
}

export async function startInterview(
  resume: ParsedResume,
  jobDescription: string,
  maxRounds = 5,
): Promise<{ sessionId: string; firstQuestion: InterviewMessage; questionId: string }> {
  const response = await fetch(`${BASE_URL}/api/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, jobDescription, maxRounds }),
  });
  return handleResponse<{ sessionId: string; firstQuestion: InterviewMessage; questionId: string }>(
    response,
  );
}

export async function processAnswer(
  sessionId: string,
  answer: string,
  currentQuestionId: string,
  round: number,
  maxRounds = 5,
  askedIds: string[] = [],
): Promise<{
  messages: InterviewMessage[];
  reasoning?: string;
  scores: AnswerScore | null;
  finished: boolean;
  nextQuestionId?: string;
  decisionPath?: DecisionNode[];
}> {
  const response = await fetch(`${BASE_URL}/api/interview/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      answer,
      currentQuestionId,
      round,
      maxRounds,
      askedIds,
    }),
  });
  return handleResponse<{
    messages: InterviewMessage[];
    reasoning?: string;
    scores: AnswerScore | null;
    finished: boolean;
    nextQuestionId?: string;
    decisionPath?: DecisionNode[];
  }>(response);
}

export async function generateReport(session: InterviewSession): Promise<InterviewReport> {
  const response = await fetch(`${BASE_URL}/api/interview/${session.id}/report`);
  return handleResponse<InterviewReport>(response);
}

export async function getDecisions(sessionId: string): Promise<DecisionPath[]> {
  const response = await fetch(`${BASE_URL}/api/interview/${sessionId}/decisions`);
  return handleResponse<DecisionPath[]>(response);
}

export async function listInterviews(limit = 20): Promise<InterviewSession[]> {
  const response = await fetch(`${BASE_URL}/api/interviews?limit=${limit}`);
  return handleResponse<InterviewSession[]>(response);
}

export async function getInterview(sessionId: string): Promise<InterviewSession> {
  const response = await fetch(`${BASE_URL}/api/interview/${sessionId}`);
  return handleResponse<InterviewSession>(response);
}

export async function listLLMConfigs(): Promise<LLMConfig[]> {
  const response = await fetch(`${BASE_URL}/api/settings/llm`);
  return handleResponse<LLMConfig[]>(response);
}

export async function createLLMConfig(
  data: Omit<LLMConfig, 'id' | 'is_active' | 'created_at' | 'updated_at'>,
): Promise<LLMConfig> {
  const response = await fetch(`${BASE_URL}/api/settings/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<LLMConfig>(response);
}

export async function updateLLMConfig(
  id: string,
  data: Partial<Omit<LLMConfig, 'id' | 'is_active' | 'created_at' | 'updated_at'>>,
): Promise<LLMConfig> {
  const response = await fetch(`${BASE_URL}/api/settings/llm/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<LLMConfig>(response);
}

export async function deleteLLMConfig(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/settings/llm/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const text = await response.text().catch(() => 'Request failed');
    throw new Error(text || `HTTP ${response.status}`);
  }
}

export async function activateLLMConfig(id: string): Promise<LLMConfig> {
  const response = await fetch(`${BASE_URL}/api/settings/llm/${id}/activate`, {
    method: 'POST',
  });
  return handleResponse<LLMConfig>(response);
}

export const api = {
  parseResume,
  matchResumeJD,
  downloadMatchPDF,
  startInterview,
  processAnswer,
  generateReport,
  getDecisions,
  listInterviews,
  getInterview,
  listLLMConfigs,
  createLLMConfig,
  updateLLMConfig,
  deleteLLMConfig,
  activateLLMConfig,
};
