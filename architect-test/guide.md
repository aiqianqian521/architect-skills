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
[ ] 测试/契约文件是否被门禁实际收集（收集数 ≠ 0）？ | 未通过时: 跑 `pytest --collect-only -q <路径>` 断言收集数 > 0；脚本式伪测试（只有 `def main()` + `__main__` 守卫、没有顶层 `def test_*`/`class Test*`）会被静默收集 0 个测试 → 加薄入口 `def test_<name>(): main()`（不改 body）+ 元测试（AST 扫描 tests/**/test_*.py）防复发。真值：loop cycle-16，6 个伪测试文件约 630 行断言不在门禁内。
[ ] 门禁的"收集扫描"是否覆盖 pytest 会收集的全部命名与深度（`test_*.py` 与 `*_test.py`，且递归子目录）？ → 只认一种命名 / 只扫一层 = 漏网：用 `rglob` 同时匹配两种命名（pytest 默认 `python_files = test_*.py *_test.py`），并加一条"扫描器必须能看见 `*_test.py` 与子目录文件"的自证用例（否则修了扫描器也没人知道它修了）。真值：loop cycle-17 —— cycle-16 的收集 tripwire 用 `glob('test_*.py')`（非递归、只认 test_ 前缀），把 0 收集文件放进 `tests/<sub>/` 或命名成 `foo_test.py` 即可整体绕过。
[ ] 门禁里"登记"的基线数字（passed / coverage / fail_under）是否与**实测运行**对照，而不只是"文档 ↔ 登记"互校？ → 缺对照 = 可静默删测试：跑完测试后解析摘要（`N passed` / `Total coverage: X%`）与登记值做**单向棘轮**比对（实测 < 登记即失败；多出不失败），解析不出摘要同样失败（fail-closed）。文档一致性检查只保证"文档说的 == 登记的"，永远不等于"登记的 == 真实的"。真值：loop cycle-17 —— `docs/baseline.json` 的 `1542 passed / 77.58%` 是手抄数字，`run_gate.py` 只看退出码与 `fail_under`，删掉一批测试后手改登记值 + 9 个文档即可保持全绿（`fail_under=70` 与实测之间的缓冲足以吸收）。
```
> **口径演进（2026-09-06 · B 阶段 round2 · coze-loop+adk ⑧ 实测真值校正）**：检查清单新增「AI 输出评测框架（多 evaluator + 实验状态机 + 多语言沙箱 + 幂等）」一项；此前清单仅覆盖传统单测/TDD，缺 AI/Agent 输出评测维度（真缺口）。真值 coze-loop eval 引擎 + google-adk evaluation framework。校正记录见 architect-skills `output/loop-dev/2026-09-06/report.md`。
> **口径演进（2026-10-23 · B 阶段 cycle-16 · loop 实测真值校正）**：检查清单新增「测试/契约文件必须被门禁实际收集（收集数 ≠ 0）」一项（真值 = loop cycle-16：6 个 `tests/test_*.py` 实为脚本式伪测试，pytest 收集 0 个测试、约 630 行断言从不执行；纳入门禁后立刻暴露 registry 权限门调用点调用不存在的方法）。校正记录见 loop 仓 `docs/flow/2026-09-05-grand-loop-status.md` §13.41。
> **口径演进（2026-10-23 · B 阶段 cycle-17 · loop 实测真值校正）**：检查清单新增「收集扫描须覆盖 pytest 全部可收集命名与深度」「登记基线数字须与实测运行对照（单向棘轮）」两项（真值 = loop cycle-17：收集 tripwire 只扫顶层且只认 `test_*` 前缀；`run_gate.py` 从不解析实测摘要，baseline 数字全靠手抄）。校正记录见 loop 仓 `docs/flow/2026-09-05-grand-loop-status.md` §13.42。

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

## cycle-17 实测增补：门禁自证（2026-10-23）

> 来源：cycle-17 A —— 对"守护者本身的守护"做审计（真值 file:行段：`contract.json` TES-12 / TES-13）。
> 口径：**一个守护脚本如果只被"源码 grep"验证，它就没有被验证；一个登记数字如果从不与实测对照，它就不是约束。**

**TES-12 · 收集扫描必须覆盖 pytest 的全部可收集命名与深度**：门禁"防伪测试"的扫描器自己也会漏——
`glob('test_*.py')` 非递归且只认 `test_` 前缀，而 pytest 默认 `python_files = test_*.py *_test.py` 且**递归**收集。
做法：扫描器用 `rglob` 匹配两种命名；再加一条**扫描器自证用例**（在 tmp 目录里放 `test_a.py` / `b_test.py` /
`sub/test_c.py` / `helper.py`，断言只看到前三个）。真值：loop cycle-17 —— cycle-16 的 tripwire 可被
`tests/<sub>/…` 或 `foo_test.py` 整体绕过，且当时无人能发现，因为扫描器本身没有测试。

**TES-13 · 登记基线数字必须与实测运行对照（单向棘轮）**："基线"必须同时被钉在**两个方向**：
① 文档 == 登记（已有）；② 实测 >= 登记（本次补）。缺 ② 时的失效模式是**静默删测试**：删掉一批测试、
手改登记值与文档，门禁全绿。做法：门禁跑完测试后解析摘要（`N passed` / `Total coverage: X%`）与登记值做
**单向棘轮**比对（实测 < 登记 = 失败；多出 = 允许，因为那是新增测试），摘要解析失败也判失败（fail-closed）；
覆盖度比对留一个小的浮点/取整容差，避免第二位小数抖动误报。真值：loop cycle-17 —— `run_gate.py` 原先
只检查 pytest 退出码与 `fail_under`，`docs/baseline.json` 的 `passed`/`coverage` 从未与实测对照过。

## 交叉引用
- 代码审查 → 参见 [[architect-review]]
- 设计测试面 → 参见 [[architect-design]] 端口-适配器
- 数据持久化测试 → 参见 [[architect-data]]
