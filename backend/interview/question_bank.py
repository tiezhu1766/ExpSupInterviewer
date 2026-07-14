from dataclasses import dataclass
from typing import Iterable


@dataclass
class Question:
    id: str
    category: str
    text: str
    keywords: list[str]


QUESTION_BANK: list[Question] = [
    Question(
        id="q1",
        category="project_experience",
        text="请介绍一个你最有成就感的技术项目。你在其中承担什么角色，遇到了哪些挑战，又是如何解决的？",
        keywords=["project", "experience", "role", "challenge", "solution"],
    ),
    Question(
        id="q2",
        category="technical_depth",
        text="你在日常开发中如何对代码进行性能优化？请结合一个具体例子说明。",
        keywords=["performance", "optimization", "code", "benchmark"],
    ),
    Question(
        id="q3",
        category="team_collaboration",
        text="请描述一次你与团队成员产生分歧的经历，你是如何沟通并达成一致的？",
        keywords=["team", "collaboration", "communication", "conflict"],
    ),
    Question(
        id="q4",
        category="problem_solving",
        text="请分享一个你遇到过的复杂 Bug 或线上事故，你的排查思路和最终解决方案是什么？",
        keywords=["bug", "debugging", "incident", "troubleshooting", "problem"],
    ),
    Question(
        id="q5",
        category="job_fit",
        text="你为什么选择应聘这个岗位？你的职业规划与这份工作有什么契合点？",
        keywords=["career", "motivation", "fit", "goal"],
    ),
    Question(
        id="q6",
        category="technical_depth",
        text="你如何理解系统架构中的高可用与可扩展性？能否举例说明你在项目中的实践？",
        keywords=["architecture", "scalability", "availability", "system"],
    ),
    Question(
        id="q7",
        category="project_experience",
        text="请介绍你主导过的一个从 0 到 1 的项目，关键里程碑和取舍是什么？",
        keywords=["project", "lead", "milestone", "trade-off"],
    ),
    Question(
        id="q8",
        category="problem_solving",
        text="当需求频繁变更时，你如何保证代码质量和交付节奏？",
        keywords=["requirement", "change", "quality", "delivery"],
    ),
    Question(
        id="q9",
        category="technical_depth",
        text="你在微服务或分布式系统中遇到过哪些典型问题？是如何解决的？",
        keywords=["microservice", "distributed", "service", "rpc"],
    ),
    Question(
        id="q10",
        category="team_collaboration",
        text="你如何向非技术人员解释一个复杂的技术方案？",
        keywords=["communication", "explain", "stakeholder", "non-technical"],
    ),
    Question(
        id="q11",
        category="job_fit",
        text="这个岗位需要用到 React / TypeScript / Node.js，你认为自己最大的优势是什么？",
        keywords=["react", "typescript", "node.js", "javascript", "frontend"],
    ),
    Question(
        id="q12",
        category="technical_depth",
        text="你如何保证代码的可测试性？请谈谈你的单元测试和集成测试实践。",
        keywords=["test", "testing", "tdd", "unit test", "integration"],
    ),
    Question(
        id="q13",
        category="project_experience",
        text="请描述一次项目重构的经历，重构的原因、过程和最终收益分别是什么？",
        keywords=["refactor", "legacy", "improvement", "performance"],
    ),
    Question(
        id="q14",
        category="problem_solving",
        text="在数据量快速增长时，你如何进行数据库或缓存层面的优化？",
        keywords=["database", "cache", "sql", "nosql", "performance"],
    ),
    Question(
        id="q15",
        category="team_collaboration",
        text="你在 Code Review 中最关注哪些方面？请举例说明一次 Review 带来的改进。",
        keywords=["code review", "review", "quality", "mentorship"],
    ),
]


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def _extract_signal_text(resume: dict, jd: str) -> str:
    parts: list[str] = [jd]
    parts.extend(resume.get("skills", []))
    for project in resume.get("projects", []):
        parts.append(project.get("name", ""))
        parts.append(project.get("description", ""))
        parts.extend(project.get("technologies", []))
    for exp in resume.get("experiences", []):
        parts.append(exp.get("company", ""))
        parts.append(exp.get("role", ""))
    return _normalize(" ".join(parts))


def select_question(
    resume: dict,
    jd: str,
    asked_ids: Iterable[str],
) -> Question:
    asked = set(asked_ids)
    signal = _extract_signal_text(resume, jd)

    candidates = [q for q in QUESTION_BANK if q.id not in asked]
    if not candidates:
        # 全部问过，从题库中随机返回答案以避免死循环
        return QUESTION_BANK[len(asked) % len(QUESTION_BANK)]

    def score(question: Question) -> int:
        return sum(1 for kw in question.keywords if kw.lower() in signal)

    candidates.sort(key=score, reverse=True)
    return candidates[0]


def get_question_by_id(question_id: str) -> Question | None:
    return next((q for q in QUESTION_BANK if q.id == question_id), None)


def get_question_bank() -> list[Question]:
    return QUESTION_BANK
