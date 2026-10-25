# 架构师技能覆盖矩阵（ARCHITECTURE-COVERAGE）

> 定位：本文件是 architect-skills「全面项目分析模式」的**覆盖维度口径源**。
> 被 `architect-router/SKILL.md`「全面项目分析模式」段引用（`../ARCHITECTURE-COVERAGE.md`，即本文件位于 architect-skills 根目录）。
> 被 loop-dev `docs/knowledge-distillation/PROJECT-ANALYSIS-TEMPLATE.md` 的 16 矩阵行口径引用。
> **本文件 = 19 矩阵行（18 atom skill + 1「性能/延迟/容量/资源预算」partial，主属 architect-agent，尚无独立 atom）**。
> 创建于 2026-09-05（B 阶段断链修复：原 router/TEMPLATE 引用本文件但文件缺失，D4 断链；本次补建使口径源真实可回溯）。最后更新：2026-10-20（新增 architect-context/architect-rag，升级 architect-agent 检查项）。

## §1 固定分析顺序（10 维）→ atom 映射

逐维度扫描顺序（来自 router「固定分析顺序」，不得跳序）：

| # | 维度 | 主 atom skill | 备注 |
|---|------|--------------|------|
| ① | 上下文与约束（目标/非目标/Tier/合规/预算/SLO/期限） | architect-design | Intake 建图先行 |
| ② | 需求与领域（术语/边界/实体·值对象·聚合/用户故事/验收） | architect-design | 领域建模归 design |
| ③ | 系统结构（模块边界/依赖方向/组合根/架构模式/演进迁移） | architect-design + architect-workflow | workflow 承流程结构 |
| ④ | 接口与通信（API 契约/版本/错误/超时/重试/幂等/消息流式） | architect-net | |
| ⑤ | 数据与状态（schema/迁移/事务/一致性/备份恢复/生命周期/隐私） | architect-data | |
| ⑥ | Agent/异步流程（状态机/checkpoint/并发/取消/预算/失败恢复/可观测） | architect-agent | 性能 partial 主归此 |
| ⑦ | 安全与信任边界（认证/授权/输入校验/密钥/沙箱/供应链/审计/STRIDE） | architect-security | |
| ⑧ | 测试与质量门禁（单测/契约/集成/E2E/金数据/回归/覆盖率/证据） | architect-test | |
| ⑨ | 交付与变更（Spec/ADR/工单/Git/CI/发布/回滚/文档一致） | architect-git + architect-docs | |
| ⑩ | 运行与产品能力（部署/可观测/成本/合规/前端体验） | architect-ops + architect-observability + architect-cost + architect-compliance + architect-frontend | 展开 5 atom，缺则标 partial/missing |

> 横切：`architect-review`（12 层审计）跨维适用，不占单维行，在每维可引为复检。
> 横评：`architect-router` 跨项目横评（≥2 项目必产出）见 router「跨项目横评」段。

## §2 覆盖矩阵（19 行 = 18 atom + 1 partial）

| # | atom skill | 覆盖维度 | 核心检查项要点 | 证据要求 | 输出物 | 校正 |
|---|-----------|---------|--------------|---------|--------|------|
| 1 | architect-design | ①②③ | 目标/非目标/Tier；领域实体·聚合；模块边界/依赖方向/组合根/架构模式/演进迁移 | 行级 file:line（组合根/边界/迁移路径） | 四件套 | |
| 2 | architect-review | 横切(12层) | 12 层审计逐层证据；评而不修两种失效模式区分 | 行级证据 + 复检钩子 | 四件套 | |
| 3 | architect-data | ⑤ | schema/迁移/事务/一致性/备份恢复/生命周期/隐私分类 | 行级 file:line | 四件套 | |
| 4 | architect-test | ⑧ | 单测/契约/集成/E2E/金数据/回归/覆盖率/验证末步；AI 输出评测框架(多 evaluator+实验状态机+多语言沙箱+幂等) | 测试入口+覆盖率+验证命令+评测契约 | 四件套 | ✅ 2026-09-06 |
| 5 | architect-workflow | ③⑥ | 流程/状态图/checkpoint-resume/handoff/fan-out·in/saga | 行级 file:line | 四件套 | |
| 6 | architect-agent | ⑥ | 状态机/checkpoint/并发上限/取消/预算/失败恢复/可观测；分层降维+压缩归档；worker-pool 背压四件套；单一路径原则；Async Generator模式(backpressure+TerminalReason)；三段式状态分离(Config/State/Deps≤4)；死亡螺旋5层防护；错误恢复阶梯(5级)；多Agent编排(Fan-out/Saga/Map-reduce)，活性看门狗（挂钟无进展中止+工具在飞挂起+仅 stall 重试），上下文域工具策略门（按上下文收窄工具面+结果级阻断） | 行级 file:line（状态机/池/队列） | 四件套 | ✅ 2026-09-05 |
| 7 | architect-git | ⑨ | 变更管控/分支策略/CI 门禁/发布回滚/敏感数据入库 | git log/CI 配置 file:line | 四件套 | |
| 8 | architect-docs | ⑨ | README/ADR/runbook/文档一致性/入口完整 | 文档入口 file:line | 四件套 | |
| 9 | architect-net | ④ | API 契约/版本/错误码/超时/重试/幂等/消息流式/trace_id | 行级 file:line | 四件套 | |
| 10 | architect-security | ⑦ | 认证/授权/输入校验/密钥管理/沙箱/供应链/审计/STRIDE | 行级 file:line（密钥/校验点） | 四件套 | |
| 11 | architect-ops | ⑩·部署 | 部署/编排/healthcheck/resource limit/回滚/发布动作 | compose/k8s/脚本 file:line | 四件套 | |
| 12 | architect-observability | ⑩·可观测 | SLI/SLO；logs/metrics/traces 跳转；P50/P95/P99；告警阈值/owner/runbook；采样/时钟/高基数；脱敏；trace 重放；**telemetry 后端可插拔 factory + noop 降级**；OTel 标准语义约定；trace exporter/路由多范式(SDK直发/平台存储/collector扇出多租户) | 行级 file:line（后端工厂/noop/语义约定/exporter 路由） | 四件套 | ✅ 2026-09-05+09-06 |
| 13 | architect-cost | ⑩·成本 | token/用量计费/资源预算/成本基线 | 用量/计费 file:line | 四件套 | |
| 14 | architect-compliance | ⑩·合规 | 监管/数据驻留/审计日志/合规检查点 | 合规配置 file:line | 四件套 | |
| 15 | architect-frontend | ⑩·前端 | 入口/可访问性/性能预算/错误边界/体验 | 前端入口 file:line | 四件套 | |
| 16 | architect-plugin | ③·插件化(横切) | 软插拔第三方可安装/manifest契约/注册vs物化/扩展点/隔离纯度门/生命周期/roster/upgrade-law; 哪些该插件化哪些不该; GitHub学习注入 | plugins目录+manifest file:line | 四件套 | |
| 17 | N/A（性能/延迟/容量/资源预算） | ⑥（主）+⑩ | 当前无独立 atom；当项目涉及高并发/大流量/资源敏感场景时，需在 ⑥Agent 或 ⑩运行维度备注线落证据并触发复检。本行标 N/A 而非 partial，避免误导用户以为已实质评审。复检触发条件：项目 README 提及性能目标或存在 load-test/benchmark 目录。 | 热路径/容量 file:line | 四件套(N/A) | |
| 18 | architect-context | 上下文预算 | 上下文窗口预算/Tier分配；四层压缩(顺序: collapse先于compact)；Auto-Compact熔断器(连续3次)；Surface/Log分层；8段结构化摘要；token监控告警；压缩可逆性/trace重放 | 行级 file:line | 四件套 | |
| 19 | architect-rag | RAG/记忆检索 | 多路并行检索(≥2路: 语义+关键词)；RRF融合(k=60)；分层检索(mental_models>observations>raw_facts)；Cross-encoder重排；MMR多样性(λ=0.7)；嵌入质量评估；Consolidation合并+溯源；Graph检索(激活扩散+时间图) | 行级 file:line | 四件套 | |

> 「输出物=四件套」= 结论 / 证据（行级）/ 风险分级（引 `reference/risk-grading-scheme.md` §一触发条件编号）/ 下一步（可执行可验证）。未经 Router 单独调用 atom 时按此骨架自补。
> 「校正」列：✅ 标记本 atom 检查点经大厂实测真值校正（见 §5）。

## §3 状态语义与 N/A 规则

- 维度状态：`covered`（≥1 条已读行级证据）/ `partial` / `missing` / `not-applicable`。
- `covered` 不得脑补：必须在 Intake「证据→维度映射表」指到已读证据；未读到证据只能 `partial/missing/N-A`。
- `N/A` 必须同时给「判定理由 + 复检触发条件」；无复检钩子的 N/A 视为「逃维」，补钩子或改 `partial`。详见 router「N/A 判定规则」。
- `partial`（性能维度）：整维证据不足但项目涉该能力时标 partial，不升 covered。

## §4 继续填充规则（指针 router）

新增 atom 必须同时更新四处（详见 router「继续填充规则」）：① 新建 `architect-{name}/SKILL.md`；② router 路由表+固定顺序登记；③ **本文件 §2 增加覆盖维度行**；④ `scripts/validate-contracts.mjs` + `tests/run-l1-tests.mjs` 增结构/路由/意图测试。
**修旧优先于加新**：新增 atom 前先核验现有 atom 是否兑现 covered 四要素（清单配修复 / 修复含验证末步 / 有独立交付段 / 风险分级引骨架）；裸问句/缺验证末步/缺交付段的 atom 须先还债再扩展。

## §5 校正记录（口径演进 changelog）

### 2026-09-05 · B 阶段 · TencentDB-Agent-Memory iter#3 实测真值校正
- **architect-agent（⑥，行 6）**：分布式模式表 Backpressure 行由「`max_size` 待实现」校正为真实四件套实现模式（worker-pool 并发上限 + buffer-storage + oversize-strategy + agent-task-queue）；检查清单新增「分层降维/压缩归档（L0→L1→compact→fast-path）」「worker-pool 并发上限+buffer+oversize 背压」两项。真值实测 file:行段：`worker-pool.ts:41-52`/`buffer-storage.ts:23-30`/`oversize-strategy.ts:18-24`/`agent-task-queue.ts:36-45`/`l0-recorder.ts:28-34`/`l1-extractor.ts:64-72`/`compressor.ts:90-98`/`fast-path.ts:17-20`（均 D3 核验存在✅）。
- **architect-observability（⑨，行 12）**：检查清单新增「telemetry 后端可插拔 factory + noop 降级」一项。真值实测：`factory.ts:49-60`（createObservabilityBackend switch type,默认 noop,internal 回退 console）/`noop-backend.ts:64-70`（NoopTraceBackend report=no-op）/`metric-tracking-{l1-latency,l2-latency,l3-latency,recall,runner}.ts`（5 后端）。
- **本文件（ARCHITECTURE-COVERAGE.md）**：原被 router L91（`../ARCHITECTURE-COVERAGE.md`）与 loop-dev PROJECT-ANALYSIS-TEMPLATE 引用但**文件缺失**（D4 断链）；本次补建为 16 行矩阵口径源，使引用可回溯。
- 完整校正验证报告：`output/loop-dev/2026-09-05/report.md`；本轮 tracker：`docs/iteration-tracker/loop-dev-2026-09-05.md`；金样 changelog：`output/golden/INDEX.md`。

### 2026-09-06 · B 阶段 round2 · adk-python+coze-loop+eino+librechat 10 candidate 实测真值校正（口径演进，非定级锚点变更）
- **architect-observability（⑩，行 12）**：检查清单 +2 项（OTel 标准语义约定 OpenInference/OpenTelemetry；trace exporter/路由多范式 SDK 直发/平台存储/collector 扇出+多租户隔离）；§2 要点补 3 点。真值三源 file:行段：google-adk `telemetry/tracing.py:196`+`sqlite_span_exporter.py:36`（SDK 端 OTel+SQLite exporter）/ coze-loop `infra/repo/ck/spans.go:52`+`lib/otel/open_inference/openinference.go:13`（平台 ClickHouse+OpenInference）/ librechat `otel/langfuse-fanout/otelcol.yaml:17`+`cmd/langfuse-fanout/main.go:613`+`metrics.go:138`（采集器 OTel collector 多租户路由+fanout metrics）。
- **architect-test（⑧，行 4）**：检查清单 +1 项（AI 输出评测框架：多 evaluator 类型 code/prompt/agent/custom_rpc + 实验运行 run/item/turn 状态机 + 多语言沙箱执行 + Redis SetNX 幂等）；此前清单仅传统单测/TDD，缺 AI 评测维度（真缺口）。§2 要点补 1 点。真值 file:行段：coze-loop `domain/entity/evaluator.go:53-58`（四类型）+`expt_run.go:40/56`（ItemRun/TurnRunState）+`execution_request.go:9/30`（SandboxExecutionRequest/RuntimeCapabilities）+`infra/runtime/manager.go:37`（GetRuntime 多语言）+`domain/component/idem/idem.go:12`（SetNX 幂等）；google-adk evaluation framework（multi-evaluator+eval 契约，部分 llm-as-judge model-gated）。
- **金样对照点**：NEW `output/loop-dev/2026-09-06/report.md`（B 阶段 round2 校正验证报告），与 2026-09-05/2026-08-25 并列对照演进；本轮口径演进（检查点新增），未改 risk-grading-scheme 定级锚点，仅记 changelog。
- 详细：`output/loop-dev/2026-09-06/report.md` + `docs/iteration-tracker/loop-dev-2026-09-06.md` + `output/golden/INDEX.md`。


### 2026-09-12 · 新增 architect-plugin 维度(软插拔/第三方插件化, 补 design 缺口)
- 触发: 用户指出架构师Skill缺'软插拔用户可安装Skill/插件'维度, 使用不提示. 参考 DSH cordis plugin-loader.
- 新增: architect-plugin/SKILL.md(8原则+检查清单+适配性判据+GitHub学习注入机制). router路由表+子技能+复合任务已登记. 本文件§2+第16行.
- 修复前测试: 结构合规9项PASS; 蜂群验证用 loop-dev 给插件化建议.

### 2026-10-09 · 新增 architect-context + architect-rag 维度，升级 architect-agent

- **architect-context（新增，行 18）**：上下文窗口预算/Tier分配；四层压缩(顺序: collapse先于compact)；Auto-Compact熔断器(连续3次)；Surface/Log分层；8段结构化摘要；token监控告警；压缩可逆性/trace重放。
- **architect-rag（新增，行 19）**：多路并行检索(≥2路: 语义+关键词)；RRF融合(k=60)；分层检索(mental_models>observations>raw_facts)；Cross-encoder重排；MMR多样性(λ=0.7)；嵌入质量评估；Consolidation合并+溯源；Graph检索(激活扩散+时间图)。
- **architect-agent（升级，行 6）**：检查清单新增「单一路径原则；Async Generator模式(backpressure+TerminalReason)；三段式状态分离(Config/State/Deps≤4)；死亡螺旋5层防护；错误恢复阶梯(5级)；多Agent编排(Fan-out/Saga/Map-reduce)」。
- router 路由表、复合任务表、固定分析顺序同步登记。
## §6 金样对照

`output/golden/` 为本矩阵+风险分级口径的金样回归基线（三项目 v2 报告）。新增/改模板后用同口径重评一项目产新日期报告，对照金样定级/触发条件/共病是否漂移；漂移=模板退化(修模板)或口径演进(新日期目录+更新金样锚点+记 §5 changelog)。

### 2026-10-01 · C 阶段 · Runtime2026 WebUI 展示系统架构能力增强
- **architect-frontend（⑩，行 10）**：新增"展示系统架构（Dashboard/Display System）专项"。
  - 蒸馏来源：`other_project/NextChat-main`（Next.js+React+react-router+zustand+clsx，前后端分离 + export 静态产物）与 `webui_skill/pick-ui-library`（recharts/liveline、Virtuoso、motion 等）。
  - 新增核验清单：FRO-08 六层分页（总览/币种/引擎/方案/回测/账户）；FRO-09 hash 路由深链接直达；FRO-0A 前后端分离只消费 REST+token 鉴权；FRO-0B 大表虚拟滚动+图表池懒实例化+节流刷新；FRO-0C 空/加载/错误三态；FRO-0D 展示层禁未来数据（红线）。
  - `guide.md` 增补"展示系统架构专项"一节；`contract.json` checklist 7 → 13 项。
- 对齐设计文档：`量化知识库/02_项目/lh-量化交易/PM/30-框架设计/2026-10-01-Runtime2026-WebUI展示系统架构设计.md`（六层嵌套路由 + 前后端分离 + 禁未来红线）。
- 本次校准：面向"多币种×多指标×多止盈方案"实时展示系统；已覆盖架构师技能欠缺的"展示系统结构评估"能力。

### 2026-10-20 · B 阶段 round3 · QwenLM/qwen-code cycle-8 实测真值校正
- **architect-agent（⑥，行 6）**：检查清单 +2 项（AGE-16 活性看门狗；AGE-17 上下文域工具策略门）；核心原则 13 -> 15。
  真值两源 file:行段：qwen-code `packages/core/src/agents/runtime/workflow-stall.ts:67,70,134,156-162,180-193,248-296`（挂钟看门狗：默认 180s / 仅 stall 重试；工具在飞挂起）；`packages/core/src/agents/runtime/subagent-plan-tool-policy.ts:18-34,43-45,94-105,139-153`（上下文域工具收窄 + 结果级阻断）。均 D3 核验存在✅。
- **loop 反向样本**：`git grep -i 'watchdog|heartbeat|idle_timeout' -- loop-engine/*.py` = 0 命中（真缺口）；A4 cycle-8 已回填 `loop-engine/stall_watchdog.py`（commit 549fb8c）。
- **本文件**：§4 校验器路径纯鏈修正（`tests/validate-architect-skills.mjs`（不存在）-> `scripts/validate-contracts.mjs` + `tests/run-l1-tests.mjs`）。
- 验证：`node scripts/validate-contracts.mjs`（19 atom，0 错 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：`output/loop-dev/2026-10-20/report.md` + `docs/iteration-tracker/loop-dev-2026-10-20.md` + `output/golden/INDEX.md`。

### 2026-10-22 · B 阶段 cycle-9（回溯补记）· coze-studio / lobehub-canary 实测真值校正
- **architect-agent（⑥，行 6）**：检查清单 +1 项（AGE-18 步骤级异常策略三态）；核心原则 15 -> 16。
  真值：coze-studio `backend/domain/workflow/internal/schema/node_schema.go:87-92` + `backend/domain/workflow/internal/compose/node_runner.go:620-643,777-780`（超时+重试+降级四元组；总尝试 = maxRetry+1；兜底路径盖 `isSuccess`；中断短路不消耗重试）。
- **architect-cost（⑩，行 10）**：检查清单 +1 项（COS-08 双窗配额快照 + 降级 + 幂等消费）；guide 原则 5 增补。
  真值：lobehub-canary `apps/desktop/src/main/modules/heterogeneousAgent/codexQuota.ts:18-20,115-122,348-374,613-641`（usedPercent 夹取 [0,100]、丢窗不补 0、抓取失败降级 error snapshot、强制幂等键跨传输复用 + 自带超时）。
- **loop 反向样本**：`git grep -n "apply_policy\|ExceptionPolicy" -- loop-engine/*.py` 当轮仅命中模块自身 → 机制已落、无调用点（登记为 G-5，cycle-10 接线闭合）。
- **回溯说明**：本条为 cycle-9 B 增量的**补记**——当轮漏记 §5（2026-10-22 cycle-10 一并补齐）；契约与验证结论未变，属文档完整性回填而非口径变更。
- 验证：`node scripts/validate-contracts.mjs`（19 atom，0 错 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。

### 2026-10-22 · B 阶段 cycle-10 · loop G-5/G-6/R1 接线回流
- **architect-agent（⑥，行 6）**：AGE-18 补强（**接线优先**：策略必须挂在真实单步调用点、默认档 = 单次+抛错与旧行为等价、兜底 `isSuccess` 只表执行完成**不得**升级为业务成功）；**新增 AGE-19**（单写者锁必须覆盖所有共享存储变更入口）；核心原则 16 -> 18。
- **architect-cost（⑩，行 10）**：COS-08 补强（`exhausted` 必须驱动循环停止判定、停机原因显式带 provider/next_reset_at；抓取失败降级**绝不停机**；以上次已知快照兜底；接线 opt-in）。
- **loop 反向样本**：`--once` 曾不持锁（只给长跑入口加锁 = 无锁）→ cycle-10 让 `CliRouter._run_once` 与长跑共用同一把 `.loop.lock`（冲突退 2，全退出路径释放）；`quota_window` 曾有机制无探针 → cycle-10 加 `Orchestrator.quota_probe` + `run_loop._quota_stop_reason`。
- 验证：`node scripts/validate-contracts.mjs`（19 atom，0 错 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：loop 仓 `docs/flow/2026-09-05-grand-loop-status.md` §13.35 + `docs/design/2026-10-22-cycle10-G56R1-connectivity.md`。

### 2026-10-22 · B 阶段 cycle-11 · N-1 无调用方机制门禁

- **architect-agent（⑥，行 6）**：**新增 AGE-20**（无调用方机制门禁：机制模块须有非测试调用方；白名单必须显式、可判活，陈旧豁免同样失败）；核心原则 18 -> 19。
  真值：loop cycle-11 新增 `scripts/check_orphan_mechanisms.py`（AST 判定机制模块 + 显式 EXEMPT 白名单 + 陈旧豁免失败）+ 接入 `scripts/run_gate.py`。
- **loop 反向样本**：门禁首次运行即命中两处 —— `loop-engine/loop_pipeline.py`（无任何调用方的被取代遗留 → 归档到 `loop-engine/_archive/`）；
  `loop-engine/tool_concurrency.py`（P1-1 批量调度机制，无生产调用点 → 显式豁免 + 追踪 N-2/I-2）。
  另修正 cycle-9 对 I-2 的口径错误：当时记「与 `tool_concurrency` 重叠、不采」，但 `tool_concurrency` 自身即为未接线机制（前提不成立）。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.36 + `docs/design/2026-10-22-cycle11-N123-orphan-gate-coze-candidates-quota-contract.md`。

### 2026-10-22 · B 阶段 cycle-12 · WeKnora 真值校正（RAG 重叠拼接）

- **architect-rag（⑩，行 rag）**：检查清单 8 → **9** 项（**新增 RAG-09** 重叠感知的保守文本拼接：
  完全包含折叠 / 有界后缀-前缀重叠去除（最短 12 码位、窗口上限 400）/ 极短子串不判包含 / 无重叠时保守保留分隔符）；
  `guide.md` 增「朴素拼接 → 重叠感知的保守合并」修复指南（含"不要按位置坐标裁剪"的失效说明）；`output_schema` type 增 `no_overlap_merge`。
  真值 file:行段：WeKnora `internal/searchutil/chunkmerge.go:15-45`（`JoinChunkContent`）、`:50-58`（`ContainsChunkContent` 短串不判包含）、
  `:87-94`（`minOverlapRunes = 12` / `defaultSearchSpan = 400`）、`:178-227`（`MergeTextChunks`）。
- **loop 反向样本**：`rag_layers.LayeredMemory._merge_text` 原实现只做「完全相同去重 + `' ∣ '` 拼接」，
  对包含/部分重叠无能为力（真缺口）→ cycle-12 A 回填 `loop-engine/text_merge.py` + `tests/test_text_merge.py`(16)，
  接线 `rag_layers._merge_text`（commit 见 loop 仓 §13.37）。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.37 + `docs/design/2026-10-22-cycle12-A-4src-distill.md`。

### 2026-10-22 · B 阶段 cycle-13 · 配额来源离线可注入（COS-08 补强）

- **architect-cost（⑩，行 cost）**：COS-08 补强 —— 配额来源必须能**离线注入**（文件探针 / 环境变量 / 宿主注入点），
  且**未配置时默认行为逐字节不变**（opt-in）；探针只"读 / 取数"，窗口语义映射与 fail-soft 降级仍归快照层；
  `guide.md` 核心原则 5 增注入补强段 + 新增修复指南「配额来源不可离线验证」。
- **loop 反向样本**：cycle-11 登记 N-3（真实额度源）为 blocked（本机无 SDK / 凭证）—— G-6 停止门已接线却无来源可测；
  cycle-13 A 落 `loop-engine/quota_file_probe.py`（`LOOP_QUOTA_FILE` 只读 JSON；文件缺失 = 探针抛错，由快照层降级），
  仅 2 行接入 `Orchestrator.__init__`；`tests/test_quota_file_probe.py`(32) 含两条端到端用例
  （env 关 = 3 轮不变；env 开 + 耗尽 payload = 第 0 轮干净停机）。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.38 + `docs/design/2026-10-22-cycle13-A-quota-file-probe.md`。

### 2026-10-22 · B 阶段 cycle-14 · 审计导出的端到端断言（新增 OBS-11）

- **architect-observability（⑩，行 observability）**：检查清单 10 → **11** 项（**新增 OBS-11** 审计/状态历史导出的端到端断言：
  产物真实存在 / 行数等于内存快照数 / 每行可机器解析 / 关键字段一致；并显式点名两类"未落地"——**不可达分支**
  （导出语句落在 return/raise 之后）与**伪序列化**（str(dict)/repr 当 JSON、手写字符串拼接））；
  `guide.md` 增检查清单行 + 口径演进注 + 修复指南「审计导出形同虚设」。
- **loop 反向样本（真值）**：loop cycle-14 实测 —— `run_loop.run()` 的 P3-A1 导出块写在 `return {...}` **之后**（不可达，
  `StateHistory.to_jsonl` 从未被调用，`iter_loop()` 也从无导出）；且该 writer 实现为
  `str(s.to_dict()).replace("'", '"')`（Python repr 拼"伪 JSON"），值里出现单引号即产出非法行。
  修复：提取 `_export_state_history()` 并在 `run()` 返回前 + `iter_loop()` 收尾处各调用一次；
  `to_jsonl` 改 `json.dumps(..., ensure_ascii=False, default=str)`；新增 `tests/test_state_history_export.py`(7，
  产物存在/行数/可解析/源侧 tripwire) + `test_to_jsonl_is_valid_json_even_with_quotes`。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.39 + `docs/design/2026-10-22-cycle14-C-state-history-export.md`。

### 2026-10-22 · B 阶段 cycle-15 · 多步管线审计须覆盖全部短路分支（新增 OBS-12）

- **architect-observability（⑩，行 observability）**：检查清单 11 → **12** 项（**新增 OBS-12** 多步管线/状态机/执行链的审计记录须覆盖全部短路分支：
  审计步骤集合恰好止于短路步 / 短路步 status 与 detail 可判读 / 终态不为成功 / 副作用未发生；happy path 另断言步骤编号与名称全序完整）；
  `guide.md` 增检查清单行 + 口径演进注 + 修复指南「多步管线的审计只看 happy path」。
- **loop 反向样本（真值）**：loop cycle-15 实测 —— `tool_pipeline.ToolPipeline.execute()` 的 14 步管线中，原先只有 happy path 与
  step-10（G-5 步异常策略）有断言；`step1 查无 / step2 abort / step3 schema 拒绝 / step8-9 权限拒绝 / step7 前置 hook 抛错 /
  step10 回退路径`以及 `ToolOrchestrator`、`create_pipeline` 两个适配器全部无测试（该模块覆盖率仅 64%）。
  补 `tests/test_tool_pipeline_contract.py`（25 例）后覆盖率 **64% → 99%**（仅剩已生效的 sys.path bootstrap 行），
  并钉死两条安全不变量：**权限拒绝不得被记为 completed**、**短路后不得继续执行后续步**。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`（L1 全绿）。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.40 + `docs/design/2026-10-22-cycle15-A-tool-pipeline-contract.md`。

### 2026-10-23 · B 阶段 cycle-16 · 伪测试纳入门禁 + 协作接缝多调用点（新增 TES-11 / AGE-21）

- **architect-test（⑧，行 test）**：检查清单 10 → **11** 项（**新增 TES-11**：测试/契约文件必须被门禁实际收集，收集数 ≠ 0；
  脚本式伪测试（`def main()` + `__main__` 守卫、无顶层 `def test_*`/`class Test*`）会被 pytest 静默收集 0 个测试 →
  加薄入口 `def test_<name>(): main()` + 元测试（AST 扫描）防复发）；`guide.md` 增检查清单行 + 口径演进注。
- **architect-agent（⑨，行 agent）**：检查清单 20 → **21** 项（**新增 AGE-21**：同一协作接缝的多个调用点都必须有等价契约断言，
  防接口重命名漂移；`guide.md` 增 cycle-16 实测增补节 + 原则 20）。
- **loop 反向样本（真值）**：loop cycle-16 实测 —— ① 6 个 `tests/test_*.py` 实为脚本式伪测试（约 630 行断言），
  pytest 对它们报 `no tests ran`，`run_gate.py` 从未执行过这些断言；② 把这些断言纳入门禁后**立刻**暴露出
  `tool_registry.dispatch()` 的权限门调用点调用早已不存在的 `.check()`（应为 `check_tool_call`）——
  任何 `set_permission()` 之后的 dispatch 必抛 `AttributeError`，7 级权限门形同虚设（该分支因无测试而长期隐藏）。
  修复 + 补契约后：`tool_registry.py` 65% → **100%**、`tool_concurrency.py`（EXEMPT 参考实现）0% → **100%**
  （`tests/test_tool_registry_contract.py` 28 例 + `tests/test_tool_concurrency_contract.py` 19 例 +
  `tests/test_gate_collection_tripwire.py` 2 例）。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.41 + `docs/design/2026-10-23-cycle16-A-gate-collection-and-permission-seam.md`。

### 2026-10-23 · B 阶段 cycle-17 · 门禁自证（新增 TES-12 / TES-13 / AGE-22）

- **architect-test（⑧，行 test）**：检查清单 11 → **13** 项（**新增 TES-12** 收集扫描须覆盖 pytest 全部可收集命名与深度——`test_*.py` + `*_test.py` 且递归；**新增 TES-13** 登记基线数字须与实测运行对照（单向棘轮：实测 < 登记即失败，摘要解析失败亦失败）；`guide.md` 增 2 行检查清单 + 口径演进注 + cycle-17 实测增补节）。
- **architect-agent（⑨，行 agent）**：检查清单 21 → **22** 项（**新增 AGE-22** 门禁/守护脚本必须被行为验证——import 后跑到每条判定分支，源码 grep 式断言不算验证；`guide.md` 增检查清单行 + 口径演进注 + cycle-17 实测增补节 + 原则 21；`SKILL.md` 摘要表补第 20/21 行并把"19条核心原则"校正为 21 条——该表自 cycle-16 起就落后于 contract）。
- **loop 反向样本（真值）**：loop cycle-17 实测 —— ① 门禁接线只用源码 grep 断言守护（`assert "check_orphan_mechanisms" in src`），把检查挪到 `return 0` 之后仍全绿；`run_gate.py` 主体（`main()` / `_triggered()` / `_parse_fail_under()`）从未被任何测试执行过，且 `scripts/` 不在覆盖率分母内；② `docs/baseline.json` 的 `passed`/`coverage` 从未与实测对照（只与文档互校）＝可静默删测试（`fail_under=70` 与实测 77.57% 之间 7.6pt 缓冲足以吸收）；③ cycle-16 的收集 tripwire 用非递归 `glob('test_*.py')`，`*_test.py` 与子目录文件可整体绕过。
  修复：`run_gate.py` 增「实测 vs 登记」单向棘轮（`parse_pytest_summary` + `baseline_violations`，捕获 pytest 输出并复用同一摘要再原样转发）+ `scripts/docs_baseline.py` docstring 去硬编码旧口径 + 新增 `tests/test_gate_self_verification.py`（20 例，覆盖缺依赖/棘轮下降/测试红灯/文档漂移/登记落后 5 条 fail 路径）+ tripwire 改 `rglob` 双命名并加扫描器自证用例（4 例）+ 新增 `tests/test_orchestrator_cli_surface.py`（21 例）。
  结果：`orchestrator.py`（被 orphan 门禁误列为 test_only 的 CLI 入口）53% → **86%**；全量 1542 → **1586 passed**，coverage 77.57% → **78.73%**。
- 验证：`node scripts/validate-contracts.mjs`（19 atom / 0 错 / 0 警）+ `node tests/run-l1-tests.mjs`（32 passed）。
- 详细：loop `docs/flow/2026-09-05-grand-loop-status.md` §13.42 + `docs/design/2026-10-23-cycle17-A-gate-self-verification.md`。

### 2026-10-23 · B 轮 cycle-18 · 提交链自证（TES-14 / DOC-06）

- **architect-test（test 维）**：检查清单 13 → **14**，新增 **TES-14** —— 文档/指针里的提交链与哈希引用必须被机器校验
  （存在性 + 标注一致 + 跨源 `head` 交叉），守卫须有负例自证与覆盖度自证，且查询要批量化不拖慢门禁。
- **architect-docs（docs 维）**：检查清单 5 → **6**，新增 **DOC-06** —— 文档中的机器可读引用（提交哈希 / 版本号 /
  基线数字 / 配置键名）必须有校验器并与单一事实源交叉；禁止只靠人工同步。
- **loop 回写动机**：loop cycle-18 发现 `docs/flow/GRAND-LOOP.md` 的提交链把 cycle-16 A 记成 `710a3af`
  （实为 cycle-17 A）、真哈希 `a09421a` 全文 0 次出现，而没有任何门禁报警。三连：cycle-16 修"被漏掉的测试"、
  cycle-17 修"门禁自身没人验证"、cycle-18 修"唤醒指针的提交链没人验证" —— 同族缺陷：**记录 vs 真值**。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警**；`node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-23 · B 轮 cycle-19 · 缺陷引用不得伪装成声明（TES-15）

- **architect-test（test 维）**：检查清单 14 → **15**，新增 **TES-15** —— 文档里的"负例/缺陷引用"必须与机器可读的
  声明形态可区分（禁止把错值照抄成 `` `hash`(cycle-N …) ``），且全仓扫描须覆盖设计文档 / status / 交接记录，
  带覆盖度自证与负例自证。
- **loop 回写动机**：loop cycle-18 修好了"提交链 vs git 真值"，但 cycle-18 的**缺陷描述**在设计文档 / status §13.43 /
  工作记录里原样复制了错哈希的声明形态，全仓扫描立刻在 3 处复现同一个假声明 —— 修完"记录错了"还要修
  "记录里写着那个错"。三连族：cycle-16 被漏掉的测试 → cycle-17 门禁自身 → cycle-18 提交链 → cycle-19 缺陷引用的形态。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警**；`node tests/run-l1-tests.mjs` → **32 passed**。
### 2026-10-23 · B 轮 cycle-20 · 幽灵哈希（正文散文 / 箭头链）（TES-16 / DOC-07）

- **architect-test（test 维）**：检查清单 15 → **16**，新增 **TES-16** —— 正文散文里的哈希引用必须机器校验（存在性 + 箭头链同仓拓扑），负例自证须覆盖「带反引号的箭头链」这一形态。
- **architect-docs（docs 维）**：检查清单 6 → **7**，新增 **DOC-07** —— 正文哈希引用（含箭头链）必须可解析，禁止只靠人工同步。
- **loop 回写动机**：loop cycle-20 三仓交叉取证命中 **3 个幽灵哈希** —— `docs/flow/GRAND-LOOP.md` L53 的 ❌错记 `11588a1`（真值 `11542a1`）、cycle-14 设计文档的 ❌错记 `a67594c`（真值 `a67594e`）、status §13.9 的 ❌错记 `8cf9d4c`（真值 `eb9f4b6`）。cycle-18/19 只守住声明形态与唤醒指针区块，正文散文与 `A→B→C` 箭头链完全裸奔。四连族：cycle-16 被漏掉的测试 → cycle-17 门禁自身 → cycle-18 提交链 → cycle-19 缺陷描述复刻形态 → cycle-20 正文/箭头链。
- **A2 自查**：守卫自证探针发现 `ARROW_RUN_RE` 只认裸哈希 → 带反引号的箭头链整段漏检（修：匹配前展平反引号，两处）。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警**；`node tests/run-l1-tests.mjs` → **32 passed**。


### 2026-10-24 — B 轮（cycle-21 — 裸写提交哈希的机器校验 + 外部源仓 pin 登记；TES-17 / DOC-08）

- **architect-test（test 维度）**：检查清单 16 → **17**，新增 **TES-17** —— 正文/指针里**裸写**（不带反引号）的提交哈希也必须被机器校验（同行 git 上下文门控 + 外部源仓 pin 登记）。反例：loop cycle-21 发现唤醒指针路径行与 registry 提交列的 **79 个唯一裸 token（179 处）** 从未被任何守卫看过；cycle-20 只扫反引号哈希与箭头链。
- **architect-docs（docs 维度）**：检查清单 7 → **8**，新增 **DOC-08** —— 文档正文里裸写的提交哈希也必须有校验器保证可解析，禁止只靠人工。
- **loop 侧闭环**：`tests/test_wake_pointer_chain.py` 16 → **20** 例（裸哈希上下文门控、全 hex 英文词不误报、摘要行跳过、外部源仓 pin 解析）。
- **新增类别**：**外部源仓 pin**（`SOURCE.md` 的 `TencentDB-Agent-Memory@2ee2239`）——它在本项目任何仓都解析不出，必须登记 checkout 后才能校验，否则裸扫会把真 pin 误判为幽灵（实测的第一个假阳性）。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警**；`node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-24 — B 轮（cycle-22 — 跨仓账本扫描：分类器与边界；TES-18 / DOC-09）

- **architect-test（test 维度）**：检查清单 17 → **18**，新增 **TES-18** —— 多语料账本扫描必须区分「真错」与「合法不可解析值」，逐类给出可复现的排除规则（数据指纹 / 运行时对象 id / 被 amend 掉的中转提交 / 外部仓基线 / 守卫自身示例），解析不出的默认仍是 fail-closed 幽灵；分类器禁止接入门禁。
- **architect-docs（docs 维度）**：检查清单 8 → **9**，新增 **DOC-09** —— 文档里的提交引用校验要写明「扫哪些语料、哪些语料不算账本」，并对跨语料不可解析值给出分类取证规则。
- **loop 侧闭环**：`tests/test_wake_pointer_chain.py` 20 → **27** 例（全长度哈希解析 / 带分隔符的摘要标签 / 分类器三类排除 + 两个反方向自证）；新增 `scripts/audit_cross_repo_ledger.py` 复现跨仓扫描（取证报告工具，不进 pytest 门禁）。
- **实测**：legacy `loop-dev` 2300 篇 shipped `.md` → 20 处 finding（runtime-id 6 / fingerprint 14）；architect-skills 86 篇 → 9 处（registered-external 9）；**幽灵提交 0**（unexplained 0，脚本 exit 0）。
- **第 7 例同族缺陷**：守卫示例 token 被逐字复刻（本仓 architect-test/guide.md 的 defaced / effaced / abc123d）→ 已修（去掉代码跨度，语义更准）。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警**；`node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-24 · B 轮 cycle-23 · 交付的验证器本身必须被验证（TES-19 / DOC-10）

- **architect-test（test 维度）**：新增第 18 → **19** 条 —— **TES-19** 交付的验证器/取证工具本身必须被验证：判定的 exit code 与手写登记表必须有测试直接断言，单测只扫合成语料，登记表条目一旦开始可解析即 FAIL。
- **architect-docs（docs 维度）**：新增第 9 → **10** 条 —— **DOC-10** 文档必须写明验证器的「判定由哪条测试断言」，手写登记表不可静默腐烂。
- **loop 回写**：`tests/test_wake_pointer_chain.py` 27 → **30** 例，直接驱动 `scripts/audit_cross_repo_ledger.py`：未解释幽灵 → exit 1、全部可解释 → exit 0、REGISTERED_UNRESOLVABLE 每条仍解析不出；全量 1615 → **1618 passed**。
- **第 8 例同族缺陷**：cross-repo 取证脚本交付时 0 覆盖、exit code 无人断言——「交付了验证器」≠「验证器被验证」。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-24 · B 轮 cycle-24 · 校验器的作用域本身必须被校验（TES-20 / DOC-11）

- **architect-test（test 维度）**：新增第 19 → **20** 条 —— **TES-20** 文档一致性校验的**作用域**（手写校验清单）本身必须被校验：入口文档不得被排除，清单要被断言，改坏入口文档必须 FAIL。
- **architect-docs（docs 维度）**：新增第 10 → **11** 条 —— **DOC-11** 文档一致性校验必须写明并覆盖「入口文档」。
- **loop 回写**：`docs_baseline.CHECK_FILES` 纳入 `docs/flow/GRAND-LOOP.md`；`tests/test_gate_self_verification.py` 23 → **26** 例（清单覆盖断言 + 合成仓漂移自证 + 真实仓断言）；全量 1618 → **1621 passed**。
- **第 9 例同族缺陷**：wake pointer 引用的基线数字无人校验——「最该被信任的文件恰恰没人查」。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-24 · B 轮 cycle-25 · 导航标号（§13.N 指针）必须被机器校验（TES-21 / DOC-12）

- **architect-test（test 维度）**：新增第 20 → **21** 条 —— **TES-21** 『指向最新状态 / 下一步』的导航标号必须被机器校验：指针等于注册表最新小节号，注册表编号连续无重复，指针缺失 / 注册表为空即 fail-closed。
- **architect-docs（docs 维度）**：新增第 11 → **12** 条 —— **DOC-12** 文档里的『最新状态 / 下一步』标号必须被机器校验。
- **loop 回写**：`tests/test_wake_pointer_chain.py` 30 → **34** 例（指针 = 注册表最新 / 注册表连续无重复 / 过期指针自证 / 重号缺号自证 / 指针缺失自证）；全量 1621 → **1625 passed**。
- **第 10 例同族缺陷**：GRAND-LOOP.md 的『下一目标 §13.N』指针无人校验——过期指针会把下一个执行者引到旧清单。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-24 · B 轮 cycle-26 · 一致性校验必须区分『当前态』与『历史态』（TES-22 / DOC-13）

- **architect-test（test 维度）**：新增第 21 → **22** 条 —— **TES-22** 一致性校验必须区分『当前态』与『历史态』：当前态数字唯一等于基线，历史数字必须带锚点（日期 / cycle-N / 「历史」），锚点作用域是数字所在的块，步进计数不纳入。
- **architect-docs（docs 维度）**：新增第 12 → **13** 条 —— **DOC-13** 历史数字必须带锚点，当前态数字唯一等于基线。
- **loop 回写**：`scripts/docs_baseline.py` 新增块级锚点规则（`blocks()` + `unanchored_suite_counts()`）；`docs/loop-dev-AS-BUILT.md` / `docs/loop-dev-ROADMAP.md` 补 7 处「历史快照」标注；`tests/test_gate_self_verification.py` 26 → **33** 例；全量 1625 → **1632 passed**。
- **第 11 例同族缺陷**：文档一致性校验只断言「基线数字出现过」，历史数字从不要求标注——旧数字与现值并排，读者会当真。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-24 · B 轮 cycle-27 · 识别器的字母表不得窄于它审计的现实（TES-23 / DOC-14）

- **architect-test（test 维度）**：新增第 22 → **23** 条 —— **TES-23** 引用识别口径（哈希字母表 7..40、全 / 半角括号、括号前可有空白）必须统一，识别到的引用必须在真实来源仓解析；口径窄于现实 = 记录被静默丢弃，而下限断言仍绿。
- **architect-docs（docs 维度）**：新增第 13 → **14** 条 —— **DOC-14** 引用必须被统一口径识别、来源可解析、轮次标注一致；漏扫（假阴性）与误报（假阳性）都算违规。
- **loop 回写**：`tests/test_wake_pointer_chain.py` 新增单一口径常量 `HASH_SRC`（`ENTRY_RE` / `HEAD_RE` / `CLAIM_RE` 共用）、全 / 半角括号 + 可选空白、`claim_problems` 跨仓解析、head 指针按提交前缀比较；34 → **44** 例；全量 1632 → **1642 passed**。
- **第 12 例同族缺陷**：链条目 / head 指针 / 哈希声明三个解析器各自硬编码 7 位哈希，而幽灵规则已用 7..40；`docs/flow/2026-09-05-grand-loop-task.md` 的全角括号声明 0 识别器可见，且其提交只在历史仓——即便看见也会被误报为幽灵。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-25 · B 阶段 cycle-29 · 安全护栏的行为面必须被独立驱动（TES-24 / DOC-15）

- **architect-test（test 维度）**：新增第 23 → **24** 条 —— **TES-24** 护栏行为面：矩阵每条规则要有见证命令，三个出口（allow / deny / escalate）分别断言，拒绝渲染必须与真实原因一致（策略拒绝 ≠ 路径越界），已知边界显式登记，且要有「补一条命不中的规则必红」的自证。
- **architect-docs（docs 维度）**：新增第 14 → **15** 条 —— **DOC-15** 护栏行为契约：见证、出口语义（escalate 未接线等同 deny）、拒绝渲染口径、已知边界都要写清，结论可被命令复核。
- **loop 回写**：`tests/test_guardian_gate.py` 新增「arg_rule 见证可达性表」（规则集必须与见证表一一对应）、下载管道由 `_HIGH_RISK_PATTERNS` 兜底、空格路径边界登记、escalate fail-closed + escalation_level 标注；`tests/test_runtime_artifact_containment.py` 新增 8 例（运行产物与锁路径必须服从 runtime.root）。16 → **36** 例；全量 1668 → **1682 passed**。
- **第 13 例同族缺陷**：护栏从未被行为驱动 —— `risk_assessor` 词边界关键字扫整条命令串，运行根含 `-eval-` 即全拒（假阳性）；`permission_matrix` 的 `sudo ` / `chmod 777` / `nc -l` 精确等值永不命中（假阴性）；策略拒绝渲染成 `guardian . escapes runtime root .`（误归因）。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。

### 2026-10-25 · B 阶段 cycle-30 · 产出的证据引用必须落到真实文件（TES-25 / DOC-16）

- **architect-test（test 维度）**：新增第 24 → **25** 条 —— **TES-25** 自动生成的证据引用（`file:line:`）在产物写出时必须能解析到真实文件：相对引用按产物目录解析、跨盘用绝对路径、无快照则自引；产物自带的自校验必须校验**存在性**（且需解析锚点），只 grep 标签的自校验对断链失明；自证 = 把引用指向不存在的文件必须变红。
- **architect-docs（docs 维度）**：新增第 15 → **16** 条 —— **DOC-16** 文档 / 报告的证据引用必须可落地：无同目录快照时显式自引，禁止宣称不存在的 `data/`；宣称「报告自带校验」时必须写明它校验存在性而非标签。
- **第 14 例同族缺陷（D-R1）**：`--report` 的带日期客户报告把 §2 六行证据写成 `file:line: data/rounds.json:1`，而报告旁从不写 `data/`（快照在 runtime 树）；自校验 `validate_risk_evidence` 只匹配 `ref:` / `file:line:` 标签，对断链 100% 失明 → 一份「看起来很干净」的报告把取证 agent 指向不存在的文件。
- 验证：`node scripts/validate-contracts.mjs` → **19 atom / 0 错 / 0 警** + `node tests/run-l1-tests.mjs` → **32 passed**。
