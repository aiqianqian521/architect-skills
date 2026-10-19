---
name: architect-test
description: >-
  测试与质量门禁架构评估：TDD 铁律、测试反模式、AI 输出评测框架。
  适用于：评估测试是否绑定内部实现、同义反复与永真断言、水平切片反模式、边界与 flaky 覆盖、契约·集成·黄金数据集门禁、AI/Agent 输出评测框架（eval sets + 多 evaluator + 实验状态机 + 沙箱幂等）。
  不适用于：代写单元测试、补覆盖率数字、跑一次测试套件。

---

# Test 架构评估

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
