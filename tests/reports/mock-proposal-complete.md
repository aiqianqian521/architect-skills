# 架构评估报告：loop-dev（蜂群模式，2026-08-31T10:00:00Z）

## 门禁判定：❌ BLOCKED

> 存在 1 个 critical 发现，方案阻塞。

### 📋 方案信息

| 字段 | 内容 |
|---|---|
| target | 把 orchestration 从 3628 行单文件降至 ≤600 行/文件，pytest 490 基线不回归 |
| gap | 现状 orchestrator.py 3628 行 god file 全塞 OODA 7-step；缺模块边界 |
| scope | loop-engine/orchestrator.py + steps/{understand,...}.py + tests/ |
| migration | 阶段1拆 decide/act；阶段2拆 observe/verify；阶段3 learn 最后 |
| compat | 调度壳保留原 CLI；失败回滚 git revert 到 18f1038 |
| acceptance | `git ls-files loop-engine | findstr orchestrator` → 单文件 ≤600 行；`python -m pytest -q` → 490 基线通过，pre-existing 不增 |
| owner | cb-owner |
| due | 2026-09-15 |

## ① 项目架构地图

| 目录/入口 | 职责一句话 | 关键文件(行级) |
|----------|-----------|--------------|
| loop-engine/ | 核心编排 | orchestrator.py:1 |

## ② 维度覆盖矩阵

| 维度 | 状态 | 证据数 | 最高风险 | 未知项 |
|---|---|---|---|---|
| design | missing | 0 | — | — |
| review | missing | 0 | — | — |
| data | missing | 0 | — | — |
| test | covered | 1 | high | — |
| workflow | missing | 0 | — | — |
| agent | missing | 0 | — | — |
| git | missing | 0 | — | — |
| docs | missing | 0 | — | — |
| net | missing | 0 | — | — |
| security | covered | 1 | critical | — |
| ops | missing | 0 | — | — |
| observability | missing | 0 | — | — |
| cost | missing | 0 | — | — |
| compliance | missing | 0 | — | — |
| frontend | missing | 0 | — | — |

## ③ 各 skill 详细分析

### test
- **M5**（high · high）
  - 类型: masked_bug
  - 证据: test_close_event_records_probe_success_count: threshold-restore logic masked（event_store_test.go:312）
  - 触发条件: §一②
  - 下一步: add explicit probe success count assertion before threshold-restore
  - 验证命令: `go test ./event -run TestCloseEventRecords -v`
  - 响应时间: 7d
  - 回滚: git revert 该提交或移除 assertion 恢复旧逻辑
  - 关联维度: design

### security
- **S1**（critical · high）
  - 类型: hardcoded_secret
  - 证据: config.yaml:14 contains plaintext api_key（config.yaml:14）
  - 触发条件: §一①
  - 下一步: rotate key and move to environment variable
  - 验证命令: `grep -r 'api_key' config/ || echo 'clean'`
  - 响应时间: 立即/24h
  - 回滚: ⚠️ 未提供（矫正四件套缺失）
  - 关联维度: ops

## ④ 问题点汇总统计（cspm 风格）

| 风险级 | 计数 | 涉及维度 |
|--------|------|---------|
| critical | 1 | security |
| high | 1 | test |
| medium | 0 | — |
| low | 0 | — |

> 风险级由 renderer 从结构化输入计算，非 LLM 主观；定级口径见 reference/risk-grading-scheme.md。

## ⑤ 改进方案 —— Critical/High 阻塞项详述

### M5（high · test）
- 现象: masked_bug
- 证据: test_close_event_records_probe_success_count: threshold-restore logic masked（event_store_test.go:312）
- 根因: Bacon 评估发现
- 改什么: test_close_event_records_probe_success_count: threshold-restore logic masked
- 怎么改: add explicit probe success count assertion before threshold-restore
- 验证: `go test ./event -run TestCloseEventRecords -v`
- 回滚: git revert 该提交或移除 assertion 恢复旧逻辑
- 影响: 见风险分级方案 §一②
- 响应时间: 7d

### S1（critical · security） · ⚠️矫正项不完整
- 现象: hardcoded_secret
- 证据: config.yaml:14 contains plaintext api_key（config.yaml:14）
- 根因: Newton 评估发现
- 改什么: config.yaml:14 contains plaintext api_key
- 怎么改: rotate key and move to environment variable
- 验证: `grep -r 'api_key' config/ || echo 'clean'`
- 回滚: ⚠️ 缺失
- ⚠️ 矫正四件套缺失: rollback — 该项不可 closed
- 影响: 见风险分级方案 §一①
- 响应时间: 立即/24h

## 结论叙述

方案完整，但存在 high/critical 发现需修复。

## 关键发现

M5 测试探针缺失；S1 明文密钥。

## 加固建议

补齐探针断言，轮换密钥。

## 下一步

按响应时间修复 S1（24h）和 M5（7d）。
