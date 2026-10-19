# loop-dev full-L2 增量复评报告（C 阶段 round2 · 2026-09-06）

> 项目：loop-dev（E:/业余/my/loop-dev，分支 codex/w0-w2，HEAD 25e3fe6→dea7375，780 passed/1 skipped/cov72.27% 稳定）
> 评估口径：B 阶段 round2 修正后的 architect-skills 16 维（architect-observability ⑩ +2 子项: OTel 标准语义约定 / trace exporter 路由多范式；architect-test ⑧ +1 子项: AI 输出评测框架）+ risk-grading-scheme §一触发条件。
> 性质：**full-L2 增量复评**（大循环 C 阶段 round2）。B-round2 ⑩⑧ 检查点变丰富后对 loop-dev 的增量复评；其余 14 维 C2(2026-09-05 l2-evaluation.md) 已评且自其后 loop 代码未变（M1-1 脚手架完成于 C2 前 + 自此 docs/Russell）。基线 C2 覆盖矩阵: 9 covered/4 partial/1 missing/3 N-A。蜂群评估范围=clamp（C2 已定: 现有并行断言 ThreadPoolExecutor ooda_pipeline + gated E4/E5）。

## ① 本轮复评范围（⑩⑧ 增量）
C2 后 loop-dev code 未改（仅 2026-09-05 C2 的 C3-1 ratchet + 自此 docs-only/Russell；M1-1 脚手架完成于 C2 前）。故本轮只复评 B-round2 新增的 ⑩⑧ 子项对 loop-dev 的影响；其余 14 维状态沿用 C2，不重列（覆盖矩阵见 C2 l2-evaluation.md §②）。

## ② ⑩⑧ 子项复评矩阵
| # | 维度·子项（B-round2 新增） | 状态 | 主skill | 证据(file:line/file) | 风险(scheme§一) |
|---|------|------|--------|----------------|---------------|
| ⑩-9 | OTel 标准语义约定（OpenInference/OpenTelemetry LLM span 语义 text/image/reasoning/tool_call/tool_call_response） | **missing** | observability | loop-engine/telemetry.py TraceBackend.report_span(*, trace_id, name, **fields) 为自定义 fields kwargs；**grep `SpanKind|OpenInference|OpenTelemetry|otel|llm_|tool_call` telemetry.py = 0 hit**；M1-1 仅 factory+noop 脚手架，无 span 语义模型 | **medium⑤⑥**（并入 M1-2，提精度不提级，非新独立缺口） |
| ⑩-10 | trace exporter/路由多范式（SDK 直发 / 平台落盘 / collector 扇出多租户隔离） | **missing** | observability | telemetry.py `_BACKENDS = {noop, none, console}`；create_backend 无 OTLP/SQLite 直发 exporter / 无平台落盘 / 无 collector 扇出+多租户路由；**grep `exporter|OTLP|SQLite|collector|routing|tenant` telemetry.py = 0 hit** | **medium⑤⑥**（并入 M1-2，同上） |
| ⑧-8 | AI/Agent 输出评测框架（eval sets + 多 evaluator 类型 + 实验运行状态机 + 评测沙箱 + SetNX 幂等） | **partial / scope-N-A-for-now** | test | loop-dev 有比例轻量评测: verifier.py(成功准则契约)+l2_analyzer.py(L2 自评)+golden(test_final_5)+run_reporter.py+signal_pool.py；resume/self-modify 幂等已由 run_lock/resume_guard/migrations v004|v005 实现（grep `idempoten` 命中均为 resume/self-modify 异域，非 eval SetNX）。缺: 多 evaluator 类型抽象(code/prompt/agent/custom_rpc)+实验 run/item/turn 三级状态机+eval-code 多语言沙箱+Redis SetNX 防重跑 | **low**（比例评测 partial；全套=scope-N-A-for-now，见③详析） |

## ③ 缺口详析（增量）

### ⑩ enrichment → M1-2 scope 扩展（medium⑤⑥，并入既有 M1 项）
- 证据：telemetry.py(M1-1, commit 1fb4846)=TraceBackend protocol + NoopTraceBackend + ConsoleTraceBackend + create_backend factory（满足 ⑩ 子项3 factory+noop，C2/B-round1 已闭合）；⑩-9 OTel 语义约定 + ⑩-10 exporter 路由范式均 missing（grep 0 hit 实测）。
- 影响：B-round2 ⑩ 检查点变丰富后，M1（⑩可观测 missing，medium，自 C2）的闭合标准提升——M1-2 不止 trace_id 传播+metrics 后端，还须: (a) span 用 OTel/OpenInference 标准语义约定(SpanKind/llm.*/tool_call 等)；(b) 选 exporter 路由范式(SDK 直发/平台落盘/collector 扇出；单机 loop 倾向 SDK 直发或 noop)。
- 修复: M1-2 拆有序子切片——M1-2a(span 语义约定模型: SpanKind+标准属性+build_span_fields helper，additive 测试，对齐 M1-1 范式)→M1-2b(trace_id 传播入 RoundContext/run_loop 热路径 + 一次 opt-in noop-default span emit)→M1-2c(选 exporter 路由范式 + metrics 通道)。每子切片独立 atomic commit + pytest 跑绿 + gate。
- 风险: medium⑤⑥ 不变(M1 自 C2 即 medium；enrichment 提精度不提级)。
- 复检钩子: loop 实施 M1-2a/b/c 任何热路径 span/语义/exporter 时重查 architect-observability 校正项(_INDEX ⑩ tencentdb-telemetry-stack 等钩子同轮复检)。

### ⑧ NEW 子项 → scope-N-A-for-now（low，登记非必修）
- 证据: loop-dev 评测现状=verifier.py+l2_analyzer.py+golden+run_reporter+run_id 双写/archive 幂等(run_lock/resume_guard/migrations v004/005)。无多 evaluator 类型/实验状态机/eval 沙箱/SetNX。
- 根因: loop-dev=单机自进化 loop(非 coze-loop 式多租户 agent 评测平台)；多 evaluator+多语言沙箱+SetNX 全套评测框架是平台级需求，单机 scope 内 verifier+golden+l2 为比例恰当的轻量评测。⑧ 子项原则意图(系统化+幂等评测)已 partial 满足；幂等防重跑已由 resume/migration 实现(异域)；整套重框架 scope-N-A-for-now。
- 修复: 不升独立 ROADMAP 必修项；登记 low + 复检钩子。
- 复检钩子: loop-dev 扩为多租户/多用户 agent 输出评测平台时重查 ⑧ 全套评测框架(_INDEX ⑧ verifier 钩子同轮复检)。

## ④ 统计（增量自 C2）
| 风险级 | 增量变化 | 涉及 |
|--------|----------|------|
| critical | 0(不变) | — |
| high | 0(不变；H1 godfile×3 C2/cycle-2 已拆<800 闭合: memory_store 783/ooda_pipeline 784/orchestrator 789) | — |
| medium | 0 变(⑩ enrichment 提精度不提级，并入 M1-2；M2 net-sandbox P4 deferred 不变；G1 gated 不变) | ⑩(M1)/⑦(M2)/⑥(G1) |
| low | +1 登记项(⑧ eval-framework scope-N-A-for-now，非必修) | ⑧ |
覆盖增量: 无状态翻转(⑩ 仍 missing→M1；⑧ 此前 C2 清单无此子项故未登记此粒度，现登记 partial/scope-N-A-for-now)。其余 14 维 C2 状态不变。

## ⑤ 改进方案 —— C-round2 bounded 决策
- **本轮不产生新可原子修代码项**: ⑩ enrichment(OTel 语义+exporter 路由)须 span 模型+热路径集成设计→M1-2 有序子切片(a/b/c)落 ROADMAP，禁乱执行/禁只做部分(D-discipline)，本轮不强行。⑧ eval-framework=scope-N-A-for-now，登记非必修。
- **C-round2 收口**: ⑩⑧ 增量复评完成；⑩→M1-2 scope 扩展登记(子切片 a/b/c)；⑧→low/scope-N-A 登记+复检钩子；其余 14 维沿用 C2。0 新可原子修代码(异于 C2-C3-1 ratchet slack 那种 trivial atomic fix)；M1-2a(span 语义脚手架)/M1-2b(trace_id 热路径)为下一可执行切片。

## 关键结论
C 阶段 round2 = B-round2 ⑩⑧ 检查点变丰富后的 loop-dev 增量复评。⑩ enrichment 收敛并入既有 M1(medium，未提级)并扩 M1-2 子切片 scope(a 语义/b trace_id 热路径/c exporter)；⑧ eval-framework 判 scope-N-A-for-now(low 登记+复检钩子，单机 scope 内比例轻量评测已 suffices)。本轮无新可原子修代码项(符合 D-discipline: 大缺口落 ROADMAP 子切片，禁只做部分)；M1-2a/b 为下一可执行切片。C 阶段 round2 闭合，进 D 回环 / 或按用户安排继续 A。

## C 阶段 round3 评估轮（A-iter8+iter9 候选源增量后；2026-09-06）

> 自 C-round2(3d203cb)起 A 增 iter#8(autogen3)+iter#9(deer-flow3)=6 candidate（⑩2/⑥2/⑦sandbox2，全 provisional）；loop-dev 代码自 M1-1(1fb4846) 未改。本轮只复评 6 candidate 对 loop-dev 覆盖矩阵/缺口/风险增量影响；16 维 code-side 覆盖沿用 C-round2。

| 复评ID | 维·来源增量 | 状态 | 证据(file/grep) | 风险 |
|---|---|---|---|---|
| CR3-1 | ⑩ autogen-tracing(OTel+GenAI semconv)+deer-flow-langfuse(session_id=thread_id 分组+opt-in gating+dual-path) | 源增量(缺口 missing 不变) | telemetry.py fresh grep SpanKind/OpenInference/gen_ai/otLP/exporter=0 hit；loop 无 span 模型 | medium⑤⑥(并入 M1-2a/b/c，提精度不提级) |
| CR3-2 | ⑥ autogen-swarm(handoff)+deer-flow-subagent-capacity-status(admission FIFO+结构化 status+安全门) | 源增量(缺口 gated 不变) | loop 无 subagent/LLM 层(G1 gated-locked 正确) | gated(不变) |
| CR3-3 | ⑦sandbox autogen-docker(OS 容器)+deer-flow-lease+projection(process-local 非 OS 级) | 源增量(缺口 deferred 不变) | loop 无 sandbox 层(M2 deferred-P4) | deferred-P4(不变) |

### §8.4.3 钩子同轮复检
本轮 loop-dev 0 代码改(docs-only eval)：⑩/⑥/⑦/⑧ candidate 复检钩子触发条件均未满足→全 N/A；candidate 回填『未回填』全不变；计数 39 不变(N==M)。

### 风险分级增量
critical/high/medium/low 全 0 变(enrichment 提精度不提级；M1-2 medium⑤⑥/G1 gated/M2 deferred-P4/⑧ scope-N-A low 全不变)。无新缺口。

### 收口(D-discipline)
- 本轮无新可原子修代码项：6 候选为 provisional 源增量，未触发 loop code adoption。
- M1-2a(span 语义模型脚手架)经 6-⑩ 源 backed + 本轮 C-round3 复评确认 = next bounded actionable(A4 代码自进化切片，非本轮 C 评估修复)，禁只做部分。
- 顺手卫生：registry §11.4「(本 C-round2 docs commit)」残留→3d203cb(同 iter#9 cycle-1 同类)。
- convergence counter 仍 0(本轮 C 评估无 ROADMAP fixable 推进)。
### C 阶段 round3 闭合 → 或按用户安排继续 A(A-iter10：下一项目蒸馏)。
