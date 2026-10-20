# loop-dev 架构评估报告（B 阶段校正验证 · 2026-10-20）

> 口径：architect-skills 真包（B-round3 2026-10-20 校正后）｜项目：loop-dev（`E:\业余\my\loop-dev-next`，分支 `dev`，HEAD `9808f82`）
> 基线：**1310 passed / 1 xfailed / coverage 73.23%**（fail_under=70，单一来源 `docs/baseline.json`）
> 定位：本轮为 **B 阶段「用 A 阶段蒸馏真值校正 architect-skills 检查点」的验证报告**，非全新项目分析；与 `2026-08-25` / `2026-09-05` / `2026-09-06` 金样并列对照演进。

## ① 结论
A 阶段 cycle-8 蒸馏（QwenLM/qwen-code）暴露两处**真实检查缺口**，已校正进 architect-agent 契约（新增 AGE-16/AGE-17），
loop 侧其一（活性看门狗）已 A4 落地并跑绿；其二（上下文域工具策略门）与 loop `tool_registry.py` 死分支吻合，留场景 C 评估接入。
本轮为**口径演进**（检查点新增），**未改 `reference/risk-grading-scheme.md` 定级锚点**，golden 触发条件/共病判定不漂移。

## ② 证据（行级 file:行段）
- `architect-agent/contract.json`（校正后：新增 AGE-16/AGE-17；meta.updated_at 2026-10-20）
- 真值源 A（活性看门狗）：qwen-code `packages/core/src/agents/runtime/workflow-stall.ts:67,70,134,156-162,180-193,248-296`
  —— `DEFAULT_STALL_MS=180_000` / `MAX_STALL_ATTEMPTS=3` / `attachStallWatchdog` / `if (inFlightTools > 0) return;`（工具在飞挂起）/ `runStallResilient`（仅 stall 重试）。
- 真值源 B（上下文域工具策略门）：qwen-code `packages/core/src/agents/runtime/subagent-plan-tool-policy.ts:18-34,43-45,94-105,139-153`
  —— `READ_ONLY_INSPECTION_TOOLS` / `PLAN_REQUIRED_TEAMMATE_PRE_APPROVAL_TOOLS` / `isPlanRequiredTeammatePreApprovalAllowedTool` / `buildSubagentPlanToolBlockedResult`（结果级阻断）。
- loop 落地验证（A4 cycle-8，commit `549fb8c`）：`loop-engine/stall_watchdog.py` + `tests/test_stall_watchdog.py`(18)；
  `run_gate.py --all` → **PASS**（1310 passed / 1 xfailed / 73.23%）。
- loop 反向样本（缺口实证）：`git grep -i 'watchdog|heartbeat|idle_timeout' -- loop-engine/*.py` = **0 命中**；`no_progress` 全为轮次计数（`async_loop.py:261`）。

## ③ 风险分级（引 `reference/risk-grading-scheme.md`）
- 新增检查点 AGE-16 / AGE-17 均为 `high`（缺失即高风险，非 critical）。
- **零新增 critical**；三项目金样定级锚点（C 明文密钥 / A 变更管控 / B godfile>800）不变。
- loop 现存 critical 级项维持既有结论（godfile 已在前轮 cycle-2 拆分治理，见 AS-BUILT）。

## ④ 下一步（可执行可验证）
1. 场景 C：用校正后 16 维评估 loop + 蜂群，重点核 `tool_registry.py` 死分支（AGE-17）→ 产出覆盖矩阵 + 缺口 + 风险分级。
2. loop：把 `stall_watchdog` 接入 `sub_agent.py` / `async_loop.py` 实际委派调用点（AGE-16 复检钩子）。
3. 复检命令：`node scripts/validate-contracts.mjs`（19 atom 0 错）+ `node tests/run-l1-tests.mjs`（32 PASS）。