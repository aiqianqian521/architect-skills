---
name: architect-context
description: >-
  上下文预算与压缩架构评估。评估LLM Agent系统的上下文窗口管理、压缩策略、预算控制、surface/log分层。
  触发关键词: 上下文窗口、context budget、上下文压缩、compaction、token管理、上下文溢出、预算管理、surface事件、log分层。
---

# 上下文预算与压缩架构评估

> **契约与指南分层**：本文件保留核心原则、修复指南和交叉引用。
> **契约层**（检查清单、输出schema）见同目录 `contract.json`。
> **指南层**（原则详解、修复范式）见同目录 `guide.md`。
> 蜂群模式下 agent 优先读 `contract.json` 确定查什么、输出什么；需判断力时参考 `guide.md`。

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径判定，骨架参考 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则与检查清单

详见 `guide.md` 与 `contract.json`。本节保留最小触发摘要：

- 触发条件见本文件顶部 YAML `description`
- 检查清单见 `contract.json` → `checklist`
- 修复指南见 `guide.md` → 常见问题修复指南

## 交叉引用

- Agent编排评估 → 参考 [[architect-agent]]
- 可观测性 → 参考 [[architect-observability]]
- 风险分级骨架 → 参考 [[architect-router]]
