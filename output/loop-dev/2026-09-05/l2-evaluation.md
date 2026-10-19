# loop-dev full-L2 评估报告（C 阶段 · 2026-09-05）

> 项目：loop-dev（`E:/业余/my/loop-dev`，分支 codex/w0-w2，HEAD 8ba5117→321030f，772 passed/cov 71.91%基线）
> 评估口径：修正后 architect-skills 16 维（B 阶段校正：architect-agent⑥/observability⑨检查点+ARCHITECTURE-COVERAGE.md补建）+ risk-grading-scheme §一触发条件。
> 性质：**full-L2 单项目评估**（大循环 C 阶段 C2）。Intake 见 work_ooda/c1-intake.md；B 校正验证见同目录 report.md。
> 蜂群评估范围=现状并行断言(ThreadPoolExecutor ooda_pipeline.py:651)+flag E4真蜂群/E5三域为 gated candidate(_INDEX)。

## ① 项目架构地图（Intake 建图）
| 目录/入口 | 职责 | 关键文件(行级) |
|----------|------|--------------|
| loop-engine/ | OODA 自进化编排引擎(58 .py) | orchestrator.py:804 / ooda_pipeline.py:930 / memory_store.py:1432 |
| loop-engine/adapters/ | 端口-适配器(TaskRunner ABC) | task_runner.py:312 / backtest_adapter.py:536 |
| loop-engine/migrations/ | schema 迁移 | base.py:308 + MIGRATIONS |
| config/ | 模式 schema | success/failure-pattern-schema.yaml |
| scripts/ | 门禁/ratchet | run_gate.py |
| tests/ | 53 .py / 772 passed | test_contract_invariants.py:352(gated边界锁) |

## ② 维度覆盖矩阵（16 行）
| # | 维度 | 状态 | 主skill | 证据(file:line) | 风险(scheme§一) |
|---|------|------|--------|----------------|---------------|
| 1 | ①上下文与约束 | covered | design | config_util.py:165-176(budget hard/soft+stop条件) + CLAUDE/RUNBOOK | low |
| 2 | ②需求与领域 | covered | design | config/success|failure-pattern-schema.yaml(模式领域) | low |
| 3 | ③系统结构 | partial | design+workflow | **godfile: memory_store.py:1432 / ooda_pipeline.py:930 / orchestrator.py:804**；端口-适配器 task_runner.py:312；插件 ToolRegistry(tool_registry.py:29) | **high①**(godfile>800×3) |
| 4 | ④接口与通信 | covered | net | task_runner.py 契约+normalize_task_result；error_code 结构化(tool_registry.py:102 pre_hook_exception / run_once_pipeline.py:96 SIG_INVALID_SIGNALS / run_loop.py:60 resume_provenance_mismatch)；signal_schema.py:4 校验 | low |
| 5 | ⑤数据与状态 | covered | data | memory_store.py:26/81/100(MIGRATIONS+MigrationRunner+BEGIN IMMEDIATE 并发回退 W1-STORE-01+transaction()原子)；schema_version(resume_guard.py) | low(godfile计入③) |
| 6 | ⑥Agent/异步 | covered(+gated partial) | agent | OODA 9步(event_log.py KNOWN_OODA_EVENT_TYPES:163)；checkpoint-resume(run_state.py:366/resume_guard.py)；circuit_breaker.py(熔断66)；事件溯源(JSONL)；ToolRegistry LIVE(orchestrator.py:239构造+ooda_pipeline.py:350 dispatch)；ThreadPoolExecutor:651(并发上限≤8)；budget(cancel/timeout) | medium(gated seam,见③godfile+⑥subagent) |
| 7 | ⑦安全与信任 | covered(+partial) | security | runtime_exec.py:1-171 ExecGate(de-shell by construction shell恒False+shlex:12 / 解释器allow-list deny-default+审计+ContainmentError fail-closed:92 / env scrub _scrub_env:116)；**OS级net sandbox 推迟P4:20** | medium(net sandbox P4 deferred) |
| 8 | ⑧测试与门禁 | covered | test | test_contract_invariants.py:352(契约不变量锁gated边界)；run_gate.py ratchet(fail_under=64)；772 passed/cov71.91%；分支cov(branch=true) | low(fail_under=64 vs实际71.91=slack,可ratchet) |
| 9 | ⑨交付与变更 | covered | git+docs | pre-commit hook(gate SKIP docs-only/必过code)；README/CLAUDE/RUNBOOK/IMPROVEMENTS/NEXT 入口；git commit链 | low |
| 10 | ⑩运行·部署(ops) | N-A | ops | 无容器化(本地回测引擎);复检钩子=上云/容器化时重查 | low(N-A带钩子) |
| 11 | ⑩运行·可观测(observability) | **missing** | observability | event_log.py JSONL(结构化日志✅)；**无trace_id/round_id传播(grep空)；无metrics后端(仅dict字段)；无healthcheck/resource_limit；无SLO仪表盘** | **medium⑤⑥(无metrics/SLO/healthcheck)** |
| 12 | ⑩运行·成本(cost) | partial | cost | config_util.py:170 max_tokens_per_round=50000(soft budget) | low(partial,token预算存在) |
| 13 | ⑩运行·合规(compliance) | N-A | compliance | 非受监管;复检钩子=受监管时重查 | low(N-A带钩子) |
| 14 | ⑩运行·前端(frontend) | N-A | frontend | 纯后端无UI;复检钩子=加UI时重查 | low(N-A带钩子) |
| 15 | 性能(partial) | partial | agent(主) | 无独立atom；cProfile未接；⑩budget=token非延迟/容量 | low(partial,无SLA/容量规划) |
| 16 | 横切 review | covered | review | 12层审计口径由 architect-review 承载(本评即横切应用) | low |

## ③ 缺口详析（C/H/M 阻塞项）

### H1 ③结构 godfile ×3（high① · scheme §一① 单文件>800行）
- 证据：memory_store.py:1432 / ooda_pipeline.py:930 / orchestrator.py:804（均>800）。
- 根因：自进化引擎累积，未做模块拆分。memory_store 聚 schema+迁移+事务+查询+L2于一身。
- 影响：变更耦合高，跨skill边界模糊（⑤数据/⑥Agent 混在 memory_store/ooda_pipeline）。
- 修复顺序：P1 拆 memory_store（schema/migration/transaction/query 分文件）→ P2 拆 ooda_pipeline（act/verify/swarm 分模块）→ P3 orchestrator 剥离至<800。每步独立 atomic commit + pytest 跑绿 + gate。
- 验证：拆分后各文件<800行 + 772 passed 不回归 + cov 不降。
- 响应时间：7d（high）。

### M1 ⑩可观测 missing（medium⑤⑥ · scheme §一⑤ 无结构化metrics/无healthcheck；⑥ 测试入口散乱不适用）
- 证据：grep trace_id/round_id/healthcheck/resource_limit 全空；metrics 仅为 task_result dict 字段（非后端）。
- 根因：event_log JSONL 提供结构化日志但未做 trace 传播/metrics 后端/SLO。
- 影响：跨 round/step 故障定位靠人工读 JSONL，无指标趋势/告警。
- 修复：接 trace_id（一次 Task 稳定标识）传播到所有 event + metrics 抽取为独立通道（noop 降级，对齐 B 阶段校正的 architect-observability 检查点）。
- 响应时间：30d（medium）。
- 复检钩子：loop 引入多任务并发/上云时升 partial→covered。

### M2 ⑦安全 net sandbox P4 deferred（medium · scheme §一⑤ 边界未收敛非批量）
- 证据：runtime_exec.py:20「true OS-level net sandbox deferred to P4」；当前 env scrub only。
- 根因：设计延期（P4）。
- 影响：subprocess 无出网限制（依赖环境）。
- 修复：P4 接 OS级 net sandbox（审计+fail-closed）。
- 响应时间：30d。

### ⑥subagent 真蜂群 gated（非风险，deliberate gate，确认正确）
- 证据：EVT_SUB_TASK_START/END 定义(event_log.py:160-161)+注册 KNOWN_OODA_EVENT_TYPES:175 但**全仓零 emit=死契约**；max_sub_agents=3(config_util.py:171) **仅 test_contract_invariants.py:352 锁定边界,无生产消费=死knob**；ToolRegistry LIVE(工具调度,非subagent)；无 LLM 层。
- 判定：E4(subagent-provider-seam)/E5(事件三域) candidate **正确保持 gated**（model-gated，contract invariant 显式锁边界防过早adopted）。非缺陷。
- 复检钩子：loop 引入 model 层/ToolRegistry subagent 通电时升 adopted（对齐 _INDEX E4/E5）。

## ④ 统计
| 风险级 | 数量 | 涉及维度 |
|--------|------|---------|
| critical | 0 | — |
| high | 3 | ③结构(godfile×3，计为1类H1) |
| medium | 3 | ⑩observability(M1) + ⑦net-sandbox(M2) + ⑥gated-seam(确认正确,信息项) |
| low | 余 | ①②④⑤⑧⑨ + ⑩cost/性能 + N-A项(带钩子) |
覆盖计数：covered 9 / partial 4(③/⑩cost/性能/⑥gated侧) / missing 1(⑩observability) / N-A 3(ops/compliance/frontend) + 横切review covered。

## ⑤ 改进方案 —— C3 bounded 修正
- **C3-1（立即，contract-tested）**：⑧测试门禁 ratchet——fail_under 64→实际cov驱动的小幅上调（保守低于实际cov）。理由：评估发现 gate slack(64 vs 71.91实际)；ratchet-only never lower，上调符合 ⑧检查点"coverage门禁 ratchet"。pytest+gate 必过。
- **C3-2（ROADMAP，非本轮）**：H1 godfile 拆分三步（P1/P2/P3，各独立 commit+pytest+gate）——大重构留专门 slice，本轮不强行（D-discipline 禁乱执行/禁只做部分）。
- **C3-3（ROADMAP）**：M1 ⑩observability trace_id+metrics 后端（对齐 B 校正的 architect-observability 检查点）——中改动留 slice。
- **C3-4（ROADMAP）**：M2 ⑦ net sandbox P4——按设计延期。

## 关键结论
loop-dev ⑥Agent/⑤数据/⑧测试/⑦安全(de-shell+allow-list+fail-closed)/④接口 核心维 covered；3 godfile(high①)与 ⑩observability missing(medium) 为主要缺口（ROADMAP）；subagent/E4/E5 gated seam 经评估**确认正确锁定**（contract invariant 防过早 adopted，无 LLM 层）。C3 本轮仅做 C3-1 ratchet（bounded+contract-tested）；godfile/observability 留 ROADMAP 专门 slice。蒸馏大厂流程(A7)仍无误（B 校正闭合），大循环可续 D。
