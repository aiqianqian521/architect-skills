# 项目 A 架构评估 v3（全新扫描·五段结构）— CSPM Agent (cspm_agent)

> 全新分析（v3，2026-08-26）。按用户最新输出模板「五段结构」重扫：① 项目架构地图 ② 维度覆盖矩阵 ③ 每 skill 详细分析 ④ 问题点汇总统计 ⑤ 改进方案(Critical/High 详述)。covered 必带行级证据（U0）；N/A 必带复检触发条件（U1）；风险分级引用 `reference/risk-grading-scheme.md` §一触发编号，禁止主观词。

## 元信息
- 路径：`E:\lvfs_git\cpsm_git\cspm_agent`
- 定位：阿里云 CSPM（云安全态势管理）检查项风险解读 Agent 后端（AgentRun 托管 · OpenAI 风格 chat-completions）
- 技术栈：Python ≥3.11 · LangGraph/deepagents · agentrun-sdk · FastAPI/Uvicorn · 阿里云 Aegis-ops/POP/credentials · uv
- 入口：`main.py`（按 `SERVER_MODE` 分流 AgentRun Server / Uvicorn HTTP）
- Git 基线：HEAD `9d51fcd`（2026-08-17）· 分支 `lvfs_dev`/`weiju_dev`

## ① 项目架构地图（每目录职责）

| 目录/入口 | 职责一句话 | 关键文件（行级证据） |
|---|---|---|
| `main.py` | 双模式启动入口：按 `SERVER_MODE` 分派 AgentRun Server / Uvicorn HTTP | `main.py` L1-50（docstring+分派；L10 默认端口注释 8000） |
| `app.py` | FastAPI 应用工厂 + `invoke_agent` 单例（25KB） | `app.py`（读取，25,140B） |
| `config/` `agents.yaml` | Agent 行为配置（33KB） | `config/agents.yaml`（readdir，33,474B） |
| `src/config/` | 配置加载器（env→值），含端口/模式/密钥/ARMS | `config_env.py`（`get_server_port` 默认 9000）、`config_app.py`（app_config YAML） |
| `src/agent/` | 核心 Agent 编排：模型构建/多 agent 协作/3 middleware | `generic_agent.py` 47.7KB、`agent_team_manager.py` 34.3KB、`base_agent.py`、`tool_blocklist_middleware.py` |
| `src/core/` | 编排/聚合：任务服务、聚合 orchestrator、baseline 调度 | `task_service.py` 20.3KB、`aggregator_orchestrator.py` 17.8KB、`baseline_aggregator_orchestrator.py` 10.8KB |
| `src/tool/pop/` | 阿里云 POP/Aegis 工具与报告聚合渲染（**god-file 高发区**） | `baseline_statistics_aggregator.py` 60.9KB(1264行)、`pop_loader.py` 46.1KB、`aliyun_pop_tool.py` 20.6KB |
| `src/tool/local/` | 本地 Markdown 报告解析/构建 | `report_md_parser.py`、`report_field_builder.py`、`cspm_report.py` |
| `src/tool/sandbox/` `knowledge/` | 沙箱执行 + 知识库/RAG 工具 | `sandbox.py`、`knowledge/` |
| `src/models/` `util/` | 请求模型 + 签名校验工具 | `app_request.py`、`signature_verifier.py` |
| `libs/alibabacloud-aegis-ops20180828-inner` | 阿里云 Aegis-ops 内部 SDK（本地 vendored） | `models.py` 1.2MB、`client.py` 975KB |
| `skills/` | deepagents 技能库（SKILL.md + 输出） | `skill-sas-cspm-explain/report/aggregator/…`、`skill-sas-baseline-*` |
| `openspec/` | spec 驱动文档（高质量项目说明） | `project.md`、`specs/`、`changes/` |
| `items/` | SAS API 文档数据 + 检查项知识（11MB） | `apis/apis.json` 11.4MB |
| `test/` | 测试/回测/round-* 产物（83 个 .py） | `round-22/aggregator_response_v2.json`(含 aliUid) |
| `docs/` | 文档 + 测试报告（23MB，大量未跟踪） | `baseline_full_test/*.json`、`*.pdf` |
| `tmp/` | 临时运行产物（57MB） | `srvA7.err` 22MB、`*.pdf` 16MB |
| `project/` `verification/` `work_ooda/` | app_config / 自评验证 / OODA 记录 | `app_config.yaml`、`verification/`、`work_ooda/` |

> 顶层已有 `*.log`(agentrun/httpapi/server 等) + `$(true)` 畸形文件 + `*.err/.pid` 未纳入任何职责归属（运行期产物泄漏到仓库根）。

## ② 维度覆盖矩阵（15 维）

| 维度 | 状态 | 主 skill | 关键证据（行级） | 风险（引 scheme §一） |
|---|---|---|---|---|
| workflow 需求/领域/Spec | covered | architect-workflow | `openspec/project.md`（Purpose/布局/Env/领域词表）+ `openspec/specs/`；`skills/*/SKILL.md` 声明式技能；baseline 三层架构 | low |
| design 系统结构 | partial | architect-design | `baseline_statistics_aggregator.py` 1264 行 + `generic_agent.py` 868 行 + `pop_loader.py` 867 行三 god-file；`sys.path.insert("src")` 路径 hack | high（§一高① god-file>800） |
| data 数据/状态 | partial | architect-data | 报告落盘 `skills/skill-sas-*/output/*.md`；`report_data_cache.py` 内存态；无 schema_version/迁移；`items/apis/apis.json` 11MB 文档数据入库；round-* 运行时 JSON 混入 test 且已跟踪 | medium |
| net 接口/通信 | partial | architect-net | FastAPI/uvicorn + AgentRun Server 双模式；`aggregator_orchestrator.py:139` SUBREPORT_TIMEOUT；`sandbox.py:34` idle timeout；无显式熔断/幂等/重试退避 | medium |
| agent Agent/异步 | covered | architect-agent | LangGraph + deepagents + 3 middleware（`explain_prefetch_guard`/`finalize_stop`/`tool_blocklist`）+ `base_agent`/`agent_context`；`agent_team_manager.py` 多 agent | low |
| security 安全边界 | partial | architect-security | (−) `.aoneci/build_docker_stage.yaml:51` 明文钉钉 webhook token 入库（critical）；round-* 真实 aliUid 已跟踪（critical-数据）。(+) `.env` 走 env + `MCP_TOKEN_ENCRYPTION_KEY`/STS 有设计 + `.env` 已 gitignore | **critical**（§一① 明文凭证入库） |
| test 测试/质量门禁 | partial | architect-test | `test/` 83 个 .py + 多入口（`run_tests.py`/`run_full_test.py`/`smoke_one.py`/`run_tests.sh`）；`verification/`；`skills_config`；测试产物 `test/*resp_*.json`/`round-*` 混入且被跟踪 | medium |
| review 审计/自评 | partial | architect-review | 项目自套 `skills/`+`openspec/`+`verification/`+`work_ooda/` 元意识强；但 134 个未跟踪自评产物未收口、评而不修（2026-08-25 金样已标记卫生问题，818 天未清） | high（§一⑤ 评而不修） |
| git 变更管控 | partial | architect-git | (+) 分支+原子+Conventional 提交；( −) `.err/.pid/.out/tmp_*/$(true)` 未 ignored、`test/round-*` 规则对已跟踪失效、`$(true)` 在顶层 | **high**（§一⑤ + §一④） |
| ops 部署/运行 | partial | architect-ops | Dockerfile（`python:3.12-slim-trixie`、ARMS、`uv sync`）+ compose(9000/env_file/restart)；( −) 无 healthcheck/resource_limits、容器默认 root（无 USER）、base 未钉 digest、CI `.aoneci` 仅 build+镜像扫描无测试门禁 | high（生产化前置）→ medium（无生产化证据） |
| observability 可观测性 | partial | architect-observability | Dockerfile ARMS 集成 + 多 `.log`；(−) 根级 `agentrun.log` 88.9MB/`test_report_err.log` 60.9MB 无轮转、无结构化 JSON/metrics/tracing、无 SLO/告警 | medium（§一med⑤） |
| cost 成本 | N/A | architect-cost | 单实例 CSPM agent，成本弱相关。**复检**：多租户规模化/bailian 计费规模化时重查 | low（带复检钩子） |
| docs 文档工程 | partial | architect-docs | (+）`openspec/project.md` 高质量 + `main.py` docstring ARMS；( −）`README.md` 首行 `hu`/`dexport` 打字错、无 ADR、CLAUDE.md 被 gitignore | low |
| compliance 合规/隐私 | partial | architect-compliance | 产品本身执行合规检查；自身数据留存（round-* aliUid 已入库）、日志脱敏、审计保留、删除机制未见。**复检**：生产化/受监管时按等保重查 | high（§一高⑥ 敏感保留无机制） |
| frontend 前端/体验 | N/A | architect-frontend | 纯后端 Agent 服务，无 UI。**复检**：加管理控制台/报告 UI 时重查 | low（带复检钩子） |

**覆盖统计**：covered 2（workflow/agent）· partial 11 · N/A 2（cost/frontend）· missing 0

## ③ 各 skill 详细分析（L1 口径逐 skill）

### architect-security（维：security）— **critical**
- 应用的原则：第 3 条密钥管理（不硬编码/不提交 git）；第 6 条 audit；「策略 vs 机制」红线。
- 逐项证据：
  - [密钥入库] `.aoneci/build_docker_stage.yaml:51` `access_token=c5f8bc…e9`（`git ls-files` 命中 + `git log --all -S` 历史 `e9714fe`）→ 违反"密钥不提交 git"
  - [真实账号入库] `test/round-22/aggregator_response_v2.json` 已跟踪含 `aliUid:1285998252732543` → 违反"敏感字段不入库"
  - [机制-] `.env` 已 gitignore（`.gitignore:48`)✅；但 `.env.example` 明确给出 `MCP_TOKEN_ENCRYPTION_KEY` 设计 ✅
- 维内风险分级：critical（scheme §一① 明文凭证入库，不豁免）
- 修复/下一步：24h 内轮换钉钉 token + 移出文件 + `git rm --cached test/round-*` + CI secret-scan

### architect-git（维：git）— **high**
- 应用的原则：提交规范/分支策略/.gitignore 是否排除敏感与运行期产物。
- 逐项证据：
  - [.gitignore] 仅盖 `*.log`/`agentrun.err`；未盖 `*.err/*.pid/*.out/tmp_*/$(true)/*.pdf`
  - [tracked 逃逸] `.gitignore:70 test/round-*/` 对已跟踪文件失效（`git check-ignore --no-index` 新文件命中/旧不命中）
  - [卫生] 134 个未跟踪项（`git status --porcelain`）；`$(true)` 畸形文件
  - [+] 分支+Conventional+原子提交（git log）
- 维内风险分级：high（scheme §一⑤ 评而不修 + §一④ 失灵向量）
- 修复/下一步：7d 内补 gitignore + 清顶层 + CI 干净工作树断言

### architect-design（维：design）— **high**
- 应用的原则：单体文件体积基线（god-file>800 行/30KB）；「上帝文件拆分三范式」。
- 逐项证据：
  - `baseline_statistics_aggregator.py` 1264 行 / 60.9KB（src/tool/pop）
  - `generic_agent.py` 868 行 / 47.7KB（src/agent）
  - `pop_loader.py` 867 行 / 46.1KB（src/tool/pop）
  - `sys.path.insert("src")` 路径 hack（`main.py` L13）
- 维内风险分级：high（scheme §一高① 单文件>800 行）
- 修复/下一步：7d 内先拆 `baseline_statistics_aggregator`（按职责正交或状态机步骤范式）

### architect-agent（维：agent）— **covered**
- 应用的原则：LLM-Agent 三义二分（本维=LLM-Agent/编排）；组合根；工具调用护栏。
- 逐项证据：`src/agent/` 含 `base_agent`/`agent_context`/`generic_agent`/`agent_team_manager` + 3 middleware（`tool_blocklist_middleware.py`、`explain_prefetch_guard_middleware.py`、`finalize_stop_middleware.py`）；`config/agents.yaml` 行为配置
- 维内风险分级：low
- 修复/下一步：可维持；拆 god-file 时保持 middleware 链不回归

### architect-workflow（维：workflow）— **covered**（主 skill）
- 应用的原则：领域建模(openspec)/Spec/垂直切片/验收标准可验证。
- 逐项证据：`openspec/project.md`（Purpose/布局/Env/领域词表/OpenSpec usage）、`openspec/specs/`、`openspec/changes/`、`skills/*/SKILL.md` 声明式技能；baseline 三层架构（explain/report/category/aggregator、git log 实证）
- 维内风险分级：low
- 修复/下一步：可维持；round-* 产物应纳入 Spec/工单管束

### architect-net（维：net）— **medium**
- 应用的原则：超时分层/重试退避/熔断/幂等/错误契约。
- 逐项证据：`aggregator_orchestrator.py:139` `timeout=SUBREPORT_TIMEOUT`；`sandbox.py:34` `sandbox_idle_timeout_seconds=300`；FastAPI/uvicorn + AgentRun Server 双模式；未见显式熔断/幂等键/统一 error_code
- 维内风险分级：medium
- 修复/下一步：30d 内统一 timeout/retry/幂等契约（调用方为云 POP/SAS）

### architect-data（维：data）— **medium**
- 应用的原则：schema/迁移/事务/生命周期/数据分类。
- 逐项证据：`report_data_cache.py`（内存态缓存）；报告落盘 `skills/skill-sas-*/output/*.md`；`items/apis/apis.json` 11MB 文档数据；`test/round-22/aggregator_response_v2.json`(aliUid) 已跟踪；无 schema_version/迁移层
- 维内风险分级：medium
- 修复/下一步：30d 内把 round-* 运行时产物与仓库分离；如需持久化补 schema 版本

### architect-review（维：review）— **medium/high**
- 应用的原则：双轴审查；god-file 基线；「评而不修」失效模式。
- 逐项证据：项目自套 `skills/`+`openspec/`+`verification/`+`work_ooda/` 元意识强；但 2026-08-25 金样已标记卫生/变更管控问题，818 天未清 → 符合"评而不修"失效；`run_full_test.err/log` 60MB 散落
- 维内风险分级：high（scheme §一⑤ 评而不修）
- 修复/下一步：7d 内把已标记问题落入任务系统并设关闭判据

### architect-test（维：test）— **medium**
- 应用的原则：TDD 红绿循环 / 黄金数据集 / 契约-集成-E2E 分层 / 质量门禁。
- 逐项证据：
  - 多入口散乱：`run_tests.py` / `run_full_test.py` / `smoke_one.py` / `run_tests.sh`（readdir + git status ?test/ => 55 未跟踪）
  - `test/` 共 83 个 .py + `test/round-*` 运行时产物（12 个已跟踪，含真实 aliUid）
  - `pyproject.toml` `[tool.pytest.ini_options] pythonpath=["src"]` ✅ pytest 框架
  - `verification/` + `skills_config` 作为自验证旁路
- 维内风险分级：medium（测试入口散乱多份 + round-* 生产数据混入 test 目录）
- 修复/下一步：30d 内收口到单一 `pytest` 命令；把 round-* 运行时数据与单测隔离（移出 test/）
### architect-ops（维：ops）— **medium/high**
- 应用的原则：健康检查分层/容器非 root/CI 门禁/回滚。
- 逐项证据：Dockerfile 从 `python:3.12-slim-trixie`（未钉 digest）、无 `USER`（默认 root）、ARMS 集成；compose `9000:9000`+`env_file .env`+`restart unless-stopped` 无 healthcheck/resource_limits/logging；`.aoneci/build_docker_stage.yaml` 仅 build+镜像安全扫描
- 维内风险分级：high（生产化前置；当前无生产化证据可降 medium）· 依据 scheme §一高⑥ 缺项批量
- 修复/下一步：production-ready 前补 USER 非 root + healthcheck + CI pytest 门禁

### architect-observability（维：observability）— **medium**
- 应用的原则：三类信号/脱敏/告警可执行。
- 逐项证据：Dockerfile ARMS（ARMS_APP_NAME/REGION）集成；多 `.log`（agentrun/httpapi/server）；(−) 根级 `agentrun.log` 88.9MB、`test_report_err.log` 60.9MB 无轮转、无结构化 JSON/metrics、无 SLO/告警
- 维内风险分级：medium（scheme §一med⑤ 无结构化日志/无 metrics）
- 修复/下一步：30d 内收口日志到 `logs/` + 轮转 + 结构化 JSON 关键量

### architect-docs（维：docs）— **low**
- 应用的原则：ADR/写给 AI 看/单一真相源。
- 逐项证据：`openspec/project.md` 高质量；`main.py` docstring ARMS 说明；`.env.example` 注释优质；( −) `README.md` L1 `hu` 开头 + `dexport` 打字错、无 ADR、`CLAUDE.md` 被 gitignore
- 维内风险分级：low
- 修复/下一步：季度内修 README 打字错误、补 CLAUDE.md/AI 入口、为大选型补 ADR

### architect-compliance（维：compliance）— **medium/high**
- 应用的原则：控制项映射/数据分类/保留删除/审计证据。
- 逐项证据：产品本身执行云合规检查；自身数据留存（round-* aliUid 已入库）、日志脱敏、审计保留、删除机制未见
- 维内风险分级：high（scheme §一高⑥ 敏感数据留存无机制）；**复检**：生产化/受监管时按等保重查
- 修复/下一步：生产化前补数据留存/审计/删除机制

### architect-cost（维：cost）— **N/A**
- 判定理由：单实例 CSPM agent，成本弱相关。
- 复检触发条件：多租户规模化/bailian 或云 API 计费规模化、接入 FinOps 告警时重查。
- 维内风险分级：low（带复检钩子）

### architect-frontend（维：frontend）— **N/A**
- 判定理由：纯后端 Agent 服务，无 UI。
- 复检触发条件：加管理控制台/风险报告 UI 时重查。
- 维内风险分级：low（带复检钩子）

## ④ 问题点汇总统计（cspm 风格）

### 按风险级计数
| 风险级 | 计数 | 涉及维度 | 关键文件/证据 |
|---|---|---|---|
| **critical** | 1 | security | `.aoneci/build_docker_stage.yaml:51` 明文钉钉 token 入库 |
| **high** | 4 | design / git / review / compliance | `baseline_statistics_aggregator.py`1264行、134 未跟踪、评而不修、round-*aliUid 入库 |
| **medium** | 4 | data / net / test / observability | round-* 跟踪、统一超时、多测试入口、日志无轮转 |
| **low** | 3 | workflow / agent / docs | README 打字错、缺 ADR/CLAUDE |
| **N/A** | 2 | cost / frontend | 带复检触发条件 |

### 覆盖统计（维度状态）
| 状态 | 计数 | 维度 |
|---|---|---|
| covered | 2 | workflow, agent |
| partial | 11 | design, data, net, security, test, review, git, ops, observability, docs, compliance |
| N/A | 2 | cost, frontend |
| missing | 0 | — |

### 高发维度 Top-N
1. **security × git × compliance**（明文凭证 + 真实账号 + 自保有缺陷）→ 安全产品自身，最优先
2. **design → src/tool/pop/**（3 个 god-file 中 2 个在此）→ 结构病高发
3. **review → 评而不修**（金样已标记、818 天未清）→ 治理失效

### 关键半定量基线
- god-file 行数：最高 `baseline_statistics_aggregator.py`=1264 行（阈值 800）→ high
- 明文凭证计数：1 个真实 token（钉钉 webhook）+ 1 处真实 aliUid → critical
- 未跟踪项：134 个 → high
- 顶层日志：`agentrun.log` 88.9MB + `test_report_err.log` 60.9MB → medium（无轮转）

## ⑤ 改进方案 —— Critical/High 阻塞项详述

### C1（critical · scheme §一① 明文凭证入库）钉钉 webhook token 硬编码提交
- 现象：`.aoneci/build_docker_stage.yaml:51` `oapi.dingtalk.com/robot/send?access_token=c5f8bc…e9`
- 证据：`git ls-files -- .aoneci` 命中；`git show HEAD:…` 实读；`git log --all -S <token>` 历史 `e9714fe 支持aone镜像构建`
- 根因：CI 脚本直接写 webhook token，未走 secrets 注入（同文件 ACR 已用 `${{secrets.*}}`，webhook 未同法）+ 无 CI secret 扫描
- 影响：webhook 泄露可被冒充告警/投毒；已进历史，普通改 HEAD 无法清除
- 修复顺序（P0，24h）：① 轮换并吊销旧 token ② webhook 改 `${{secrets.DINGTALK_WEBHOOK}}` ③ 清理历史 ④ CI secret-scan 门禁
- 验证命令：`git grep -n 'access_token=' -- ':!*.md'` 应为空
- 响应时间：24h

### C2（critical · scheme §一④ 变更管控失灵致敏感数据入库）round-* 真实账号数据已跟踪
- 现象：`test/round-22/aggregator_response_v2.json` 已跟踪且含 `aliUid:1285998252732543`
- 证据：`git show HEAD:test/round-22/…` 实读；`git ls-files 'test/round-*'` = 12 个；`.gitignore:70` round 规则仅对新文件生效
- 根因：运行期产物已在规则前 `git add`（已跟踪则 gitignore 失效）；CI 无泄露门禁兜底
- 影响：真实阿里云账号 UID + 检查项结构入库；CSPM 产品自身违反"检测 AK/账号泄漏"职责
- 修复顺序（P0，24h）：① `git rm --cached test/round-*` ② CI `git status --porcelain` 干净断言 + aliUid 扫描 ③ 运行期产物统一 `output/`/`test-data/` 且 gitignore 全盖
- 验证命令：`git ls-files 'test/round-*'` 应为空
- 响应时间：24h

### H1（high · scheme §一⑤ 评而不修 + §一④ 失灵向量）顶层卫生 + gitignore 失灵
- 现象：134 个未跟踪项、`$(true)`、`full_test.err/.pid`、`run_*.py`、`tmp_*`、`test/`55、`docs/`52、`verification/`、`work_ooda/`
- 证据：`git status --porcelain`（134）+ readdir；`.gitignore` 未盖 `*.err/*.pid/*.out/tmp_*/$(true)/*.pdf`
- 根因：gitignore 未全盖运行期产物 + 变更治理缺位；2026-08-25 金样已标记、818 天未清 → 评而不修
- 影响：`git add .` 会把 89MB 日志/16MB PDF/临时脚本扫进稳定分支
- 修复顺序（P1，7d）：① 补 gitignore ② `git rm --cached` ③ pre-commit hook ④ CI 干净断言
- 验证命令：`git status --porcelain | Select-String 'tmp_|\.err$|\.pid$|\.out$'` 应为空
- 响应时间：7d

### H2（high · scheme §一高① god-file>800 行）三处超 800 行单体文件
- 现象：`baseline_statistics_aggregator.py` 1264 / `generic_agent.py` 868 / `pop_loader.py` 867 行
- 证据：字节+行数实测（60.9/47.7/46.1KB）
- 根因：聚合统计与代理编排逻辑堆积，未按职责/状态机/生命周期范式拆分
- 影响：结构病高发区、可维护性差、回归成本高
- 修复顺序（P1，7d）：先拆 `baseline_statistics_aggregator`（正交性收益最高）
- 验证命令：`Get-ChildItem src -Recurse -Filter *.py | Sort Length -Desc | Select -First 1` 单文件 ≤800 行
- 响应时间：7d

### H3（high · scheme §一④ + §一高⑥）CSPM 产品自身敏感日志与数据留存无机制
- 现象：`agentrun.log` 88.9MB / `test_report_err.log` 60.9MB 等散落根目录
- 证据：readdir 字节实读；根级 `.log/.err/.out` 抓 AK/LTAI/MCP token 零命中（抽查，未全量）
- 根因：日志无统一目录/轮转；未接结构化与脱敏
- 影响：审计期日志含账号/检查项结构；磁盘膨胀
- 修复顺序（P1，7d）：① 日志收口 `logs/` + 轮转 ② redaction middleware ③ 全量泄露扫描
- 验证命令：`Select-String -Path *.log,*.err -Pattern 'AKID|LTAI[0-9A-Za-z]{8,}|aliUid'` 应空
- 响应时间：7d

### H4（high · scheme §一高⑥ 运维缺项）容器 root + 无 healthcheck + CI 无测试门禁
- 现象：Dockerfile 无 `USER`（默认 root）、base `python:3.12-slim-trixie` 未钉 digest、compose 无 healthcheck、`.aoneci` 无 pytest 门禁
- 证据：Dockerfile / docker-compose / `.aoneci` 全文实读
- 根因：容器与 CI 以最小可用为目标，未做生产加固
- 影响：生产化时 root 提权面、无就绪探针、回归无自动门禁
- 修复顺序（P2，30d 前置）：① USER 非 root ② base 钉 digest ③ healthcheck ④ CI 加 pytest
- 验证命令：`docker inspect` 见 USER 非 root；`docker compose config` 见 healthcheck
- 响应时间：30d（生产化前）

## 关键结论（V/I/U 三分）
- **VERIFIED**：明文钉钉 token 已入库且历史存在（`git log --all -S`）；round-* 真实 aliUid 已跟踪（`git show HEAD`）；god-file 三处超 800 行（行数实测）
- **VERIFIED**：134 个未跟踪项（`git status --porcelain`）；顶层日志大小（readdir 字节）
- **INFERRED**：根级日志"可能含账号数据"（未全量 grep，标 UNVERIFIED）
- **UNVERIFIED**：`pytest` 全量通过率、镜像构建、真机扫描——资源/环境限制未执行，列为下一步验证动作

## 已接受假设
- 假设 `items/apis/apis.json` 中的 token/SHA 均为阿里云公开 API 文档示例（掩码 `LTAI…****`/`access_token=XXX`），非真实凭证——已抽验非 `XXX`/`****` 的真实 token 仅 `.aoneci` 处
- 假设钉钉 webhook token 泄露可被伪造告警（符合 webhook 签名机制推断）

## 未覆盖与建议新增 skill
- **performance/latency 基线**：ARCHITECTURE-COVERAGE 中该维为 partial，本评估未跑 P50/P95（无压测环境）→ 建议补性能压测。
- **供应链 CVE 扫描**：`libs/` 内 vendored Aegis-ops SDK 未做依赖 CVE 审计 → 建议补供应链扫描项。

## 验证命令与结果
- `git ls-files -- .aoneci/build_docker_stage.yaml` → 命中（tracked）
- `git show HEAD:.aoneci/… | Select-String access_token` → 命中明文 token
- `git log --all -S c5f8bc…e9` → `e9714fe`（历史存在）
- `git grep -rl aliUid -- 'test/round-*'` → round-19/22/25 命中
- `git ls-files 'test/round-*'` → 12 个已跟踪
- `git status --porcelain` → untracked=134
- `Get-ChildItem -Recurse -File | Sort Length` → `agentrun.log` 88.9MB 等
- `Get-ChildItem src -Recurse -Filter *.py | Sort Length` → 三 god-file
- 根级 `.log/.err/.out` 抓 secret 模式 → 零命中（抽查）
- 未执行（标 UNVERIFIED）：`pytest`、镜像构建、真机/CVE 扫描

## 证据来源附录（Intake 实读）
- `main.py` L1-50、`src/config/config_env.py`、`app.py`、`config/agents.yaml`、`.env.example`
- `.aoneci/build_docker_stage.yaml`、`docker-compose.yml`、`Dockerfile`、`pyproject.toml`、`.gitignore`
- `openspec/project.md`、`README.md`
- `test/round-22/aggregator_response_v2.json`（git show，含 aliUid）
- `src/`（agent/core/tool/pop/local/models/util）readdir + 字节/行数
- 顶层 readdir + 目录大小 + `git status --porcelain`（134）
- `git log --oneline -20` + `git log --all -S <token>`
- 未读（标注）：`config/agents.yaml` 内容、`skills/*/SKILL.md` 全文、round-* 全量、`.env` 实际值

> 五段结构模板（①架构地图②维度矩阵③每skill详析④统计汇总⑤改进方案）已同步写入 `architect-router/SKILL.md`「L2 单项目报告·五段结构」。本报告为用新模板产出的第一份金样样例。
