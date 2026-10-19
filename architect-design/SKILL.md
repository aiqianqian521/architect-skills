---
name: architect-design
description: >-
  系统架构设计评估：端口-适配器、DDD 战术设计、组合根、模块边界与结构健康。
  适用于：评估模块边界与依赖方向、端口-适配器分离与全局可变状态、深模块与纯透传模块、领域实体/值对象/聚合/限界上下文、规模 Tier 适配与过度设计、组合根与结构健康基线（god-file 离群）。
  不适用于：绘制架构图、代写技术方案文档、单文件代码重构。

---

# Design 架构评估

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

## 交叉引用

- 架构审查 → 参见 [[architect-review]]
- 风险分级骨架 → 参见 [[architect-router]]
