# architect-observability 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 可观测性与 SLO

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则

### 1. 信号必须能回答行动问题

日志解释“发生了什么”，指标显示“是否正在恶化”，trace 定位“在哪一步变慢/失败”。每个信号都要对应 owner、阈值和行动。

### 2. SLO 先于仪表盘

先定义用户可感知的成功率、延迟、可用性和新鲜度，再选择指标。不要用采集数量代替服务质量。

### 3. 统一关联上下文

跨 HTTP、队列、Agent step 传播 `trace_id`、`request_id`、版本和租户 scope；日志脱敏，禁止把 token、完整 prompt 或敏感 payload 写入普通日志。

### 4. 告警必须可执行

告警包含症状、影响、开始时间、链接、升级路径和回滚/降级动作；低价值告警不应淹没真正故障。

## 检查清单

```text
[ ] 是否有关键用户旅程对应的 SLI/SLO？ | 未通过时: 为每个关键旅程定成功率/延迟/可用性/新鲜度 SLI 与 SLO 目标；无 SLO 即先定 1 个最关键旅程的 SLO。
[ ] 是否采集 logs/metrics/traces 并可互相跳转？ | 未通过时: 三类信号接入并关联 trace_id/request_id；只采单一的补另两类并打通跳转。
[ ] telemetry 后端是否可插拔（factory 按 config.type 装配多后端）且不可用时 noop 降级、不阻断主路径？ | 未通过时: 用 createBackend(type) 工厂装配多后端（internal/console/file/metric-tracking-* 等），缺后端或装载失败时回退 NoopTraceBackend（report=no-op），保证可观测性故障不拖垮核心链路（真值实测 TencentDB `factory.ts:49-60`/`noop-backend.ts:64-70`/`metric-tracking-{l1-latency,l2-latency,l3-latency,recall,runner}.ts`）。
[ ] 是否包含 P50/P95/P99、错误率、吞吐、队列深度和资源饱和度？ | 未通过时: 补齐分位延迟+错误率+吞吐+队列深度+饱和度(USE/RED)；缺指标即补到仪表盘。
[ ] 告警是否有阈值、owner、runbook 和去重策略？ | 未通过时: 每条告警补阈值/owner/runbook/去重；无 owner 的告警标 high 并指派。
[ ] 是否验证采样、时钟、时区和高基数标签成本？ | 未通过时: 检查采样率/时钟同步(NTP)/时区统一(UTC)/高基数标签(group_by 任意 id)成本；高基数即降维或采样。
[ ] 是否对敏感字段做脱敏并验证日志不可泄密？ | 未通过时: 日志接入脱敏(字段白名单/正则)并跑泄密断言；无脱敏即补白名单。
[ ] 是否能从一次 trace 重放或定位关键失败步骤？ | 未通过时: 接分布式 trace 并能按 trace_id 重放关键链路；无 trace 即先接最关键 RPC 的 span。
[ ] telemetry span 是否使用标准语义约定（OpenInference/OpenTelemetry LLM span 语义，如 text/image/reasoning/tool_call/tool_call_response）而非自定义散点？ | 未通过时: 采 OpenInference/OpenTelemetry 标准语义约定标注 span（input/output/llm/tool），禁每点自定义；真值实测 coze-loop open_inference/openinference.go:13-19（TextLiteral/ReasoningLiteral/ToolCallLiteral）+ google-adk telemetry/tracing.py:196（trace_agent_invocation）。
[ ] trace 导出/exporter 是否按场景选范式（SDK 直发 exporter / 平台落盘存储 / collector 扇出多租户路由）且多租户场景隔离 trace？ | 未通过时: 择优三种 exporter 范式——SDK 直发（adk sqlite_span_exporter 轻量）/ 平台落盘（coze-loop ClickHouse 批量 Insert+分析查询）/ collector 扇出（librechat OTel collector routing connector 多租户 destination eu/jp/us）；多租户必隔离 trace。真值实测 adk sqlite_span_exporter.py:36/coze-loop infra/repo/ck/spans.go:52/librechat otel/langfuse-fanout/otelcol.yaml:17+main.go:613+metrics.go:138。

> **口径演进（2026-09-05 · TencentDB-Agent-Memory iter#3 实测真值校正）**：检查清单新增「telemetry 后端可插拔 factory + noop 降级」一项，带可回溯 file:行段真值（factory 切配多后端 + NoopTraceBackend 不可用降级）。校正记录见 architect-skills `output/loop-dev/2026-09-05/report.md`。
> **口径演进（2026-09-06 · B 阶段 round2 · adk+coze-loop+librechat ⑩ 三方实测真值校正）**：检查清单新增「OTel 标准语义约定」「trace exporter/路由多范式+多租户隔离」两项，带三源可回溯 file:行段真值（SDK 端 adk OTel+SQLite exporter / 平台端 coze-loop ClickHouse+OpenInference / 采集器端 librechat OTel collector routing 多租户扇出）。校正记录见 architect-skills `output/loop-dev/2026-09-06/report.md`。
``````

## 常见问题修复指南

### 告警很多但无法定位

1. 按用户旅程建立 SLI，而不是按组件数量建告警。
2. 将症状告警和原因指标关联到同一 trace/dashboard。
3. 为每条告警补 owner、runbook、降级和回滚动作。
4. 用一次故障演练验证从告警到恢复的耗时。
5. **验证**：发起一次受控故障，断言告警→定位→恢复耗时在目标内；MTTR 有指标可查。

### 日志写入敏感信息

1. 全局检索日志中对 token/密钥/prompt/PII 的写入点。
2. 接入脱敏白名单/正则（按 key 名或值模式）在日志 handler 前生效。
3. 跑泄密断言：批量样本日志不含已知敏感模式。
4. **验证**：grep 已知 token/secret 在日志目录零命中；CI 加日志泄漏扫描门禁。

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。
> 边界口径：日志/指标/trace 采集、SLO 仪表盘、告警策略归 observability；API 契约内的 trace_id/error_code 归 [[architect-net]]；编排内 step 追踪归 [[architect-agent]]；回滚/降级/发布动作归 [[architect-ops]]。

## 交叉引用

- Agent step 追踪 → [[architect-agent]]
- API tracing/超时 → [[architect-net]]
- 审查证据 → [[architect-review]]
- 运行手册与决策记录 → [[architect-docs]]
- 回滚/发布动作 → 参见 [[architect-ops]]（边界: 信号采集/SLO/告警归 observability；回滚/降级/发布动作归 ops）
