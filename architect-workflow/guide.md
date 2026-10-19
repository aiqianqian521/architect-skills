# architect-workflow 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 开发工作流

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 从想法到代码的完整链路

```
想法 → 领域建模 → 严格追问 → 原型验证 → 规格文档 → 工单拆分 → 实现
```

### 1. 领域建模（术语表构建）

> 注意：如果要进行 DDD 战术设计（实体/值对象/聚合根/限界上下文），请路由到 [[architect-design]]。

**构建 CONTEXT.md 术语表，每个术语有唯一定义**

```markdown
# CONTEXT.md — loop 项目领域术语
| 术语 | 定义 | 反义词/混淆项 |
|------|------|-------------|
| Task | 一次完整的任务编排运行 | ≠ Round（Task包含多轮）|
| Round | 一次 OODA 循环迭代 | ≠ Step（Round包含7个Step）|
| Pattern | 从失败/成功中学习的模式记录 | ≠ Rule（Pattern被动记录，Rule主动排除）|
```

规则：
- 每个术语只有一种含义
- 列出容易混淆的区别
- 有"禁止使用"列表（如"不允许用 Event 指代 Round"）

### 2. 严格追问（grilling）
设计树 + 前沿推进。每个决策节点用以下模板：

```markdown
## 决策节点: {决策名}
| 选项 | 优点 | 缺点 | 风险 |
|------|------|------|------|
| A: {方案A} | {具体收益} | {付出的代价} | {可能出问题的地方} |
| B: {方案B} | ... | ... | ... |

**推荐: {选哪个}** — {一句话理由}
**依赖: {前置决策}**（未做的决策不展开）
```

执行规则：
- 每个决策节点有2-3个选项
- 推荐一个并说明理由
- 只问决策前沿（依赖的决策已做的前提下）
- 事实查证是 Agent 的事，决策是人的事

### 3. 规格模板（to-spec）
```markdown
# Spec: <功能名>
## Problem Statement（问题描述）
## Solution（解决方案）
## User Stories（用户故事）
- As a <角色>, I want <功能>, so that <价值>
## Implementation Decisions（实现决策）
- 模块、接口、契约（不要文件路径）
## Testing Decisions（测试策略）
## Out of Scope（明确排除）
```

### 4. 工单拆分（to-tickets）

工单模板：
```markdown
## {TICKET-ID}: {一句话标题}
**类型**: feat | fix | refactor | chore
**依赖**: blocking: [{前置工单ID}] | blocked_by: [{被阻塞的工单ID}]
**验收**: {具体可验证的完成条件}
**涉及层**: {贯穿的模块/层次列表}
```

拆分规则：
- **Tracer-bullet 垂直切片**: 每个工单贯穿所有层
- **依赖声明**: 每个工单标注 blocking/blocked_by
- **Expand-Contract**: 宽重构用新旧接口共存 → 迁移 → 废弃旧接口

### 5. Wayfinding（探索地图）
对于不确定的大型任务，用三栏地图：

| Destination（目标） | Known（已知路径） | Fog of War（未知区域） |
|---------------------|-------------------|----------------------|
| {最终要达成的状态} | {已做的决策和证据} | {看不清、需要探索的部分} |

执行：逐个解决 Fog of War 中的 decision tickets（research→prototype→grilling→task），不提前绘制看不清的区域。

### 6. 问题分类（triage）
```
标签状态机:
needs-triage → needs-info / ready-for-agent / ready-for-human / wontfix
```
Out-of-scope 知识库：记录被拒绝的建议和原因。

## 验收标准、风险与变更控制

Spec 和工单必须把“完成”写成可验证行为，而不是“代码写完”。每个垂直切片至少包含：

- Given/When/Then 验收场景，包含 happy path、边界和失败路径。
- 依赖、迁移、权限、可观测性和回滚影响；未知项进入风险登记表。
- 对应测试命令、测试数据和通过阈值；不能用“手工确认”替代关键路径验证。
- 关联 ADR/Spec/工单 ID，确保需求、实现、测试和决策可以互相追溯。

### 变更控制

当实现偏离已接受 Spec 时，先记录偏离原因、影响和替代方案，再更新 Spec/ADR；不要让代码成为未记录的“第二份真相”。高风险变更需要重新执行 `architect-review` 的安全、数据和回滚检查。

```markdown
### AC-01: 重试不产生重复副作用
Given 同一个 idempotency_key 已成功提交
When 客户端在超时后再次提交同一请求
Then 服务返回相同业务结果，且数据库只存在一条业务记录
验证: pytest -q tests/test_idempotency.py
```

## 检查清单

```
[ ] 领域术语是否在 CONTEXT.md 中有唯一定义？ → 未定义: 创建 CONTEXT.md，列出核心概念+定义+反义词
[ ] 架构决策是否经过了严格追问？ → 未追问: 对每个决策准备2-3个替代方案，写"为什么选了A不选B"
[ ] 规格是否写清楚了 Problem/Solution/Out of Scope？ → 缺项: 用 to-spec 模板补全
[ ] 工单是否是垂直切片（每张都能独立验证）？ → 水平切片: 改为按用户故事纵向拆分
[ ] 大型探索任务是否使用 wayfinding 地图？ → 未使用: 写 destinations/known/fog-of-war 三栏
```

## 常见问题修复指南

### 需求不清晰 → 严格追问
1. 列出当前已知信息（Known）
2. 列出不确定的部分（Fuzzy）
3. 对每个 Fuzzy 点生成 2-3 个选项
4. 推荐最优选项并说明理由
5. 等待确认后再推进

### 任务过大无法开始 → Wayfinding
1. 写最终目标（destination）
2. 列出已知路径（decisions-so-far）
3. 标注未知区域（fog of war）
4. 只做第一块 fog 的决策，不提前规划后续

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。
## 交叉引用
- DDD 战术设计 → 参见 [[architect-design]]
- 设计审查 → 参见 [[architect-review]]
- 技术调研 → 参见 [[architect-docs]]
- 测试策略 → 参见 [[architect-test]]
