from dataclasses import dataclass, field
from typing import Optional, Any


@dataclass
class Blackboard:
    """行为树共享数据容器。"""

    question: str = ""
    answer: str = ""
    history: list = field(default_factory=list)
    quality: Optional[str] = None          # good/vague/shallow/no_data/irrelevant
    need_follow_up: bool = False
    follow_up: Optional[str] = None
    reasoning: Optional[str] = None
    extra: dict = field(default_factory=dict)  # 扩展字段
