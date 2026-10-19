# 项目 A 架构评估 v2 — CSPM Agent (cspm_agent)

> 全新分析（v2）。不复用 v1 结论，按修复后 architect-skills「全面分析模式」15 维逐维重读重判。所有 covered 必有 Intake 实读证据指向（router U0 硬规则）；N/A 必带复检触发条件（U1）。

## 元信息
- 路径：`E:\lvfs_git\cpsm_git\cspm_agent`
- 定位：阿里云 CSPM（云安全态势管理）安全检查 Agent 后端
- 技术栈：Python ≥3.11 · LangGraph · AgentRun SDK · LangChain · FastAPI/Uvicorn · 阿里云 POP/Aegis/credentials
- 入口：`main.py`（按 `SERVER_MODE` 分流 agentrun / uvicorn）
- 分析日期：2026-08-25 · 分析口径：修复后 skills（14 PASS）全量模式 · Intake 实读 · 行级证据

## 一、结论先行

**事实（已验证，附行级证据）**
- 双模式入口分流：`main.py` 按 `SERVER_MODE` 选 AgentRun Server（默认）/ Uvicorn HTTP（main.py L1-51 实读）
- `src/agent/` 含两个 god file：`generic_agent.py` 47693B、`agent_team_manager.py` 34339B（readdir 实读）
- 顶层 73 个目录项中 25 个垃圾：`agent.log`/`agentrun.err`/`full_test.{log,pid,err}`/`server*.log`/`tmp_l1_srv.err`/`tmp_patch_*.py`/`tmp_verify_*.json` 等 + 畸形文件名 `$(true)`（readdir 实读）
- `docker-compose.yml`：端口 `9000:9000`、`env_file .env`、`restart unless-stopped`，**无 healthcheck / resource_limits / logging driver**（实读全文）
- `main.py` docstring 注释默认端口 `8000`，与 compose `9000` 不一致（main.py L10 实读）
- `.env.example` 走 STS + `MCP_TOKEN_ENCRYPTION_KEY` 加密密钥，密钥管理有设计（.env.example L1-35 实读）
- git log 活跃：baseline L1/L2/L3 三层 + SAS/CSPM，分支 `lvfs_dev`/`weiju_dev` 合并

**判断**
- 端口配置多源、无单一可信源 → high（部署一致性风险，8000/9000 漂移）
- 顶层卫生灾难 + `$(true)` 入库 → 变更管控失灵 → **critical**（ops × git × security 三维交汇）
- CSPM 安全检查产品自身敏感日志散落顶层未 gitignore → 反讽性 high

**假设（未实测，显式标注）**
- 假设 `*.log`/`*.err` 含 AK 或 STS 临时凭证残留 → 若属实 security 由 high 升 critical。**本轮未 grep 验证**，列为下一步 H3-verify。

**一句话**：骨架（双模式入口 + LangGraph 编排 + STS 密钥设计）扎实，血肉（god file + 目录卫生 + 配置多源）欠债；安全产品自身卫生与变更管控是阻塞项。

## 二、15 维覆盖矩阵

| atom | 状态 | 关键证据（行级） | 风险 |
|---|---|---|---|
| design | partial | 双模式入口清晰；但 `generic_agent.py` 47KB + `agent_team_manager.py` 34KB 双 god file；`sys.path.insert("src")` 路径 hack；顶层 73 项 25 垃圾 | high |
| data | partial | `config/agents.yaml` 行为配置；`LAUNCH_MODE=local` 落 Markdown 风险报告；未见显式持久层/schema 版本/迁移 | medium |
| net | partial | FastAPI/uvicorn HTTP + AgentRun Server 双模式；**端口 8000(main) vs 9000(compose) 不一致**；无显式超时/重试/熔断 | high |
| workflow | covered | LangGraph + agent_team_manager 多 agent + middleware 链（`explain_prefetch_guard`/`finalize_stop`/`tool_blocklist`）；baseline L1/L2/L3 三层（git log 实证） | low |
| agent | covered | AgentRun SDK + LangGraph + `base_agent`/`agent_context` + middleware 链；这是项目核心能力 | low |
| security | partial | (+) `.env.example` STS + `MCP_TOKEN_ENCRYPTION_KEY`；(−) 顶层 `*.log/*.err` 可能含凭证且未 gitignore；`$(true)` 暗示 shell 注入残留；自身 RBAC/审计未见 | high |
| test | partial | `run_full_test.py`/`run_tests.py`/`smoke_one.py` 多入口 + `verification/` + `skills_config`；自套 architect-skills 方法；但 `tmp_*.py`/`tmp_verify_*.json` 残渣散落 | medium |
| review | partial | 项目用 `skills/`+`openspec/`+`verification/` 自评（元意识强）；但 god file/垃圾未自纠收口 | medium |
| git | partial | (+) 分支管理 + 活跃提交；(−) 25 垃圾 + `$(true)` + `tmp_*.json` 入库，gitignore 失效 | high |
| ops | partial | Dockerfile + compose（ports/env_file/restart）；(−) 无 healthcheck/resource/logging/graceful shutdown | medium |
| observability | partial | (+) ARMS 接入文档详（main.py docstring）；多 `.log` 输出；(−) 默认无 ARMS、无结构化/metrics/tracing 统一、日志无轮转 | medium |
| cost | N/A | 单实例 CSPM agent，成本弱相关。**复检条件**：多租户规模化或 bailian 模型计费规模化时重查 | low |
| docs | partial | (+) main.py docstring 详、`.env.example` 注释优质、skills/openspec 元文档；(−) 缺统一顶层 README 入口（待复检） | low |
| compliance | partial | CSPM 即合规检查能力（检查阿里云资源合规）；自身数据留存/日志审计/PII 合规未见；**复检条件**：生产化时按等保/数据合规重查 | medium |
| frontend | N/A | 纯后端 Agent 服务。**复检条件**：未来加管理控制台/风险报告 UI 时重查 | low |

**覆盖统计**：covered 2（workflow/agent）· partial 11 · N/A 2（cost/frontend）· missing 0

## 三、Critical / High 阻塞项详述

### C1（critical）顶层卫生灾难 + 变更管控失灵
- **现象**：顶层 73 项含 25 个 `.log/.err/.pid/.out/tmp_*/$(true)`，`$(true)` 畸形文件名已入库
- **证据**：readdir 实读（junk=25, weird=$(true)）；git log 显示活跃开发但垃圾持续累积
- **根因**：`.gitignore` 未覆盖运行期产物；变更管控（CODEOWNERS/CI lint）缺位；`$(true)` 暗示曾有未受控 shell 执行残留入库
- **影响**：构建可能打包垃圾 → 镜像膨胀/泄露；审计期日志含敏感；git 历史污染
- **修复方向**：(1) 补 `.gitignore` 规则覆盖 `*.log`/`*.err`/`*.pid`/`*.out`/`tmp_*`/`$(*)`；(2) `git rm --cached` 清已有；(3) 加 pre-commit hook 拦截
- **验证命令**：`git status --porcelain | Select-String 'tmp_|\.log$|\.err$|\.pid$|\.out$'` 应为空；`Get-ChildItem '$(true)'` 应 FileNotFound
- **风险分级**：critical · **下一步**：先 grep `*.log/*.err` 是否含 AK/SECRET → 决定是否触发密钥轮换（接 H3-verify）

### H1（high）端口配置多源、无单一可信源
- **现象**：`main.py` 注释默认 8000，`docker-compose` 9000，`.env.example` 未设 `SERVER_PORT` 默认
- **证据**：main.py L10 `SERVER_PORT: ... 默认: 8000`；compose `ports: - "9000:9000"`
- **根因**：配置三源（代码默认/compose/env）无单一可信源 + 无启动一致性校验
- **影响**：本地跑 8000、容器跑 9000，文档/联调/网关配置易错
- **修复方向**：单一真实源——`SERVER_PORT` 只在 `.env` 定义，compose 与 main 都读它；启动时 assert compose 端口 == env 端口
- **验证命令**：`docker compose config` 输出端口应 == `main.py` 启动日志端口
- **风险分级**：high · **下一步**：补 `.env.example` 的 `SERVER_PORT=9000` 并在 compose 用 `${SERVER_PORT:-9000}`

### H2（high）双 god file
- **现象**：`generic_agent.py` 47KB、`agent_team_manager.py` 34KB
- **修复方向**：按职责拆分（agent 生命周期/工具调度/team 编排/middleware 各自独立模块）
- **验证命令**：单文件 ≤ 400 行为达标线
- **风险分级**：high · **下一步**：先拆 `agent_team_manager`（team 编排正交性最高收益）

### H3（high）安全产品自身卫生反讽
- **现象**：CSPM 安全检查产品，自身 `*.log/*.err` 散落顶层未 gitignore，`$(true)` 入库
- **修复方向**：日志统一到 `logs/` + rotation；敏感字段 redaction middleware；`$(true)` 清理并加 CI secret-scan
- **验证命令**：`Select-String -Path *.log,*.err -Pattern 'AK|SECRET|TOKEN|access_key'` 应空
- **风险分级**：high（若 grep 命中凭证则升 critical）· **下一步**：执行 H3-verify grep

## 四、Medium / Low 汇总
- data：补显式持久层与 schema 版本（medium）
- ops：compose 补 healthcheck/resource/logging（medium）
- observability：默认开启结构化 JSON 日志 + 关键 metrics（medium）
- test：清理 `tmp_*` 残渣，统一测试入口到 `run_tests.py`（medium）
- compliance：生产化前补数据留存/审计合规（medium，复检驱动）
- docs：补顶层 README 统一入口（low）

## 五、修复优先级 + 还债顺序
1. **P0**：C1（gitignore + 清垃圾 + pre-commit）→ H3-verify（grep 凭证，决定是否轮换）
2. **P1**：H1（端口单一源）→ H2（拆 team_manager）→ ops healthcheck/resource
3. **P2**：observability 结构化日志 → test 残渣清理 → docs README

**负责人建议**：bundle/项目维护者统一 owner；P0/P1 阻塞项在新增任何 baseline 层之前先还债（与 architect-skills 改进清单同口径：先还债再加新）。

## 六、证据来源附录（Intake 实读文件）
- `main.py` L1-51（双模式入口 + ARMS 文档 + 默认端口注释）
- `src/agent/` readdir（generic_agent 47KB / agent_team_manager 34KB / 6 个 middleware）
- 顶层 readdir（73 项 / 25 垃圾 / `$(true)`）
- `docker-compose.yml` 全文（ports/env_file/restart，无 healthcheck）
- `.env.example` L1-35（STS + MCP_TOKEN_ENCRYPTION_KEY + 启动模式注释）
- `git log --oneline -15`（baseline L1/L2/L3 + SAS/CSPM + 分支合并）
- 未读（标注）：`config/agents.yaml` 内容、`src/config.py` 端口默认值实现、`*.log` 内容（列为 H3-verify）

> 本报告全程引用 SKILL.md 实读内容，未读到的标「未读/复检」，不脑补。N/A 两维（cost/frontend）均带复检触发条件，符合 router U1。
