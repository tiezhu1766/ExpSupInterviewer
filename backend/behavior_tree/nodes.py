from enum import Enum
from typing import Callable, Any


class NodeStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    RUNNING = "running"


class Node:
    """基类，子类实现 async tick(blackboard) -> NodeStatus。"""

    name: str

    async def tick(self, bb) -> NodeStatus:
        raise NotImplementedError

    def to_dict(self) -> dict:
        return {"name": self.name, "type": self.__class__.__name__}


class Selector(Node):
    """选择节点：依次执行子节点，第一个 SUCCESS/RUNNING 即返回，全 FAILURE 才 FAILURE。"""

    def __init__(self, children: list[Node], name: str = "Selector"):
        self.children = list(children)
        self.name = name

    async def tick(self, bb) -> NodeStatus:
        for child in self.children:
            status = await child.tick(bb)
            if status != NodeStatus.FAILURE:
                return status
        return NodeStatus.FAILURE

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "type": "Selector",
            "children": [c.to_dict() for c in self.children],
        }


class Sequence(Node):
    """序列节点：依次执行子节点，遇到 FAILURE/RUNNING 即返回，全 SUCCESS 才 SUCCESS。"""

    def __init__(self, children: list[Node], name: str = "Sequence"):
        self.children = list(children)
        self.name = name

    async def tick(self, bb) -> NodeStatus:
        for child in self.children:
            status = await child.tick(bb)
            if status != NodeStatus.SUCCESS:
                return status
        return NodeStatus.SUCCESS

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "type": "Sequence",
            "children": [c.to_dict() for c in self.children],
        }


class Condition(Node):
    """条件节点：执行 async predicate(blackboard) -> bool，True=SUCCESS，False=FAILURE。"""

    def __init__(self, predicate: Callable, name: str = "Condition"):
        self.predicate = predicate
        self.name = name
        self.last_result: Any = None

    async def tick(self, bb) -> NodeStatus:
        self.last_result = await self.predicate(bb)
        return NodeStatus.SUCCESS if self.last_result else NodeStatus.FAILURE

    def to_dict(self) -> dict:
        return {"name": self.name, "type": "Condition"}


class Action(Node):
    """动作节点：执行 async action(blackboard) -> NodeStatus。"""

    def __init__(self, action: Callable, name: str = "Action"):
        self.action = action
        self.name = name
        self.last_note: str = ""

    async def tick(self, bb) -> NodeStatus:
        result = await self.action(bb)
        status, self.last_note = _normalize_result(result)
        return status

    def to_dict(self) -> dict:
        return {"name": self.name, "type": "Action"}


def _normalize_result(result: Any) -> tuple[NodeStatus, str]:
    """将 action 返回值归一化为 (NodeStatus, note)。

    - NodeStatus 枚举或 status 字符串("success"/"failure"/"running") -> 对应状态，note 为空
    - 其他返回值(如 LLM 生成的追问文本) -> 视为 SUCCESS，note 记录输出摘要
    """
    if isinstance(result, NodeStatus):
        return result, ""
    try:
        return NodeStatus(result), ""
    except (ValueError, TypeError):
        return NodeStatus.SUCCESS, str(result)[:200]
