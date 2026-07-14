import operator
from typing import Annotated, Literal, Optional, TypedDict

from pydantic import BaseModel, Field

from backend.interview.decision_tree import run_decision_tree
from backend.interview.question_bank import get_question_by_id, select_question
from backend.llm.pydantic_agents import evaluate_answer_with_ai, generate_report_with_ai
from backend.schemas import AnswerScore, DimensionScore, InterviewMessage, ParsedResume


class FollowUpDecision(BaseModel):
    need_follow_up: bool
    follow_up: Optional[str] = None
    reasoning: str
    quality: Literal["good", "vague", "shallow", "no_data", "irrelevant"]


class ReportOutput(BaseModel):
    dimensions: list[DimensionScore] = Field(
        ..., description="List of {name, score} with score 0-10"
    )
    suggestions: list[str]


class InterviewState(TypedDict, total=False):
    resume: dict
    jd: str
    history: list[dict]
    asked_ids: list[str]
    current_question_id: str
    answer: str
    round: int
    max_rounds: int

    need_follow_up: bool
    follow_up: Optional[str]
    reasoning: Optional[str]
    quality: Optional[str]

    messages: Annotated[list[dict], operator.add]
    scores: Annotated[list[dict], operator.add]
    finished: bool
    next_question_id: Optional[str]
    report: Optional[dict]
    decision_path: list[dict]


def _current_question_text(question_id: str) -> str:
    question = get_question_by_id(question_id)
    return question.text if question else question_id


async def follow_up_decider(state: InterviewState) -> dict:
    question_text = _current_question_text(state["current_question_id"])

    blackboard, decision_path = await run_decision_tree(
        question_text, state["answer"], state.get("history", [])
    )

    updates: dict = {
        "need_follow_up": blackboard.need_follow_up,
        "reasoning": blackboard.reasoning,
        "follow_up": blackboard.follow_up,
        "quality": blackboard.quality,
        "decision_path": decision_path.to_list(),
    }

    if blackboard.need_follow_up and blackboard.follow_up:
        updates["messages"] = [
            {"role": "thinking", "content": blackboard.reasoning, "type": "thinking"},
            {"role": "interviewer", "content": blackboard.follow_up, "type": "followup"},
        ]

    return updates


async def evaluator(state: InterviewState) -> dict:
    question_text = _current_question_text(state["current_question_id"])
    quality = state.get("quality", "good")

    score = await evaluate_answer_with_ai(question_text, state["answer"], quality)
    return {"scores": [score.model_dump()], "round": state["round"] + 1}


async def question_generator(state: InterviewState) -> dict:
    previous = state["current_question_id"]
    asked = list(set(state.get("asked_ids", []) + [previous]))

    question = select_question(
        resume=state["resume"],
        jd=state["jd"],
        asked_ids=asked,
    )

    return {
        "asked_ids": asked,
        "current_question_id": question.id,
        "next_question_id": question.id,
        "round": state["round"] + 1,
        "messages": [
            {"role": "interviewer", "content": question.text, "type": "question"}
        ],
    }


async def finish_interview(state: InterviewState) -> dict:
    return {
        "finished": True,
        "messages": [
            {
                "role": "interviewer",
                "content": "面试已结束，感谢你的参与。",
                "type": "question",
            }
        ],
    }


def route_after_evaluator(state: InterviewState) -> Literal["finish", "question_generator", "__end__"]:
    if state["round"] >= state["max_rounds"]:
        return "finish"
    if state.get("need_follow_up"):
        return "__end__"
    return "question_generator"


def build_graph():
    from langgraph.graph import END, StateGraph

    builder = StateGraph(InterviewState)
    builder.add_node("follow_up_decider", follow_up_decider)
    builder.add_node("evaluator", evaluator)
    builder.add_node("question_generator", question_generator)
    builder.add_node("finish", finish_interview)

    builder.set_entry_point("follow_up_decider")
    builder.add_edge("follow_up_decider", "evaluator")
    builder.add_conditional_edges("evaluator", route_after_evaluator)
    builder.add_edge("question_generator", END)
    builder.add_edge("finish", END)

    return builder.compile()


_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph


async def run_answer_graph(
    resume: ParsedResume,
    jd: str,
    history: list[InterviewMessage],
    asked_ids: list[str],
    current_question_id: str,
    answer: str,
    round: int,
    max_rounds: int,
) -> dict:
    graph = get_graph()
    initial_state: InterviewState = {
        "resume": resume.model_dump(),
        "jd": jd,
        "history": [m.model_dump() for m in history],
        "asked_ids": asked_ids,
        "current_question_id": current_question_id,
        "answer": answer,
        "round": round,
        "max_rounds": max_rounds,
        "messages": [],
        "scores": [],
        "finished": False,
        "decision_path": [],
    }
    result = await graph.ainvoke(initial_state)
    return result


async def generate_report_from_session(
    session_id: str,
    messages: list[InterviewMessage],
    scores: list[AnswerScore],
    resume: ParsedResume,
    jd: str,
) -> dict:
    return await generate_report_with_ai(session_id, messages, scores, resume, jd)
