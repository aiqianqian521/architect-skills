---
skill_family: architect
skill_name: architect-router
tier: L2-meta
project: architect-skills
input_ref: architect-skills-offline-bundle
evaluatedAt: 2026-09-14
renderer: render-report.cjs v2.1
status: NEED_REVIEW
---

# architect-skills 优化方向确认报告

> 评估性质：技能元评估（对 architect-skills 自身后续优化方向的 P9 + 蜂群确认）。
> 评估方法：P9 技术评审（接-化-发三阶段）+ 蜂群四 Agent 交叉验证 + 冲突仲裁。
> 上游依据：本轮全面评估产出的优化方向结论。
> 落盘：docs/ARCHITECT-ROADMAP-CONFIRMED-2026-09-14.md

## ① 评估对象地图（architect-skills 组件结构）

| 目录/入口 | 职责一句话 | 关键文件（行级） |
|-----------|-----------|----------------|
| architect-router/ | 总入口：意图路由 + 复合任务 + 全面分析模式 | SKILL.md:1-289 |
| reference/ | 契约层：schema、风险分级、编排协议、跨项目格式 | agent-output-schema.json / risk-grading-scheme.md / swarm-orchestrator.md |
| scripts/ | 聚合层：renderer + 校验 + 回归守卫 | render-report.cjs:1-461 / validate-contracts.mjs / regression-guard.cjs |
| tests/ | 质量门禁：L1 单元测试 + fixtures | run-l1-tests.mjs:1-135 / fixtures/eval-*.json |
| architect-{name}/ | 16 个 atom skill：各维评审原则 + 检查清单 + 修复指南 | SKILL.md（design/agent/test/...） |
| ARCHITECTURE-COVERAGE.md | 覆盖矩阵口径源：17 行 = 16 atom + 1 partial | ARCHITECTURE-COVERAGE.md:1-88 |
| pipeline.config.json | 三项目评估流水线配置 | pipeline.config.json:1-22 |

## ② 优化方向覆盖矩阵

| 维度 | 状态 | 证据 | 风险 |
|------|------|------|------|
| renderer 硬编码缺口 | partial | deriveArchMap:167-186 硬编码待补 | medium（scheme 二.4 文档缺关键入口） |
| L1 测试覆盖 | partial | 22 断言，缺横评/金样/plugin 用例 | medium（scheme 二.6 测试入口散乱） |
| orchestrator 自动化 | missing | 仅 swarm-orchestrator.md 契约，无代码 | high（scheme 二.3 边界未收敛） |
| contract.json 拆分 | partial | 1/16（仅 security），其余缺 | medium（scheme 二.1 单文件超800行类 gods） |
| 性能/延迟 atom | N/A | 当前三项目无 SLA/容量诉求 | low（复检：项目引入网络服务/接付费 API 时重查） |
| 矫正四件套强制 | partial | renderer 检查但 high 不阻断 | medium（scheme 二.1） |
| 金样回归自动化 | partial | regression-guard.cjs 存在但基线未验证 | low |
| 评估工单闭环 | missing | 无跟踪机制 | low |

## ③ 各优化方向详细分析

### renderer deriveArchMap 去硬编码
- **原则**：产出不得含待补占位符；结构由 renderer 强制，LLM 只填 narrative
- **证据**：render-report.cjs:175 `role: （待补：据 Intake 建图）`
- **风险分级**：medium（scheme 二.4）
- **下一步**：从文件路径推断目录职责 + schema 新增 `meta.dir_roles` 可选字段；2h

### L1 测试补到 30 断言
- **原则**：L1 通过后才允许进 L2/L3；无断言覆盖的行为可退化
- **证据**：run-l1-tests.mjs:16-135 仅 T1-T11；缺横评格式 / 金样回归 / plugin 覆盖
- **风险分级**：medium（scheme 二.6）
- **下一步**：新增 T12（横评格式验证）/ T13（金样回归格式）/ T14（plugin atom 覆盖）；2h

### 最小 orchestrator 0.1
- **原则**：蜂群评估应一键运行，人工分发/收集不可持续
- **证据**：swarm-orchestrator.md:1-234 契约完备，但 scripts/ 目录无 orchestrator 实现代码
- **风险分级**：high（scheme 二.3 边界未收敛——契约与实现未闭合）
- **下一步**：`scripts/swarm-orchestrator.cjs` 读 pipeline.config.json → 收集 fixture → 调用 renderer → 产出 report.md；4h（0.1 版本不调度真实 agent）

### contract.json 第2个 atom（architect-design）
- **原则**：契约化降低 agent token 消耗，但判断力不得退化
- **证据**：architect-design/SKILL.md:1-157 内容丰富，未拆 contract + guide
- **风险分级**：medium（scheme 二.1）
- **下一步**：按 security 样板拆 `contract.json + guide.md + SKILL.md`；验证原则引用数 + 行级证据密度契约化后 >= 改造前；6h

### 性能维度降级 N-A
- **原则**：N/A 必须带复检触发条件，不得脑补 covered
- **证据**：ARCHITECTURE-COVERAGE.md:49 行 17 标 partial，但三项目（cspm/loop-dev/deepseek）确无性能评审实证
- **风险分级**：low（scheme 三.1 N/A 维无复检触发条件——当前无复检条件）
- **下一步**：行 17 改为 N-A，复检条件写项目引入网络服务 / 接 LLM token 计费 / 有 P99 SLA 要求时重查

### 矫正四件套渐进强制
- **原则**：critical/high 发现必须可落地、可验证、可回滚
- **证据**：render-report.cjs:153-163 `checkRemediationCompleteness` 检查改什么/怎么改/验证/回滚
- **风险分级**：medium（scheme 二.1）
- **下一步**：critical 缺失 `verify_command` → 自动标 unknown；high 缺失标 warning；不一次性破坏现有金样

## ④ 问题点汇总统计

| 风险级 | 计数 | 涉及维度 |
|--------|------|---------|
| high | 1 | orchestrator 自动化缺失 |
| medium | 4 | renderer 硬编码 / L1 覆盖 / contract 拆分 / 矫正四件套 |
| low | 2 | 性能维度 N-A 复检 / 金样回归基线 |
| N/A | 1 | 性能 atom（带复检条件） |

覆盖状态：covered=0 partial=5 missing=2 N/A=1

## ⑤ 确认后的优化方案 — 阻塞项详述

### H1（high · scheme 二.3）orchestrator 自动化缺失
- **现象**：swarm-orchestrator.md 契约完备，但无代码实现；每次评估需人工准备 fixture → 运行 renderer
- **证据**：scripts/ 目录 8 个文件，无 orchestrator.cjs；pipeline.config.json:5-21 项目配置存在但无消费者
- **根因**：改造优先修 renderer 和 schema，orchestrator 实现因无第二个实例被延后
- **影响**：蜂群评估无法一键运行，阻碍规模化使用
- **修复顺序**：
  - P0：orchestrator 0.1 读 pipeline.config.json → 收集 fixture → 调用 renderer（4h）
  - P1：验证三项目一键运行输出与手工运行一致（1h）
- **验证命令**：`node scripts/swarm-orchestrator.cjs --project loop-dev --out /tmp/report.md`
- **响应时间**：7d

### M1（medium · scheme 二.4）renderer 架构地图硬编码
- **现象**：deriveArchMap 目录职责 one-liner 恒为（待补：据 Intake 建图）
- **证据**：render-report.cjs:175
- **修复**：从文件路径推断目录职责 + schema 新增 `meta.dir_roles` 可选字段
- **验证命令**：`node tests/run-l1-tests.mjs` 中 T15：renderer 产出不含待补
- **响应时间**：30d

### M2（medium · scheme 二.6）L1 测试未覆盖横评/金样/plugin
- **现象**：22 断言仅覆盖 strict/lenient/模式/narrative/type，缺横评/金样/plugin
- **证据**：run-l1-tests.mjs:1-135
- **修复**：新增 T12/T13/T14
- **验证命令**：`node tests/run-l1-tests.mjs` → 30 passed
- **响应时间**：30d

### M3（medium · scheme 二.1）contract.json 仅 1/16
- **现象**：仅 architect-security 拆出契约，其余 15 个 atom 仍混合 SKILL.md
- **证据**：validate-contracts.mjs --require-all 15 error
- **修复**：architect-design 按 security 样板拆契约（第二个实例验证）
- **验证命令**：`node scripts/validate-contracts.mjs` → 2 pass
- **响应时间**：30d

## 关键发现

1. **优化方向整体正确**，但 orchestrator 实现优先级应提至最高（当前最大瓶颈）。
2. **契约铺开保持克制**：第2个 atom 选 architect-design（全面分析 Phase2 调和者，token 消耗最高），不铺 15 个。
3. **性能维度建议降级 N-A**：当前三项目确无性能实证，硬建 atom = 无场景验证的债务。
4. **矫正四件套渐进实施**：critical 强制、high warning，与 renderer 现有 `--strict-narrative` 逻辑一致，避免金样全红。

## 已接受假设

1. 当前只有 loop-dev 是真实深度使用蜂群评审的场景。
2. renderer 的 narrative 空段由下游 LLM/人工填充，机器聚合产物允许 NARRATIVE_MISSING 警告。
3. orchestrator 0.1 版本只做fixture → renderer一键运行，不调度真实 agent（降低复杂度）。

## 未覆盖与建议新增

| 建议新增 | 理由 | 优先级 |
|----------|------|--------|
| `scripts/swarm-orchestrator.cjs` | 最小自动化调度：读配置 → 收集 → 渲染 | high |
| `tests/run-l2-integration.mjs` | L2 集成测试：真实 agent 输出 → renderer → 报告 | medium |
| `reference/baseline-metrics.md` | 跨项目半定量基线沉淀（god-file 阈值等） | low |

## 验证命令与结果

```bash
# L1 单测（当前基线）
cd E:/业余/skill/wend/architect-skills-offline-bundle/architect-skills
node tests/run-l1-tests.mjs
# 当前：22 passed, 0 failed
# 目标：30 passed, 0 failed

# renderer 三项目复测
node scripts/render-report.cjs tests/fixtures/eval-cspm-agent.json --out /tmp/cspm.md
node scripts/render-report.cjs tests/fixtures/eval-loop-dev.json --out /tmp/loop.md
node scripts/render-report.cjs tests/fixtures/eval-deepseek-harness.json --out /tmp/ds.md
# 预期：cspm BLOCKED / loop-dev PASSED / deepseek PASSED

# contract 校验（当前基线）
node scripts/validate-contracts.mjs
# 当前：1 pass, 15 warn
# 目标：2 pass, 14 warn
```

## P9 评审结论

> 优化方向经 P9 三阶段评审 + 蜂群四 Agent 交叉验证 + 冲突仲裁后，**整体判断正确，4 处微调**：
> 1. orchestrator 0.1 范围缩小为fixture→renderer 一键运行（4h，不调度 agent）；
> 2. 第2个契约化 atom 选 architect-design（比 test 收益更高）；
> 3. 矫正四件套 critical 强制、high warning（渐进，不破坏金样）；
> 4. 性能维度降级 N-A（带复检条件），不新建 atom。

## 蜂群仲裁结论

> 四 Agent 发现 4 处冲突，全部可调和：
> - C-1：deriveArchMap 推断 vs 要求 agent 提供 dir_roles → **调和**：先做简单推断，schema 新增可选字段
> - C-2：第2个契约 atom 选 design vs test → **采纳 design**（Phase2 调和者，token 消耗最高）
> - C-3：orchestrator 8h vs 4h → **采纳 4h**（缩小范围至 fixture→renderer）
> - C-4：矫正四件套强制 vs 渐进 → **调和**：critical 强制，high warning

> 收口：优化方向经 P9 + 蜂群双重确认，偏差已收敛，可按确认后的优先级总表执行。
