---
name: architect-review
description: >-
  架构审查与代码质量评估：双轴审查、12 层 Agent 架构审计、质量门禁。
  适用于：对已有项目做横向架构与代码质量审查、规范轴+规格轴双轴审查、Fowler 坏味道识别、12 层 Agent 架构审计、证据化发现（文件·行号·影响·修复·验证命令）、结构健康半定量基线与还债门禁。
  不适用于：单次 PR 级代码走查、单维度专项评估（请用对应 atom）、代写代码或执行 CI。

---

# Review 架构评估

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
