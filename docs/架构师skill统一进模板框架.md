
# 架构师 skill 统一进声明式模板框架（loop-dev 成品输出落地）

> 日期：2026-09-01
> 目标：让架构师 skill（蜂群评审）的**成品输出**统一套用 `ai-skill-output-template` 的声明式模板 + 强校验，而非各写各的格式。本文记录接法、脚本与成果。

## 一、为什么统一

此前架构师 bundle 自己的 `render-report.cjs` 是命令式 `if-family`，与 ai-skill-output-template 的声明式模板互不相通：
- 输出结构虽同为"五段"，但输入契约不一致（swarm agents[] vs family/dimensions/findings/narratives）。
- 强校验缺失：无从卡住「narrative 空 / 证据无行级来源 / 分级无 scheme 引用 / other 桶饱和」。

统一后 = 一套模板声明 + 一套强校验，架构师、ooda、obsidian、任意项目的成品输出同口径、可回归。

## 二、两个衔接脚本（新增）

在 `architect-skills/scripts/` 下：

| 脚本 | 作用 |
|------|------|
| `swarm-to-template.cjs` | 适配器：把蜂群评审输出（agents[] 或 swarm-output.json）映射为声明式模板输入契约；自动从 meta.files_read 推导 archMap；保留 findings 原始 type。 |
| `eval-to-report.cjs` | 一键产出：`adapt -> render(template) -> validate`，输出合规成品报告并回显强校验信号。 |

## 三、用法（对任意项目产出统一成品）

```bash
# 环境：指向 ai-skill-output-template 包（缺省按相对路径解析）
export AI_TEMPLATE_ROOT=E:\业余\skill\wend\ai-skill-output-template

# 一键：蜂群评审 JSON -> 统一成品报告 + 强校验
node scripts/eval-to-report.cjs tests/fixtures/eval-loop-dev.json \
   --project loop-dev --out E:\业余\my\loop-dev\docs\architecture-report.md
```

## 四、loop-dev 成品成果（本次落地）

- 依据：`tests/fixtures/eval-loop-dev.json`（蜂群 agent 原始输出）
- 成品：`ai-skill-output-template/output/loop-dev/2026-09-01/report.md`（同步至 loop-dev/docs）
- 模板：`architect.single-report`；门禁：validate 强校验 exit 0

### 框架自动浮出的质量信号（正是"统一"的价值）
1. **other 桶饱和度 67% > 50%** —— loop-dev 3 条发现中 2 条被 agent 标为 `other`（DES1/D1）。这不是 renderer 降级，而是**蜂群 agent 原始标注过于粗糙**。P0 修复的精度思想在这里体现：框架把 this 问题显式化，提示 reviewer 回头收紧 agent 的 type 标注（将设计类的 DES1 标 `design_flaw`/`dup_code`，数据类的 D1 标 `config_drift` 等）。
2. **3 处分级无 scheme 触发引用** —— 建议分段引用 `references/grading-scheme.md`。
3. **1 处证据无 file:line 行级来源** —— D1 的 evidence 是叙述而非定位，建议 `loop-engine/circuit_breaker.py:NN`。

> 这些 WARN 均为非阻断，但直接指向架构师评审质量可改进的真实点。修复 agent 标注后重跑即可清零。

## 五、后续：对 loop-dev 持续评审走同一 pipeline

每次对 loop-dev 或其他项目评审：
1. 蜂群 skill 产出 agents 原始 JSON（或 swarm-output.json）。
2. `eval-to-report.cjs` 一键产出统一成品 + 强校验。
3. 依据 WARN 信号反过来改进 agent 标注（type 精度、证据定位、分级引用）。

这样**统一框架既管输出格式，也能反馈收窄 agent 产出的精度**，与 P0/P9 的结论闭环。
