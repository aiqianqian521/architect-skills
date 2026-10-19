# architect-router 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 架构师全家桶 — Router

## 路由规则

根据用户意图匹配对应的 atom skill：

| 用户意图 | 路由到 | 触发关键词 | 路由判断规则 |
|---------|--------|-----------|-------------|
| 系统架构设计 | `architect-design` | 设计架构、模块拆分、六边形、端口适配器、DDD战术设计、深模块、SOLID、依赖反转 | "设计是否合理/正确"→design |
| 架构审查 | `architect-review` | 审查代码、架构审计、代码质量、改进架构、代码有什么架构问题、设计有什么架构问题 | "代码/实现是否符合设计"→review |
| 数据与存储 | `architect-data` | 数据库设计、SQLite、SQL vs NoSQL、schema、迁移、存储方案、数据模型、连接管理 | — |
| 测试与质量 | `architect-test` | 写测试、TDD、调试、单元测试、回归测试、质量门禁、测试覆盖率 | — |
| 开发工作流 | `architect-workflow` | 需求分析、写规格、拆分工单、领域建模、术语表、技术决策、wayfinding | "术语定义/流程设计"→workflow |
| Agent 系统 | `architect-agent` | Agent架构、状态机、流水线、分布式、异步任务、LangGraph、OODA | — |
| Git 规范 | `architect-git` | Git提交、分支策略、合并冲突、版本管理 | — |
| 文档工程 | `architect-docs` | ADR、技术文档、架构决策记录、知识管理、技术调研、CLAUDE.md | — |
| 网络架构 | `architect-net` | API设计、RPC、服务间通信、超时重试、负载均衡、网关 | — |
| 安全架构 | `architect-security` | 认证授权、输入校验、密钥管理、沙箱、威胁建模、安全审计 | — |
| 部署与运行 | `architect-ops` | 部署、CI/CD、容器、健康检查、灰度发布、蓝绿发布、回滚 | — |
| 可观测性 | `architect-observability` | 日志、指标、Tracing、SLO、告警、运行手册、故障响应 | — |
| 成本与供应商 | `architect-cost` | 成本估算、云账单、容量费用、FinOps、供应商锁定、预算 | — |
| 合规与隐私 | `architect-compliance` | GDPR、个人信息保护、数据驻留、审计保留、删除请求 | — |
| 前端与体验 | `architect-frontend` | 前端架构、UX、可访问性、设计系统、状态管理、组件边界 | — |
| 插件化与软插拔 | `architect-plugin` | 插件化、软插拔、第三方插件、可安装扩展、插件manifest、扩展点加载、让用户开发插件、不都自研只适配兼容加载、插件生命周期、插件隔离、热重载插件、GitHub项目注入插件化 | "第三方可安装/插件manifest/软插拔"→plugin |
| 上下文与压缩 | `architect-context` | 上下文窗口、context budget、压缩策略、compaction、token管理、上下文溢出 | "上下文/压缩/token是否合理"→context |
| RAG与记忆检索 | `architect-rag` | RAG、检索增强、向量检索、语义搜索、embedding、检索融合、rerank、记忆引擎 | "检索/RAG/记忆是否合理"→rag |

## 流程

1. 识别用户意图，匹配到唯一的 atom skill
2. 如果意图跨越多个 skill（如"检查设计+数据层"），按优先级规则选最相关的：**精确关键词匹配 > 近似匹配；命中最多关键词者优先；同等条件下按路由表行顺序**，然后提示是否需要其他
3. 如果意图模糊（只说"帮我看下架构"），不依赖关键词匹配，直接展示完整的 10 个子 skill 列表让用户选择
4. 调用匹配的 Skill tool 执行对应 atom skill

### 路由冲突解决

当意图同时匹配多个 skill 时，按以下优先级：
1. **"检查设计"vs"审查代码"**: 用户说"设计是否合理/正确/全面"（含"设计对不对"、"设计有没有问题"等评估设计质量的表达）→ `architect-design`；说"代码/实现是否符合设计"→ `architect-review`；说"审查/审核/审计+设计"（如"审查设计"、"设计审核"、"审计架构"）→ `architect-review`（动作是审查，不是设计）
2. **"领域建模"**: 用户说"DDD/实体/值对象/聚合根"→ `architect-design`；说"术语表/CONTEXT.md/概念定义"→ `architect-workflow`

## 复合任务与交付协议

架构问题经常同时覆盖多个维度。Router 先选一个主 skill，再把其余维度作为明确的审查清单传给同一轮工作，避免多个 skill 各自给出互相矛盾的结论。

| 复合意图 | 主 skill | 必须追加的维度 | 最小交付物 |
|---------|---------|---------------|-----------|
| 设计系统 + 数据库 | `architect-design` | `architect-data`、`architect-security` | 架构边界、schema、迁移/备份风险 |
| 设计 API + 高可用 | `architect-net` | `architect-security`、`architect-agent` | 契约、超时/重试、熔断、幂等 |
| 审查代码 + 补测试 | `architect-review` | `architect-test`、`architect-data` | 严重等级发现、回归测试、数据风险 |
| Agent 架构 + 生产化 | `architect-agent` | `architect-net`、`architect-security`、`architect-observability`、`architect-ops` | 状态图、失败策略、权限边界、审计证据 |
| 需求到实现 | `architect-workflow` | `architect-design`、`architect-test`、`architect-docs` | CONTEXT、Spec、垂直工单、验收标准 |
| 从开发到上线 | `architect-workflow` | `architect-design`、`architect-ops`、`architect-observability`、`architect-security`、`architect-test` | Spec、发布路径、SLO、回滚和验证证据 |
| 产品体验 + 合规 | `architect-frontend` | `architect-workflow`、`architect-net`、`architect-compliance`、`architect-security` | 用户旅程、a11y、数据流和控制项 |
| 设计系统 + 插件化 | `architect-design` | `architect-plugin`、`architect-security` | 扩展点契约、第三方加载、插件隔离沙箱 |
| Agent架构 + RAG | `architect-agent` | `architect-rag`、`architect-context` | 记忆注入边界、检索预算、上下文污染风险 |
| 数据存储 + RAG | `architect-data` | `architect-rag` | schema与向量维度对齐、迁移路径、备份策略 |

### 统一交付格式

每次路由后的输出至少包含：

1. **结论**：当前方案/实现是否通过，或推荐哪条路径。
2. **证据**：文件、行号、测试命令、外部来源或明确的未知项。
3. **风险**：按 `critical/high/medium/low` 分级，并写明阻塞条件。
4. **下一步**：一个可执行、可验证的最小动作；涉及决策时链接 ADR。

当外部资料不可访问时，必须标注“仅基于本地资料”，不得把未检索的事实写成已验证结论。

### 原子风险分级与下一步骨架（供 atom 引用）

各 atom 自身若不定义风险分级，必须引用本骨架，使"单 atom 被直接调用（未经 Router 路由）"时仍能产出符合交付协议的四件套。atom 在 `## 交叉引用` 之上加一行：`风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架`。

风险级口径：
- `critical`：阻塞目标 / 安全可被立即利用 / 不可逆数据风险。
- `high`：显著伤质量但未全阻塞 / 触发即造成线上事故。
- `medium`：小瑕疵，便宜则修。
- `low`：格式/命名打磨。

单 atom 输出至少附：`结论 + 证据(file:line) + 风险级 + 下一步(可执行、可验证)`。未经 Router 路由而单独调用 atom 时，按此骨架自补风险分级段，不得省略。

## 全面项目分析模式

当用户说“全面分析”“端到端评估”“从开发到上线”“有没有遗漏”时，不得只挑一个 skill。按安装目录上级的 [`ARCHITECTURE-COVERAGE.md`](../ARCHITECTURE-COVERAGE.md) 逐维度扫描，并为每一维标记 `covered`、`partial`、`missing` 或 `not-applicable`。如果运行环境没有该文件，使用本节固定顺序，并明确标记“矩阵文件未安装”。

### 项目 Intake（建图，必跑）

在逐维度扫描前，先对项目"建图"并产出一张 **证据→维度映射表**，否则各维证据由模型即兴选取，跨运行证据覆盖不一致、不可追溯。

建图读取顺序（架构层，非逐行）：
1. **入口/主程序**：启动文件、CLI 入口、main/app。
2. **配置**：config / env / manifest / docker-compose。
3. **依赖锁**：requirements / package.json / go.mod / Cargo.toml / pom，识别技术栈与版本约束。
4. **目录树 + Top-N 最大文件**：分层结构，按字节体积取最大的若干单体文件（结构病高发区）。
5. **test 与 CI**：测试目录、CI 配置、覆盖率/门禁是否可见。
6. **最近变更**：git log / CHANGELOG / release notes。
7. **文档**：README / CLAUDE.md / agents.md / ADR / runbook。

产出 `证据→维度映射表`：每条证据标注它喂养哪个维度的哪个检查项，作为逐维判定的证据底座。

硬规则：
- `covered` 维必须在映射表里指到至少 1 条已读证据；未读到证据的维只能标 `partial / missing / N/A`，不得脑补 `covered`。
- 逐维判定中新引用的证据，必须先回填映射表再用于判定。
- Intake 只在架构层读，不逐行；深入单文件内部属"逐维深入"，在该维证据栏注明 `[深入] file:line`。

以下逐维扫描，均基于 Intake 建图的证据；新证据须先回填映射表再用于判定。

### 固定分析顺序

1. **上下文与约束**：目标、非目标、规模 Tier、合规、预算、SLO、交付期限。
2. **需求与领域**：术语、边界、实体/值对象/聚合、用户故事、验收标准。
3. **系统结构**：模块边界、依赖方向、组合根、架构模式、演进/迁移路径。
4. **接口与通信**：API 契约、版本、错误、超时、重试、幂等、消息/流式通信。
5. **数据与状态**：schema、迁移、事务、一致性、备份恢复、生命周期、隐私分类。
6. **Agent/异步流程**：状态机、checkpoint、并发、取消、预算、失败恢复、可观测性。
6b. **上下文预算与压缩**：上下文窗口预算/Tier分配、压缩分层(顺序)、熔断器、Surface/Log分层
6c. **RAG/记忆检索**：多路检索、融合策略(RRF)、分层检索、重排序、去重(MMR)、嵌入质量、Consolidation
7. **安全与信任边界**：认证、授权、输入校验、密钥、沙箱、供应链、审计、STRIDE。
8. **测试与质量门禁**：单测、契约、集成、E2E、黄金数据集、回归、覆盖率、证据。
9. **交付与变更**：Spec、ADR、工单、Git、CI、发布、回滚、文档一致性。
10. **运行与产品能力**：部署、可观测性、成本、合规、前端体验必须分别调用对应 atom skill；若环境没有安装，则显式标记“partial/missing”。

### 全面分析的最低输出

```markdown
## ① 项目架构地图（每目录职责，来自 Intake 建图）
| 目录/入口 | 职责一句话 | 关键文件(行级) |
|----------|-----------|--------------|

## ② 维度覆盖矩阵
| 维度 | 状态 | 主 skill | 证据 | 风险(critical/high/medium/low) |
|------|------|---------|------|-------------|

## ③ 各 skill 详细分析（每个架构师 skill 独立小节，L1 口径）
### {skill 名}
- 应用的原则/检查清单
- 逐项行级证据: file:line
- 维内风险分级（引 scheme §一触发条件编号）
- 修复/下一步

## ④ 问题点汇总统计（cspm 风格）
| 风险级 | 数量 | 涉及维度 | 关键文件 |
|--------|------|---------|---------|
（另附: 覆盖计数 covered/partial/N-A/missing；高发维度 Top-N；关键半定量基线）

## ⑤ 改进方案 —— Critical/High 阻塞项详述
### C{n}（critical · scheme §一触发编号）
- 现象 / 证据 / 根因 / 影响 / 修复顺序(P0/P1/P2) / 验证命令 / 响应时间

## 关键结论
## 已接受假设
## 未覆盖与建议新增 skill
## 验证命令与结果
```

### N/A 判定规则

维度标 `not-applicable(N/A)` 必须同时给出：
1. **判定理由**：一句话写明为什么该维对本项目不适用（如"纯后端无 UI""非受监管产品""无云付费 API"）。
2. **复检触发条件**：写出"项目发生什么变化时，该维应从 N/A 降为 `partial/covered` 重查"（如"未来上云 / 加 UI / 接 LLM token / 受监管"）。没有复检钩子的 N/A 视为"逃维"，必须补钩子或改为 `partial`。

在覆盖矩阵中，`状态` 列为 N/A 时，`证据` 列填"本项目不适用"，`风险/下一步` 列填复检触发条件。

### 跨项目横评（≥2 项目必产出）

同一轮评估 ≥2 个项目时，全面分析必须额外产出横评矩阵作为一等产物（非可选）：

```markdown
## 跨项目横评矩阵
| 维度 | 项目 A | 项目 B | 项目 C | 共病 / 差异结论 |
|------|--------|--------|--------|----------------|
| ③ 系统结构 | A: 47KB 入口过载 | B: 178KB 编排上帝文件 | C: 215KB 策略上帝文件 | 三项目各有典型结构病 |
```

横评三件事：
- **共病识别**：多项目同一维同病（如都缺超时/熔断）→ 行业级结论，提升到 ADR。
- **区分度检验**：同一 atom 在不同画像项目抓到不同病种 → 证明覆盖力，非套话命中率。
- **基线沉淀**：横评中高频出现的阈值（god-file 体积、测试通过率等）沉淀为半定量基线，反哺各 atom 清单。

单项目评估不强制横评，但建议在覆盖矩阵下方留一行"预留横评位"。

### 继续填充规则

新增能力必须同时更新四处：

1. 新建 `architect-{name}/SKILL.md`，明确触发词、核心原则、检查清单、修复指南和交叉引用。
2. 在 Router 路由表和全面分析顺序中登记。
3. 在 `ARCHITECTURE-COVERAGE.md` 增加覆盖维度、输出物和证据要求。
4. 在 `tests/validate-architect-skills.mjs` 增加结构、路由和代表性意图测试。

5. **修旧优先于加新**：新增 atom 前，必须先核验现有 atom 是否兑现 covered 四要素（清单配修复 / 修复含验证末步 / 有独立交付段 / 风险分级引用骨架）。发现裸问句、缺验证末步、缺交付段的 atom 须先还债再扩展；`tests/validate-architect-skills.mjs` 的质量门禁（无裸问句 / 修复含验证末步）即修旧的自动守门，不通过不得加新。

## 新增 Atom Skill

扩展全家桶需要 4 步，必须同时更新路由、全面分析矩阵和验证：

1. 创建 `~/.claude/skills/architect-{name}/SKILL.md`
2. 在路由表中加一行（用户意图 + 路由到 + 触发关键词 + 判断规则，无判断规则时填"—"）
3. 在本文件 `子技能` 列表和 description frontmatter 中增加新 skill 名称；在 `ARCHITECTURE-COVERAGE.md` 登记覆盖维度和输出物
4. 在 `tests/validate-architect-skills.mjs` 增加结构、交叉引用和代表性意图测试，并运行安装测试

### SKILL.md 模板
```markdown
---
name: architect-{name}
description: >-
  {一句话定位}。触发关键词: {逗号分隔}。
  合并自: {源 skill 列表}.
---

# {中文标题}

## 核心原则
### 1. {原则名}
...

## 检查清单
````
[ ] {检查项} | 未通过时: {修复操作}
````

## 常见问题修复指南
### {问题}: 
1. 第一步操作（含代码示例）
2. 第二步操作
3. 验证结果

## 交叉引用
- 审查维度 → 参见 [[architect-review]]
- 数据相关 → 参见 [[architect-data]]
```

## 输出模板硬性清单（强制）

> 本节是 architect-skills 输出的强制规范，所有评估输出（L1 atom 单维 / L2 单项目 / L3 横评）必须遵守。设计参考 cspm_agent SAS/CSPM 输出模板体系（prompt 硬性要求 + scheme 口径 + input-format 契约 + 金样回归）。

### 交付协议四件套（每次输出必含）

1. **结论** — 该维/项目的总体判定
2. **证据** — 行级（文件+行号 或 目录+大小），U0 硬规则：covered 必带实读证据，不脑补
3. **风险分级** — critical/high/medium/low，依据 `reference/risk-grading-scheme.md` §一触发条件编号定级，禁止主观词
4. **下一步** — 含响应时间（依 scheme §一响应时间表）

### L2 单项目报告·五段结构（用户定制的强结构清单）

> 单项目全面分析报告固定为五段，顺序不可换。结构与 narrative 分离：表/统计/风险计数由评估者按结构化输入填，叙述(结论)单独写。对照 cspm 报表形式：① 架构地图 ② 维度评估 ③ 每 skill 详析 ④ 统计汇总 ⑤ 改进方案。

1. **① 项目架构地图** — 来自 Router「项目 Intake 建图」：入口/配置/依赖/目录树+Top-N 文件/CI/变更/文档，每个目录一句话职责 + 关键文件行级证据。回答每个目录大概是做啥的。
2. **② 维度覆盖矩阵** — 15 维 atom 的 covered/partial/N-A/missing + 证据 + 风险分级（引 scheme 触发条件编号）。（沿用现有矩阵表）
3. **③ 各 skill 详细分析** — 对每个命中的架构师 skill 输出独立小节，按 L1 atom 口径：应用的核心原则/检查清单 → 逐项行级证据 → 维内风险分级(引 scheme) → 修复/下一步。**每个 skill 都需要，不允许只留矩阵一行**。
4. **④ 问题点汇总统计** — cspm 风格统计：按 risk-level 计数（critical/high/medium/low 各几项、涉及哪些维）、覆盖计数（covered/partial/N-A/missing）、高发维度 Top-N、关键半定量基线(如 god-file 行数/明文密钥计数)。报告不展示内部评分权重，只展示计数与触发条件标签。
5. **⑤ 改进方案 —— Critical/High 阻塞项详述** — 每个 critical/high 单独小节：现象 / 行级证据 / 根因 / 影响 / 修复顺序(P0/P1/P2) / 验证命令+通过条件 / 响应时间（引 scheme）。沿用现有 C/H 详述格式。

> 此五段结构同时是 scripts/render-report.cjs（P3 renderer）的输入 schema；renderer 强制表头，评估者只填证据与 narrative。

### 分层输出模板

- **L1 atom 单维**：状态(covered/partial/missing/N-A) + 证据行 + 风险分级(引 scheme)；covered 必带证据、N-A 必带复检触发条件（U0/U1）
- **L2 单项目**：15 维覆盖矩阵 + C/H/M 分级(引 scheme 触发条件) + 验证命令 + 证据附录
- **L3 横评**：依 `reference/cross-project-input-format.md`，必含共病矩阵/区分度/基线沉淀三件套，共病须 ≥2 项目命中

### prompt 硬性要求（借鉴 cspm，约束 LLM 自由发挥）

1. covered 必带行级证据，N-A 必带复检触发条件（U0/U1）
2. 风险分级必须引 `reference/risk-grading-scheme.md` §一触发条件编号，禁止"严重/可能/比较重要"等主观词
3. 禁止编造：未读/未获取标"未覆盖"，不脑补
4. 明文密钥发现即 critical，不因"个人项目"豁免
5. 横评共病必须 ≥2 项目命中，禁止单项目问题当共病
6. 完成后落盘 artifact（单项目报告 / 横评 / 反评）

### 金样回归

对照 `output/golden/INDEX.md` 金样，确认定级口径一致。金样定级锚点：
- 明文密钥入库 → critical（scheme §一①）
- god file > 800 行 → critical（scheme §一①）
- 变更管控失灵致敏感入库 → critical（scheme §一④）

### 终态演进（P3，未完成）

当前 U0/U1/风险分级/横评格式靠本清单 prompt 约束 + `tests/validate-architect-skills.mjs` 结构校验。终态演进出 report_renderer 脚本：结构由代码 render，LLM 只写 narrative（参考 cspm_agent report_renderer，其 `templates/risk_zh.md` 已标弃用转服务端 render）。
