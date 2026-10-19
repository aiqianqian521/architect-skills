# architect-net 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 网络架构与API设计

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则

### 1. API 设计铁律

```
[ ] API 契约先于实现（先写 OpenAPI/Proto/接口文档）
[ ] 向后兼容（加字段不改字段，加接口不删接口）
[ ] 版本策略明确（URL v1/v2 或 Header Accept-Version）
[ ] 错误信息可操作（返回 error_code + human_readable + action_required）
```

### 2. 通信模式选型

| 模式 | 适用场景 | 技术选择 |
|------|---------|---------|
| **同步 RPC** | 实时查询、命令下发 | REST/gRPC |
| **异步消息** | 事件通知、解耦处理 | Redis Pub/Sub, RabbitMQ |
| **请求-响应** | 查询-返回 | HTTP/JSON API |
| **流式** | 实时数据推送 | WebSocket, SSE |
| **批处理** | 定时任务、大数据 | Cron + 文件/队列 |

### 3. 超时与重试

```python
# 超时策略：总超时 = 连接超时 + 读超时
DEFAULT_TIMEOUTS = {
    "connect": 5,    # 连接超时 5s
    "read": 30,      # 读超时 30s
    "total": 45,     # 总超时 45s
}

# 重试策略：指数退避 + 抖动
RETRY_CONFIG = {
    "max_retries": 3,
    "backoff_factor": 2,     # 1s → 2s → 4s
    "jitter": 0.1,           # ±10% 随机抖动防止惊群
    "retry_on": [TimeoutError, ConnectionError, 429, 503],
}
```

### 4. Circuit Breaker（熔断器）

```
状态: CLOSED → OPEN → HALF_OPEN → CLOSED

CLOSED: 正常状态，计数错误
  → 连续错误 > threshold（如5次）→ OPEN

OPEN: 拒绝请求，直接返回 fallback
  → 等待 timeout（如30s）→ HALF_OPEN

HALF_OPEN: 允许少量探测请求
  → 成功 → CLOSED
  → 失败 → OPEN（重新计时）
```

### 5. 网关与负载均衡

| 组件 | 作用 | 技术选择 |
|------|------|---------|
| API Gateway | 统一入口、认证、限流 | Nginx, Kong, Traefik |
| Service Mesh | 服务发现、熔断、可观测性 | Istio, Linkerd |
| Load Balancer | 分发请求到多个实例 | Round Robin / Least Connections / IP Hash |

### 6. 幂等、分页与可观测性

- 对会产生副作用的 `POST`/消息消费定义幂等键；服务端持久化“处理中/成功/失败”状态，重复请求返回同一业务结果，而不是再次扣款或创建资源。
- 大集合默认使用 cursor-based pagination，返回 `next_cursor` 和稳定排序字段；避免 offset 在高并发写入下漏读/重复读。
- 错误响应采用稳定的 `error_code`、人类可读 `message`、`action_required` 和 `retryable` 字段；对 HTTP API 优先兼容 RFC 9457 Problem Details。
- 每个请求/消息携带 `trace_id`、`request_id` 和版本；跨服务传播 trace context，日志中禁止记录 token、密码和完整个人数据。
- 指标至少包括请求量、错误率、延迟分位数、重试次数、熔断状态、队列深度和降级次数，并为关键 SLO 配置告警。

```json
{
  "type": "https://api.example.com/problems/timeout",
  "title": "Upstream timeout",
  "status": 504,
  "detail": "The dependency did not respond before the deadline.",
  "error_code": "UPSTREAM_TIMEOUT",
  "retryable": true,
  "action_required": "Retry with the same idempotency key"
}
```

## 检查清单

```
[ ] API 是否有明确的契约文档（OpenAPI/Proto）？ → 没有: 先写 Spec，再写代码
[ ] 超时策略是否分层（connect/read/total）？ → 未分层: 至少区分连接超时和业务超时
[ ] 重试是否带退避+抖动？ → 固定间隔: 改为指数退避 + 随机抖动
[ ] 是否有 circuit breaker 防止雪崩？ → 没有: 实现 CLOSED→OPEN→HALF_OPEN 三状态熔断
[ ] 关键服务是否有降级方案（fallback）？ → 无降级: 定义 graceful degradation 策略
[ ] 是否考虑网络分区（split-brain）场景？ → 未考虑: 评估 CAP 取舍，明确是 CP 还是 AP
```

## 常见问题修复指南

### 服务不可用 → 加熔断+降级
1. 找到所有外部调用（HTTP/gRPC/subprocess）
2. 对每个调用包装熔断器装饰器
3. 定义 fallback 行为（返回缓存/默认值/降级功能）
4. 熔断后通过 health check 自动恢复

### 超时不确定 → 分层超时
1. 分析每个调用的正常响应时间（P50/P95/P99）
2. connect_timeout = 正常 P50
3. read_timeout = 正常 P95 * 1.5
4. total_timeout = read_timeout + connect_timeout + buffer

> 边界口径：API 边界内（超时/重试/熔断/幂等契约、trace_id、error_code）归 net；编排内（状态机/checkpoint/多 Agent 并发）归 [[architect-agent]]；信号采集/SLO/告警平台归 [[architect-observability]]；回滚/发布动作归 [[architect-ops]]。

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。
## 交叉引用
- 分布式模式（Saga/Idempotency） → 参见 [[architect-agent]]
- 数据一致性 → 参见 [[architect-data]]
- 安全（认证/授权/加密） → 参见 [[architect-security]]
- 架构审查 → 参见 [[architect-review]]
- 信号采集/SLO/告警平台 → 参见 [[architect-observability]]（边界: API 契约内 trace_id/error_code 归 net；采集/SLO/告警归 observability）
