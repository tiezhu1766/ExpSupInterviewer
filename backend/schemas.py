from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class Project(BaseModel):
    name: str = ""
    description: str = ""
    technologies: list[str] = []


class Experience(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: Optional[str] = None


class ParsedResume(BaseModel):
    name: str = ""
    skills: list[str] = []
    projects: list[Project] = []
    experiences: list[Experience] = []

    @model_validator(mode="after")
    def normalize_experiences(self):
        for exp in self.experiences:
            if exp.description and not exp.role:
                exp.role = exp.description
        return self


class InterviewMessage(BaseModel):
    role: Literal["interviewer", "candidate", "thinking"]
    content: str
    type: Optional[Literal["question", "followup", "thinking"]] = None


class AnswerScore(BaseModel):
    relevance: int = Field(..., ge=0, le=10)
    depth: int = Field(..., ge=0, le=10)
    completeness: int = Field(..., ge=0, le=10)


class InterviewSession(BaseModel):
    id: str
    resume: ParsedResume
    jobDescription: str
    messages: list[InterviewMessage]
    scores: list[AnswerScore]
    status: Literal["preparing", "ongoing", "finished"]
    maxRounds: int = 5
    currentQuestionId: Optional[str] = None
    askedIds: list[str] = []
    createdAt: str
    finishedAt: Optional[str] = None


class MatchItem(BaseModel):
    skill: str
    status: Literal["full", "partial", "missing"] = "partial"
    score: int = Field(default=0, ge=0, le=100)
    similarity: Optional[float] = None
    suggestion: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_status(cls, data: dict) -> dict:
        if isinstance(data, dict):
            status = data.get("status")
            match_type = data.get("matchType") or data.get("match_type")
            raw = (status or match_type or "partial").lower().replace(" ", "_")
            mapping = {
                "full": "full",
                "fully_matched": "full",
                "fullymatched": "full",
                "matched": "full",
                "partial": "partial",
                "partially_matched": "partial",
                "partiallymatched": "partial",
                "missing": "missing",
                "not_matched": "missing",
                "notmatched": "missing",
                "no": "missing",
            }
            data["status"] = mapping.get(raw, "partial")
        return data


class MatchResponse(BaseModel):
    overallScore: int = Field(..., ge=0, le=100)
    items: list[MatchItem]
    suggestions: list[str]
    matchMode: Literal["hybrid", "llm_only"] = "hybrid"


class DimensionScore(BaseModel):
    name: str
    score: int = Field(..., ge=0, le=10)


class ProgressPoint(BaseModel):
    sessionId: str
    totalScore: int
    createdAt: str


class InterviewReport(BaseModel):
    sessionId: str
    dimensions: list[DimensionScore]
    progress: list[ProgressPoint]
    suggestions: list[str]
    transcript: list[InterviewMessage]


class MatchInput(BaseModel):
    resume: ParsedResume
    jobDescription: str


class StartInterviewInput(BaseModel):
    resume: ParsedResume
    jobDescription: str
    maxRounds: int = 5


class StartInterviewResponse(BaseModel):
    sessionId: str
    firstQuestion: InterviewMessage
    questionId: str


class AnswerInput(BaseModel):
    sessionId: str
    answer: str
    currentQuestionId: str
    round: int
    maxRounds: int
    askedIds: list[str]


class DecisionNode(BaseModel):
    name: str
    status: str  # success/failure/running
    note: str = ""


class AnswerResponse(BaseModel):
    messages: list[InterviewMessage]
    reasoning: Optional[str] = None
    scores: Optional[AnswerScore] = None
    finished: bool
    nextQuestionId: Optional[str] = None
    decisionPath: list[DecisionNode] = []


class LLMConfigBase(BaseModel):
    name: str
    base_url: str
    api_key: str
    model: str


class LLMConfigCreate(LLMConfigBase):
    pass


class LLMConfigUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None


class LLMConfigOut(BaseModel):
    id: str
    name: str
    base_url: str
    api_key: str
    model: str
    is_active: bool
    created_at: str
    updated_at: str


class DecisionPathOut(BaseModel):
    id: str
    session_id: str
    message_id: Optional[str] = None
    nodes: list[DecisionNode] = []  # 从 nodes_json 反序列化
    created_at: str
