---
name: architect-agent
description: >-
  Agent架构评估（LLM-Agent / 异步循环 / 编排引擎），含19条核心原则（单一路径、Async Generator、三段式状态分离、死亡螺旋5层防护、Auto-Compact熔断器、错误恢复阶梯、活性看门狗、上下文域工具策略门、步骤级异常策略三态、策略接线优先、单写者锁覆盖、无调用方机制门禁）、9步Loop OODA模式、8项检查清单与修复指南、以及Claude Code Agent Loop深度设计参考。触发条件：设计/审查Agent系统、编排引擎、异步任务循环、LLM-Agent架构。
---

# Agent 架构评估

> **契约与指南分层**：本文件保留核心原则、修复指南和交叉引用。
> **契约层**（检查清单、输出 schema）见同目录 `contract.json`。
> **指南层**（原则详解、修复范式）见同目录 `guide.md`。
> 蜂群模式下 agent 优先读 `contract.json` 确定查什么、输出什么；需判断力时参考 `guide.md`。

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则与检查清单

详见 `guide.md` 与 `contract.json`。本节保留最小触发摘要：

- 触发条件见本文件顶部 YAML `description`
- 检查清单见 `contract.json` → `checklist`
- 修复指南见 `guide.md` → 常见问题修复指南

### 核心原则摘要

| # | 原则 | 关键点 |
|---|------|--------|
| 1 | 状态机定义 | 状态 + 转换 + 条件 |
| 2 | Checkpoint-Resume | 每阶段持久化，支持断点续跑 |
| 3 | 分层错误处理 | L1重试 → L2诊断 → L3人工 |
| 4 | Circuit Breaker | 连续错误计数器，超阈值熔断+通知 |
| 5 | 分层降维+压缩归档 | L0原始 → L1提取 → compact压缩 → fast-path快路径 |
| 6 | Worker-pool背压四件套 | 并发上限 + buffer + oversize + task-queue |
| 7 | 事件/钩子扩展 | waterfall hook链或EventEmitter模式 |
| 8 | **单一路径原则** | 所有执行路径走同一个 query() 函数 |
| 9 | **Async Generator 模式** | backpressure + TerminalReason + yield* composability |
| 10 | **三段式状态分离** | Config不可变 / State可变 / Deps可注入（≤4个） |
| 11 | **死亡螺旋5层防护** | reactiveCompact → snip → micro → collapse → fuse |
| 12 | **错误恢复阶梯** | drain → compact → 8K→64K升级 → 多轮恢复3次 → 暴露退出 |
| 13 | **Auto-Compact 熔断器** | 连续失败3次熔断，防止每天250K API调用 |
| 14 | **活性看门狗** | 挂钟无进展中止 + 工具在飞挂起计时 + 仅 stall 重试 |
| 15 | **上下文域工具策略门** | 按执行上下文收窄工具面 + 结果级阻断 |
| 16 | **步骤级异常策略三态** | 超时+重试+降级四元组 + isSuccess 标记 + 中断短路 |
| 17 | **策略接线优先** | 机制必须挂真实调用点 + 默认档行为等价 + isSuccess≠业务成功 |
| 18 | **单写者锁覆盖** | 枚举所有写者入口 + 共用单写者锁 + 全退出路径释放 |
| 19 | **无调用方机制门禁** | 机制模块须有非测试调用方 + 白名单显式/可判活 |

## 交叉引用

- 架构审查 → 参见 [[architect-review]]
- 风险分级骨架 → 参见 [[architect-router]]
- Claude Code Agent Loop 深度参考 → 参见 `guide.md` ## Claude Code Agent Loop 深度参考
