# 跨项目横评矩阵 v2 — A(cspm_agent) × B(loop-dev) × C(runtime01201)

> 按 router U2 要求：评估 ≥2 个真实项目必产出跨项目横评。本文由三份 v2 单项目报告（均 Intake 实读、行级证据、不复用 v1 结论）抽象合成，含共病矩阵 / 区分度 / 成熟度梯度 / 基线沉淀。

## 一、三项目画像对比

| 维度 | A · cspm_agent | B · loop-dev | C · runtime01201 |
|---|---|---|---|
| 定位 | 阿里云 CSPM 安全检查 Agent 后端 | lh 自进化回测编排系统（CLI） | ETH 严格模式信号监控系统 |
| 技术栈 | Python+LangGraph+AgentRun+FastAPI | Python 零依赖+SQLite+OODA | Python+ccxt+pandas，无 web |
| 规模信号 | src/agent god file ×2 | orchestrator 3628 行单文件 | backtest/ 62 脚本 |
| 安全卫生 | 高（.env.example 走 STS+加密） | 中（零依赖+SQLite，面小） | **低（明文密钥 critical）** |
| 自评能力 | 中（用 architect-skills/openspec） | **高（19 问题自分级+多轮自评）** | 无（review missing） |
| 还债能力 | 弱（元意识强未收口） | 弱（评而不修，19 问题持续） | N/A（无自评可还） |
| 头号 critical | 顶层卫生+变更管控（C1） | orchestrator god file（C1） | 明文密钥+同凭证（C1 security） |
| 文档 | 中（docstring 详，缺 README） | **过载（21+ md + 17.9MB zip）** | 弱（无架构文档+GBK 乱码） |

## 二、共病矩阵（≥2 项目的共性缺口）

| 共病 | A | B | C | 严重度 | 性质 |
|---|---|---|---|---|---|
| god file / 单文件膨胀 | ✅ generic 47KB+team 34KB | ✅ orchestrator 169KB | ◐ loop-engine 84KB(复刻B) | critical/high | 技术债头号 |
| 目录/文件卫生差 | ✅ 25 垃圾+`$(true)` | ✅ 17.9MB zip 入库 | ✅ backtest 62+GBK乱码 | high | 3 项目共病 |
| 变更管控/gitignore 失效 | ✅ 垃圾入库 | ✅ zip 入库 | ✅ 密钥入库 | high | 3 项目共病 |
| 配置多源/无单一可信源 | ✅ 端口 8000/9000 | ◐ | ◐ | high | A 独显 |
| 评而不修 / 自评未收口 | ✅ 元意识未收口 | ✅ 19 问题持续 | ✅ 无自评 | high | 3 项目不同程度 |
| 编码规约缺失 | ✅ py 中文注释乱码 | ◐ | ✅ GBK 乱码 | medium | 2 项目共病 |

✅=命中 ◐=部分/隐性

**共病结论**：三项目最普遍的弱点是「目录卫生 + 变更管控 + god file」——均属"工程纪律"类，非"技术能力"类。说明个人/小团队项目的瓶颈是纪律而非能力，对应 architect-skills 的 `git`/`ops`/`design` 维应强化"工程纪律门禁"清单。

## 三、区分度（各自独有问题）

**A 独有**
- CSPM 安全产品反讽：做安全检查产品，自身敏感日志散落未 gitignore（security 维 partial 偏 high）
- 双模式入口（agentrun/uvicorn）设计正向，但端口配置多源
- STS + MCP_TOKEN_ENCRYPTION_KEY 密钥设计正向（三项目里密钥管理最成熟）

**B 独有**
- OODA 7-step（U→O→O→D→A→V→L）固定循环 + corrections R1-R6 playbook
- 自评能力三项目最强：多份 architect-* 自评 + CLAUDE 19 问题自分级
- 评而不修最显著：评估 ROI 倒挂（评的比修的多）
- docs 过载（21+ md + 二进制入库）

**C 独有**
- security 维唯一真 critical：明文密钥 + 测试生产同凭证 + 已入库
- backtest 62 脚本爆炸（无包结构）
- 复刻 B 的 loop-engine 未共享抽象（cross-project 视角发现）
- review 维 missing（无自评文化）

## 四、成熟度梯度

按「安全卫生 + 变更管控」硬指标：**A > B > C**
- A：密钥管理有设计（STS），但卫生执行差
- B：攻击面小（零依赖本地），但 docs 卫生差
- C：硬 critical（明文密钥），工程化最弱

按「自评 + 还债闭环」软指标：**B > A > C**
- B：自评最强，但还债最弱（闭环断裂）
- A：元意识强（用 architect-skills），收口弱
- C：无自评（起点最低，但无虚假确定性）

**梯度结论**：A/B 的"自评强但还债弱"与 C 的"无自评"是两种失效模式。architect-skills 的 `review` 维应区分这两种：前者需"评后必修门禁"，后者需"先建自评文化"。

## 五、基线沉淀（通用教训 + 推荐门禁）

从三项目抽象的 5 条通用架构基线：

1. **god file 是个人/小团队项目头号技术债**（A/B 命中，C 复刻 B 模式将演化）→ `design` 维应加「单文件 ≤N 行」硬门禁 + 拆分修复指南
2. **目录卫生 + 变更管控是普遍弱点**（3 项目共病）→ `git`/`ops` 维应把「.gitignore 覆盖运行期产物 + pre-commit 拦截」列为 P0 清单项
3. **密钥管理成熟度差异巨大**（A:STS > B:零依赖 > C:明文critical）→ `security` 维应设「密钥管理三态检查」：环境变量化 / .env+gitignore / 明文入库（明文=direct critical，无需复检）
4. **自评能力 ≠ 还债能力**（B 最显著）→ `review` 维应加「评后必修门禁」清单项：每轮自评必清 ≥1 critical
5. **cross-project 视角能发现单项目不可见问题**（C 复刻 B loop-engine）→ 验证 router U2 横评能力的价值，应保留并强化

**推荐门禁（可移植到 architect-skills）**：
- `git` 维 P0：.gitignore 覆盖 `*.log/*.err/*.pid/tmp_*/.env/config.yaml(含密钥时)`
- `security` 维 P0：明文密钥扫描（grep TOKEN/SECRET/KEY 在配置文件 = direct critical）
- `design` 维 P1：单文件行数门禁（≤400 行 soft / ≤800 hard）
- `review` 维 P1：自评报告 critical 数应随轮次递减（评后必修门禁）

## 六、横评对 architect-skills 的反馈

本次横评验证/暴露的 skill 能力：

- **router U2（横评）真生效**：C 复刻 B loop-engine（H2）是单项目视角不可见的，横评才发现 → 直接证明修复保留横评能力价值
- **`security` 维分级正确**：三项目 security 落差（A partial / B partial / C critical）与实际密钥管理成熟度精准对应 → 修复后的 security 清单（含明文密钥检查）可用
- **`review` 维需补"两种失效模式"**：B（评而不修）vs C（无自评）是不同问题，当前 review 清单未区分
- **`git`/`ops` 维"工程纪律"清单价值最高**：3 项目共病都在这两维，修复后的清单（.gitignore/healthcheck）命中率高
- **`design` 维 god file 修复指南**：A/B 都命中，但修复指南"拆分"需更具体（按 7-step / 按职责），当前可执行性待提升

> 横评证据全部来自三份 v2 单项目报告的 Intake 实读，无新增脑补。共病/区分度均带项目级证据指向。
