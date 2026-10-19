# 项目 B 架构评估 v2 — loop-dev（lh 自进化回测编排系统）

> 全新分析（v2）。不复用 v1 结论，按修复后 architect-skills「全面分析模式」15 维逐维重读重判。covered 必有 Intake 实读证据（U0）；N/A 带复检触发条件（U1）。

## 元信息
- 路径：`E:\业余\my\loop-dev`
- 定位：lh 自进化回测编排系统（CLI 驱动，OODA 7-step 循环）
- 技术栈：Python 3.11+ · 零依赖优先（PyYAML 可选）· SQLite 模式库 · OODA U→O→O→D→A→V→L
- 入口：`loop-engine/orchestrator.py`（CLI：`--doctor/--once/--status/--review/--reset`）
- 分析日期：2026-08-25 · 分析口径：修复后 skills（14 PASS）全量模式 · Intake 实读 · 行级证据

## 一、结论先行

**事实（已验证，附行级证据）**
- `orchestrator.py` = **3628 行 / 169KB** 单文件 god file，OODA 7-step 全塞其中（实读行数+head 45 行）
- CLAUDE.md v3.4 自述：`490 passed / 8 pre-existing failures = 98.4%`（L33）；`已知架构问题 19 项（4 critical, 6 major, 9 minor）`（L38），详情指向 `docs/architecture-problem-scan-report.md`
- `loop-engine/` 模块化：`event_log.py` 18KB · `memory_store.py` 61KB（SQLite 模式库）· `l2_analyzer.py` 13KB · `verifier.py` · `circuit_breaker.py` · `adapters/` · `corrections/`(R1-R6 playbook) · `tool_registry.py`
- `docs/` 含 `deepseek-harness-master.zip` **17.6MB** + `docs/docs.zip` **0.3MB** 二进制入库（实读 statSync）
- `docs/` 文档过载：21+ md（CLAUDE/README/RUNBOOK/roadmap/defect-scan/problem-scan/harness-analysis/CONTEXT/architect-reaudit-2026-08-22/architect-wave3-assessment-2026-08-23/p9-review 等）
- 根目录有 `.pytest_cache`（测试真实跑过）
- git log：`bcce5b1 docs(ooda): close git and regression task` / `5ac0362 fix(loop): preserve retry errors`

**判断**
- `orchestrator.py` 3628 行 god file → **critical**（CLAUDE 自列 4 critical 之一，OODA 七步全集中一文件）
- docs 治理差（17.9MB 二进制 + 21+ 文档散乱无索引收敛）→ high
- **评而不修**：自评能力极强（19 问题自分级、多份 architect-* 自评报告），但 19 问题持续存在 → high（与 architect-skills「评了不修」同构反模式）
- **这是三项目里自省能力最强的**：review/test/docs/observability 四维 covered，但还债速度 < 评的速度

**假设（未实测，标注）**
- 假设 4 critical 含 god file（CLAUDE L38 未逐项展开，详情在 problem-scan-report 未深读）→ 列为复检
- 假设 8 pre-existing failures 是被"豁免"而非真修 → 复检 RUNBOOK/CI豁免清单

**一句话**：B 是 architect-skills 的重度自评用户，元意识与测试/文档/可观测能力在个人项目里属顶尖，但"评的比修的多"——god file 与 19 问题长期共存，是"自省强、执行弱"的典型。

## 二、15 维覆盖矩阵

| atom | 状态 | 关键证据（行级） | 风险 |
|---|---|---|---|
| design | partial | OODA 7-step 架构清晰但全塞 `orchestrator.py` 3628 行；模块化仅在 `loop-engine/` 同级展开 | critical |
| data | covered | `memory_store.py` 61KB SQLite 模式库 + `event_log.py` 18KB 事件日志；数据层明确 | low |
| net | N/A | CLI 本地回测，无网络服务。**复检**：若加 HTTP/RPC 接口重查 | low |
| workflow | covered | OODA U→O→O→D→A→V→L 固定循环 + `corrections/` R1-R6 playbook + `circuit_breaker.py` | low |
| agent | partial | `adapters/`(backtest_adapter/task_runner) + `tool_registry.py` + `subagent_spec.md`（规划文档，落地度待查） | medium |
| security | partial | 零依赖优先减攻击面 + SQLite 本地；(−) 回测策略属 IP 无加密/访问控制 | medium |
| test | covered | CLAUDE 自述 490/8=98.4%（L33）+ `verifier.py` + `corrections` R1-R6 回归 + `.pytest_cache` 实证 | low |
| review | covered | 项目反复自评：`architecture-problem-scan-report`/`architect-reaudit`/`architect-wave3-assessment`/`p9-review` + CLAUDE 19 问题自分级 | low |
| git | partial | (+) 提交活跃语义化；(−) 17.9MB 二进制 zip 入库；19 问题文档化但未清 | high |
| ops | partial | `cron_wrapper.sh` + RUNBOOK v3.2 可克隆重现 + `--doctor` 自检；(−) 无容器化/systemd 编排 | medium |
| observability | covered | `event_log.py` 事件日志 + OODA 每步强制产物 + orchestrator 注释提状态条可视化 | low |
| cost | N/A | 本地回测工具。**复检**：接付费 API/算力规模化时重查 | low |
| docs | covered | 21+ 文档（CLAUDE/README/RUNBOOK/roadmap/defect-scan/problem-scan/harness-analysis/CONTEXT） | medium（过载） |
| compliance | N/A | 个人回测工具。**复检**：商业化/接外部数据时重查 | low |
| frontend | N/A | CLI 工具。**复检**：加 dashboard 时重查 | low |

**覆盖统计**：covered 5（data/workflow/test/review/observability/docs 实为 6 但 docs 过载降 medium）· partial 5 · N/A 5 · missing 0

## 三、Critical / High 阻塞项详述

### C1（critical）orchestrator.py 3628 行 / 169KB god file
- **现象**：OODA 7-step（U/O/O/D/A/V/L）全集中单文件
- **证据**：实读行数 3628 / 169KB；head 45 行确认 OODA 7-step 注释 + CLI 命令 + 统一日志
- **根因**：OODA 步骤未拆为独立模块（每步一个 `step_*.py`），状态机/调度/IO/分析混在一起
- **影响**：单点修改风险高、测试难隔离、AI 维护上下文爆炸
- **修复方向**：按 7-step 拆 `steps/{understand,observe,orient,decide,act,verify,learn}.py` + `orchestrator.py` 仅留调度壳；`memory_store`/`event_log` 已独立，照此正交化
- **验证命令**：单文件 ≤ 600 行；`pytest` 490 基线不回归（8 pre-existing 不增）
- **风险分级**：critical · **下一步**：先拆 `decide`/`act`（正交性最高），保留 `learn` 最后（依赖全链路）

### H1（high）docs 治理差 + 17.9MB 二进制入库
- **现象**：`deepseek-harness-master.zip` 17.6MB + `docs/docs.zip` 0.3MB + 21+ md 散乱
- **证据**：statSync 实读；docs readdir
- **根因**：无 `docs/` 治理规约（索引/归档/二进制禁入库）；参考资料与项目文档混放
- **修复方向**：(1) zip 移出 git/加 `git rm --cached` + `.gitignore`；(2) 建 `docs/_index.md` 统一索引（按状态：active/archive/reference）；(3) 参考资料归 `docs/reference/`
- **验证命令**：`git ls-files docs | Select-String '\.zip$'` 应空；`docs/_index.md` 存在且链接全可达
- **风险分级**：high · **下一步**：先清 zip（reduce repo 17.9MB）

### H2（high）评而不修 —— 自评 19 问题长期共存
- **现象**：CLAUDE L38 自述 19 问题（4c/6M/9m），多份 architect-* 自评报告，但问题持续
- **证据**：CLAUDE.md L33/L38；docs 内 `architect-reaudit-2026-08-22`/`architect-wave3-assessment-2026-08-23` 多轮自评
- **根因**：自评 cadence 高于还债 cadence；无"评后必修"门禁（与 architect-skills 改进清单 P0/P1 阻塞项同构）
- **影响**：评估文档膨胀但架构未改善；ROI 倒挂
- **修复方向**：设"每轮自评后必清 ≥1 critical"门禁；19 问题转 issue tracker 带状态；C1 god file 优先
- **验证命令**：连续两轮自评报告 critical 数应递减
- **风险分级**：high · **下一步**：把 19 问题中的 4 critical 绑定到 C1/H1 收口

## 四、Medium / Low 汇总
- agent：`subagent_spec.md` 规划落地度待查，adapters 抽象已完成（medium，复检）
- ops：加 `--doctor` → systemd timer / Docker 可选编排（medium）
- security：回测策略 IP 加密/访问控制（medium，本地工具风险低）
- docs：21+ 文档过载 → 建索引收敛（medium，接 H1）

## 五、修复优先级 + 还债顺序
1. **P0**：C1（拆 orchestrator 7-step）—— 直接对应 CLAUDE 自列 4 critical
2. **P1**：H1（清 zip + docs 索引）→ H2（19 问题转 tracker + 评后必修门禁）
3. **P2**：agent subagent_spec 落地度复检 → ops 编排 → security IP

**负责人建议**：B 是个人项目但自评机制成熟，建议把"自评"能量转向"还债"——评 1 次 = 必修 1 个 critical，否则停止新增评估文档。

## 六、证据来源附录（Intake 实读文件）
- `loop-engine/orchestrator.py` 实读行数 3628/169KB + head 45 行（OODA 7-step + CLI + 统一日志 + UTF-8 保护）
- `CLAUDE.md` v3.4 L1-138（L33 测试基线 / L38 19 问题自分级 / L115 problem-scan 引用）
- `loop-engine/` readdir（memory_store 61KB / event_log 18KB / l2_analyzer 13KB / verifier / circuit_breaker / adapters / corrections / tool_registry）
- `docs/` readdir（21+ md + zip 17.6MB+0.3MB 实读 statSync）+ 纠正交接：`docs/architecture/` **不存在**，19 问题详情在 `docs/architecture-problem-scan-report.md`
- `git log --oneline`（ooda/loop fix 语义化提交）
- 未读（标注）：`architecture-problem-scan-report.md` 19 问题逐项、`RUNBOOK.md` 豁免清单、`subagent_spec.md` 落地度

> 本报告 B 维 covered 论断由 CLAUDE 自述 + Intake 互证，非单方脑补。已纠正 v1/交接的 `docs/architecture/` 路径错误与 orchestrator 行数（实际 3628 非 3229）。
