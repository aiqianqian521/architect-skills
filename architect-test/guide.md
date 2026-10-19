# architect-test 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 测试与质量保证

## TDD 铁律

### 红-绿循环
```
1. RED:    写一个失败的测试（只测公共接口）
2. GREEN:  写最少的代码让测试通过
3. REFACTOR: 重构代码，保持测试绿色
```

### 好测试的标准
- 只通过公共接口验证行为
- 一个测试只验证一个行为
- 测试名称描述场景（不是实现）
- AAA 结构：Arrange → Act → Assert

### 三类反模式
```
[ ] 实现耦合测试 — 测试绑定了内部实现细节（mock了不该mock的）
[ ] 同义反复测试 — getX() 的测试验证 x==x，无意义
[ ] 水平切片测试 — 按层测试而非按功能垂直切片
```

### 在哪写测试
- **接缝处**: 系统的自然边界（端口-适配器边界）
- 端口测试：用 fake 实现
- 适配器测试：用真实基础设施（集成测试）

## pytest 模式

```python
# 参数化
@pytest.mark.parametrize("input,expected", [
    (TaskInput("backtest", {}), "completed"),
    (TaskInput("unknown", {}), "error"),
])
def test_runner(input, expected):
    assert runner.run(input).status == expected

# Fixture 作用域
@pytest.fixture(scope="module")  # 模块级复用
def store():
    s = PatternStore(":memory:")
    yield s
    s.close()

# 使用 conftest.py 共享 fixture
```

## 调试方法论（diagnosing-bugs）

### 6 阶段诊断循环
1. **构建反馈循环**: 写一个能复现bug的测试（必须红）
2. **复现 + 最小化**: 缩减到最小可复现用例
3. **提出假设**: 3-5个可证伪的假说，按可能性排序
4. **逐一验证**: 每次只改一个变量
5. **先写回归测试**: 修复前写好测试，确保修复有效
6. **清理**: 移除调试代码

### 反馈循环构建方法（6 种）

| 方法 | 适用场景 | 操作 |
|------|---------|------|
| **失败测试** | bug 可以复现 | `@pytest.mark.xfail` 装饰器写一个红的测试 → 修复代码 → 测试变绿 |
| **curl/CLI 一行复现** | API/CLI 相关 bug | 复制触发 bug 的精确命令到终端，一行回车就能看到错误 |
| **重放 trace** | 有日志/事件流 | 从 JSONL 提取触发 bug 的那条 event → 用同样输入重新执行 → 对比结果 |
| **临时 harness 脚本** | 需要反复调试的模块 | 写 `_debug_xxx.py` 单文件脚本，只加载目标模块的最小依赖，循环执行直到复现 |
| **Bisection 二分定位** | 大规模改动后引入的 bug | `git bisect start` → `git bisect bad HEAD` → `git bisect good <last-known-good>` → 逐个 commit 测试 |
| **差异对比** | 正常 vs 异常 | 并排对比一次成功的执行 trace 和一次失败的 trace，逐行找出第一个不同的地方 |

## 契约、集成与黄金数据集

测试层级按系统边界组织，而不是按内部类层级堆叠：

| 层级 | 目标 | 替身策略 |
|------|------|---------|
| 领域/用例单测 | 验证业务规则和编排结果 | fake outbound port；不 mock 被测内部实现 |
| 契约测试 | 验证端口的输入、输出、错误和幂等契约 | 同一套契约跑在每个适配器上 |
| 集成测试 | 验证真实 DB/API/队列的序列化、迁移、超时和重试 | 使用隔离资源，测试后清理 |
| E2E/回归 | 验证关键用户旅程和发布不回归 | 最少但稳定，失败输出完整 trace |

对 Agent、推荐系统和复杂数据转换，维护一个版本化 golden dataset：每条样本包含输入、期望状态/决策、允许的误差、来源和脱敏说明。每次变更运行固定子集和全量回归，报告通过率、边界样本和已接受差异；不能只报告平均分。

测试数据需要可重复生成，固定 seed 和时间；敏感生产数据必须脱敏或合成。任何新豁免都要写明原因、owner、到期日和复审测试。

## 检查清单

```
[ ] 新功能是否有对应的失败测试？（先红后绿） → 没有: 写 @pytest.mark.xfail 测试，描述预期行为
[ ] 测试是否通过公共接口？（没有mock内部实现） → 有mock内部: 改为只mock端口（ABC），适配器用 fake
[ ] 测试命名是否描述场景？ → 命名模糊: 改为 test_<what>_<condition>_<expected> 格式
[ ] 是否覆盖了边界条件？（空输入、最大值、超时） → 补: @pytest.mark.parametrize 加边界用例
[ ] 是否有永真断言？（excluded >= 0 毫无意义） → 改为具体断言: excluded > 0 或检查排除的具体信号名
[ ] 是否有依赖随机性的 flaky 测试？ → 有: 用固定 seed 或确定性 mock 替换随机数据
[ ] AI/Agent 输出是否有评测框架（eval sets + 多 evaluator 类型 + 实验运行状态机 + 评测沙箱执行 + 幂等防重跑）？ | 未通过时: 建 AI 评测框架——多 evaluator 类型抽象（code/prompt/agent/custom_rpc）+ 实验运行 run/item/turn 三级状态机 + 多语言沙箱执行评测代码（资源限额 NetworkAccess/FileSystemAccess）+ Redis 式 SetNX 幂等防重跑；llm-as-judge 项需 model 层（gated）。真值实测 coze-loop domain/entity/evaluator.go:53-58（四类型）+expt_run.go:40/56（ItemRun/TurnRunState）+execution_request.go:9/30（SandboxExecutionRequest/RuntimeCapabilities）+infra/runtime/manager.go:37（GetRuntime 多语言）+domain/component/idem/idem.go:12（SetNX 幂等）+ google-adk evaluation framework。
```
> **口径演进（2026-09-06 · B 阶段 round2 · coze-loop+adk ⑧ 实测真值校正）**：检查清单新增「AI 输出评测框架（多 evaluator + 实验状态机 + 多语言沙箱 + 幂等）」一项；此前清单仅覆盖传统单测/TDD，缺 AI/Agent 输出评测维度（真缺口）。真值 coze-loop eval 引擎 + google-adk evaluation framework。校正记录见 architect-skills `output/loop-dev/2026-09-06/report.md`。

## 常见问题修复指南

### Flaky 测试 → 确定性化
1. 找到使用 random/当前时间的测试
2. 用 `random.seed(42)` 或 `freezegun.freeze_time()` 固定
3. Mock 外部依赖返回固定数据
4. 连续跑 10 次确认不再随机失败

### 测试不足 → 补覆盖
1. 按模块运行 `pytest --cov` 看覆盖率报告
2. 优先补覆盖率最低的模块
3. 先公共接口 happy-path，再边界条件，最后异常路径
4. 参见 [[architect-review]] 质量门禁阈值

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。
## 交叉引用
- 代码审查 → 参见 [[architect-review]]
- 设计测试面 → 参见 [[architect-design]] 端口-适配器
- 数据持久化测试 → 参见 [[architect-data]]
