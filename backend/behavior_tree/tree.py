from .nodes import Node, NodeStatus, Selector, Sequence, Condition, Action
from .blackboard import Blackboard


class DecisionNode:
    """决策路径中的一个节点记录。"""

    def __init__(self, name: str, status: str, note: str = ""):
        self.name = name
        self.status = status  # success/failure/running
        self.note = note

    def to_dict(self) -> dict:
        return {"name": self.name, "status": self.status, "note": self.note}


class DecisionPath:
    """行为树执行路径，用于持久化和前端回放。"""

    def __init__(self):
        self.nodes: list[DecisionNode] = []

    def add(self, node: DecisionNode):
        self.nodes.append(node)

    def to_list(self) -> list[dict]:
        return [n.to_dict() for n in self.nodes]


class BehaviorTree:
    """行为树执行器，tick 时记录决策路径。"""

    def __init__(self, root: Node):
        self.root = root
        self.path = DecisionPath()

    async def tick(self, blackboard: Blackboard) -> NodeStatus:
        self.path = DecisionPath()  # 重置
        return await self._tick_node(self.root, blackboard)

    async def _tick_node(self, node: Node, bb: Blackboard) -> NodeStatus:
        # 执行节点，记录到 path，处理组合节点的子节点遍历
        if isinstance(node, Selector):
            return await self._tick_selector(node, bb)
        if isinstance(node, Sequence):
            return await self._tick_sequence(node, bb)
        if isinstance(node, Condition):
            return await self._tick_condition(node, bb)
        if isinstance(node, Action):
            return await self._tick_action(node, bb)
        raise TypeError(f"Unsupported node type: {type(node).__name__}")

    async def _tick_selector(self, node: Selector, bb: Blackboard) -> NodeStatus:
        # 占位：先记录自身，子节点执行后回填最终状态
        idx = len(self.path.nodes)
        self.path.add(DecisionNode(node.name, ""))
        for child in node.children:
            status = await self._tick_node(child, bb)
            if status != NodeStatus.FAILURE:
                self.path.nodes[idx].status = status.value
                return status
        self.path.nodes[idx].status = NodeStatus.FAILURE.value
        return NodeStatus.FAILURE

    async def _tick_sequence(self, node: Sequence, bb: Blackboard) -> NodeStatus:
        idx = len(self.path.nodes)
        self.path.add(DecisionNode(node.name, ""))
        for child in node.children:
            status = await self._tick_node(child, bb)
            if status != NodeStatus.SUCCESS:
                self.path.nodes[idx].status = status.value
                return status
        self.path.nodes[idx].status = NodeStatus.SUCCESS.value
        return NodeStatus.SUCCESS

    async def _tick_condition(self, node: Condition, bb: Blackboard) -> NodeStatus:
        status = await node.tick(bb)
        result_text = "是" if node.last_result else "否"
        self.path.add(
            DecisionNode(node.name, status.value, f"结果: {result_text}")
        )
        return status

    async def _tick_action(self, node: Action, bb: Blackboard) -> NodeStatus:
        status = await node.tick(bb)
        self.path.add(DecisionNode(node.name, status.value, node.last_note))
        return status

    def get_path(self) -> DecisionPath:
        return self.path
