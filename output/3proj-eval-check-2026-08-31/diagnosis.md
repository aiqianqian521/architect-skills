# 三项目评估：更新后 architect-skills 效果诊断（OODA R1 基线）

> 评估基线日期：2026-08-31
> 触发：用户用 Qoder CN 更新 architect-skills 后，对 cspm_agent / loop-dev / deepseek-harness-master 三项目做评估，检验效果。本基线为"我代跑评估"的产出，供用户在 Qoder CN 复核比对。
> OODA 工作区：`work_ooda/20260831-163522-architect-skill-3proj-eval/`

---

## 一、总体结论（先看这个）

**更新后的 skill 能产生真实、有行级证据的发现（质量达标的核心部分成立），但被一个门禁缺陷污染了输出观感，导致三份报告都被误标为"方案不完整、已阻塞"，且覆盖矩阵大量维度显示 missing、结论叙述段全空。**

一句话：**agent 会评，renderer 的 proposal 门禁不会"分模式"**——它把"评估现有项目（无 proposal）"错当成了"评审改造方案（proposal 不全）"。

---

## 二、门禁误用：根因

在 `scripts/render-report.cjs`（升级后 368 行，v2.1）：

```js
function computeVerdict(allFindings, missingAgents, unknowns, proposalCheck) {
  if (!proposalCheck.complete) {
    return { pass: false, label: "PROPOSAL_INCOMPLETE", ... };
  }
  ...
}
```

- 三份报告均无 `proposal` 输入（因为任务是"全面评审现有项目"而非"提交改造方案"）→ `validateProposal(undefined)` 返回 `{complete:false, missing:[6字段], level:"critical"}` → `computeVerdict` 直接返回 `PROPOSAL_INCOMPLETE`。
- 渲染并不提前中止，正文仍渲染 ③ 详析（所以能找到真实发现），但门禁横幅、覆盖矩阵 missing、narrative 空段共同造成"评审看起来失败了"。

**矫正方向**：renderer 需区分两种模式——
- **assessment mode（评估现有项目，proposal 可空）**：proposal 缺省不阻塞，直接跑全维评审；
- **review mode（评审改造方案，proposal 必填）**：才启用 `PROPOSAL_INCOMPLETE` 门禁。

目前同一入口无法区分，这是本次最需要修的点。

---

## 三、三项目发现基线（真实产出，含证据核验）

### 3.1 cspm_agent（E:\lvfs_git\cpsm_git\cspm_agent）

| 发现ID | 维度 | 类型 | 风险 | 证据(行级) | 核验 |
|---|---|---|---|---|---|
| SEC-04 | security | hardcoded_secret | **critical** | `app.py:342 ali_uid=1960721413485912 硬编码，未走 env` | ✅ **实读核验真实**（app.py L342 确为该值） |
| DES1 | design | god_file | high | `app.py:1-602` 602 行单文件混合 monkey patch/HTTP server/工具加载/配置打印多职责 | ⚠️ 文件真实存在，职责混合倾向成立 |
| SEC-02 | security | design_flaw | high | `app.py:20-160` 运行时替换 urllib.parse.quote 与 model_adapter.wrap_model | ⚠️ 属运行时 monkey patch，需人工确认风险级别 |
| D1 | data | missing_validation | medium | `config_env.py:198 int(val)` 无 try/except | ⚠️ 待实读 |
| T1 | test | missing_test | medium | src 190 文件 vs test 12 文件，无 coverage 配置 | ✅ 数量对比成立 |
| O1 | ops | other | medium | `Dockerfile:86-88 ENTRYPOINT 被注释` | ⚠️ 待实读 |

**基线判断**：cspm 是本批风险最高的项目（1 critical 硬编码凭证）。**建议优先复核 SEC-04**。

### 3.2 loop-dev（E:\业余\my\loop-dev）

| 发现ID | 维度 | 类型 | 风险 | 证据 |
|---|---|---|---|---|
| T1 | test | design_flaw | medium | `pyproject.toml:15 fail_under=64` 覆盖率阈值过低（行业良好 80%） |
| DES1 | design | other | low | circuit_breaker.py 深模块、小接口大实现 ->符合 deep module 原则 |
| D1 | data | other | low | W1-RESUME-01 快照恢复不变量维护良好 |

**基线判断**：loop-dev 干净度较高（无 critical/high）。注意：本报告把安全维标为 missing，但既有 2026-08-25 报告认为 security 为 partial（回测策略 IP 属本地工具、风险低）——**口径需复核**。

### 3.3 deepseek-harness-master（E:\业余\my\loop-dev\docs\deepseek-harness-master）

| 发现ID | 维度 | 类型 | 风险 | 证据 |
|---|---|---|---|---|
| DES2 | design | design_flaw | medium | `AGENTS.md:101` 全 ESM，CJS-only 导出会破坏源码启动契约 |
| DOC1 | docs | doc_gap | medium | `AGENTS.md` 150 行极细规则，新贡献者学习曲线陡 |
| SEC-01 | security | other | low | AGENTS.md:96 凭证不入库、CI 无 key 自跳过、.env 已 gitignore |
| T1 | test | other | low | AGENTS.md:65 test:coverage 门禁要求包级 100% |

**基线判断**：deepseek-harness 工程纪律好（多数发现为 low）。注意 **docs 目录有 7515 个文件**，覆盖矩阵的 data/net/ops 等标 missing 可能因 agent 未能读完深树。

---

## 四、需要用户/Qoder 复核的关键问题（OODA 待办）

| # | 问题 | 严重度 | 处置建议 |
|---|------|--------|---------|
| 1 | **proposal 门禁误用**：评估现有项目被标 PROPOSAL_INCOMPLETE | critical | renderer 加 assessment/review 双模式，proposal 可空评估 |
| 2 | **覆盖矩阵大量 missing**：三项目多数维 0 证据 | major | 可能 agent 未读深(deepseek docs 7515 文件)；需确认是采样不足还是 agent 失联 |
| 3 | **narrative 四段全空**：结论/关键发现/加固建议/下一步为空 | major | 输出协议要求 narrative 必填；需在 renderer 校验补上 |
| 4 | **loop-dev 安全维口径漂移**：本次 missing vs 旧版 partial | medium | regression-guard 应告警此项 |
| 5 | **cspm SEC-02 monkey patch 定级**：high 是否过重 | medium | 人工确认影响面 |

---

## 五、给 Qoder CN 复核的任务清单

1. 在 Qoder CN 里用更新后 architect-skills 重跑三项目（**assessment mode，不提交 proposal**），确认门禁不再误标。
2. 对照本基线的证据（尤其 cspm SEC-04 app.py:342），看发现是否复现、定级是否一致。
3. 反馈 fail：
   - 若门禁仍误用 → 落实 renderer 双模式修复。
   - 若覆盖矩阵仍大量 missing → 检查 agent 读取深度/超时，落 regression-guard 基线。
4. 通过标准：三报告 门禁✅/narrative 非空/覆盖完整/无口径漂移。

> 📌 R1 诊断结论：更新后 skill 能产出真实发现（cspm SEC-04 硬编码凭证已实读核验为真），但 renderer 的 proposal 门禁未区分"评估现有项目"与"评审改造方案"，导致三份报告全被误标 PROPOSAL_INCOMPLETE 且覆盖矩阵/叙述空段——首要修点是 renderer 增加 assessment 模式，随后按复核清单在 Qoder CN 重跑对齐。

