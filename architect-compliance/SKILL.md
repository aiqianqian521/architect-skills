---
name: architect-compliance
description: >-
  合规与隐私架构评估：数据分类与合法依据、主体权利、数据驻留、控制项落地机制。
  适用于：评估数据处理目的与合法依据、字段级最小化与脱敏·访问审计、保留与删除例外、DSR（访问·更正·导出·删除）可执行性、跨境数据流动与事件响应、合规控制是否接入测试与 CI。
  不适用于：出具法律意见、渗透测试、供应链漏洞扫描、代写隐私政策。

---

# Compliance 架构评估

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
