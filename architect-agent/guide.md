# architect-agent 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# Agent 与自动化系统设计

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

> ⚠️ "Agent" 在本 skill 含三义，评估前先二分意图：
> (1) **LLM-Agent**（模型 + 工具 + 记忆）：重点查工具调用护栏、记忆/模式库污染、prompt 注入与预算。
> (2) **异步任务/循环**（轮询、消息消费者、cron、事件循环）：重点查重试/幂等/退避/取消/死循环。
> (3) **编排引擎**（状态机、checkpoint、OODA、工作流）：重点查状态恢复、并发上限、事件溯源一致性。
> 三者都适用本 skill，但检查清单要按二分结果侧重取用；不要用一个口径评三种系统。
## Agent 架构参考

### DSH 微内核模式（Cordis）
```
一切皆插件（Everything is a Plugin）
├── Context树: extend/isolate/intercept 三级作用域
├── Fiber生命周期: PENDING→LOADING→ACTIVE→DISPOSED
├── 5种事件分发: emit/parallel/serial/bail/waterfall
├── Capability Seam: 每个能力拆为 Definition→Provider→Consumer 三角色
└── 声明式组合: Profile→Bundle→Patch 确定性层叠
```

### Loop OODA 模式
```
U→W→Q→O→O→D→A→V→L 9步循环
├── L1 重试: standard→longer_timeout→graceful_skip
├── L2 元进化: 健康评分→停滞检测→自动建议
├── 合同编程: Budget/Stop/Scope/Zone 四层约束
├── 事件溯源: JSONL 不可变事件日志
└── 端口-适配器: TaskRunner ABC 通用契约
```

### 状态机设计（LangGraph 模式）
```python
# OODA 循环作为状态图
class OODAState(TypedDict):
    round: int
    signals: list[dict]
    decision: str
    result: TaskResult | None

def build_ooda_graph():
    graph = StateGraph(OODAState)
    graph.add_node("observe", observe_fn)
    graph.add_node("orient", orient_fn)
    graph.add_node("decide", decide_fn)
    graph.add_node("act", act_fn)
    graph.add_node("verify", verify_fn)
    graph.add_node("learn", learn_fn)
    graph.add_edge(START, "observe")            # 入口
    graph.add_conditional_edges("decide", route_decision, {
        "execute": "act", "skip": "learn"
    })
    graph.add_edge("learn", END)                # 终止
    return graph.compile()
```

## 流水线模式（chain-patterns）

### 多阶段流水线设计
```
[阶段1] → checkpoint → [阶段2] → checkpoint → [阶段3]
每个 checkpoint 保存状态，支持断点续跑
```

### 关键模式
- **Checkpoint-Resume**: 每阶段结束保存状态，重启后从断点继续
- **Handoff 文件**: 阶段间传递最小上下文（引用已有产物，不复制）
- **Fan-out/Fan-in**: 并行子任务 → 聚合结果
- **Saga**: 多步骤长事务，每步有补偿操作

## 分布式模式（按需选用）

| 模式 | 场景 | 实现 |
|------|------|------|
| Circuit Breaker | 连续失败自动熔断 | `_consecutive_errors` 计数 |

### Circuit Breaker 的故障域分级（增强，cycle-7 A4）

基础熔断只管「连续失败数」；对多模型/多提供商舰队，还需**故障域分类** + **两级回路**，否则「单模型坏」会误伤整个提供商，或「输入错误」误封正常模型。

| 域 | 含义 | 动作 |
|------|------|------|
| `NONE` | 端点已应答（如上下文超长/??错误） | 不开回路（不隔离），避免误伤 |
| `MODEL` | 只有该模型 ref 不健康 | 开单模型回路，兄弟模型仍可路由 |
| `PROVIDER` | 整个提供商不健康 | 开整提供商回路，不再逐个轮询子模型 |

- **cooldown 指数升级**：OPEN 后等待时间随连续失败数递增（base 60s → 2次 5×（上限内）→ ≥3次 max 900s），防反复撞墙。
- **half-open 单飞探针**：cooldown 到期后只允许一个探针通行（同层拒绝第二个），探针成功则关闭回路，失败则重新 OPEN。
- **真值实测**：TencentCloud/Octop v1.0.2 `src/octop/infra/agents/providers/health.py:44-50,60-84,95-106,148-153,155-179`；loop `loop-engine/failure_scope.py` + `failure_scope_registry.py`（cycle-7 A4）。
- **边界**：API 边界内单次调用的熔断/超时/重试仍归 [[architect-net]]；本节只补「编排内多模型/多提供商**舰队**健康」。
| Idempotency | 重复执行结果一致 | error_signature 去重 + UPSERT |
| Rate Limiting | 限流保护 | subprocess 并发控制 |
| Backpressure | 防止队列无限增长 | worker-pool 并发上限 + buffer-storage + oversize-strategy + agent-task-queue 四件套（真值实测 TencentDB `worker-pool.ts:41-52`/`buffer-storage.ts:23-30`/`oversize-strategy.ts:18-24`/`agent-task-queue.ts:36-45`；非“待实现”占位） |
| Retry with Degradation | 临时故障重试（渐进式降级，非指数退避） | L1 standard→longer_timeout→graceful_skip |

## 延迟优化（latency-critical）

```python
# cProfile 定位热路径
import cProfile
cProfile.run('orchestrator.run_once()', 'hot.prof')
# 然后用 pstats 查看 Top 10:
# import pstats; p = pstats.Stats('hot.prof'); p.sort_stats('cumtime').print_stats(10)

# 常见热路径优化
def act(self, task):  # 热路径！
    # 1. 去掉不必要的 I/O（如每次调用都读配置文件）
    # 2. 缓存重复计算（如 signal_pattern 匹配结果）
    # 3. 批量操作代替逐条操作（如 SQLite executemany）
    # 4. 异步化不依赖结果的操作
```

## 可观测性与取消

Agent 编排器必须把一次任务当作可追踪的执行单元，而不是一串无法关联的日志。

```text
trace_id        = 一次 Task 的稳定标识
round_id        = 一轮 OODA 的标识
step_id         = 单个步骤/工具调用的标识
parent_step_id  = fan-out 子任务回收时的父步骤
```

强制记录：开始/结束时间、状态转换、工具名、重试次数、耗时、错误类别、输入输出摘要（脱敏后）和最终决策。不要把完整 prompt、token 或密钥写入普通日志。

取消与预算规则：

- 每个 Task 继承一个绝对 deadline；子任务只能缩短 deadline，不能延长。
- 收到取消信号后，停止新 fan-out，等待已启动的可取消 I/O 收尾，并把状态写成 `cancelled`。
- 并行任务必须有上限、队列长度和 backpressure；禁止无限 `gather()`。
- 超过 token、时间或重试预算时，返回可解释的 `budget_exhausted`，不要静默成功。
- 状态恢复必须校验 `schema_version`、`task_id` 和幂等键，拒绝恢复过期或跨 scope 的 checkpoint。

### 工具调用的代码级护栏

提示词中的“必须调用工具”不是约束。入口处应使用 allow-list 校验工具名和参数，执行后验证返回 schema，再把结果交给下一步；未验证的工具结果不能触发持久化或高风险副作用。

## 检查清单

```
[ ] 是否有明确的状态机定义（状态+转换+条件）？ → 没有: 用 StateGraph 或枚举定义状态，画出转换图
[ ] 阶段间状态是否可持久化（checkpoint-resume）？ → 不可持久化: 每个 checkpoint 写 state.md 或 SQLite
[ ] 错误处理是否分层（L1重试→L2诊断→L3人工）？ → 未分层: 实现 standard→longer_timeout→graceful_skip 三级
[ ] 是否有 circuit breaker（防止雪崩），且按故障域分级（单模型 vs 整提供商），OPEN 后 cooldown 随失败数升级？ → 无熔断: 加连续错误计数器，超阈值熔断 + 通知。有熔断但单作用域: 补故障域分类 + 两级回路 + cooldown 指数升级 + half-open 单飞探针
[ ] 长流程/记忆/日志是否有分层降维 + 压缩归档（L0 原始 → L1 抽取 → compact 压缩 → fast-path 快路径）？ → 未分层: 按 L0-recorder→L1-extractor→compressor→fast-path 四层降维，超阈值触发压缩归档（真值 TencentDB `l0-recorder.ts:28-34`/`l1-extractor.ts:64-72`/`compressor.ts:90-98`/`fast-path.ts:17-20`）
[ ] 并发抽取是否有 worker-pool 并发上限 + buffer + oversize + task-queue 背压四件套？ → 缺件: 补 worker-pool(concurrency≥1) + buffer-storage + oversize-strategy + agent-task-queue，禁止无限 `gather()`（真值 TencentDB `worker-pool.ts:41-52` 等）
[ ] 扩展点是否用事件/钩子而非硬编码？ → 硬编码: 改为 waterfall hook 链或 EventEmitter 模式
[ ] 热路径是否经过优化？ → 未优化: 用 cProfile 找到最热 3 条路径，逐一优化
[ ] 门禁/守护脚本本身是否被**行为**验证（import 后真跑到各判定分支），而不是只做源码字符串匹配？ → 只做源码 grep = 未验证：把门禁当被测对象——用 `importlib` 加载后逐一调用它的纯函数（触发判定 / 阈值解析 / 摘要解析），并用 monkeypatch 替掉慢与依赖环境的接缝（子进程、git、外部校验器），**每条 fail 路径都要有断言**（缺依赖拒绝 / 棘轮下降拒绝 / 测试红灯 / 文档漂移 / 登记值落后）。真值：loop cycle-17 —— 门禁接线此前只有 `assert "check_orphan_mechanisms" in src` 这类源码 grep 断言，把检查挪到 `return 0` 之后仍全绿。

> **口径演进（2026-09-05 · TencentDB-Agent-Memory iter#3 实测真值校正）**：Backpressure 行由“待实现”校正为真实四件套实现模式；检查清单新增「分层降维/压缩归档」「worker-pool 并发上限+buffer+oversize」两项，均带可回溯 file:行段真值。校正记录见 architect-skills `output/loop-dev/2026-09-05/report.md`。
> **口径演进（2026-10-23 · B 阶段 cycle-17 · loop 实测真值校正）**：检查清单新增「门禁/守护脚本必须被行为验证」一项（真值 = loop cycle-17：`run_gate.py` 的接线只由源码 grep 断言守护，删掉/挪走检查后全绿；补行为契约后 5 条 fail 路径全部可复现）。校正记录见 loop 仓 `docs/flow/2026-09-05-grand-loop-status.md` §13.42。
```

## 常见问题修复指南

### 单线程 → 多 Agent 并行
1. 识别独立子任务（不同时间窗口回测、不同信号源）
2. 用 `parallel()` / `asyncio.gather()` 并发执行
3. 汇总结果，处理部分失败的情况
4. 注意共享状态隔离（见 [[architect-data]] 连接管理）

### 缺少错误恢复 → 加 L1 重试
1. 给每个外部调用（subprocess/API）加 try/except
2. 定义重试策略: immediate → wait_2x_timeout → skip_with_log
3. 所有重试写入 JSONL，供 L2 分析用

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。

## Claude Code Agent Loop 深度参考

> 以下内容基于 Claude Code 源码分析（`query()` 函数，1730行），提炼可复用的 Agent Loop 设计知识。
> 评估项目时，对照以下6个维度逐一审查。

### 单一路径原则

Claude Code 只有一个 `query()` 函数（1730行）。REPL调用它、SDK调用它、子代理调用它、headless runner调用它。任何在 query() 之外实现的特性，在子代理/headless模式下都不存在。

```
所有入口 → query() → [中间件链: 认证→压缩→工具调用→格式化] → 统一输出
```

评估要点：
- 项目是否所有执行路径都走同一个入口？
- 是否存在"快捷方式"执行路径（绕过关键中间件）？
- 新增特性时是否保证在所有模式下均可用？

### Async Generator 模式

```typescript
async function* query(params): AsyncGenerator<Message|Event, TerminalReason>
```

三个核心价值：

1. **Backpressure**: 消费者调用 `.next()` 才产生数据，天然解决快生产慢消费
2. **Return type**: `TerminalReason` 编码10种终止原因，调用者不需要订阅 "end" 事件
3. **Composability via `yield*`**: 子生成器透明转发，无需回调/promise 包装

```typescript
// TerminalReason 枚举示例
enum TerminalReason {
  COMPLETED,           // 正常完成
  MAX_TURNS,           // 达到轮次上限
  TOKEN_BUDGET,        // token预算耗尽
  USER_INTERRUPT,      // 用户中断
  TOOL_DENIED,         // 工具被拒绝
  ERROR,               // 未分类错误
  CONTEXT_WINDOW_FULL, // 上下文窗口满
  AUTOCOMPACT_FAILED,  // auto-compact失败
  // ... 共10种
}
```

评估要点：
- 编排框架是否使用 generator/async generator？
- 终止原因是否枚举化（而非靠日志字符串判断）？
- 是否存在背压机制？

### 三段式状态分离

| 段 | 性质 | 典型内容 | 注入方式 |
|----|------|---------|---------|
| **QueryConfig** | 不可变，入口时快照 | 特性开关、会话状态、环境变量 | 入口参数 |
| **State** | 可变 | 消息历史、工具结果、上下文 | 函数内可变对象 |
| **QueryDeps** | 可注入（4个，不是40个） | 模型调用器、压缩器、微压缩器、UUID生成器 | 依赖注入 |

反模式：把所有东西塞进一个不可变快照（`QueryConfig` = 40个字段）。

```typescript
// 正确：4个可注入依赖
interface QueryDeps {
  model: ModelInvoker;          // 模型调用
  compactor: Compactor;         // 上下文压缩器
  microcompactor: MicroCompactor; // 微压缩器
  idGenerator: () => string;    // UUID生成
}
```

评估要点：
- 不可变配置与可变状态是否分离？
- 依赖是否可注入以便测试？
- 依赖数量是否 ≤ 4（否则可能过度耦合）？

### 四层上下文压缩（顺序至关重要）

```
Raw messages → [Layer1: Tool Result Budget] → [Layer2: Snip Compact]
→ [Layer3: Microcompact] → [Layer4: Context Collapse] → [Layer5: Auto-Compact]
→ Messages for API call
```

**collapse 先于 auto-compact**：如果 collapse 把上下文降到阈值以下，auto-compact 变为空操作，保留细粒度上下文。

| 层 | 触发条件 | 作用 |
|----|---------|------|
| Tool Result Budget | 每个 tool result 后 | 截断过长的工具输出 |
| Snip Compact | 80% 上下文窗口使用率 | 剪裁旧消息 |
| Microcompact | 每个 tool result 后 | 微压缩当前轮次 |
| Context Collapse | 超过阈值（窗口-13000） | 压缩历史轮次为摘要 |
| Auto-Compact | 连续接近上限（窗口-13000） | 激进压缩 |

评估要点：
- 压缩是否分层（而非单一策略）？
- collapse 是否先于更激进的 compact？
- 各层触发阈值是否独立可配置？

### Auto-Compact 熔断器

```
effectiveContextWindow = contextWindow - min(modelMaxOutput, 20000)
Auto-compact 触发: effectiveWindow - 13,000
硬性阻塞: effectiveWindow - 3,000
连续失败熔断: 3次
```

生产事件参考：有用户会话因 auto-compact 无限循环每天燃烧 250K API 调用。熔断器是最后防线。

```typescript
// 熔断器伪代码
class AutoCompactFuse {
  private consecutiveFailures = 0;
  private readonly FUSE_LIMIT = 3;
  
  shouldAutoCompact(usage: number, effectiveWindow: number): boolean {
    if (this.consecutiveFailures >= this.FUSE_LIMIT) {
      return false; // 熔断，不再尝试
    }
    return usage > effectiveWindow - 13000;
  }
  
  recordFailure(): void { this.consecutiveFailures++; }
  reset(): void { this.consecutiveFailures = 0; }
}
```

评估要点：
- 是否存在自动压缩的熔断器？
- 熔断阈值是否可配置？
- 是否有连续失败的上限计数器？

### 错误恢复阶梯（逐级升级）

```
Level 1: Context collapse drain  — 温和回收
Level 2: Reactive compact        — 响应式压缩
Level 3: 8K→64K 窗口升级         — 升级上下文窗口
Level 4: 多轮恢复（最多3次）      — 重试恢复
Level 5: 暴露错误退出            — 优雅失败
```

关键原则：每级升级前必须尝试当前级别的所有恢复手段，不跳级。

评估要点：
- 错误恢复是否阶梯式（而非单一重试）？
- 各级之间是否有明确的升级条件？
- 是否有最大恢复尝试次数限制？

### 死亡螺旋防护（5层）

Agent 死亡螺旋：上下文膨胀 → 触发压缩 → 压缩失败 → 上下文继续膨胀 → 再次触发压缩 → ... 无限循环。

```
Layer 1: hasAttemptedReactiveCompact  — 一次性标志，防止重复触发
Layer 2: snipCompactThreshold         — 80%阈值触发剪裁
Layer 3: microcompact                 — 在每个 tool result 后执行
Layer 4: contextCollapse              — 压缩历史轮次
Layer 5: autoCompactFuse              — 连续3次失败熔断
```

评估要点：
- 是否有至少3层防护？
- 各层之间是否有递进关系（从轻到重）？
- 是否有最终熔断器（fuse）防止无限循环？

### 多Agent编排模式

| 模式 | 场景 | 关键约束 |
|------|------|---------|
| **Fan-out/Fan-in** | 并行独立子任务 | 父任务等待所有子任务完成→聚合 |
| **Saga** | 多步骤长事务 | 每步有补偿操作 |
| **Map-Reduce** | 大规模同质处理 | Map并行→Reduce聚合 |
| **Agent-as-Judge** | 质量评估 | 评估Agent与执行Agent隔离 |

```typescript
// Fan-out/Fan-in 伪代码
async function fanOutFanIn(tasks: Task[]): Promise<AggregatedResult> {
  const results = await Promise.allSettled(
    tasks.map(t => spawnSubAgent(t))
  );
  const successes = results.filter(r => r.status === 'fulfilled');
  const failures = results.filter(r => r.status === 'rejected');
  return { successes, failures, summary: aggregate(successes) };
}
```

评估要点：
- 是否支持 Fan-out/Fan-in（并行子任务）？
- Saga 模式是否有补偿操作定义？
- Agent-as-Judge 中评估Agent是否与执行Agent隔离？

## 交叉引用
- Loop OODA → 参见 [[architect-design]] 端口-适配器模式
- 状态持久化 → 参见 [[architect-data]]
- 流程设计 → 参见 [[architect-workflow]]
- 审查 Agent 架构 → 参见 [[architect-review]] 12层审计
- API 超时/重试/熔断/幂等契约 → 参见 [[architect-net]]
- SLO/告警/日志平台 → 参见 [[architect-observability]]

## cycle-8 实测增补：活性看门狗与上下文域工具策略门（2026-10-20）

> 来源：A 阶段 cycle-8 蒸馏 QwenLM/qwen-code（真值 file:行段见 `contract.json` AGE-16/AGE-17）。两项均为 loop 实测缺口回流。

**14. 活性看门狗（AGE-16）**：委派式尝试（子 agent 派发 / 模型轮次）应有**挂钟级「无进展」看门狗**：默认 180s（可 per-call / env 覆盖，0= 关闭）；**工具在飞期间挂起计时**（合法长工具不得误判为 stall）；**仅对 stall 重试**（上限 3），确定性失败（MAX_TURNS/TIMEOUT/ERROR）立即上抛、不重试；父级取消优先于重试。与「死亡螺旋层防护」「错误恢复阶梯」互补：后两者管“入口/恢复策略”，看门狗管“活性（卡死不可见）”。

**15. 上下文域工具策略门（AGE-17）**：工具可见性按执行上下文动态收窄：子 agent/队友处于“计划待批准”上下文时，仅放行**只读检视白名单** + 退出计划模式；`task_update` 过**参数级**最小放行（仅“认领”语义）；拒绝以**结果级** `ToolResult{error}` 返回（对模型可解释、可自纠）而非抛错中断循环。

## cycle-9 实测增补：步骤级异常策略三态（2026-10-22）

> 来源：A 阶段 cycle-9 蒸馏 coze-studio（真值 file:行段见 `contract.json` AGE-18）。loop 实测缺口回流（开工前全仓 0 命中）。

**16. 步骤级异常策略三态（AGE-18）**：每个步骤的异常处理应做成**可序列化的数据四元组**
`{timeout_ms, max_retry, process_type, data_on_err}`，其中 `process_type` 三态 = **抛错**（fail the node）/
**异常分支**（走该节点的错误分支）/ **返回兜底数据**（发 `data_on_err` 并继续）。总尝试次数 = `max_retry + 1`，
重试计数应镜像进执行上下文（恢复/重跑看到同一计数）；兜底路径（分支或默认数据）在收尾时给输出盖
`isSuccess=true` 标记，让下游用同一字段分支，而不必解析异常文本；「中断（暂停/恢复）」类错误在重试循环里
**短路直抛**、不消耗重试次数。与原则 3（分层错误处理）、12（错误恢复阶梯）、14（活性看门狗）互补：
后三者分别管「分层策略 / 恢复升级 / 活性可见」，本原则管「**单步异常策略可配置且可降级**」。

## cycle-10 实测增补：接线优先与单写者锁覆盖（2026-10-22）

> 来源：cycle-10 A 阶段补 G-5/G-6/R1 三处「机制已落、接线未闭」缺口（真值 file:行段见 `contract.json` AGE-18 补强 / AGE-19）。
> 两条均为 loop 实测回流；口径：机制存在 ≠ 控制存在。

**17. 接线优先：机制必须挂在真实调用点，且默认档行为等价（AGE-18 补强）**：一个「策略 / 协议 / 快照」模块
只有落了**真实调用点**才算控制面——判据是 `git grep` 能命中调用方（只命中自身与其测试 = 未接线）。
接线必须 **opt-in 且默认档与旧行为逐字节等价**（如 `ExceptionPolicy()` = 单次尝试 + 原样上抛），
否则「接线」本身就是回归。并且要分清两层标记：兜底路径盖的 `isSuccess` 只是**执行层**的「步骤完成」，
**不是业务成功**；下游校验器 / 判定必须仍看到 `not_verified`，禁止把「降级成功」升级成业务通过。
与原则 16 互补：16 管「策略可配置」，17 管「策略真的在链路上且不改变默认语义」。

**18. 单写者锁必须覆盖所有变更入口（AGE-19）**：并发安全看的是**共享存储的写者集合**，不是「主要入口」。
给长跑循环加了锁、却让 `--once` / 单次任务 / CLI 子命令裸奔写同一 SQLite，等于没有锁（表现为间歇性数据损坏，
最难复现的一类）。做法：**枚举所有写者** → 共用同一把单写者锁（冲突即拒绝 + 非零退出码）→ 或给每次运行
独立产物目录以消除共享；锁须**可判活**（持有者 PID 不可达 = 陈旧可接管；模糊态 fail-safe 不抢锁）
并在**任何**退出路径（异常 / 中断 / 信号）释放。与原则 2（Checkpoint-Resume）、6（背压四件套）互补：
后两者管「可恢复 / 过载保护」，本原则管「单写者互斥」。

## cycle-11 实测增补：无调用方机制门禁（2026-10-22）

> 来源：cycle-11 N-1 —— 把 G-5/G-6 那类「机制已落、接线未闭」的人工判据**门禁化**（真值 file:行段：`contract.json` AGE-20）。
> 口径：**机制存在 ≠ 控制存在；「接线」的存在必须能被机器判定。**

**19. 无调用方机制门禁（AGE-20）**：一个机制模块（≥1 顶层 `def`/`class`）落在引擎目录却**没有任何调用方**，
就是 G-5/G-6 式的静默回归——历史上只靠人工 `git grep` 才发现。做法：门禁脚本用 AST 判定每个机制模块
是否有**非测试**调用方（BOM 容错；`import_module("x")` / `__import__("x")` / 引号字面量做动态加载兜底）；
无调用方即**失败**。例外必须写成**显式白名单条目**，每条附**理由 + 追踪项**，且白名单必须**可判活**：
条目对应模块消失或已接线 = **陈旧豁免**，同样失败（白名单不能腐烂）。仅被测试引用的模块单列为
informational（允许的「参考实现」，如 `tool_concurrency`）。与原则 17（接线优先）互补：17 管「机制
真的在链路上」，19 管「没人能悄悄把一个没接线的机制留在仓里」。

## cycle-16 实测增补：协作接缝多调用点漂移（2026-10-23）

> 来源：cycle-16 A —— 同一个权限接缝被两处调用，一处的测试全绿、另一处**早就调用了不存在的方法**（真值 file:行段：`contract.json` AGE-21）。
> 口径：**一个接缝有 N 个调用点，就需要 N 份等价断言；只在其中一处有测试 = 其余各处在静默漂移。**

**20. 协作接缝的多调用点等价断言（AGE-21）**：当一个协作接口（PermissionGate / HookBus / 结果契约 / 存储事务）
被 **≥2 处**调用时，只覆盖其中一处是**假安全**——接口方法改名/改签名后，未被覆盖的那一处照样能"编译通过 + 测试全绿"，
直到线上第一次走到那条分支才炸。做法：**枚举接缝的全部调用点** → 逐处核对方法名与参数语义是否一致 →
**每一处**都补等价断言（同一不变量、同一失败模式）。真值：loop cycle-16 实测——`tool_pipeline` step 8 调
`check_tool_call(name, params)`（正确且有测试），而 `tool_registry.dispatch` 调的是早已不存在的 `check(name, source)`，
于是**任何** `set_permission()` 之后的 dispatch 必抛 `AttributeError`；该分支因无测试而长期隐藏（模块覆盖率 65%）。
修复后以 `tests/test_tool_registry_contract.py` 钉住，并保留一条"原缺陷会抛 AttributeError"的回归用例。
与原则 19（无调用方门禁）互补：19 管"有没有人调用"，20 管"每个调用点是否一致且被验证"。

## cycle-17 实测增补：门禁自证（2026-10-23）

> 来源：cycle-17 A —— 审计"门禁自己的门禁"，发现守护脚本只用源码字符串断言验证（真值 file:行段：`contract.json` AGE-22）。
> 口径：**守护脚本的失效方式是"静默"的——只有行为测试能让它吵起来。**

**21. 门禁/守护脚本必须被行为验证（AGE-22）**：门禁（pre-commit 钩子 / 校验脚本 / 巡检器）是整条链上最后一道自动防线，
但它自己往往只被"看起来接上了"的方式验证：`assert "check_orphan_mechanisms" in src`、`assert "--all" in src`——
**对源码做字符串匹配**。这种断言挡不住真正的回归：把某个检查挪到 `return 0` 之后、删掉一段棘轮判定、或改掉触发前缀，
源码里那个字符串还在，测试全绿，门禁已经静默失效。做法：把门禁当**被测系统**——
① 用 `importlib` 按路径加载（门禁脚本通常不在包路径上）；② 把它的纯函数（触发判定、阈值解析、摘要解析、比对函数）
当单元被测；③ 对 `main()` 用 monkeypatch 替掉慢/环境依赖的接缝（子进程跑测试、`git show HEAD:…`、外部校验器模块），
让**每一条 fail 路径**都变成一条可在进程内复现的断言：缺依赖 → 拒绝且非零；棘轮下降 → 拒绝；测试红灯 → 拒绝；
文档/登记漂移 → 拒绝；登记值落后于实测 → 拒绝。真值：loop cycle-17 —— `scripts/run_gate.py` 补
`tests/test_gate_self_verification.py`（20 例）后，上述 5 条 fail 路径全部有断言，且暴露了门禁的既有盲区
（登记数字从不与实测对照）。与原则 20（协作接缝多调用点）互补：20 管"业务接缝的每个调用点是否被验证"，
21 管"守护这些调用的门禁本身是否被验证"。
