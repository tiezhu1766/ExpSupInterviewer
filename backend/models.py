from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel


class Resume(SQLModel, table=True):
    __tablename__ = "resumes"

    id: str = Field(default=None, primary_key=True)
    name: str = ""
    skills: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    projects: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    experiences: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    raw_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    sessions: list["InterviewSession"] = Relationship(back_populates="resume")


class JobDescription(SQLModel, table=True):
    __tablename__ = "job_descriptions"

    id: str = Field(default=None, primary_key=True)
    text: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    sessions: list["InterviewSession"] = Relationship(back_populates="job_description")


class InterviewSession(SQLModel, table=True):
    __tablename__ = "interview_sessions"

    id: str = Field(default=None, primary_key=True)
    resume_id: Optional[str] = Field(default=None, foreign_key="resumes.id")
    job_description_id: Optional[str] = Field(default=None, foreign_key="job_descriptions.id")
    status: str = "ongoing"
    max_rounds: int = 5
    current_question_id: Optional[str] = None
    asked_ids_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    resume: Optional[Resume] = Relationship(back_populates="sessions")
    job_description: Optional[JobDescription] = Relationship(back_populates="sessions")
    messages: list["InterviewMessage"] = Relationship(back_populates="session")
    scores: list["AnswerScore"] = Relationship(back_populates="session")
    report: Optional["InterviewReport"] = Relationship(back_populates="session")


class InterviewMessage(SQLModel, table=True):
    __tablename__ = "interview_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="interview_sessions.id")
    role: str = ""
    content: str = ""
    type: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    session: InterviewSession = Relationship(back_populates="messages")


class AnswerScore(SQLModel, table=True):
    __tablename__ = "answer_scores"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="interview_sessions.id")
    relevance: int = 0
    depth: int = 0
    completeness: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    session: InterviewSession = Relationship(back_populates="scores")


class InterviewReport(SQLModel, table=True):
    __tablename__ = "interview_reports"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="interview_sessions.id", unique=True)
    dimensions: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    progress: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    suggestions: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    session: InterviewSession = Relationship(back_populates="report")


class LLMConfig(SQLModel, table=True):
    __tablename__ = "llm_configs"

    id: str = Field(default=None, primary_key=True)
    name: str
    base_url: str
    api_key: str
    model: str
    is_active: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DecisionPath(SQLModel, table=True):
    __tablename__ = "decision_paths"

    id: str = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="interview_sessions.id", index=True)
    message_id: Optional[str] = Field(default=None, foreign_key="interview_messages.id")
    nodes_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmbeddingCache(SQLModel, table=True):
    __tablename__ = "embedding_cache"

    id: str = Field(default=None, primary_key=True)
    text_hash: str = Field(index=True)
    text: str = ""
    vector_json: str = Field(default="[]")
    model: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
