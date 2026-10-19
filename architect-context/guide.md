# architect-context 判断力指南（Guide）

> 单atom调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 上下文预算与压缩架构

## 核心概念

上下文窗口是LLM Agent系统最稀缺的资源。管理不善会导致：
- **静默截断**：最早的消息被丢弃，模型失去关键上下文
- **压缩循环**：压缩→模型需要更多信息→追问→上下文膨胀→再次压缩（无限循环）
- **预算耗尽**：token用尽但任务未完成

## Claude Code 上下文管理参考

### 四层压缩（顺序至关重要）

```
Raw messages → [Layer1: Tool Result Budget] → [Layer2: Snip Compact]
→ [Layer3: Microcompact] → [Layer4: Context Collapse] → [Layer5: Auto-Compact]
→ Messages for API call
```

**核心规则：collapse 先于 auto-compact**——如果 collapse 把上下文降到阈值以下，auto-compact 变为空操作，保留细粒度上下文。**顺序反了会导致信息丢失**。

| 层 | 触发条件 | 作用 |
|----|---------|------|
| Layer1: Tool Result Budget | 每个tool result后 | 截断过长输出（保留头尾） |
| Layer2: Snip Compact | 80%窗口阈值 | 裁剪低信噪比内容 |
| Layer3: Microcompact | 每个tool result后 | 压缩重复/冗余内容 |
| Layer4: Context Collapse | 接近窗口上限 | 将历史轮次压缩为摘要 |
| Layer5: Auto-Compact | effectiveWindow-13000 | 自动压缩历史，保留关键上下文 |

### Auto-Compact 熔断器

```
effectiveContextWindow = contextWindow - min(modelMaxOutput, 20000)
Auto-compact 触发阈值: effectiveContextWindow - 13,000
硬性阻塞阈值: effectiveContextWindow - 3,000
连续失败熔断: 3次
```

**生产事故教训**：有用户会话因 auto-compact 无限循环每天燃烧 250K API 调用。熔断器是防止财务损失的最后防线。

### 8段结构化摘要（Compaction Summary）

```
1. 请求 (Request)
2. 概念 (Concepts)
3. 文件 (Files)
4. 错误 (Errors)
5. 待办 (Pending)
6. 当前 (Current)
7. 下一步 (Next)
8. 关键上下文 (Critical Context)
```

### Surface/Log 分层

| 类型 | 受众 | 用途 | 保留策略 |
|------|------|------|---------|
| Surface Events | 模型可见 | 上下文构建 | 跟随上下文生命周期 |
| Log Events | 仅记录 | 审计/调试 | 不可变持久化 |

**关键原则**：Surface事件进入模型上下文，必须严格控制体积；Log事件永远不进入模型上下文。

## Hindsight Token 预算管理

Hindsight 实现了精确的 token 级截断：

```python
# 分层检索的token预算分配
mental_models_budget = total_budget * 0.4    # 最高优先级
observations_budget = total_budget * 0.35
raw_facts_budget = total_budget * 0.25      # 最低优先级
```

**原则**：高价值内容（mental_models）获得更多token预算，低价值内容（raw_facts）按需截断。

## 检查清单

```
[ ] 是否有明确的上下文窗口预算？（总token→各层分配） 
    → 没有: 定义 total_budget，按优先级分配给各内容层

[ ] 上下文压缩是否有分层机制？（至少3层）
    → 少于3层: 实现 Tool Result Budget → Snip → Collapse 三层

[ ] collapse 是否先于 auto-compact？（顺序至关重要）
    → 顺序反了: 调整顺序，collapse 必须在 compact 之前

[ ] 是否有 Auto-Compact 熔断器？（连续失败3次熔断）
    → 没有: 加计数器，连续失败3次触发熔断+通知

[ ] Surface 和 Log 是否分层？（模型上下文 vs 审计日志）
    → 未分层: 区分 SURFACE_EVENT_TYPES 和 LOG_EVENT_TYPES

[ ] 压缩后是否有验证步骤？（压缩后上下文是否仍然完整？）
    → 没有: 压缩后运行完整性检查（关键信息是否保留）

[ ] 是否有 token 预算监控和告警？
    → 没有: 加 token_usage 指标，80%阈值告警

[ ] 压缩是否为可逆/可回放？（trace重放能力）
    → 不可逆: 保留压缩前的原始事件（仅log层），支持trace重放
```

> 风险分级与下一步骨架参考 [[architect-router]]#原子风险分级与下一步骨架。

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令+通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第3步）。

## 交叉引用
- Agent编排 → [[architect-agent]]
- 数据生命周期 → [[architect-data]]
- 可观测性/告警 → [[architect-observability]]
- 成本预算 → [[architect-cost]]
