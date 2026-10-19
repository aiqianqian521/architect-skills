---
name: architect-rag
description: >-
  RAG/记忆检索架构评估。评估检索增强生成系统的多路检索、融合策略、分层架构、索引管理、嵌入质量。
  触发关键词: RAG、检索增强、记忆引擎、向量检索、语义搜索、知识库、embedding、检索融合、rerank、分层检索、记忆管理、memory engine。
---

# RAG/记忆检索架构评估

> **契约与指南分层**：本文件保留核心原则、修复指南和交叉引用。
> **契约层**（检查清单、输出schema）见同目录 contract.json。
> **指南层**（原则详解、修复范式）见同目录 guide.md。
> 蜂群模式下 agent 优先读 contract.json 确定查什么、输出什么；需判断力时参考 guide.md。

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径判定，骨架参考 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则与检查清单

详见 guide.md 与 contract.json。本节保留最小触发摘要：

- 触发条件见本文件顶部 YAML description
- 检查清单见 contract.json → checklist
- 修复指南见 guide.md → 常见问题修复指南

## 交叉引用

- 数据存储 → 参考 [[architect-data]]
- 上下文压缩 → 参考 [[architect-context]]
- Agent记忆 → 参考 [[architect-agent]]
- 成本（embedding API费用） → 参考 [[architect-cost]]
- 风险分级骨架 → 参考 [[architect-router]]
