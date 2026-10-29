# architect-skills — 架构评估技能集

> 19 个「架构维度 atom」skill + 1 个路由编排 skill（`architect-router`）。每个 atom 是可独立触发的评估维度，router 负责跨维度编排、全面项目分析与跨项目横评。
> 覆盖矩阵口径源：[ARCHITECTURE-COVERAGE.md](ARCHITECTURE-COVERAGE.md)——19 矩阵行 = 18 个 atom skill + 1 条 partial（性能/延迟/容量/资源预算，主属 `architect-agent`）。

## Skill 清单

| skill | 评估维度 |
|---|---|
| `architect-agent` | Agent 架构评估（LLM-Agent / 异步循环 / 编排引擎），含 21 条核心原则与 9 步 Loop OODA 模式 |
| `architect-compliance` | 合规与隐私架构评估：数据分类与合法依据、主体权利、数据驻留、控制项落地机制 |
| `architect-context` | 上下文预算与压缩架构评估：上下文窗口管理、压缩策略、预算控制、surface/log 分层 |
| `architect-cost` | 成本与供应商架构评估：业务单位成本、容量假设、成本结构与供应商锁定 |
| `architect-data` | 数据与存储架构评估：迁移铁律、事务与一致性、备份恢复、数据生命周期 |
| `architect-design` | 系统架构设计评估：端口-适配器、DDD 战术设计、组合根、模块边界与结构健康 |
| `architect-docs` | 文档工程与知识管理架构评估：ADR 体系、面向 AI 的文档、调研引用规范 |
| `architect-frontend` | 前端与体验架构评估：关键用户旅程状态、可访问性、性能预算、展示系统结构 |
| `architect-git` | Git 与版本控制架构评估：提交规范、分支策略、冲突解决、入库排除 |
| `architect-net` | 网络与 API 契约架构评估：契约先行、超时·重试·熔断·降级、版本与兼容 |
| `architect-observability` | 可观测性与 SLO 架构评估：SLI/SLO、logs·metrics·traces、告警与 trace 重放 |
| `architect-ops` | 部署与运行架构评估：发布路径、健康检查、回滚策略、容器基线 |
| `architect-plugin` | 插件化与软插拔架构评估：manifest 契约、扩展点、隔离纯度、生命周期 |
| `architect-rag` | RAG/记忆检索架构评估：多路检索、融合策略、分层架构、索引管理、嵌入质量 |
| `architect-review` | 架构审查与代码质量评估：双轴审查、12 层 Agent 架构审计、质量门禁 |
| `architect-router` | 架构师蜂群总入口与路由：跨维度编排、全面项目分析、跨项目横评 |
| `architect-security` | 安全架构设计：认证授权、输入校验、密钥管理、沙箱、威胁建模、权限模型 |
| `architect-test` | 测试与质量门禁架构评估：TDD 铁律、测试反模式、AI 输出评测框架 |
| `architect-workflow` | 开发工作流与规格架构评估：领域术语、严格追问、Spec 完整度、垂直切片 |

## 配套项目（生态互链）

| 仓库 | 是什么 | 与本仓的关系 |
|---|---|---|
| [aiqianqian521/sloth-loop](https://github.com/aiqianqian521/sloth-loop) | 零 LLM 的任务编排引擎（身体） | 把本仓作为能力层挂载（`skills/architect-skills` 子模块），其「全面项目分析模式」按本仓覆盖矩阵跑 |
| [aiqianqian521/ooda_skill](https://github.com/aiqianqian521/ooda_skill) | OODA 执行循环纪律 | 同族 skill：`architect-agent` 的 9 步 Loop OODA 模式与它同源，评估结论可回灌其轮次记录 |
| [aiqianqian521/obsidian-skills](https://github.com/aiqianqian521/obsidian-skills) | Obsidian 知识库 skill 组（14 个） | 同族 skill：本仓的评估结论可落库沉淀 |
| [aiqianqian521/ai-skill-output-template](https://github.com/aiqianqian521/ai-skill-output-template) | 声明式多模板注册中心 | 定义本仓评估报告的输出结构契约 |

> 上面四个仓库都反向链接回本仓；`sloth-loop` 以 submodule 方式挂载本仓，可按需 pin 版本。
