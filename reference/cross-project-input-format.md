# 跨项目横评输入格式契约（Cross-Project Input Format）

> 本文件定义 architect-skills 跨项目横评的**结构化输入与输出契约**。横评不是即兴，是结构化输入驱动的聚合。设计参考：cspm_agent `aggregator/reference/input-format.md`（15 子报告 + 路由表 + JSON schema + 共病判定）。
> 对应 Router「### 跨项目横评」USE 节的 U2 规则硬化。

## 一、触发条件

评估 **≥2 个项目**时必须产出横评（Router U2）。单项目评估不触发横评。

## 二、输入契约（每项目覆盖矩阵）

每个被评项目产出一份覆盖矩阵，作为横评输入。格式：

```json
{
  "project": "A-cspm-agent",
  "path": "E:/...",
  "atoms": {
    "design": {"status": "partial", "evidence": "src/agent/generic_agent.py 47KB", "risk": "high", "trigger": "scheme §一①gofile>800"},
    "security": {"status": "missing", "evidence": "config.yaml L5-16 明文密钥", "risk": "critical", "trigger": "scheme §一①明文密钥"}
  }
}
```

字段：
- `status`: covered / partial / missing / N-A
- `evidence`: 行级证据（U0，文件+行号 or 目录+大小）
- `risk`: critical / high / medium / low（依据 scheme）
- `trigger`: scheme §一触发条件编号

## 三、共病判定规则

| 判定 | 条件 | 输出 |
|---|---|---|
| **共病** | ≥2 项目同一 atom 同一触发条件命中 | 入「共病矩阵」，标严重度（critical 共病 > high 共病 > ...） |
| **区分度** | 仅 1 项目命中的独有问题 | 入「区分度」，标项目归属 |
| **基线沉淀** | 共病抽象出的通用教训/门禁 | 入「基线沉淀」，标可移植性 |

共病判定阈值：**≥2 项目命中即记共病**（不设百分比，避免小样本失真）。

## 四、输出三件套（横评必须含）

横评报告必须含以下三节（顺序固定）：

### 1. 共病矩阵
表头：`共病项 | A | B | C | 严重度 | 性质`。✅=命中 ◐=部分。
必含列：每项目命中标记 + 严重度 + 性质（技术债/工程纪律/安全）。

### 2. 区分度
按项目列独有问题，每项带"独有原因"（非共病的根因）。

### 3. 基线沉淀
从共病抽象的通用教训 + 可移植门禁建议（移植到 architect-skills 哪个 atom）。

## 五、成熟度梯度（≥3 项目时产出）

按硬指标（安全卫生/变更管控）与软指标（自评/还债闭环）各排梯度，说明两种失效模式（评而不修 vs 无自评）。

## 六、聚合禁止项

1. 禁止脑补未读项目的数据（U0 适用横评）
2. 禁止把单项目问题当共病（必须 ≥2 命中）
3. 禁止无触发条件的"共病"定性（共病也须引 scheme 触发条件）
4. cross-project 发现必须标"单项目视角不可见"（验证 U2 价值）

## 七、金样对照

`output/cross-project/2026-08-25/cross-assessment.md` 为本契约的横评金样实例（见 `output/golden/INDEX.md`「跨项目横评」行）：
- 含完整三件套（共病矩阵/区分度/基线沉淀）
- 发现 C 复刻 B loop-engine（单项目不可见，验证 U2）
- 共病均带项目级证据 + scheme 触发条件

## 八、与 Router 的关系

Router「### 跨项目横评」节要求 ≥2 项目必产出横评。本契约定义**输入格式 + 共病判定 + 输出三件套**，把 U2 从"必产出"硬化为"按契约产出"。Router「输出模板硬性清单」要求横评引用本契约。
