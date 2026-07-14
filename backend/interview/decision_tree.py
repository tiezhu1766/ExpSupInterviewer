"""面试追问决策行为树。

组装基于 PydanticAI 的回答质量分类与追问生成行为树：
- NeedsFollowUp 条件节点：调用 classify_quality_with_ai 判断是否需要追问，
  并把 quality/need_follow_up/follow_up/reasoning 写入 blackboard。
- GenerateFollowUp 动作节点：确认 follow_up 已写入 blackboard，不重复调用 LLM。
- Pass 动作节点：无需追问时直接通过。

通过 build_decision_tree() 构造，run_decision_tree() 便捷执行。
"""
from __future__ import annotations

from backend.behavior_tree import (
    Action,
    BehaviorTree,
    Blackboard,
    Condition,
    DecisionPath,
    NodeStatus,
    Selector,
    Sequence,
)
from backend.llm.pydantic_agents import classify_quality_with_ai


async def answer_quality_predicate(bb: Blackboard) -> bool:
    """调用 PydanticAI 分类回答质量，将结果写入 blackboard。

    返回 need_follow_up：True 表示需要追问（条件节点 SUCCESS）。
    """
    decision = await classify_quality_with_ai(bb.question, bb.answer, bb.history)
    bb.quality = decision.quality
    bb.need_follow_up = decision.need_follow_up
    bb.follow_up = decision.follow_up
    bb.reasoning = decision.reasoning
    return bb.need_follow_up


async def generate_follow_up_action(bb: Blackboard) -> NodeStatus:
    """确认追问内容已由 predicate 写入 blackboard。

    不重复调用 LLM，仅校验 follow_up 是否存在。
    """
    if bb.follow_up:
        return NodeStatus.SUCCESS
    return NodeStatus.FAILURE


async def pass_action(bb: Blackboard) -> NodeStatus:
    """无需追问时直接通过。"""
    if bb.quality is None:
        bb.quality = "good"
    return NodeStatus.SUCCESS


def build_decision_tree() -> BehaviorTree:
    """构建面试追问决策行为树。"""
    root = Selector(
        [
            Sequence(
                [
                    Condition(answer_quality_predicate, name="判断是否追问"),
                    Action(generate_follow_up_action, name="生成追问"),
                ],
                name="追问序列",
            ),
            Action(pass_action, name="直接通过"),
        ],
        name="决策根节点",
    )
    return BehaviorTree(root)


async def run_decision_tree(
    question: str, answer: str, history: list[dict]
) -> tuple[Blackboard, DecisionPath]:
    """便捷执行：构造 blackboard 并运行决策树，返回 (blackboard, 决策路径)。"""
    bb = Blackboard(question=question, answer=answer, history=history)
    tree = build_decision_tree()
    await tree.tick(bb)
    return bb, tree.get_path()
