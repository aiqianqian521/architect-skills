# 金样索引（Golden Samples Index）

> 本目录是 architect-skills 输出模板的**回归基线**。每次评估输出可对照金样，确认输出协议（结论/证据/风险分级/下一步）、风险分级口径（scheme）、横评契约（input-format）一致。设计参考：cspm_agent `skill-*/output/` 多时间戳实例 + 金样文件引用。
> 金样来源：2026-08-25 三项目 v2 全新分析，统一存放于 `output/{项目}/{日期}/report.md`。

## 输出目录约定（统一）

- **单项目分析** = 一份完整自包含 MD，路径 `output/{项目名}/{YYYY-MM-DD}/report.md`（同项目不同日期重评 = 不同日期目录）。
- **跨项目横评** = `output/cross-project/{YYYY-MM-DD}/cross-assessment.md`。
- renderer（`scripts/render-report.cjs`）按此约定落盘：`node render-report.cjs input.json --out output/{项目}/{日期}/report.md`。
- 反评（skills 自评）非项目输出，留 `docs/`。

## 金样清单

| 金样 | 路径 | 对应模板层 | 验证的输出规则 |
|---|---|---|---|
| 单项目报告-A（cspm-agent） | [../cspm-agent/2026-08-25/report.md](../cspm-agent/2026-08-25/report.md) | L2 单项目 | 15维覆盖矩阵 + 行级证据(U0) + N/A带复检(U1) + 风险分级引scheme触发条件 |
| 单项目报告-B（loop-dev） | [../loop-dev/2026-08-25/report.md](../loop-dev/2026-08-25/report.md) | L2 单项目 | 同上；另验证 review 维"两种失效模式"区分(评而不修) |
| 单项目报告-C（runtime01201） | [../runtime01201/2026-08-25/report.md](../runtime01201/2026-08-25/report.md) | L2 单项目 | 同上；critical security 触发条件①明文密钥(金样级 critical) |
| 单项目报告-v3（五段结构） | [../cspm-agent/2026-08-26/report.md](../cspm-agent/2026-08-26/report.md) | L2 单项目·五段 | ①架构地图 ②维度矩阵 ③逐skill详析 ④cspm统计汇总 ⑤C/H改进方案；覆盖矩阵/统计由结构化输入计算，narrative 只写结论 |
| 跨项目横评 | [../cross-project/2026-08-25/cross-assessment.md](../cross-project/2026-08-25/cross-assessment.md) | L3 横评 | input-format 三件套(共病/区分度/基线) + 共病≥2项目 + 单项目不可见发现(C复刻B) |
| 修复后反评 | [../../docs/architect-skills-postrepair-evaluation.md](../../docs/architect-skills-postrepair-evaluation.md) | 元评估 | 修复点实测矩阵 + 虚假确定性自查 + v2 vs v1 差异证据 |

## 回归用法

新增/改动 architect-skills 输出模板后：
1. 用同样口径重评一个项目，产出新报告（落 `output/{项目}/{新日期}/report.md`）
2. 对照同层金样：风险分级等级是否一致？触发条件引用是否齐全？共病判定是否 ≥2 命中？
3. 若金样定级与新输出漂移，either 模板退化（修模板）either 口径演进（新日期目录 + 更新金样锚点，记录原因）

## 金样定级锚点（供回归对照）

- C `critical` = security 触发 `scheme §一①`（明文密钥入库）—— 任何项目命中此条必 critical，不豁免
- A `critical` = ops×git×security 触发 `scheme §一④`（变更管控失灵致 `$(true)`/垃圾入库）
- B `critical` = design 触发 `scheme §一①godfile>800`（orchestrator 3628 行）
- 三项目共病"目录卫生+变更管控" = `scheme §一④` 批量命中 → 共病严重度 high
- C 复刻 B loop-engine = 横评特有发现（单项目不可见）→ 验证 U2 不可删

## 维护规则

1. 金样不轻易改（改=口径演进，须记 changelog）
2. 每轮大修后追加新金样（新日期目录，保留旧金样对照演进）
3. 金样用相对链接指向 `output/{项目}/{日期}/report.md`（不复制内容，避免双份维护）

## 口径演进 changelog

### 2026-09-05 · B 阶段 · TencentDB iter#3 实测真值校正（口径演进，非定级锚点变更）
- **architect-agent(⑥)**：分布式模式表 Backpressure 行「`max_size` 待实现」→ 真实四件套(worker-pool+buffer+oversize+task-queue)；检查清单 +2 项（分层降维/压缩归档、worker-pool 背压）。真值 `worker-pool.ts:41-52`/`buffer-storage.ts:23-30`/`oversize-strategy.ts:18-24`/`agent-task-queue.ts:36-45`/`l0-recorder.ts:28-34`/`l1-extractor.ts:64-72`/`compressor.ts:90-98`/`fast-path.ts:17-20`。
- **architect-observability(⑨)**：检查清单 +1 项（telemetry 后端可插拔 factory + noop 降级）。真值 `factory.ts:49-60`/`noop-backend.ts:64-70`/`metric-tracking-{l1-latency,l2-latency,l3-latency,recall,runner}.ts`。
- **ARCHITECTURE-COVERAGE.md**：architect-skills 根补建（16 行矩阵 §2），原 router L91 `../` 自指根的引用断链闭合；loop-dev PROJECT-ANALYSIS-TEMPLATE 路径统一指向根（v1.6）。
- **金样对照点**：NEW `output/loop-dev/2026-09-05/report.md`（B 阶段校正验证报告），与本目录既有金样(2026-08-25 三项目 v2)并列对照演进；本轮为**口径演进**（检查点校正+断链修复），**未改 risk-grading-scheme 定级锚点**，故不新增定级锚点行，仅记 changelog。
- 详细：`output/loop-dev/2026-09-05/report.md` + `docs/iteration-tracker/loop-dev-2026-09-05.md`。
### 2026-09-06 · B 阶段 round2 · adk-python+coze-loop+eino+librechat 10 candidate 实测真值校正（口径演进，非定级锚点变更）
- **architect-observability（⑩，行 12）**：检查清单 +2 项（OTel 标准语义约定 OpenInference/OpenTelemetry；trace exporter/路由多范式 SDK 直发/平台存储/collector 扇出+多租户隔离）；§2 要点补 3 点。真值三源 file:行段：google-adk telemetry/tracing.py:196+sqlite_span_exporter.py:36（SDK 端 OTel+SQLite exporter）/ coze-loop infra/repo/ck/spans.go:52+lib/otel/open_inference/openinference.go:13（平台 ClickHouse+OpenInference）/ librechat otel/langfuse-fanout/otelcol.yaml:17+cmd/langfuse-fanout/main.go:613+metrics.go:138（采集器 OTel collector 多租户路由+fanout metrics）。
- **architect-test（⑧，行 4）**：检查清单 +1 项（AI 输出评测框架：多 evaluator 类型 code/prompt/agent/custom_rpc + 实验运行 run/item/turn 状态机 + 多语言沙箱执行 + Redis SetNX 幂等）；此前清单仅传统单测/TDD，缺 AI 评测维度（真缺口）。§2 要点补 1 点。真值 file:行段：coze-loop domain/entity/evaluator.go:53-58（四类型）+expt_run.go:40/56（ItemRun/TurnRunState）+execution_request.go:9/30（SandboxExecutionRequest/RuntimeCapabilities）+infra/runtime/manager.go:37（GetRuntime 多语言）+domain/component/idem/idem.go:12（SetNX 幂等）；google-adk evaluation framework（multi-evaluator+eval 契约，部分 llm-as-judge model-gated）。
- **金样对照点**：NEW output/loop-dev/2026-09-06/report.md（B 阶段 round2 校正验证报告），与 2026-09-05/2026-08-25 并列对照演进；本轮口径演进（检查点新增），未改 risk-grading-scheme 定级锚点，仅记 changelog。
- 详细：output/loop-dev/2026-09-06/report.md + docs/iteration-tracker/loop-dev-2026-09-06.md + output/golden/INDEX.md。

### 2026-10-20 · B 阶段 round3 · QwenLM/qwen-code 实测真值校正（口径演进，非定级锚点变更）
- **architect-agent（⑥，行 6）**：检查清单 +2 项——AGE-16 活性看门狗（挂钟无进展中止 + 工具在飞挂起计时 + 仅 stall 重试）、AGE-17 上下文域工具策略门（按上下文收窄工具面 + 结果级阻断）；核心原则表 13 -> 15。真值两源：qwen-code workflow-stall.ts:67,70,134,156-162,180-193,248-296；subagent-plan-tool-policy.ts:18-34,43-45,94-105,139-153。
- **loop 落地**：活性看门狗已 A4 cycle-8 回填（`loop-engine/stall_watchdog.py` + 18 例，commit 549fb8c，run_gate PASS 1310/73.23%）。
- **金样对照**：NEW `output/loop-dev/2026-10-20/report.md`（B 阶段 round3 校正验证报告），与 2026-08-25/09-05/09-06 并列对照演进；本轮为口径演进（检查点新增），未改 risk-grading-scheme 定级锚点，仅入 changelog。
- 详细：`output/loop-dev/2026-10-20/report.md` + `docs/iteration-tracker/loop-dev-2026-10-20.md` + `ARCHITECTURE-COVERAGE.md §5`。
