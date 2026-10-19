# 架构评估报告：cspm_agent（蜂群模式，2026-08-31T14:00:00Z）

## 门禁判定：❌ BLOCKED（模式：assessment）

> 存在 1 个 critical 发现，方案阻塞。

> （评估现有项目模式：proposal 非必填，本报告已按全维评审输出；如需"评审改造方案"请用 review 模式并提供 proposal。）

## ① 项目架构地图

| 目录/入口 | 职责一句话 | 关键文件(行级) |
|----------|-----------|--------------|
| ./ | （待补：据 Intake 建图） | app.py |
| test | （待补：据 Intake 建图） | test/ |

## ② 维度覆盖矩阵

| 维度 | 状态 | 证据数 | 最高风险 | 未知项 |
|---|---|---|---|---|
| design | covered | 2 | high | — |
| review | 未评审 | 0 | — | — |
| data | covered | 1 | medium | — |
| test | partial | 1 | medium | — |
| workflow | 未评审 | 0 | — | — |
| agent | 未评审 | 0 | — | — |
| git | 未评审 | 0 | — | — |
| docs | 未评审 | 0 | — | — |
| net | 未评审 | 0 | — | — |
| security | covered | 2 | critical | — |
| ops | covered | 1 | medium | — |
| observability | 未评审 | 0 | — | — |
| cost | 未评审 | 0 | — | — |
| compliance | 未评审 | 0 | — | — |
| frontend | 未评审 | 0 | — | — |

> 状态口径：covered/partial=有评审产出，missing=代理遗漏/失联，N/A=维度不适用（带复检条件），未评审=本轮无代理评估。

## ③ 各 skill 详细分析

### design
- **DES1**（high · high）
  - 类型: god_file
  - 证据: app.py 602 lines: monkey patch, HTTP server, AgentRun server, tool loading, config printing; too many responsibilities（app.py:1-602）
  - 触发条件: §1①
  - 下一步: Split: app.py keeps entry only, monkey patch -> patches/, HTTP server -> server/, tool loading -> bootstrap/
  - 验证命令: `python -m py_compile app.py && dir src/server src/patches src/bootstrap`
  - 回滚: git revert split commit

- **DES2**（medium · high）
  - 类型: design_flaw
  - 证据: task_service.py:151-404 has 5 nearly identical _maybe_prefetch_* methods differing only in task_name/parsed type（task_service.py:151-404）
  - 触发条件: §1②
  - 下一步: Extract generic prefetch template method, each specific method only passes parser and task name
  - 验证命令: `pytest tests/test_task_service.py -q`
  - 回滚: Restore original 5 separate methods

### data
- **D1**（medium · high）
  - 类型: missing_validation
  - 证据: config_env.py:198 int(val) without try/except; invalid value causes ValueError at startup（config_env.py:198-201）
  - 触发条件: §1②
  - 下一步: Wrap int() with try/except, return None on invalid value and log warning
  - 验证命令: `pytest tests/test_config_env.py -k invalid_uid`
  - 回滚: Restore direct int() conversion

### test
- **T1**（medium · high）
  - 类型: missing_test
  - 证据: test/ directory only has 12 test files while src/ has 190 files; no coverage config found（test/）
  - 触发条件: §1②
  - 下一步: Add pytest + coverage config, target core module coverage >=70%
  - 验证命令: `pytest --cov=src --cov-report=term-missing`
  - 回滚: Remove pytest-cov config

### security
- **SEC-04**（critical · high）
  - 类型: hardcoded_secret
  - 证据: app.py:342 ali_uid=1960721413485912 hardcoded in source, not from env var（app.py:342）
  - 触发条件: §1①
  - 下一步: Read from ALIBABA_CLOUD_ALI_UID env var, raise ConfigurationError if missing
  - 验证命令: `grep -n '1960721413485912' app.py && echo FAIL || echo PASS`
  - 回滚: Restore hardcoded value

- **SEC-02**（high · medium）
  - 类型: design_flaw
  - 证据: app.py:20-160 runtime replacement of urllib.parse.quote and agentrun model_adapter.wrap_model breaks library consistency（app.py:20-160）
  - 触发条件: §1②
  - 下一步: Replace monkey patch with explicit wrapper class or upstream PR for dynamic headers
  - 验证命令: `python -c "import app; assert hasattr(app, '_apply_dynamic_headers_patch') == False"`
  - 回滚: Restore original monkey patch

### ops
- **O1**（medium · high）
  - 类型: other
  - 证据: Dockerfile:86-88 ENTRYPOINT commented out (AgentRun platform bug fix in progress), relies on external orchestration for start command（Dockerfile:86-88）
  - 触发条件: §1②
  - 下一步: Track AgentRun platform bug fix, restore ENTRYPOINT after fix; temporarily specify command in docker-compose.yml
  - 验证命令: `docker build -t cspm-test . && docker run --rm cspm-test echo entrypoint ok`
  - 回滚: Re-comment ENTRYPOINT

## ④ 问题点汇总统计（cspm 风格）

| 风险级 | 计数 | 涉及维度 |
|--------|------|---------|
| critical | 1 | security |
| high | 2 | design，security |
| medium | 4 | — |
| low | 0 | — |

> 风险级由 renderer 从结构化输入计算，非 LLM 主观；定级口径见 reference/risk-grading-scheme.md。

## ⑤ 改进方案 —— Critical/High 阻塞项详述

### DES1（high · design）
- 现象: god_file
- 证据: app.py 602 lines: monkey patch, HTTP server, AgentRun server, tool loading, config printing; too many responsibilities（app.py:1-602）
- 根因: Halley 评估发现
- 改什么: app.py 602 lines: monkey patch, HTTP server, AgentRun server, tool loading, config printing; too many responsibilities
- 怎么改: Split: app.py keeps entry only, monkey patch -> patches/, HTTP server -> server/, tool loading -> bootstrap/
- 验证: `python -m py_compile app.py && dir src/server src/patches src/bootstrap`
- 回滚: git revert split commit
- 影响: 见风险分级方案 §1①

### SEC-04（critical · security）
- 现象: hardcoded_secret
- 证据: app.py:342 ali_uid=1960721413485912 hardcoded in source, not from env var（app.py:342）
- 根因: SecurityAgent 评估发现
- 改什么: app.py:342 ali_uid=1960721413485912 hardcoded in source, not from env var
- 怎么改: Read from ALIBABA_CLOUD_ALI_UID env var, raise ConfigurationError if missing
- 验证: `grep -n '1960721413485912' app.py && echo FAIL || echo PASS`
- 回滚: Restore hardcoded value
- 影响: 见风险分级方案 §1①

### SEC-02（high · security）
- 现象: design_flaw
- 证据: app.py:20-160 runtime replacement of urllib.parse.quote and agentrun model_adapter.wrap_model breaks library consistency（app.py:20-160）
- 根因: SecurityAgent 评估发现
- 改什么: app.py:20-160 runtime replacement of urllib.parse.quote and agentrun model_adapter.wrap_model breaks library consistency
- 怎么改: Replace monkey patch with explicit wrapper class or upstream PR for dynamic headers
- 验证: `python -c "import app; assert hasattr(app, '_apply_dynamic_headers_patch') == False"`
- 回滚: Restore original monkey patch
- 影响: 见风险分级方案 §1②

## 结论叙述



## 关键发现



## 加固建议



## 下一步



## ⚠️ 报告完整性警告（NARRATIVE_MISSING）

> 以下叙述段为空：summary(结论叙述)、keyFindings(关键发现)、hardening(加固建议)、nextSteps(下一步)。建议评估者补齐后再作为正式报告存档；若为机器聚合产物请注明。
