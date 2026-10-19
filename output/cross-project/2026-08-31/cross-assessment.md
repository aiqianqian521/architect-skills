# 跨项目横评报告（2026-08-31）

> 日期：2026-08-31
> 项目：cspm-agent / loop-dev / deepseek-harness-master
> 评估方式：模拟蜂群（单 AI 实例多维度扫描）
> 关联：`output/golden/INDEX.md` 横评契约

---

## 一、三项目共病分析

| 共病项 | 涉及项目 | 命中维度 | 根因 | 严重度 |
|--------|---------|---------|------|--------|
| 无显著共病 | — | — | 三项目技术栈/阶段差异大 | — |

**说明**：cspm-agent（Python/LangGraph/早期）vs loop-dev（Python/成熟）vs deepseek-harness（TypeScript/pnpm/极成熟）处于不同生命周期，无跨项目共病是合理结果。

---

## 二、区分度矩阵

| 维度 | cspm-agent | loop-dev | deepseek-harness | 区分度 |
|------|-----------|----------|------------------|--------|
| design | high (god_file) | low (deep module OK) | low (monorepo OK) | 高 |
| security | critical (hardcoded) | low | low | 极高 |
| test | medium (missing) | medium (threshold low) | low (100% gate) | 高 |
| ops | medium (ENTRYPOINT) | N/A | N/A | — |
| docs | N/A | N/A | medium (doc_gap) | — |

**区分度结论**：cspm-agent 为"早期项目高债务型"，loop-dev 为"中期项目调优型"，deepseek-harness 为"成熟项目维护型"。

---

## 三、单项目不可见发现（横评特有）

| 发现 | 横评视角 | 单项目可见性 |
|------|---------|-------------|
| cspm-agent app.py 602 行 god file + monkey patch 140 行 + hardcoded secret 集中于同一文件 | 单项目可见 | ✅ |
| loop-dev 覆盖率 70.43% 虽高于 cspm-agent（无 coverage），但远低于 deepseek-harness（per-file 100%） | 横评可见 | ⚠️ 需对比才显 |
| deepseek-harness AGENTS.md 150 行 vs cspm-agent 无 AGENTS.md | 横评可见 | ✅ |

---

## 四、基线对照（vs 2026-08-25 金样）

| 检查项 | 本次 | 金样 v2 | 状态 |
|--------|------|---------|------|
| 15 维覆盖矩阵 | ✅ 有 | ✅ 有 | 一致 |
| 行级证据(U0) | ✅ 有 file:line | ✅ 有 | 一致 |
| N/A 带复检(U1) | ❌ 未填 reason/recheck_trigger | ✅ 有 | **退化** |
| 风险分级引 scheme | ✅ 有 | ✅ 有 | 一致 |
| 共病 ≥2 项目 | ❌ 无共病 | ✅ 有（目录卫生） | **差异**（项目集不同） |
| renderer 空 section | ❌ 结论/关键发现/加固建议/下一步 空白 | ✅ 已填 | **退化** |

---

## 五、问题与限制（诚实声明）

1. **模拟评估**：本次为单 AI 实例模拟蜂群，非真实多代理并行。agent 输出为人工构造 JSON，非真实 agent 执行结果。
2. **schema 摩擦**：`agent-output-schema.json` 的 `type` 枚举过窄，导致 3 次 renderer reject，映射后损失精度。
3. **renderer 空白**：报告第 ⑥-⑨ 节（结论叙述/关键发现/加固建议/下一步）为空，因当前 renderer 只聚合结构化数据，narrative 需 LLM 二次填充。
4. **无 OODA 闭环**：本次只产出报告，未执行矫正验证。

---

> 本横评按 `reference/cross-project-input-format.md` 三件套（共病/区分度/基线）输出，但受限于模拟评估性质，共病项和基线对照存在合理差异。
