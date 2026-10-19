# architect-design 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 系统架构设计

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则

### 1. 端口-适配器（Hexagonal Architecture）

**端口** = 抽象接口（ABC/Protocol），定义"做什么"
**适配器** = 具体实现，可替换
**铁律**: 领域逻辑永远不 import 适配器；适配器 import 端口；依赖指向抽象

```python
# 端口（在领域层定义）
class TaskRunner(ABC):
    @abstractmethod
    def run(self, input: TaskInput) -> TaskResult: ...

# 适配器（在基础设施层实现）
class BacktestRunner(TaskRunner):  # 适配器实现端口
    def run(self, input): ...
```

**反模式**: 
- 全局可变状态（模块级 `_SETTINGS` dict）
- 领域代码直接调 `subprocess.run()`
- 适配器代码泄漏到领域层

### 2. 深模块（Deep Module）

- **深模块** = 小接口 + 大实现。对外简单，内部复杂
- **浅模块** = 大接口 + 小实现。只是透传
- **删除测试**: 删掉这个模块，需要改多少代码？越少越好
- **接口即测试面**: 通过公共接口测试，不 mock 内部实现

### 3. DDD 战术设计

> 注意：如果用户要建立**术语表**（CONTEXT.md、概念定义），请路由到 [[architect-workflow]] 的"领域建模（术语表构建）"。

| 概念 | 定义 | loop 项目示例 |
|------|------|-------------|
| 实体 | 有唯一标识 | Task, Round, Pattern |
| 值对象 | 无标识，不可变 | TaskInput, TaskResult, RoundContext |
| 聚合根 | 一组相关对象的入口 | Orchestrator → Round → OODA Steps |
| 限界上下文 | 不同子域用不同术语 | 回测域 Signal ≠ 文档域 Event |

### 4. 规模适配

| Tier | 特征 | 适用技术 |
|------|------|---------|
| Tier 1 | 单文件/CLI | SQLite + 零依赖 |
| Tier 2 | 轻量Web | FastAPI + 单表 |
| Tier 3 | 多服务 | PostgreSQL + Redis |
| Tier 4+ | 企业级 | K8s + 消息队列 |

**原则**: 永远选当前规模够用的最简方案，不为未来过度设计。

## 检查清单

当用户说"检查设计是否全面"时，逐项输出。每项含修复操作：

| 检查项 | 未通过时的修复操作 |
|--------|------------------|
| 端口-适配器: 核心逻辑与I/O是否分离？有没有全局可变状态？ | ① 定义 ABC 端口接口 ② 将 I/O 代码移入适配器类 ③ 删除全局变量改为依赖注入 |
| 模块深度: 每个模块是小接口大实现吗？有没有纯透传模块？ | ① 计算"接口方法数 / 实现行数"比 ② <0.05 为浅模块→合并相邻模块 ③ 提取大实现到私有方法 |
| 领域边界: 术语是否一致？不同子域有无混淆？ | ① 建立 CONTEXT.md 术语表（见 [[architect-workflow]]）② 不同子域用不同类名/模块名隔离 |
| 规模适配: 当前方案是否过度设计？ | ① 确认 Tier 级别（见上表）② Tier1 用 PostgreSQL → 降级为 SQLite ③ Tier4 用 SQLite → 升级 |
| 依赖方向: 依赖是否指向抽象而非具体实现？ | ① 检查 import 语句 ② 领域层不应 import 适配器 ③ 引入 ABC/Protocol 反转依赖 |
| 单一职责: 每个类/函数只做一件事？ | ① 类 >1500 行 → 按职责拆分为 3-5 个类 ② 函数 >50 行 → 按逻辑段落提取子方法 |
| 单体文件体积: Top-N 文件是否离群？ | ① 按字节/行排序取 Top-N ② 单文件 >800 行或 >30KB 视为 god-file，按职责拆分 ③ 跨项目横评沉淀体积基线 |

### 5. 组合根与架构边界测试

所有具体适配器、配置和基础设施依赖应在唯一的 composition root 组装。领域层和用例层只依赖端口，不在方法内部偷偷创建数据库连接、HTTP client、时钟或随机数生成器。

建议用自动化边界测试守住依赖方向：

- 扫描 import 图，禁止 domain → infrastructure、domain → web framework 的反向依赖。
- 对每个 outbound port 运行一组 contract tests；所有适配器都必须通过同一组契约。
- 对旧系统先写 characterization test，再按垂直切片迁移；保留可切回的路由开关。
- 把“删除这个模块需要改多少调用方”作为耦合度信号，而不是只看目录层级。

```python
# composition root：唯一负责绑定具体实现
store = SqlitePatternStore(config.db_path)
runner = BacktestRunner(store=store, clock=SystemClock())
orchestrator = Orchestrator(runner=runner, policy=policy)
```

### 结构健康半定量基线（god-file 尺）

结构健康用半定量阈值判，避免"感觉太大"。基线（按项目类型 weight）：

| 信号 | 阈值 | 动作 |
|------|------|------|
| 单体文件 | >800 行 或 >30KB | 按职责拆分，优先拆组合根/编排/IO |
| 单个类 | >1500 行 | 按职责拆为 3-5 个类 |
| 单个函数 | >50 行 | 提取子方法 |
| 浅模块（接口方法数/实现行数） | 接口面大于实现（浅模块） | 合并相邻模块 |

跨项目横评时把高频出现的体积/行数沉淀为本 bundle 基线（见 Router 跨项目横评）。仅定性"是否太大"而无数值依据的发现标 medium 以下。
## 常见问题修复指南

### 上帝类拆分
1. 列出类的所有职责（每个方法标注归属哪类职责）
2. 按职责分组，每组提取为新类
3. 原类变为协调器，只保留方法调用序列
4. 用依赖注入传递新类实例
5. 参见 [[architect-review]] 12层审计

### 上帝文件/上帝类拆分三范式（按结构类型选）

god-file 拆分不能只会"按职责"。先判结构类型，再选范式：

**范式1｜按职责正交**（通用，适合发散式变化类 god-class）
- 即上"上帝类拆分"5 步。适用：一个类因多种不同原因被改。

**范式2｜按状态机步骤**（适合编排/OODA/流水线型 god-file，如数千行的 orchestrator）
1. 把流程每个 step/phase 拆成独立 handler（Observe/Orient/Decide/Act 各一）
2. 用状态机或 step 列表驱动，编排器只持"当前步+上下文"
3. 每步只管自己输入→输出契约，不跨步读状态
4. 编排器仅留 iter/异常/退出条件，体积骤降
- 验证：拆后每步 handler 可单测；编排器 <300 行。

**范式3｜按生命周期**（适合多阶段管理型，如 team_manager/team 编排）
1. 按对象生命周期阶段切分（创建/运行/销毁 或 init/hot-path/teardown）
2. 每阶段独立模块，阶段间通过事件或接口交接
3. 聚合根只持阶段引用与切换逻辑，不内联阶段细节
- 验证：单阶段可独立替换；聚合根行数 < 原 god-file 的 1/3。

选择判据：流程驱动→范式2；职责发散→范式1；多阶段管理→范式3。不确定时先看"它为什么大"——因步骤多→2，因管的事多→1，因阶段多→3。

### 全局可变状态消除
1. 找到所有 `module_level_dict = {}` 形式
2. 创建配置数据类（dataclass/NamedTuple）
3. 构造函数接收，实例传递
4. 删除全局变量，验证无残留引用

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。
## 交叉引用
- 审查设计质量 → 参见 [[architect-review]]
- 数据层设计 → 参见 [[architect-data]]
- 术语表构建 → 参见 [[architect-workflow]]
- 文档记录（ADR） → 参见 [[architect-docs]]
